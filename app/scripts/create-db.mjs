import { query } from "../db/index.mjs";

async function main() {
  const dbName = process.env.CREATE_DB_NAME;

  console.log(`Dropping old db: ${dbName}`);
  await query(`DROP DATABASE IF EXISTS ${dbName}`, []);

  console.log(`recreating db: ${dbName}`);
  await query(`CREATE DATABASE ${dbName}`, []);
}

main();
