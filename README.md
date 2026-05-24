# FP Dashboard

FP Dashboard is a full-stack operations platform for Future Physicians. It helps students discover healthcare opportunities, partners review applicants, staff coordinate placements and outreach, and administrators manage quality, analytics, imports, moderation, automation, and program operations.

The project is built as a realistic internal beta: role-based dashboards, Prisma/PostgreSQL data modeling, Clerk authentication, Supabase Storage for private resume files, optional OpenAI-assisted features with deterministic fallbacks, background automation endpoints, tests, monitoring hooks, and safe demo data.

## Problem

Future Physicians needs to coordinate students, healthcare partners, applications, placement requests, outreach, events, sponsorships, service hours, feedback, and reporting without scattering operational state across spreadsheets and email threads.

## Solution

FP Dashboard centralizes those workflows into role-specific dashboards:

- Students manage profiles, resumes, applications, placement requests, recommendations, interviews, events, service hours, and feedback.
- Partners manage opportunities, applicants, interviews, onboarding, service hours, and success metrics for their own organizations.
- Staff manage placement queues, outreach CRM, automations, embeddings refreshes, events, sponsors, and sponsorships.
- Admins manage users, partners, opportunities, analytics, moderation, imports, data quality, feedback, service hours, recommendation evaluation, and audit logs.

## Tech Stack

- Next.js App Router and React
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Clerk authentication and RBAC
- Supabase Storage for private resume files
- Resend for optional email notifications
- OpenAI for optional AI enrichment and embeddings
- Vercel Cron secured by `CRON_SECRET`
- Vitest and Playwright
- Sentry placeholders for monitoring

## Core Workflows

- Opportunity discovery, deterministic semantic search, matching, recommendations, and public published opportunity previews.
- Student applications with resume metadata, parsed resume fields, interview scheduling, onboarding checklists, service-hour records, and certificates as metadata.
- Partner applicant review with deterministic fit summaries and optional AI wording.
- Staff placement requests, outreach contacts/tasks, AI-assisted outreach drafts, automations, events, and sponsorship workflows.
- Admin analytics, advanced analytics, imports, moderation, verification, data quality, feedback review, recommendation evaluation, audit logs, and service-hour approval.

## AI Systems

AI is optional and server-only. The app builds and functions without `OPENAI_API_KEY`.

- Resume parsing stores deterministic extracted fields and can optionally enrich summaries.
- Match scoring and recommendations remain deterministic first.
- Applicant summaries and outreach drafts use template fallbacks.
- Embeddings are stored as JSON records and used only as an optional boost, not as an automated decision.
- Explanations and gaps remain visible; humans make final decisions.

See [docs/ai-systems.md](docs/ai-systems.md) and [docs/matching-algorithm.md](docs/matching-algorithm.md).

## Local Setup

Install dependencies:

```bash
npm install
```

Create environment variables from the example:

```bash
copy .env.example .env.local
```

Fill the local values for Clerk and PostgreSQL. Optional services such as Supabase, Resend, OpenAI, Sentry, and Cron can be left blank for fallback-oriented local development.

Validate and generate Prisma:

```bash
npm run db:validate
npm run db:generate
```

Apply migrations and seed demo data:

```bash
npm run db:migrate
npm run db:seed
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Mode

`prisma/seed.ts` creates fake, idempotent demo records only. Demo mode does not bypass Clerk or RBAC. Create matching Clerk test users and set their `publicMetadata.role` values:

| Email                      | Clerk user ID           | Role metadata |
| -------------------------- | ----------------------- | ------------- |
| `demo-student@example.com` | `user_demo_student_001` | `STUDENT`     |
| `demo-partner@example.com` | `user_demo_partner_001` | `PARTNER`     |
| `demo-staff@example.com`   | `user_demo_staff_001`   | `STAFF`       |
| `demo-admin@example.com`   | `user_demo_admin_001`   | `ADMIN`       |

When one of these accounts signs in, dashboard pages show a demo banner. See [docs/demo-guide.md](docs/demo-guide.md).

## Testing

```bash
npm run lint
npm run test:unit
npm run build
npm run format:check
npm run test:e2e
```

If Playwright browser binaries are missing locally:

```bash
npx playwright install
```

## Deployment

The app is designed for Vercel with PostgreSQL, Clerk, optional Supabase Storage, optional Resend, optional OpenAI, optional Sentry, and a secured Cron route. See [docs/deployment.md](docs/deployment.md).

## Screenshots

Screenshots are intentionally placeholders until a stable beta environment is available:

- Student dashboard and opportunity board
- Partner applicant review and success dashboard
- Staff outreach, automations, events, and sponsors
- Admin analytics, data quality, imports, moderation, and service hours

## Documentation

- [Architecture](docs/architecture.md)
- [Database schema](docs/database-schema.md)
- [Auth and RBAC](docs/auth-rbac.md)
- [Deployment](docs/deployment.md)
- [Environment variables](docs/environment-variables.md)
- [AI systems](docs/ai-systems.md)
- [Matching algorithm](docs/matching-algorithm.md)
- [Security and privacy](docs/security-privacy.md)
- [Demo guide](docs/demo-guide.md)
- [Roadmap](docs/roadmap.md)

## Current Status

Stages 0-50 are complete for the internal beta plan, including demo mode and documentation. The repository should not contain real student data, real resumes, or secrets.
