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

Run migrations against the target database:

```bash
npm run db:migrate
npm run db:generate
```

Seed only in safe non-production or demo environments:

```bash
npm run db:seed
```

## Cron

`vercel.json` schedules the operational workflow endpoint. The route requires:

```text
Authorization: Bearer ${CRON_SECRET}
```

Set a strong `CRON_SECRET` in Vercel. Do not expose it to the client.

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
