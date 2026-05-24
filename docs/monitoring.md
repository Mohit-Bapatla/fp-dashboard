# Monitoring and Beta Operations

## Sentry

Sentry is wired with placeholder environment variables only. Add real DSN values
in deployment settings, not in source control:

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`

The app initializes Sentry only when a DSN is present. Client, server, and edge
configuration files are present for the Next.js App Router.

## Vercel Logs

Use Vercel function logs to inspect server action failures, route handler
errors, build output, cron executions, and request spikes. Watch for repeated
rate-limit errors, storage errors, Prisma errors, and failed scheduled jobs.

## Supabase Logs

Use Supabase database and storage logs to review slow queries, connection pool
pressure, failed uploads, missing storage bucket permissions, and unexpected
database errors.

## What To Monitor During Beta

- Sign-in and dashboard redirect failures
- Resume upload and parsing failures
- Application submission failures
- CSV import validation and import failures
- Background job execution summaries
- Email skipped/sent audit metadata
- Slow admin list pages as data grows
- Repeated rate-limit hits

## Playwright Setup

If smoke tests fail because browsers are missing, install Playwright browsers:

```powershell
npx playwright install
```
