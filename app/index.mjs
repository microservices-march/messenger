import config from "./config/config.mjs";
import express from "express";
import Router from "express-promise-router";
import cors from "cors";

/* =================
   SERVER SETUP
================== */
const router = Router();
const app = express();
const port = config.get("port");

import { query, runInTransaction } from "./db/index.mjs";
import { dispatchEvent, NewMessageEvent } from "./events/index.mjs";

app.use(cors());
app.use(express.json());
app.use(router);

/* ======
   ROUTES
========*/
router.get("/conversations", getConversations);
router.post("/conversations", createConversation);
router.get(
  "/conversations/:conversationId/messages",
  getMessagesInConversation
);
router.post(
  "/conversations/:conversationId/messages",
  createMessageInConversation
);
router.post("/conversations/:conversationId/view_horizon", setViewHorizon);
router.get("/health", (_req, res) => {
  res.sendStatus(200);
});

/* =================
   ROUTE HANDLERS
================== */
async function getConversations(req, res) {
  const currentUserId = req.header("user-id");
  if (!currentUserId) {
    res.status(400);
    return res.json({
      error: `Please specify a user id by adding the User-Id header.`,
    });
  }
  const { rows: conversations } = await query(
    `
    SELECT c.id, c.inserted_at
      FROM channels c
      JOIN users_channels uc ON c.id = uc.channel_id AND uc.user_id = $1
    LIMIT 100;
    `,
    [currentUserId]
  );

  const channelIds = conversations.map((c) => c.id);

  const { rows: usersInChannel } = await query(
    `
    SELECT uc.channel_id as id, ARRAY_AGG(u.name) as participants FROM users_channels uc
      JOIN users u ON u.id = uc.user_id
      WHERE uc.channel_id = ANY($1) AND uc.user_id <> $2
      GROUP BY uc.channel_id
      LIMIT 100;
  `,
    [channelIds, currentUserId]
  );

  const channelNamesById = usersInChannel.reduce((acc, channel) => {
    acc[channel.id] = channel.participants.join(",");
    return acc;
  }, {});

  const channels = conversations.map((c) => {
    c.name = channelNamesById[c.id];
    return c;
  });

  res.send({ conversations: channels });
}

const PARTICIPANT_COUNT = 2;
async function createConversation(req, res) {
  const participantIds = new Set(req.body.participant_ids);
  if (participantIds.size !== PARTICIPANT_COUNT) {
    res.status(400);
    return res.json({
      error: `Conversation must have ${PARTICIPANT_COUNT} unique users`,
    });
  }

  const { rows: users } = await query(
    "SELECT id FROM users WHERE id = ANY($1)",
    [[Array.from(participantIds)]]
  );

  if (users.length !== PARTICIPANT_COUNT) {
    res.status(400);
    return res.json({
      error: `participant_ids provided did not match to two known participants`,
    });
  }

  const { rows: matching } = await query(
    `SELECT channel_id FROM users_channels WHERE user_id = ANY($1)`,
    [Array.from(participantIds)]
  );

  if (matching.length >= 2) {
    res.status(400);
    return res.json({
      error: `A conversation between these two users already exists with id ${matching[0].channel_id}`,
    });
  }

  let conversationId, insertedAt;
  await runInTransaction(async (client) => {
    ({
      rows: [{ id: conversationId, inserted_at: insertedAt }],
    } = await client.query(
      "INSERT INTO channels DEFAULT VALUES RETURNING id, inserted_at"
    ));

    for (let user of users) {
      await client.query(
        "INSERT INTO users_channels(channel_id, user_id) VALUES ($1, $2)",
        [conversationId, user.id]
      );
    }
  });

  res.status(201);
  res.json({
    conversation: {
      id: conversationId,
      inserted_at: insertedAt,
    },
  });
}

async function getMessagesInConversation(req, res) {
  const { rows } = await query(
    `
    SELECT m.*, u.name as username FROM messages m
      JOIN users u on u.id = m.user_id
    WHERE channel_id = $1
    ORDER BY index ASC
    `,
    [req.params.conversationId]
  );
  res.json({ messages: rows });
}

async function createMessageInConversation(req, res) {
  const { content } = req.body;

  const userId = req.header("user-id") && parseInt(req.header("user-id"), 10);
  if (!userId) {
    res.status(400);
    return res.json({
      error: `Please specify a user id by adding the User-Id header.`,
    });
  }

  const conversationId = parseInt(req.params.conversationId, 10);

  const { rows: channelMembers } = await query(
    "SELECT user_id FROM users_channels WHERE channel_id = $1;",
    [conversationId]
  );
  const participantIds = channelMembers.map((member) =>
    parseInt(member.user_id, 10)
  );

  if (!participantIds.includes(userId)) {
    res.status(400);
    return res.json({ error: `User with id ${userId} is not in conversation` });
  }

  await runInTransaction(async (client) => {
    await client.query(
      "SELECT FROM messages WHERE channel_id = $1 FOR UPDATE;",
      [conversationId]
    );
    const { rows } = await client.query(
      "SELECT MAX(index) as current_index FROM messages WHERE channel_id = $1",
      [conversationId]
    );
    let nextIndex = 1;
    if (rows[0].current_index !== null) {
      nextIndex = parseInt(rows[0].current_index) + 1;
    }

    try {
      const {
        rows: [{ id: messageId, inserted_at: insertedAt }],
      } = await client.query(
        "INSERT INTO messages(content, user_id, channel_id, index) VALUES($1, $2, $3, $4) RETURNING id, inserted_at",
        [content, userId, conversationId, nextIndex]
      );

      await dispatchEvent(
        new NewMessageEvent({
          conversationId,
          userId,
          index: nextIndex,
          participantIds,
        })
      );

      const {
        rows: [user],
      } = await query("SELECT name FROM users WHERE id = $1", [userId]);

      res.status(201);
      res.json({
        message: {
          id: messageId,
          content,
          index: nextIndex,
          user_id: userId,
          username: user.name,
          conversation_id: conversationId,
          inserted_at: insertedAt,
        },
      });
    } catch (e) {
      // https://www.postgresql.org/docs/8.2/errcodes-appendix.html
      // 23503  FOREIGN KEY VIOLATION   foreign_key_violation
      if (e.code === "23503" && e.constraint === "messages_channel_id_fkey") {
        res.status(400);
        return res.json({
          error: `conversation_id of ${conversationId} could not be found`,
        });
      } else if (
        e.code === "23503" &&
        e.constraint === "messages_user_id_fkey"
      ) {
        return res.json({ error: `user_id of ${userId} could not be found` });
      }
      throw e;
    }
  });
}

async function setViewHorizon(req, res) {
  const { index } = req.body;

  const userId = req.header("user-id");
  if (!userId) {
    res.status(400);
    return res.json({
      error: `Please specify a user id by adding the User-Id header.`,
    });
  }

  const { conversationId } = req.params;

  await query(
    "UPDATE users_channels SET last_viewed_index = $1 WHERE channel_id = $2 AND user_id = $3",
    [index, conversationId, userId]
  );

  res.sendStatus(204);
}

/* =================
   SERVER START
================== */
app.listen(port, () => {
  console.log(`messenger_service listening on port ${port}`);
});

export default app;
