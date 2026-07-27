import { validatePreviewDatabaseIsolation } from "../src/lib/db/runtime-database-config";

validatePreviewDatabaseIsolation(process.env);

console.log("Runtime database configuration is valid for this environment.");
