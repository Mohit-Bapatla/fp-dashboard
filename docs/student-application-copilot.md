# Student Application Copilot

## Shipped scope

The student product is an opportunity navigator and application copilot, not a
job board or automatic-submission service. This release implements the complete
Priority 0 and Priority 1 scope:

- discoverable, preparable, and submittable availability states;
- interactive application tasks, calculated progress, and next actions;
- an action-first student home and combined task manager;
- student reminder preferences, structured reminders, and a weekly plan;
- owner-scoped student-added external opportunities and optional admin review;
- explicit student action for every internal submission or external
  confirmation.

The activities, stories, recommendations, answer editor, interview-preparation,
and outcome features have schema foundations only. They are deliberately absent
from navigation until owner-scoped editors and action tests are implemented.

## Routes

- `/dashboard/student`: urgent actions, recent workspace, recommendations,
  opening-soon programs, active applications, and readiness links.
- `/dashboard/student/opportunities`: verified public directory plus the entry
  point for adding an external application.
- `/dashboard/student/opportunities/add-external`: creates a private,
  student-owned source.
- `/dashboard/student/opportunities/[opportunityId]`: public details or the
  owning student's private external details.
- `/dashboard/student/opportunities/[opportunityId]/apply`: preparation,
  explicit FP submission, or explicit host-portal confirmation.
- `/dashboard/student/applications/[applicationId]`: private application packet,
  target date, resume selection, calculated progress, tasks, notes, and submit
  handoff.
- `/dashboard/student/tasks`: owner-scoped task filters and controls.
- `/dashboard/student/settings`: notification preferences and current weekly
  plan preview.
- `/dashboard/notifications`: exact action links, read state, and dismissal.
- `/api/jobs/student-reminders`: secret-protected scheduled reminder runner.
- `/dashboard/admin/opportunities/verification`: public verification queue and
  private student-source review requests. Resolving a request never publishes
  the source.

## Availability and submission

The shared visibility policy has three distinct decisions:

| Decision          | Allowed availability              | Additional rules                                                                     |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| Discover          | `OPEN`, `OPENING_SOON`, `ROLLING` | Public listings must be published, verified, non-placeholder, and not past deadline. |
| Prepare           | `OPEN`, `OPENING_SOON`, `ROLLING` | Same public rules, or an owner-matched private student-added source.                 |
| Submit or confirm | `OPEN`, `ROLLING`                 | `opensAt` is absent or reached, and the deadline is absent or not passed.            |

An opening-soon or future-opening listing can be saved, followed, and prepared,
but no internal submission or external confirmation action is accepted. The
same policy is enforced in Server Actions; hiding a button is not an
authorization boundary.

## Tasks, progress, and next action

`ApplicationTask` is the logical task model and maps to the former checklist
table so existing records retain their IDs and history. New workspace tasks use
stable `taskKey` values, typed sources, required flags, statuses, and date-only
due dates. System tasks are inserted with `createMany(..., skipDuplicates)` and
are never silently deleted.

Students can complete or reopen tasks, mark them blocked, skip optional tasks,
create private custom tasks, and edit due dates only for student-controlled
tasks. Every mutation derives the student profile from Clerk context, scopes the
record through its application owner, rate limits the action, and audits only
IDs, types, status, and other non-content metadata.

Submission and external-confirmation tasks are completed only by their
authoritative submission Server Actions. Generic task controls cannot complete
or reopen those records. Today, overdue, and this-week buckets use the student's
notification timezone so task and reminder timing agree.

Calculated progress is:

`completed required tasks / non-skipped required tasks`

Legacy `completionPercent` remains only as a fallback when an old application
has no task rows. It is refreshed as a snapshot after task, resume-selection,
workspace, and submission mutations; students cannot type it manually.

The next-action rank is deterministic: overdue required tasks, required tasks
due this week, blocked document work, required document work, a submission task
when the application is actually submittable, interview preparation, follow-up,
outcome reporting, then remaining required or optional work.

## Reminders and weekly plan

`StudentNotificationPreference` controls in-app delivery, email, weekly digest,
opening/deadline/task/recommendation/interview/outcome categories, quiet hours,
and IANA timezone. Defaults favor in-app reminders; email and the weekly digest
are opt-in.

The daily runner derives notifications from structured dates and task types. It
uses unique deduplication keys for deadline, target-date, opening, overdue-task,
recommendation, interview-tomorrow, follow-up, thank-you, and outcome events.
Eligible email notifications are grouped into at most one message per student
per run. Quiet hours and current preferences are checked before delivery.

On Monday in the student's timezone, an opted-in digest is generated from the
same structured weekly plan. Empty plans are not sent. Email content excludes
essay text, story text, resume text, private notes, task descriptions, and
recommender message bodies. The current plan is visible in settings.

Vercel calls `/api/jobs/student-reminders` daily with
`Authorization: Bearer ${CRON_SECRET}`. See `background-jobs.md` for exact
schedules, retry behavior, and cadence limitations.

## Student-added external opportunities

Student-added records use:

- `visibility = STUDENT_PRIVATE`;
- `sourceType = STUDENT_ADDED`;
- `status = DRAFT`;
- `verificationStatus = NEEDS_REVIEW`;
- `applicationMethod = EXTERNAL_PORTAL`;
- an authenticated `studentOwnerProfileId`;
- a normalized safe HTTP(S) URL unique per student.

The submitted URL is retained as an untrusted, student-provided source link; it
is not written into the verified official-application field. Students can still
explicitly confirm that they submitted outside FP, but private-source UI and
audit copy never claim the link is an official host portal.

The student-entered organization name is stored on the private record. A hidden
system organization satisfies the existing relational schema but is excluded
from public, partner, staff, admin-catalog, import, analytics, embedding, and
operational queries. Reserved-name and forged-membership guards prevent the
placeholder from becoming a partner tenant.

Private notes remain on the application, never the verification request. An
optional verification request exposes only the submitted title, organization,
and source URL to admins. Approval records review status; it does not change
visibility or publish the opportunity. Webpage content is not scraped.

## Privacy and ownership

- Student task, application, resume, notification, and private-opportunity
  mutations derive identity from authenticated context.
- Private opportunities are readable only by their owner and intentionally
  authorized admin verification reviewers.
- General admin, staff, partner, public, analytics, import, embedding, and job
  paths require a public opportunity and a non-placeholder organization.
- Audit and analytics events never include task descriptions, essays, stories,
  resume text, private notes, source-page content, or credentials.
- URLs reject non-HTTP(S) schemes, credentials, localhost, private IPv4,
  non-public IPv6, scoped, and mapped-private addresses before normalization.
- No workflow signs, attests, approves generated text, emails a recommender, or
  submits an application without an explicit student action.

## AI and document safety

This release adds no generic chatbot and no application-answer generation UI.
Existing optional recommendation wording remains server-side and has a
deterministic fallback when `OPENAI_API_KEY` is absent. Later answer/story
foundations separate factual notes, student drafts, AI drafts, approved text,
provenance, and prompt versions; no AI text is auto-approved.

Resume files continue to use private Supabase storage and signed owner-scoped
access. The later schema adds resume naming/version metadata and status-only
document tracking, but multiple-version management and sensitive-document
uploads are deferred. Students should not upload transcripts, medical records,
or parent forms unless a reviewed private-storage workflow is added.
Future resume actions must clear and set the student's single active default
resume in one transaction.

## Environment and operations

Required configuration is documented in `.env.example` and
`environment-variables.md`. Student reminders additionally require:

- `CRON_SECRET` for the scheduled route;
- `NEXT_PUBLIC_APP_URL` for absolute email links;
- `EMAIL_NOTIFICATIONS_ENABLED=true`, a Resend key, and sender configuration
  before any opted-in email can be delivered.

No migration or cron in this branch has been applied to production, and no
production deployment is part of this work.

## Known limitations and deferred work

- A daily Hobby-compatible cron cannot reliably deliver a two-hour interview
  reminder or wake immediately after every timezone's quiet hours.
- Email row claiming prevents concurrent duplicate sends but is not a durable
  queue lease if a function terminates after claim and before provider response.
- Authenticated browser smoke testing requires Clerk test credentials; the
  manual checklist is in `student-authenticated-smoke-checklist.md`.
- Priority 2–4 data models are intentionally schema-only. Activities, stories,
  multiple-resume management, recommendation contacts, application answers,
  interview preparation, outcomes, export/deletion, comparison, and calendar
  export need owner-scoped UI and action coverage in later changes.
- No external page scraping, automatic publication, automatic submission, or
  recommender email sending is implemented.

## Recommended next phase

Build Priority 2 as a vertical slice: owner-scoped activities and stories,
resume-version management, status-only documents, and recommendation contacts.
Add authenticated cross-student access tests and mobile browser coverage before
exposing those editors in Application Profile navigation.
