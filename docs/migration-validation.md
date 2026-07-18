# Migration validation

The CI workflow applies the complete Prisma migration history to a fresh,
disposable PostgreSQL 16 service database. It checks that every migration is
applied and compares the resulting database with `prisma/schema.prisma` to
detect schema drift.

It also stages the migrations preceding
`20260711074500_opportunity_navigator_mvp` in a temporary directory, applies
that baseline to an isolated `upgrade_validation` schema, inserts representative
published, closed, and archived opportunities, and upgrades through the full
history. The validator checks the expected status transitions and new
application-status enum values before removing the isolated schema and staged
files.

The original opportunity-navigator migration remains immutable. The follow-up
`20260715020500_secure_private_workflow_tables` migration enables RLS without
public policies on the three new Clerk-owned workflow tables, and the validator
asserts that state in both fresh and upgraded schemas.

The validator is intentionally separate from normal application database
configuration. It requires `MIGRATION_VALIDATION_DATABASE_URL`, accepts only a
loopback host, requires the database name
`fp_dashboard_migration_validation`, and passes that URL to Prisma as both
`DATABASE_URL` and `DIRECT_URL`. The only permitted URL query parameter is the
single value `schema=public`; host, port, SSL, and session-option overrides are
rejected before Prisma or PostgreSQL is called. These safeguards prevent
`.env.local` or a connected Supabase database from becoming the validation
target.

## Run locally with Docker

Start a disposable PostgreSQL 16 container:

```powershell
docker run --rm --detach `
  --name fp-dashboard-migration-validation `
  --env POSTGRES_DB=fp_dashboard_migration_validation `
  --env POSTGRES_USER=postgres `
  --env POSTGRES_PASSWORD=postgres `
  --publish 55432:5432 `
  --health-cmd "pg_isready -U postgres -d fp_dashboard_migration_validation" `
  --health-interval 5s `
  --health-timeout 5s `
  --health-retries 10 `
  postgres:16-alpine
```

After the container reports healthy, run the validator:

```powershell
$env:MIGRATION_VALIDATION_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:55432/fp_dashboard_migration_validation?schema=public"
npm run db:migrate:validate
Remove-Item Env:MIGRATION_VALIDATION_DATABASE_URL
```

Stop the container when validation is complete. Because it was started with
`--rm`, Docker removes it and its database automatically:

```powershell
docker stop fp-dashboard-migration-validation
```

This command is only a disposable compatibility and drift check. It does not
authorize or perform a deployment to Supabase or any other shared database.
Production migrations must use the separately approved deployment process.
