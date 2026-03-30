import { loadEnvConfig } from "@next/env";
import type { Config } from "drizzle-kit";

loadEnvConfig(process.cwd());

function getMigrationDatabaseUrl() {
  const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;
  if (unpooledUrl) {
    return unpooledUrl;
  }

  const pooledUrl = process.env.DATABASE_URL;
  if (!pooledUrl) {
    throw new Error(
      "Missing database URL. Set DATABASE_URL_UNPOOLED or DATABASE_URL in your environment.",
    );
  }

  const parsedUrl = new URL(pooledUrl);
  if (parsedUrl.hostname.includes("-pooler.")) {
    parsedUrl.hostname = parsedUrl.hostname.replace("-pooler.", ".");
  }

  return parsedUrl.toString();
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getMigrationDatabaseUrl(),
  },
} satisfies Config;
