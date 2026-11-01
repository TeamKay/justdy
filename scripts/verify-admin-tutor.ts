import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });

  try {
    const adminId = "gJapPQPSeoc4iJ7YZQO4An5cXdstlA7L";

    const result = await pool.query(
      `
      UPDATE "user"
      SET "verificationStatus" = 'Verified'
      WHERE id = $1
        AND role = 'ADMIN'
        AND status = 'Active'
      RETURNING
        id,
        name,
        role,
        status,
        "verificationStatus";
      `,
      [adminId]
    );

    if (result.rowCount === 0) {
      console.log("No matching active administrator was updated.");
      return;
    }

    console.log("Administrator verification updated:");
    console.log(result.rows[0]);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Verification update failed:", error);
  process.exitCode = 1;
});