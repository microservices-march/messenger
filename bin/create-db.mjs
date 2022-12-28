import * as dotenv from "dotenv";
dotenv.config();
import { query } from "../db/index.mjs";

async function main() {
  const dbName = "messenger_dev";

  console.log(`Dropping old db: ${dbName}`);
  await query(`DROP DATABASE ${dbName}`, []);

  console.log(`recreating db: ${dbName}`);
  await query(`CREATE DATABASE ${dbName}`, []);
}

main();
