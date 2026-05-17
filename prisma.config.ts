import "dotenv/config";
import { defineConfig } from "prisma/config";

const fallbackDatabaseUrl =
  "postgresql://USER:PASSWORD@localhost:5432/fp_dashboard?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
  },
});
