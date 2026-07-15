import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.MIGRATION_VALIDATION_ACTIVE_DATABASE_URL?.trim();
const migrationsPath = process.env.MIGRATION_VALIDATION_MIGRATIONS_PATH?.trim();

if (!databaseUrl || !migrationsPath) {
  throw new Error(
    "The migration validation config can only be used through scripts/validate-migrations.mjs.",
  );
}

export default defineConfig({
  schema: resolve(process.cwd(), "prisma/schema.prisma"),
  migrations: {
    path: resolve(migrationsPath),
  },
  datasource: {
    url: databaseUrl,
  },
});
