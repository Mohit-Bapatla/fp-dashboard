# Authorization and data-isolation matrix

Reviewed July 19, 2026. This is a code-and-test audit, not a penetration-test or
security certification. Supabase Data API RLS is deny-all, but Prisma uses a
database-owner connection; the application checks below are therefore the
primary authorization boundary.

| Surface                                                   | Server-side gate and resource scope                                                                                                      | Negative evidence                                                                       | Remaining preview evidence                                |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Public directory                                          | Published, public-directory visibility predicates; no student-owned private records                                                      | Public-query and student-visibility unit tests                                          | Public route and detail samples                           |
| Student profile and settings                              | Clerk user ID is resolved server-side; profile is selected through the authenticated user                                                | Age/profile validation and student ownership tests                                      | Student A and Student B direct navigation                 |
| Saved opportunities                                       | `assertStudentAccess`; mutations include the authenticated student profile ID                                                            | Saved-opportunity ownership tests                                                       | Cross-account action attempt                              |
| Applications and tasks                                    | `assertStudentAccess`; application/task predicates include the authenticated profile ID                                                  | Application-task cross-user edit/delete/status tests and student ownership tests        | Student A/B direct URL and action attempts                |
| Private external opportunities                            | Owner profile is assigned server-side and visibility queries require that owner or public visibility                                     | External-opportunity action and student-visibility tests                                | Student B direct URL and directory isolation              |
| Resumes                                                   | Current user/profile lookup precedes upload, parse, delete, and signed URL creation; signed URLs are short-lived                         | Resume action, parsing-storage ownership, validation, and abuse tests                   | Authenticated Student A upload/download; Student B denial |
| Notifications                                             | Current app user is derived from Clerk; notification reads/updates include `userId`                                                      | Notification and reminder unit tests                                                    | Student A/B direct action isolation                       |
| Partner opportunities/applicants                          | `getCurrentPartnerContext` derives allowed organization IDs server-side; opportunity/application queries include those IDs               | Partner privacy-guard tests cover unrelated application, resume, and opportunity IDs    | Blocked: no Partner A/Partner B preview credentials       |
| Staff operations, exports, analytics, and placement queue | `assertPlacementQueueAccess` accepts only server-side staff/admin roles                                                                  | Role helper and placement authorization tests                                           | Blocked: no staff preview credential                      |
| Admin mutations, imports, user/organization management    | `assertAdminAccess` checks server-side Clerk claims before data access; IDs are validated before mutation; sensitive changes are audited | Admin guard/import/moderation/organization tests                                        | Admin preview navigation and non-admin denial             |
| Comments                                                  | `assertCanCreateRecordComment` derives the user and checks entity role/ownership and permitted visibility                                | Record-comment authorization tests                                                      | Role-specific UI only where credentials exist             |
| Cron routes                                               | Exact bearer comparison with configured `CRON_SECRET`; missing configuration fails closed; failed auth is rate-limited                   | Cron route tests cover missing/wrong secret, deduplication workflows, and `Retry-After` | No production cron invocation                             |

## Audit conclusions

- Client-provided user IDs and role IDs are not accepted as authorization facts.
- Student-sensitive reads and mutations use the authenticated user's profile or
  user ID in the database predicate; a bare resource ID is not sufficient.
- Partner-sensitive reads and mutations are scoped to organization IDs derived
  from membership, not an organization ID supplied by the client.
- Admin and staff checks occur before sensitive reads and writes.
- User-facing failures redirect or return bounded, generic messages; raw Prisma
  errors and authorization internals are not intentionally returned.
- Audit events exist for high-impact admin, staff, application, notification,
  and file operations. Routine private reads are not audit-logged to avoid
  capturing unnecessary student activity.

## Known limitations

- Automated tests are targeted negative authorization tests, not exhaustive
  fuzzing of every identifier shape or concurrency schedule.
- Preview credentials cover two students and one admin. Partner-to-partner and
  staff-only browser negatives remain blocked until disposable accounts exist.
- RLS is defense-in-depth for direct Supabase access only. Any new Prisma query
  must continue to include the application-layer ownership or organization
  predicate and a negative test.
