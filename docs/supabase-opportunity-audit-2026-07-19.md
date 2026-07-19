# Supabase opportunity audit - 2026-07-19

This is the read-only pre-change audit for the real-opportunity import work. No migration, SQL write, import, or Supabase configuration change was performed.

## Target identity and environment boundary

- Supabase project: `FP Dashboard`
- Project ref: `ksuzzfzufotrwrxdrynl`
- Organization: `Future Physicians`
- Region: `us-east-2`
- Database/schema: `postgres.public`
- PostgreSQL: 17.6 (platform build 17.6.1.121)
- Plan: Free
- Branches: only the default/main branch exists
- The local `DATABASE_URL` resolves to the same project ref.

Because there is no disposable Supabase branch, the connected database is treated as production. All database inspection in this task was read-only. Schema validation and import planning remain local until an owner authorizes a separately identified production operation.

## Backup and restore readiness

No connected backup API or off-platform logical backup was available to verify. A fresh logical backup and a tested restore target are mandatory before any production migration or import. The import transaction, change-event ledger, and archive-instead-of-delete behavior do not replace a database backup.

## Schema and migration audit

- 38 tables exist in `public`; all have RLS enabled and none has an RLS policy.
- `anon`, `authenticated`, and `service_role` have broad grants, but RLS currently denies Data API row access. Prisma connects with the database owner role and bypasses RLS, so server authorization remains the critical boundary.
- Supabase migration history contains 20 completed entries; the repository had 21 migration directories before this work.
- `20260715020500_secure_private_workflow_tables` is not in live migration history, although its RLS effects are visible. Reconciliation is required before applying a later migration.
- `20260711074500_opportunity_navigator_mvp` differs only by line endings. The live checksum matches the CRLF form.
- `20260718090000_resume_review_timestamps` had repository drift. The live checksum matches the earlier `CASE WHEN "parseStatus" = 'COMPLETED' THEN "updatedAt" ELSE NULL END` form, which has been restored locally. The later `20260718093000_resume_review_reanalysis_backfill` intentionally clears the timestamps.
- A read-only Prisma diff found no pre-existing datamodel difference after accounting for migration-file drift.

The new `20260719120000_real_opportunity_import_system` migration is additive and has not been applied.

## Existing opportunity data

Seven opportunity rows exist:

- 4 published
- 1 pending approval
- 1 closed
- 1 student-private draft

All seven are explicit demo, smoke-test, or fixture records. Five use reserved example-domain URLs, two lack source URLs, three lack application URLs, and three were never verified. Every populated organization, source, and application URL checked returned HTTP 404. The fixtures are referenced by eight applications, one saved opportunity, and one external verification request, so the safe plan archives six public fixtures and preserves the student-private record. Nothing is deleted.

## Advisors

- Security advisor: 38 informational `rls_enabled_no_policy` findings, consistent with deny-all Data API access.
- Performance advisor: 135 findings. The actionable schema item is an unindexed `PartnerOrganization.verifiedById` foreign key; the additive migration includes that index.
- The other 134 findings are unused-index notices on a very small database and are not a reason to remove application indexes during this work.

## Stop condition

Production remains untouched. Before any production write, an owner must review the exact migration reconciliation, backup receipt, dry-run hash, database identity, current row count, planned action counts, and one-time approval phrase.
