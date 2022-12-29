import pg from "pg";
const { Pool } = pg;

// Configuration for the pool is pulled from
// environment variables automatically.
// See the .env file or the container
// environment. All vars start with 'PG'
const pool = new Pool();

// This method not to be used with transactions that span
// multiple statements.
// See https://node-postgres.com/features/transactions
// use ruInTransaction provided by this module
export const query = (text, params) => {
  return pool.query(text, params);
};

export const runInTransaction = async (queryFn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await queryFn(client);
    client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};
