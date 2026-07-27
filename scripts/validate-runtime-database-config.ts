import { resolveRuntimeDatabaseUrl } from "../src/lib/db/runtime-database-config";

resolveRuntimeDatabaseUrl(
  process.env,
  "postgresql://USER:PASSWORD@localhost:5432/fp_dashboard?schema=public",
);

console.log("Runtime database configuration is valid for this environment.");
