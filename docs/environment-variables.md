# Environment Variables

`.env.example` lists all expected variables. Keep real values in `.env.local` locally and in Vercel environment settings for deployed environments.

## Application

- `NEXT_PUBLIC_APP_NAME`: display name.
- `NEXT_PUBLIC_APP_URL`: canonical app URL for links, metadata, and absolute
  reminder/digest email links. Set this to the production HTTPS origin before
  enabling email.

## Clerk

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: client-safe Clerk key.
- `CLERK_SECRET_KEY`: server-only Clerk secret.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: sign-in path.
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: sign-up path.
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`: post-sign-in fallback.
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`: post-sign-up fallback.
- `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL`: post-sign-up destination,
  including after email verification and other required sign-up tasks.
- `NEXT_PUBLIC_CLERK_SIGN_OUT_FALLBACK_REDIRECT_URL`: post-sign-out fallback.

## Database

- `DATABASE_URL`: PostgreSQL connection string for Prisma.

## Supabase Storage

- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only service role key.
- `SUPABASE_RESUME_BUCKET`: private resume bucket name.

## Email

- `RESEND_API_KEY`: server-only Resend key.
- `EMAIL_FROM`: sender identity.
- `EMAIL_REPLY_TO`: optional reply-to address.
- `EMAIL_NOTIFICATIONS_ENABLED`: set to `true` only when email sending is intentionally enabled. Student reminder preferences are an additional per-account gate.

## OpenAI

- `OPENAI_API_KEY`: server-only optional key for enrichment, drafting, and embeddings.

The app must build and run without this key by using deterministic fallbacks.

## Cron

- `CRON_SECRET`: bearer token for internal scheduled job endpoints. Both
  `/api/jobs/operational-workflows` and `/api/jobs/student-reminders` reject
  requests without `Authorization: Bearer ${CRON_SECRET}`.

## Monitoring

- `NEXT_PUBLIC_SENTRY_DSN`: client-safe Sentry DSN if enabled.
- `SENTRY_DSN`: server Sentry DSN.
- `SENTRY_ENVIRONMENT`: environment label such as `local`, `preview`, or `production`.

## Rules

- Do not commit `.env.local`.
- Do not expose service role keys or API keys to client components.
- Keep public variables limited to values intentionally safe for the browser.
