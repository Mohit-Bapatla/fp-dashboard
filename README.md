# FP Dashboard

A full-stack operations platform for Future Physicians that manages healthcare opportunity discovery, student applications, partner review workflows, staff placement operations, and admin analytics.

**Live demo:** [fp-dashboard-rosy.vercel.app](https://fp-dashboard-rosy.vercel.app)

## Overview

Future Physicians previously coordinated student opportunities, partner relationships, applications, outreach, service hours, and reporting across forms, spreadsheets, and email threads.

FP Dashboard centralizes those workflows into a role-based platform for students, healthcare partners, staff, and administrators. The goal is to make healthcare opportunity placement easier to manage, easier to track, and more scalable as Future Physicians grows.

## Project Status

FP Dashboard is an internal beta/demo-safe build. The repository uses fake seed data for demos and should not contain real student data, real resumes, production secrets, or private partner records.

## Highlights

- Role-based dashboards for students, partners, staff, and admins
- Student opportunity discovery, application tracking, resume records, placement requests, and service-hour records
- Partner tools for opportunity management, applicant review, interviews, onboarding, and organization-level tracking
- Staff tools for placement workflows, outreach CRM, events, sponsors, and operational queues
- Admin tools for user management, partner management, opportunity moderation, analytics, data quality, imports, audit logs, and impact reporting
- Clerk authentication and role-based access control
- Prisma/PostgreSQL relational data model
- Optional AI-assisted enrichment with deterministic fallbacks
- Demo-safe seed data and beta readiness documentation
- Vitest, Playwright, Sentry hooks, and Vercel deployment support

## Tech Stack

- Next.js App Router
- React
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
- Sentry monitoring hooks

## Core Workflows

### Students

Students can complete profiles, manage resume records, browse healthcare opportunities, submit applications, track statuses, request placements, register for events, log service hours, and provide feedback.

### Partners

Partners can manage organization-connected opportunities, review applicants, coordinate interviews and onboarding, track service hours, and view organization-level activity.

### Staff

Staff can manage placement queues, outreach contacts and tasks, automations, events, sponsors, sponsorships, and operational workflows.

### Admins

Admins can manage users, partners, opportunities, analytics, moderation, imports, data quality, service-hour approvals, feedback, recommendation evaluation, and audit logs.

## AI Systems

AI features are optional and server-only. The app builds and runs without `OPENAI_API_KEY`.

- Resume parsing stores deterministic extracted fields and can optionally enrich summaries.
- Match scoring and recommendations are deterministic first.
- Applicant summaries and outreach drafts use template fallbacks.
- Embeddings are stored as JSON records and used only as an optional boost.
- Humans make final placement and review decisions.

See `docs/ai-systems.md` and `docs/matching-algorithm.md`.

## Local Setup

Install dependencies:

```bash
npm install
```
