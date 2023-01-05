import seedData from "./support/seeds.mjs";
import { query } from "../db/index.mjs";

async function main() {
  console.log("Writing seed data...");

  for (let user of seedData.users) {
    await query("INSERT INTO USERS(name) VALUES($1)", [user.name]);
  }
}

main();
