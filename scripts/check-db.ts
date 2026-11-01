import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;

console.log("DATABASE_URL loaded:", Boolean(databaseUrl));

if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);

    console.log("Database connection details:", {
      protocol: parsed.protocol,
      host: parsed.hostname,
      port: parsed.port || "(default)",
      database: parsed.pathname,
    });
  } catch {
    console.log("DATABASE_URL exists but is not a valid URL.");
  }
} else {
  console.log("DATABASE_URL was not found in .env.");
}