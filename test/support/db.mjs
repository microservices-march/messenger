import config from "../../config/config.mjs";
import pg from "pg";
const { Pool } = pg;

// Configuration for the pool is pulled from
// environment variables automatically.
// See the .env file or the container
// environment. All vars start with 'PG'
const pool = new Pool({
  user: config.get("pguser"),
  host: config.get("pghost"),
  database: config.get("pgdatabase"),
  password: config.get("pgpassword"),
  port: config.get("pgport"),
});

// Rollback after every quer
export const getClient = async (queryFn) => {
  const client = await pool.connect();
  return client;
};
