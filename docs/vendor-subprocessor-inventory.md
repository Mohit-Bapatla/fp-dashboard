# Vendor and subprocessor inventory

> **Draft for review — not legal advice and not attorney approved.**

This inventory is derived from current code and environment-variable names. It
does not confirm contracts, data-processing addenda, regions, or production
feature enablement.

| Provider                  | Function                                                       | Potential data                                           | Current controls / review needed                                                                     |
| ------------------------- | -------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Clerk                     | Authentication and session management                          | Account identifiers, email, role metadata, session data  | Server authorization; confirm retention, regions, minor-user settings, and DPA                       |
| Supabase                  | PostgreSQL and private resume storage                          | Product records, student profiles, applications, resumes | Service role server-only; storage ownership checks; confirm backups, regions, and DPA                |
| Vercel                    | Hosting, functions, deployment logs, Analytics, Speed Insights | Requests, device/performance data, operational logs      | Security headers and log redaction; confirm retention and analytics settings                         |
| Sentry                    | Optional error monitoring                                      | Redacted errors and operational context                  | Default PII disabled, redaction hook, environment/release tags; verify server-side project settings  |
| Resend                    | Service email                                                  | Recipient address and message metadata/content           | Notification preferences and quiet hours; confirm retention and DPA                                  |
| OpenAI                    | Optional resume enrichment                                     | Requested resume-derived text when configured            | Optional failure isolation; never required for deterministic parse; confirm data controls and notice |
| Upstash                   | Optional distributed rate limiting                             | Hashed rate-limit identifiers and counters               | No raw IP stored by application; fail-closed production behavior; confirm retention/region           |
| HCB / The Hack Foundation | Donation processing and fiscal sponsorship                     | Donor/payment information handled on HCB                 | FP links externally; HCB issues receipt; confirm disclosure and responsibilities                     |
| External host websites    | Opportunity sources and applications                           | Data submitted directly by user to host                  | Clear third-party disclaimer; safe URL validation and bounded verifier                               |

Owner must maintain this list when adding, removing, or materially reconfiguring
a provider.
