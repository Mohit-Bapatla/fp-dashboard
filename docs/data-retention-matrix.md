# Data-retention matrix

> **Draft for review — not legal advice and not attorney approved.**

The periods below are proposed policy targets, not confirmed production deletion
automation. Legal holds, security investigations, and documented regulatory or
fiscal obligations may require a narrow exception.

| Data class                                   | Purpose                                      | Proposed active retention                                                             | Deletion or review trigger                         | Owner / open issue                        |
| -------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------- |
| Clerk account identifiers and role           | Authentication and authorization             | Account life plus 30 days                                                             | Verified account deletion request                  | Owner must coordinate Clerk deletion      |
| Student profile and preferences              | Dashboard and matching                       | Account life; review after 24 months inactivity                                       | Verified deletion or inactivity review             | Counsel approval needed                   |
| Resumes in private storage and parsed fields | Requested review and applications            | While current or attached to an active application; review after 12 months inactivity | Replacement, verified deletion, or account process | Application preservation rule unresolved  |
| Applications, tasks, and submissions         | Student workflow and auditability            | Account life; review 24 months after final activity                                   | Verified request subject to program/legal needs    | Owner/counsel decision                    |
| Private external opportunities               | Student organization                         | Account life                                                                          | Student deletion or verified account deletion      | Must remain owner scoped                  |
| Notification preferences                     | Service communications                       | Account life                                                                          | Account deletion                                   | Remove with profile                       |
| Operational and security audit logs          | Abuse prevention and incident evidence       | Proposed 12 months                                                                    | Scheduled review and deletion                      | Security professional approval            |
| Rate-limit records                           | Abuse prevention                             | Window expiry plus daily operational cleanup                                          | Automated expiry cleanup                           | Operations owner must monitor the job     |
| Support and data-request correspondence      | Respond to requests and demonstrate handling | Proposed 24 months after closure                                                      | Review at end of period                            | Counsel approval needed                   |
| Opportunity public records and source checks | Directory accuracy and history               | While listed plus proposed 24-month archive                                           | Human archive and periodic review                  | Never auto-delete on one check            |
| Backups                                      | Recovery                                     | Provider-plan retention, to be confirmed                                              | Provider expiry cycle                              | Supabase plan/retention must be confirmed |
| Sentry/Vercel telemetry                      | Reliability and security                     | Provider-configured period, proposed maximum 90 days                                  | Provider expiry                                    | Confirm plan settings and regions         |

## Request handling

Verified requests should be logged without copying sensitive document content.
Active records should be deleted or de-identified where eligible. Backups are
not edited individually; deletion propagates when snapshots expire. The
requester should be told about any material exception.
