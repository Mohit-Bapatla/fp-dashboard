# Architecture

FP Dashboard is a Next.js App Router application with server-first data access, Clerk-backed authentication, Prisma/PostgreSQL persistence, and narrowly scoped client components for interactive forms and controls.

## Runtime Shape

- `src/app` contains App Router routes, server pages, route handlers, and server actions.
- `src/components` contains reusable UI components, dashboard shells, forms, cards, tables, and workflow widgets.
- `src/lib` contains server-only domain helpers, Prisma access, RBAC guards, matching/search logic, notifications, audit logging, AI helpers, jobs, analytics helpers, and CSV import logic.
- `prisma` contains schema, migrations, and seed data.
- `docs` contains engineering and operations documentation.
- `tests` and Playwright configuration cover unit and smoke tests.

## Main Boundaries

### Authentication and Users

Clerk handles identity. The local `User` model stores the app role and links to `clerkUserId`. Dashboard access is enforced through role-specific guards and ownership checks.

### Database

PostgreSQL is the source of truth. Prisma models cover users, student profiles, resumes, partners, opportunities, applications, onboarding, comments, moderation, interviews, service hours, events, sponsors, analytics events, feedback, jobs, audit logs, notifications, and demo data.

### Storage

Supabase Storage is used for private resume files. Resume parsing and storage access stay server-only. Demo seed data stores resume metadata only and no real file.

### AI and Matching

AI helpers are server-only and optional. Deterministic search, matching, recommendations, applicant summaries, outreach drafts, and explanations work without OpenAI. Embeddings are stored as JSON `EmbeddingRecord` rows and used as optional ranking boosts only.

### Background Jobs

Vercel Cron calls a secured Next.js route with `Authorization: Bearer ${CRON_SECRET}`. A shared operational workflow runner performs idempotent checks and logs useful results.

### Monitoring

Sentry is configured with placeholder environment variables. Server logs, Vercel logs, Supabase logs, Sentry, audit logs, and job results are the first beta monitoring surfaces.

## Data Flow

1. Clerk authenticates a user.
2. Dashboard pages load the local `User` and enforce role or ownership.
3. Server components query Prisma with selected fields.
4. Server actions validate inputs, check authorization, mutate data, and write audit logs/notifications where appropriate.
5. Client components only receive safe view data and never import server-only helpers or secrets.

## Deployment Topology

```text
Browser
  -> Next.js App Router on Vercel
    -> Clerk for auth
    -> PostgreSQL through Prisma
    -> Supabase Storage for private resumes
    -> Resend for optional emails
    -> OpenAI for optional enrichment/embeddings
    -> Sentry/Vercel logs for monitoring
```

## Design Principles

- Prefer explicit role and ownership checks over implicit UI hiding.
- Keep API keys server-only.
- Use deterministic fallbacks for optional AI.
- Avoid automated accept/reject decisions.
- Keep sensitive documents out of the database and demo seed.
- Add migrations only for durable product state.
