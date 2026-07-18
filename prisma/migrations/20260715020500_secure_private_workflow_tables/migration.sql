-- These Clerk-backed workflow records are accessed through server-side Prisma,
-- not the Supabase Data API. RLS with no public policies denies anon and
-- authenticated API roles if the public schema is exposed by the project.
ALTER TABLE "SavedOpportunity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApplicationChecklistItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpportunityCorrectionReport" ENABLE ROW LEVEL SECURITY;
