import supertest from "supertest";
import app from "../index.mjs";
import { query } from "../db/index.mjs";
import { createUser, BASE_USERS } from "./support/factory.mjs";

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
        .post("/conversations", {
          participant_ids: [users[0].id, users[1].id],
        })
        .send({
          participant_ids: [users[0].id, users[1].id],
        })
        .expect(201);
    });

    it("should fail if one of the users does not exist in the db", async () => {});

    it("should fail if the conversation already exists", async () => {});

    it("should fail if there are duplicate users", async () => {});

    it("should fail if there are more than two participants", async () => {});

    it("should fail if there are less than two participants", async () => {});
  });

  describe("GET /conversations", () => {
    it("should return the conversations for the given user", async () => {});

    it("Should name the conversation based on the other user's name", async () => {});
  });

  describe("POST /conversations/:conversationId/messages", async () => {
    it("should create a message", () => {});

    it("should return an increasing index", async () => {});
  });

  describe("GET /conversations/:conversationId/messages", () => {
    it("should get all messages in the conversation", async () => {});

    it("should order them in descending order by index", async () => {});
  });

  describe("POST /conversations/:conversationId/view_horizon", () => {
    it("should set the return ok", async () => {});
  });
});
