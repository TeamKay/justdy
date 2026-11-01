import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });

  try {
    const result = await pool.query(
      "SELECT NOW() AS database_time"
    );

    console.log("Neon connection successful!");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Neon connection failed:", error);
  } finally {
    await pool.end();
  }
}

main();