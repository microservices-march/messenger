import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import Router from "express-promise-router";
const router = Router();
const app = express();
const port = process.env.PORT || 8080;

import { query, runInTransaction } from "./db/index.mjs";
import { dispatchEvent, NewMessageEvent } from "./events/index.mjs";

app.use(express.json());
app.use(router);

router.get("/conversations", async (req, res) => {
  const { rows } = await query("SELECT * FROM channels LIMIT 100", []);
  res.send(JSON.stringify(rows));
});

const PARTICIPANT_COUNT = 2;
router.post("/conversations", async (req, res) => {
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
});

router.get("/conversations/:conversationId/messages", async (req, res) => {
  const { rows } = await query(
    "SELECT * FROM messages WHERE channel_id = $1 ORDER BY index ASC",
    [req.params.conversationId]
  );
  res.json({ messages: rows });
});

router.post("/conversations/:conversationId/messages", async (req, res) => {
  // TODO: get user ID from cookie
  const { content, user_id: userId } = req.body;
  const { conversationId } = req.params;

  const {
    rows: [channelMemberUser],
  } = await query(
    "SELECT user_id FROM users_channels WHERE channel_id = $1 AND user_id = $2;",
    [conversationId, userId]
  );
  if (!channelMemberUser) {
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
        })
      );

      res.status(201);
      res.json({
        message: {
          id: messageId,
          content,
          index: nextIndex,
          user_id: userId,
          conversation_id: conversationId,
          inserted_at: insertedAt,
        },
      });
    } catch (e) {
      // https://www.postgresql.org/docs/8.2/errcodes-appendix.html
      // 23503 	FOREIGN KEY VIOLATION 	foreign_key_violation
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
});

router.post("/conversations/:conversationId/view_horizon", async (req, res) => {
  const { index, user_id: userId } = req.body;
  const { conversationId } = req.params;

  await query(
    "UPDATE users_channels SET last_viewed_index = $1 WHERE channel_id = $2 AND user_id = $3",
    [index, conversationId, userId]
  );

  res.sendStatus(204);
});

app.listen(port, () => {
  console.log(`messenger_service listening on port ${port}`);
});