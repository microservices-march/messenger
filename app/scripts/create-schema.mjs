import * as fs from "fs/promises";
import { query } from "../db/index.mjs";

async function main() {
  const sql = await fs.readFile("./scripts/support/schema.sql", "utf8");
  console.log(`READ IN: ${sql}`);

  console.log("creating tables");
  await query(sql);
}

main();
