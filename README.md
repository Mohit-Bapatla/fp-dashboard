# Future Physicians Platform

A unified healthcare opportunity platform for Future Physicians.

The application combines a public website, verified opportunity directory,
student dashboard, partner workspace, staff operations tools, and
administrative controls in one Next.js project.

**Production:** [futurephysicians.org](https://futurephysicians.org)

## Overview

Future Physicians helps students discover and manage healthcare opportunities
while giving approved organizations tools to publish programs, review
applicants, and track participation.

The public website and authenticated dashboards share the same application,
design system, authentication layer, opportunity records, and deployment
pipeline.

## Highlights

- Public directory for verified healthcare opportunities
- Role-based dashboards for students, partners, staff, and administrators
- Student profiles, resume parsing, saved opportunities, and applications
- Partner opportunity management, applicant review, and placement tracking
- Admin verification, moderation, analytics, imports, and audit logs
- Clerk authentication with server-side authorization
- Prisma and PostgreSQL relational data model
- Responsive public product demonstrations and accessible interactions
- Vitest, Playwright, Axe, Sentry, and Vercel deployment support

## Product Areas

### Students

Students can create profiles, upload and parse resumes, discover opportunities,
review eligibility, save listings, submit applications, track external
applications, join waitlists, and monitor deadlines.

Recommendations assist discovery but do not guarantee acceptance or placement.
Host organizations retain control over selection decisions.

### Partners

Approved organizations can manage opportunities, configure eligibility,
review authorized applicants, update statuses, track onboarding and placements,
and export approved program data.

### Staff and administrators

Staff and administrators can coordinate placements, verify opportunities,
manage users and organizations, review data quality, run imports and exports,
monitor analytics, and inspect audit logs.

## Opportunity Workflows

The platform supports internships, research, shadowing, volunteering, events,
and other healthcare-access programs.

Application paths include:

- Future Physicians-managed applications
- External applications tracked inside the dashboard
- Introduction requests when available
- Interest forms and waitlists

Public listings must satisfy publication, verification, organization,
availability, and deadline rules before they are exposed.

## Roles and Access Control

| Role        | Primary access                                             |
| ----------- | ---------------------------------------------------------- |
| Student     | Profile, opportunities, applications, documents, events   |
| Partner     | Organization opportunities, applicants, placements        |
| Staff       | Operational queues and approved internal workflows        |
| Admin       | Moderation, verification, analytics, users, and audit logs |
| Super Admin | Highest-level administrative access                        |

Authorization is enforced on the server. Sensitive actions should independently
verify authentication, role, ownership or organization membership, resource
state, input validity, and audit requirements.

## Authentication

Authentication is provided by [Clerk](https://clerk.com), including:

- Email authentication
- Google OAuth
- Role-aware routing
- Protected dashboard routes
- Production custom domains
- Server-side user synchronization

Development and production Clerk instances issue different user IDs. User
reconciliation must preserve existing roles, profiles, applications, and
relationships when a verified email already exists.

## Resume Parsing

Students can upload resumes and extract structured fields such as:

- Summary
- Skills
- Education
- Experience
- Certifications

Resume parsing runs server-side and includes Vercel output tracing for PDF.js
worker and native canvas dependencies. Uploaded files remain private and must
never be committed to the repository.

## Tech Stack

### Application

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Server Components and Server Actions

### Data and authentication

- Prisma ORM
- PostgreSQL
- Supabase-hosted PostgreSQL and Storage
- Clerk authentication and RBAC

### Infrastructure and integrations

- Vercel
- Vercel Cron
- Resend
- OpenAI for optional enrichment
- Sentry
- Vercel Speed Insights

### Testing and quality

- Vitest
- Playwright
- Axe accessibility checks
- ESLint
- Prettier
- Prisma validation
- Production builds in CI

## Repository Structure

```text
.
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── public/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   ├── api/
│   │   └── dashboard/
│   ├── components/
│   └── lib/
├── tests/
│   ├── unit/
│   └── e2e/
├── artifacts/screenshots/
├── docs/
├── next.config.ts
├── package.json
└── README.md
```

## Local Development

### Prerequisites

- Node.js compatible with CI and Vercel
- npm
- PostgreSQL or access to a disposable development database
- Clerk development credentials

### Setup

```bash
git clone https://github.com/Mohit-Bapatla/fp-dashboard.git
cd fp-dashboard
npm install
cp .env.example .env.local
npx prisma generate
npx prisma validate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Use synthetic or disposable data for local development and automated testing.
Never connect ordinary local development to the production database.

## Common Commands

```bash
npm run dev
npm run format
npm run format:check
npm run lint
npm run test
npm run build
npm run test:e2e
npx prisma generate
npx prisma validate
npx prisma migrate status
```

The scripts in `package.json` are the source of truth.

## Database Migrations

Use `prisma migrate dev` only with an isolated development database.

Before applying production migrations, confirm the database identity, target
schema, backup status, pending SQL, and rollback procedure. Apply approved
migrations with:

```bash
npx prisma migrate deploy
```

Never run `prisma migrate reset` or `prisma db push` against production.

## Testing

Run unit tests with:

```bash
npm run test
```

Run Playwright end-to-end tests with:

```bash
npm run test:e2e
```

Some authenticated suites require disposable Clerk test identities or storage
states. Credential-gated skipped tests are not successful coverage.

Test responsive behavior at 1440, 1024, 768, 430, 390, 375, 360, and 320
pixels. Important mobile flows should also be reviewed on a real iPhone.

## Deployment

Production deployments are created through Vercel from the configured
production branch, normally `main`.

Preview deployments should use development or staging authentication,
disposable data, non-production storage, and protected access where
appropriate.

Changing an environment variable requires a new deployment before the change
takes effect.

## Security and Privacy

Security controls include server-side authorization, ownership checks,
verified opportunity visibility, input and upload validation, private file
storage, audit logging, rate limiting, duplicate-submission protection, error
redaction, security headers, and database access controls.

Never rely on hidden buttons, client-side roles, browser-supplied ownership IDs,
or unverified email addresses as security boundaries.

Report suspected vulnerabilities privately rather than opening a public issue
with exploit details or sensitive information.

## Contribution Workflow

1. Create a branch from the latest `main`.
2. Make focused changes.
3. Add or update tests.
4. Run the validation suite.
5. Push the branch and open a draft pull request.
6. Review the Vercel Preview deployment.
7. Merge only after required checks and approvals pass.

Before requesting review, run:

```bash
npm ci
npx prisma generate
npx prisma validate
npm run format
npm run format:check
npm run lint
npm run test
npm run build
npm run test:e2e
git diff --check
```

## Contact

- General support: [support@futurephysicians.org](mailto:support@futurephysicians.org)
- Partnerships: [outreach@futurephysicians.org](mailto:outreach@futurephysicians.org)
- Funding: [fundraising@futurephysicians.org](mailto:fundraising@futurephysicians.org)
- Instagram: [futurephysiciansmedia](https://www.instagram.com/futurephysiciansmedia/)
- TikTok: [@futurephysicians.org](https://www.tiktok.com/@futurephysicians.org)
- LinkedIn: [Future Physicians](https://www.linkedin.com/company/104746121/)
- Newsletter: [Future Physicians Substack](https://futurephysicians.substack.com/)
