import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma/client";
import {
  createRuntimePoolConfig,
  resolveRuntimeDatabaseUrl,
} from "@/lib/db/runtime-database-config";

const fallbackDatabaseUrl =
  "postgresql://USER:PASSWORD@localhost:5432/fp_dashboard?schema=public";

const globalForPrisma = globalThis as unknown as {
  runtimeDatabase?: {
    pool: Pool;
    prisma: PrismaClient;
  };
};

function createRuntimeDatabase() {
  const pool = new Pool(
    createRuntimePoolConfig(
      resolveRuntimeDatabaseUrl(process.env, fallbackDatabaseUrl),
    ),
  );
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({
    adapter,
  });

  return { pool, prisma };
}

const runtimeDatabase =
  globalForPrisma.runtimeDatabase ?? createRuntimeDatabase();

// Next.js can evaluate this module more than once inside one warm serverless
// instance. Keep one Prisma client and one bounded pg Pool per isolate.
globalForPrisma.runtimeDatabase = runtimeDatabase;

export const prisma = runtimeDatabase.prisma;
