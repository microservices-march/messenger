import config from "../config/config.mjs";
import * as amqp from "amqplib";

const EVENT_QUEUE_NAME = "chat_queue";

async function main() {
  const conn = await amqp.connect(`amqp://guest:guest@${config.get("amqphost")}:${config.get("amqpport")}`);

  const ch1 = await conn.createChannel();
  await ch1.assertQueue(EVENT_QUEUE_NAME);

  return ch1;
}

const channel = await main();

export function NewMessageEvent({ conversationId, userId, index }) {
  this.channelId = conversationId;
  this.userId = userId;
  this.index = index;
  this.targetQueue = EVENT_QUEUE_NAME;

  this.serialize = () => {
    return Buffer.from(
      JSON.stringify({
        type: "new_message",
        channel_id: this.channelId,
        user_id: this.userId,
        index: this.index,
      })
    );
  };

  return this;
}

export async function dispatchEvent(event) {
  channel.sendToQueue(event.targetQueue, event.serialize());
}
