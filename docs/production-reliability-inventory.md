# Production reliability failure-surface inventory

Inventory captured read-only from `main` at
`8e1dc75c0fc7a6e568526857c375043789124d7b` before reliability changes. “Ref”,
“retry”, and “logged” describe that baseline. The focused PR remediates the
shared high-risk boundary and reference gaps without changing workflow rules.

## Public

| Workflow                | Route                            | Action or API                             | Expected success                        | Safe failure                        | Existing boundary  | Ref                  | Retry         | Logged      |
| ----------------------- | -------------------------------- | ----------------------------------------- | --------------------------------------- | ----------------------------------- | ------------------ | -------------------- | ------------- | ----------- |
| Homepage                | `/`                              | Server render and marketing-viewer lookup | Approved homepage and metrics render    | Global error page                   | `global-error.tsx` | No                   | Yes           | Sentry only |
| Opportunities directory | `/opportunities`                 | Public Prisma opportunity queries         | At least one verified published listing | Availability message, contact, home | Route error        | No                   | Yes           | No          |
| Opportunity detail      | `/opportunities/[opportunityId]` | Public opportunity lookup                 | Verified record and safe links render   | Not found or route/global boundary  | Parent/global      | No                   | Boundary only | Sentry only |
| Contact                 | `/contact`                       | Static server render                      | Contact destinations render             | Global error page                   | Global             | No                   | Yes           | Sentry only |
| Sign-in                 | `/sign-in`                       | Clerk `<SignIn>` and marketing viewer     | Clerk account form mounts               | Auth boundary                       | Auth route error   | Digest fragment only | Yes           | Sentry only |
| Sign-up                 | `/sign-up`                       | Clerk `<SignUp>`                          | Clerk account form mounts               | Auth boundary                       | Auth route error   | Digest fragment only | Yes           | Sentry only |

## Student

| Workflow                  | Route                                   | Action or API                                      | Expected success                                 | Safe failure                                      | Existing boundary                      | Ref                          | Retry         | Logged                |
| ------------------------- | --------------------------------------- | -------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------- | -------------------------------------- | ---------------------------- | ------------- | --------------------- |
| User synchronization      | `/dashboard/**`                         | `syncCurrentUserFromClerk`                         | One local user linked to verified Clerk identity | Dashboard boundary; P2002 race recovered          | Dashboard                              | No                           | Boundary      | Unexpected errors: no |
| Onboarding step save      | `/dashboard/student/onboarding`         | `saveStudentProfile`                               | One step committed atomically                    | Previous progress retained and form error         | In-form                                | 8 hex                        | Yes           | Structured console    |
| Onboarding refresh/resume | Same                                    | Onboarding progress query                          | First incomplete step opens                      | Dashboard boundary                                | Dashboard                              | No                           | Boundary      | Sentry only           |
| Onboarding completion     | Same                                    | Final `saveStudentProfile` transaction             | One profile and one completion audit             | Earlier progress retained                         | In-form                                | 8 hex                        | Yes           | Structured console    |
| Dashboard load            | `/dashboard/student`                    | Student dashboard Prisma reads                     | Attention dashboard renders                      | Dashboard unavailable                             | Dashboard                              | No                           | Yes           | Sentry only           |
| Opportunity search        | `/dashboard/student/opportunities`      | Student opportunity queries                        | Filtered authorized results                      | Dashboard boundary                                | Dashboard                              | No                           | Yes           | Sentry only           |
| Application creation      | `/dashboard/student/opportunities/[id]` | `startApplicationWorkspace`                        | Idempotent workspace upsert and tasks            | No unsafe duplicate; boundary on unexpected error | Dashboard                              | No                           | Boundary      | No                    |
| Workspace load            | `/dashboard/student/applications/[id]`  | Owned application plus optional resume/preferences | Owned workspace renders                          | Core boundary; optional rows degrade              | Route error and inline optional status | Digest/raw or 8 hex optional | Yes           | Optional loads only   |
| Checklist update          | Same and `/tasks`                       | `updateStudentApplicationTaskStatus`               | Owned task changes once                          | In-form action error                              | In-form/dashboard                      | No                           | Submit again  | No                    |
| Private-note update       | Same                                    | `updateApplicationWorkspace`                       | Optimistic write persists                        | Conflict or earlier data retained                 | Inline status                          | 8 hex                        | Yes           | Unexpected write only |
| Application status update | Apply/workspace routes                  | Submission actions                                 | Authorized transition and audit                  | Validation/action state                           | In-form/dashboard                      | Inconsistent                 | Flow-specific | Partial               |
| Sign-out                  | Dashboard account menu                  | Clerk `signOut`                                    | Session deleted and same-origin replace          | Generic error                                     | Inline                                 | No                           | Yes           | No                    |

## Partner

| Workflow               | Route                           | Action or API                                 | Expected success                             | Safe failure                           | Existing boundary       | Ref                     | Retry    | Logged                |
| ---------------------- | ------------------------------- | --------------------------------------------- | -------------------------------------------- | -------------------------------------- | ----------------------- | ----------------------- | -------- | --------------------- |
| Membership resolution  | `/dashboard/partner/**`         | `getCurrentPartnerContext`                    | Only linked organization IDs returned        | Redirect/empty state/boundary          | Dashboard               | No                      | Boundary | No                    |
| Dashboard load         | `/dashboard/partner`            | Organization-scoped counts and recent records | Linked organization summary                  | Optional counts degrade; core boundary | Dashboard and inline    | 8 hex for optional only | Yes      | Optional only         |
| Applicant list         | `/dashboard/partner/applicants` | Organization-scoped application query         | Authorized applicants only                   | Optional detail/count fallback         | Dashboard and inline    | 8 hex for optional only | Yes      | Optional/core partial |
| Applicant detail       | Same, application card          | Scoped application relations                  | Permitted student fields render              | Missing optional relations degrade     | Inline/dashboard        | 8 hex optional          | Yes      | Partial               |
| Status update          | Same                            | `updatePartnerApplicationStatus`              | Allowed transition on owned opportunity      | Rate-limit/no-op/redirect              | Inline notice/dashboard | No                      | Yes      | Side effects only     |
| Comment creation       | Same                            | `addRecordComment`                            | Allowed visibility comment persists          | Validation/rate-limit redirect         | Inline/dashboard        | No                      | Yes      | Audit path only       |
| Organization isolation | All partner routes              | Organization IDs in every query/action        | Other organizations return no private record | Empty/not found/no-op                  | Route authorization     | No                      | N/A      | No                    |
| Sign-out               | Dashboard account menu          | Clerk `signOut`                               | Session remains cleared after refresh/back   | Generic error                          | Inline                  | No                      | Yes      | No                    |

## Reliability changes mapped to gaps

- Category/date references and redacted structured context now cover unexpected
  onboarding, application, partner, dashboard, auth, public, and sign-out
  boundaries.
- Boundary references are generated independently of framework digests; stack
  traces and deployment details remain private.
- The production smoke command covers the canonical public surface without
  authentication or writes.
- The credential-gated authenticated suite provisions only Clerk development
  users and a localhost PostgreSQL 16 database.
