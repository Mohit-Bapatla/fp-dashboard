import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

const fallbackDatabaseUrl =
  "postgresql://USER:PASSWORD@localhost:5432/fp_dashboard?schema=public";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const prismaCliDatabaseUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? fallbackDatabaseUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: prismaCliDatabaseUrl,
  },
});
