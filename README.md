# Future Physicians Platform

A unified healthcare-opportunity platform for Future Physicians.

The platform combines a public website, verified opportunity directory, student dashboard, partner workspace, staff operations tools, and administrative controls in one Next.js application.

**Production:** [futurephysicians.org](https://futurephysicians.org)

---

## Overview

Future Physicians helps students discover and manage healthcare opportunities while giving organizations structured tools to publish programs, review applicants, and track participation.

The platform replaces disconnected forms, spreadsheets, email threads, and manual tracking with role-based workflows for:

- Students
- Healthcare and community partners
- Future Physicians staff
- Administrators

The public website and authenticated dashboards share the same application, design system, authentication layer, opportunity records, and deployment pipeline.

---

## Project Status

The Future Physicians Platform is deployed in production and remains under active development.

Current priorities include:

- Expanding the verified opportunity directory
- Improving student application workflows
- Strengthening partner onboarding and applicant management
- Hardening authorization, rate limiting, and upload security
- Expanding authenticated end-to-end coverage
- Improving operational reporting and placement workflows

Local development and automated tests must use synthetic or disposable data.

Do not commit:

- Real student records
- Real resumes
- Private partner information
- Clerk users or session data
- Database exports
- API keys
- Production environment variables
- OAuth client secrets
- Service-role credentials

---

## Core Product Areas

### Public website

The public website introduces Future Physicians and provides access to:

- Healthcare opportunity discovery
- Student and partner information
- Events
- Chapters
- Impact information
- Grants and supporters
- Frequently asked questions
- Contact channels
- Privacy and terms pages

The landing page includes interactive, local-only product demonstrations. These previews do not modify live records or represent real student accounts.

### Public opportunity directory

Visitors can browse publicly available healthcare opportunities without creating an account.

Public listings are filtered through publication and visibility rules, including:

- Published status
- Verification status
- Organization verification
- Availability state
- Opening and closing dates
- Application deadlines
- Public visibility requirements

Unpublished, private, expired, or otherwise restricted opportunities must not be exposed through public pages, metadata, APIs, or the sitemap.

### Student dashboard

Students can:

- Create and update a reusable profile
- Record education, experience, interests, and preferences
- Upload and parse resumes
- Discover healthcare opportunities
- Review eligibility and fit information
- Save, follow, and dismiss opportunities
- Apply through Future Physicians
- Track external applications
- Join waitlists
- Monitor deadlines and next steps
- Track application statuses
- View events and resources
- Manage documents and profile completion

Recommendations and eligibility indicators assist discovery but do not guarantee acceptance or placement. Host organizations retain control over admissions and selection decisions.

### Partner workspace

Approved partner organizations can:

- Manage organization information
- Create and update opportunities
- Configure eligibility criteria
- Set deadlines, capacity, and application methods
- Review authorized applicants
- Manage applicant statuses
- Track interviews, onboarding, and placements
- Communicate status updates
- Export authorized program data
- Review organization-level activity

Public visitors cannot create a partner workspace automatically. Partnership inquiries are routed through the Future Physicians outreach team.

### Staff operations

Staff tools support operational workflows such as:

- Placement coordination
- Opportunity review
- Partner outreach
- Student support
- Events
- Program operations
- Sponsorship and fundraising tracking
- Application and placement queues

Access is restricted by server-side role checks.

### Administration

Administrative tools support:

- User and role management
- Partner and organization management
- Opportunity verification
- Publication moderation
- Application oversight
- Placement operations
- Data-quality review
- Imports and exports
- Correction reports
- Analytics
- Audit logs
- Recommendation evaluation
- Operational monitoring

Administrative access must never rely solely on hidden navigation or client-side role checks.

---

## Opportunity Model

The platform supports multiple opportunity categories, including:

- Internships
- Research
- Shadowing
- Volunteering
- Events
- Other healthcare-access programs

An opportunity may use one of several application paths:

### Future Physicians-managed application

The student submits application information through the FP Dashboard.

### External application

The student applies through a partner or external website and may track progress inside FP.

### Introduction request

Future Physicians may facilitate an introduction when that option is available.

### Interest form or waitlist

Students may join an interest list or waitlist for programs that are not accepting standard applications.

Application availability, deadlines, verification status, and eligibility are evaluated independently.

---

## Roles and Access Control

The application supports role-based access for:

| Role | Primary access |
|---|---|
| Student | Profile, opportunities, applications, documents, events |
| Partner | Organization opportunities, applicants, placements, reports |
| Staff | Operational queues and approved internal workflows |
| Admin | Moderation, verification, analytics, users, audit tools |
| Super Admin | Highest-level administrative access |

Authorization is enforced on the server.

Every sensitive Server Action, route handler, and data mutation should independently verify:

1. Authentication
2. Database user identity
3. Required role
4. Resource ownership or organization membership
5. Resource visibility and current state
6. Input validity
7. Relevant rate limits
8. Audit requirements

Client-side role checks are for interface behavior only and are not security boundaries.

---

## Authentication

Authentication is provided by [Clerk](https://clerk.com).

The production application uses a separate Clerk production instance from development and preview environments.

Authentication features include:

- Email-based authentication
- Google OAuth
- Role-aware dashboard routing
- Protected dashboard routes
- Production custom Clerk domains
- Server-side user synchronization

### User reconciliation

Clerk development and production instances issue different user IDs.

User synchronization must safely reconcile an existing database user when:

- The current Clerk user ID is new
- The same verified email already exists in the database
- Existing roles, profiles, applications, and relationships must be preserved

Automatic linking must only use verified Clerk email addresses and must not allow a user to claim another account through an unverified or browser-supplied email.

---

## Resume Upload and Parsing

Students can upload resume files and extract structured profile information.

The resume pipeline supports fields such as:

- Summary
- Skills
- Education
- Experience
- Certifications

Resume parsing uses server-side PDF tooling and includes Vercel-specific output tracing for required PDF.js worker and native canvas dependencies.

Important safeguards include or should include:

- File-size limits
- PDF MIME and signature validation
- Safe storage keys
- Private file access
- Bounded parsing work
- Generic user-facing failures
- No raw parser or native-module errors exposed to users
- Duplicate parse prevention
- Rate limiting for expensive parsing operations

Uploaded resume content must never be committed to the repository.

---

## AI-Assisted Features

AI features are optional and server-side.

The application should remain functional without an `OPENAI_API_KEY`.

Potential AI-assisted workflows include:

- Resume enrichment
- Applicant summaries
- Opportunity enrichment
- Outreach drafts
- Embedding-based recommendation boosts

Design principles:

- Deterministic logic runs first
- AI output is treated as assistive, not authoritative
- Human reviewers make final decisions
- AI must not silently change eligibility or placement outcomes
- Private student information must not be exposed unnecessarily
- Sensitive AI failures must fall back to deterministic behavior

See:

- `docs/ai-systems.md`
- `docs/matching-algorithm.md`

when available.

---

## Recommendation and Eligibility System

Opportunity recommendations are eligibility-aware and may consider:

- Education level
- Grade level
- Location
- Remote preference
- Interests
- Experience
- Availability
- Opportunity requirements
- Opening and deadline status
- Verification and publication state

The recommendation engine should:

- Rank eligible opportunities ahead of ineligible ones
- Explain important eligibility findings
- Avoid falsely labeling a user as eligible
- Preserve access to relevant public listings where policy permits
- Support saving, following, and dismissing recommendations
- Avoid leaking private or unpublished opportunities

Recommendations do not guarantee acceptance.

---

## Tech Stack

### Application

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Server Components
- Server Actions
- Accessible component primitives

### Data

- Prisma ORM
- PostgreSQL
- Supabase-hosted PostgreSQL
- Supabase Storage for private files

### Authentication

- Clerk
- Google OAuth
- Role-based access control
- Server-side authorization

### Infrastructure

- Vercel
- Vercel Preview Deployments
- Vercel Cron
- Custom production domain
- Output-file tracing for server dependencies

### Integrations

- Resend for optional email delivery
- OpenAI for optional enrichment
- Sentry for monitoring
- Supabase Storage for private uploads

### Testing and quality

- Vitest
- Playwright
- Axe accessibility checks
- ESLint
- Prettier
- Prisma validation
- Production builds in CI

---

## Repository Structure

```text
.
├── prisma/
│   ├── migrations/              # Ordered database migrations
│   ├── schema.prisma            # Prisma data model
│   └── seed files               # Synthetic development data
│
├── public/                      # Public static assets
│
├── src/
│   ├── app/
│   │   ├── (marketing)/         # Public website routes
│   │   ├── api/                 # Route handlers
│   │   ├── dashboard/           # Authenticated role-based dashboards
│   │   ├── sign-in/             # Authentication pages
│   │   └── sign-up/
│   │
│   ├── components/
│   │   ├── dashboard/           # Authenticated dashboard components
│   │   ├── marketing/           # Public-site components and demos
│   │   ├── opportunities/       # Shared opportunity UI
│   │   ├── public/              # Public opportunity components
│   │   ├── student/             # Student-specific components
│   │   └── ui/                  # Shared interface primitives
│   │
│   ├── lib/
│   │   ├── admin/               # Admin authorization and services
│   │   ├── auth/                # Clerk synchronization and role logic
│   │   ├── opportunities/       # Eligibility and visibility logic
│   │   ├── public/              # Public data access
│   │   ├── security/            # Redirect and security helpers
│   │   └── site-config.ts       # Public links and organization content
│   │
│   └── proxy.ts                 # Route protection and role routing
│
├── tests/
│   ├── unit/                    # Vitest tests
│   └── e2e/                     # Playwright tests
│
├── artifacts/
│   └── screenshots/             # Intentional visual-review evidence
│
├── docs/                        # Technical and operational documentation
├── next.config.ts
├── package.json
└── README.md
