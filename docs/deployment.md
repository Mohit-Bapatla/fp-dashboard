# Deployment

FP Dashboard is designed for Vercel, PostgreSQL, Clerk, and optional integrations.

## Required Services

- Vercel project for Next.js hosting.
- PostgreSQL database reachable from Vercel.
- Clerk application for authentication.

## Optional Services

- Supabase Storage for private resume files.
- Resend for email notifications.
- OpenAI for optional parsing enrichment, outreach polish, applicant wording, and embeddings.
- Sentry for monitoring.

## Environment Setup

Copy `.env.example` into the deployment environment and fill production values in Vercel project settings. Never commit `.env.local` or real secrets.

Required for a normal deployed app:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`

Required for an approved database migration job:

- `DIRECT_URL` — a direct, non-pooler PostgreSQL connection to the approved
  target database. `prisma.config.ts` deliberately prefers this value over
  `DATABASE_URL` for Prisma CLI commands.

Recommended:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_RESUME_BUCKET`
- `CRON_SECRET`

Optional:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `EMAIL_NOTIFICATIONS_ENABLED`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`

## Database

Use `prisma migrate dev` only while creating migrations against a local
development database:

```bash
npm run db:migrate
npm run db:generate
```

Before deployment, validate the complete migration history against disposable
PostgreSQL 16 as described in [Migration validation](migration-validation.md).
Production and shared-database migrations must be applied with
`prisma migrate deploy` through an explicitly approved deployment workflow;
never point the disposable validator at Supabase or another shared database.

For that approved job, set the runtime and direct URLs explicitly and keep the
schema pinned to `public`:

```bash
DATABASE_URL="postgresql://<runtime-role>:<password>@<approved-host>:5432/<approved-database>?schema=public"
DIRECT_URL="postgresql://<migration-role>:<password>@<approved-direct-host>:5432/<approved-database>?schema=public"
npx prisma migrate deploy
```

Confirm the host, database, role, and `schema=public` target before running the
command. Do not run the seed command. Apply migrations before the application
release, or atomically in the same approved deployment workflow before new code
receives traffic; this release must not serve opportunity-directory requests
against a database that is missing the navigator migration.

The `20260715020500_secure_private_workflow_tables` follow-up migration enables
RLS without public policies on the opportunity navigator's three new private
workflow tables. Before a Supabase deployment, confirm that the runtime Prisma
role is the approved direct database role and review the project's Data API
schema exposure and grants. Do not add anon/authenticated policies for these
Clerk-owned records without a separate authorization design.

Seed only in safe non-production or demo environments:

```bash
npm run db:seed
```

## Cron

`vercel.json` schedules the operational and student-reminder workflow
endpoints. Both routes require:

```text
Authorization: Bearer ${CRON_SECRET}
```

Set a random `CRON_SECRET` of at least 16 characters in Vercel. Do not expose it
to the client. Vercel can duplicate cron events and does not retry failed
invocations; use audit logs and a manual authenticated rerun for recovery.

## Pre-Deploy Checks

```bash
npm run db:validate
npm run lint
npm run test:unit
npm run build
npm run format:check
npm run test:e2e
```

## Internal Launch Checks

Before inviting internal staff or beta users, review:

- [Internal launch guide](internal-launch.md)
- [Student beta guide](student-beta.md)
- [Partner beta guide](partner-beta.md)
- [Workflow migration guide](workflow-migration.md)

## Rollback Notes

Use Vercel deployment rollback for application issues. Database rollback should be handled carefully through explicit follow-up migrations, not by resetting production data.
