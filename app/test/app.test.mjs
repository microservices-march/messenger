import supertest from "supertest";
import app from "../index.mjs";
import assert from "assert";
import { query } from "../db/index.mjs";
import {
  createConversation,
  createMessageInConversation,
  createUser,
  BASE_USERS,
} from "./support/factory.mjs";

describe("messenger service API", () => {
  let users = [];
  beforeEach(async () => {
    users = [];
    for (let user of BASE_USERS) {
      const u = await createUser(query, user.name);
      users.push(u);
    }
  });

  afterEach(async () => {
    await query("TRUNCATE users, channels, users_channels, messages CASCADE;");
  });

  describe("GET /health", () => {
    it("should return OK", async () => {
      await supertest(app).get("/health").expect(200);
    });
  });

  describe("POST /conversations", () => {
    it("should create a conversation", async () => {
      await supertest(app)
        .post("/conversations")
        .send({
          participant_ids: [users[0].id, users[1].id],
        })
        .expect(201);
    });

    it("should fail if one of the users does not exist in the db", async () => {
      const res = await supertest(app)
        .post("/conversations")
        .send({
          participant_ids: [users[0].id, users[2].id + 1],
        })
        .expect(400);

      assert.match(
        res.body.error,
        /participant_ids provided did not match to two known participants/
      );
    });

    it("should fail if the conversation already exists", async () => {
      await supertest(app)
        .post("/conversations")
        .send({
          participant_ids: [users[0].id, users[1].id],
        })
        .expect(201);

      const res = await supertest(app)
        .post("/conversations")
        .send({
          participant_ids: [users[0].id, users[1].id],
        })
        .expect(400);

      assert.match(
        res.body.error,
        /A conversation between these two users already exists with id \d+/
      );
    });

    it("should fail if there are duplicate users", async () => {
      const res = await supertest(app)
        .post("/conversations")
        .send({
          participant_ids: [users[0].id, users[0].id],
        })
        .expect(400);

      assert.match(res.body.error, /Conversation must have 2 unique users/);
    });

    it("should fail if there are more than two participants", async () => {
      const res = await supertest(app)
        .post("/conversations")
        .send({
          participant_ids: [users[0].id, users[1].id, users[2].id],
        })
        .expect(400);

      assert.match(res.body.error, /Conversation must have 2 unique users/);
    });

    it("should fail if there are less than two participants", async () => {
      const res = await supertest(app)
        .post("/conversations")
        .send({
          participant_ids: [users[0].id],
        })
        .expect(400);

      assert.match(res.body.error, /Conversation must have 2 unique users/);
    });
  });

  describe("GET /conversations", () => {
    let existingConversation;
    beforeEach(async () => {
      existingConversation = await createConversation(
        query,
        users[0].id,
        users[1].id
      );
    });

    it("should return the conversations for the given user", async () => {
      const res = await supertest(app)
        .get(`/conversations`)
        .set("User-Id", users[0].id)
        .expect(200);

      assert.equal(
        res.body.conversations.length,
        1,
        "expected one conversation"
      );
      assert.equal(
        res.body.conversations[0].id,
        existingConversation.id,
        `expected one conversation with id ${existingConversation.id}`
      );
    });

    it("Should name the conversation based on the other user's name", async () => {
      const res = await supertest(app)
        .get(`/conversations`)
        .set("User-Id", users[0].id)
        .expect(200);

      assert.equal(
        res.body.conversations[0].name,
        users[1].name,
        `Expected conversation to be named for the other user: ${users[1].name}`
      );
      assert.equal(
        res.body.conversations[0].id,
        existingConversation.id,
        `expected one conversation with id ${existingConversation.id}`
      );
    });
  });

  describe("POST /conversations/:conversationId/messages", async () => {
    let existingConversation;
    beforeEach(async () => {
      existingConversation = await createConversation(
        query,
        users[0].id,
        users[1].id
      );
    });

    it("should create a message", async () => {
      await supertest(app)
        .post(`/conversations/${existingConversation.id}/messages`)
        .set("User-Id", users[0].id)
        .send({
          content: "Clambering over rocks",
        })
        .expect(201);
    });

    it("should return an increasing index", async () => {
      const {
        body: {
          message: { index: indexOne },
        },
      } = await supertest(app)
        .post(`/conversations/${existingConversation.id}/messages`)
        .set("User-Id", users[0].id)
        .send({
          content: "Clambering over rocks",
        })
        .expect(201);

      const {
        body: {
          message: { index: indexTwo },
        },
      } = await supertest(app)
        .post(`/conversations/${existingConversation.id}/messages`)
        .set("User-Id", users[0].id)
        .send({
          content: "Picnic on a blustery day",
        })
        .expect(201);

      assert.equal(
        indexTwo,
        indexOne + 1,
        "second index should be one greater than the first"
      );
    });
  });

  describe("GET /conversations/:conversationId/messages", () => {
    let existingConversation;
    let messageOne, messageTwo;
    beforeEach(async () => {
      existingConversation = await createConversation(
        query,
        users[0].id,
        users[1].id
      );

      messageOne = await createMessageInConversation(
        query,
        existingConversation.id,
        users[0].id,
        "The first message"
      );

      messageTwo = await createMessageInConversation(
        query,
        existingConversation.id,
        users[1].id,
        "The second message"
      );
    });

    it("should get all messages in the conversation", async () => {
      const res = await supertest(app)
        .get(`/conversations/${existingConversation.id}/messages`)
        .set("User-Id", users[0].id)
        .expect(200);

      assert.equal(res.body.messages.length, 2, "expected two messages");
    });

    it("should order them in descending order by index", async () => {
      const res = await supertest(app)
        .get(`/conversations/${existingConversation.id}/messages`)
        .set("User-Id", users[0].id)
        .expect(200);

      assert.equal(
        res.body.messages[0].index,
        1,
        "expected first message to have index of 1"
      );
      assert.equal(
        res.body.messages[1].index,
        2,
        "expected first message to have index of 2"
      );
    });
  });

  describe("POST /conversations/:conversationId/view_horizon", () => {
    let existingConversation;
    beforeEach(async () => {
      existingConversation = await createConversation(
        query,
        users[0].id,
        users[1].id
      );
    });

    it("should set the return ok", async () => {
      await supertest(app)
        .post(`/conversations/${existingConversation.id}/view_horizon`)
        .set("User-Id", users[0].id)
        .send({
          index: 12,
        })
        .expect(204);
    });

    it("should set the view horizon in the db", async () => {
      const expectedIndex = 12;
      await supertest(app)
        .post(`/conversations/${existingConversation.id}/view_horizon`)
        .set("User-Id", users[0].id)
        .send({
          index: expectedIndex,
        })
        .expect(204);

      const {
        rows: [{ last_viewed_index: lastViewedIndex }],
      } = await query(
        "SELECT * FROM users_channels WHERE user_id = $1 AND channel_id = $2",
        [users[0].id, existingConversation.id]
      );

      assert.equal(
        lastViewedIndex,
        expectedIndex,
        `expected last_viewed_index to have been set to ${expectedIndex}`
      );
    });
  });
});
