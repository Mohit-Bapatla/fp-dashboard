# Opportunity Navigator MVP

## Current-state audit

The original product already supported authenticated student, partner, staff, and admin dashboards; profiles and private resumes; published opportunity browsing; direct applications; placements; events; notifications; deterministic and optional embedding ranking; CRUD; CSV imports; audit logs; and rate limiting. The main trust gaps were that every host record looked like an FP partner, fit was presented mainly as a percentage, missing requirements resembled mismatches, Saved was a placeholder, and applications had no preparation phase.

## Implemented MVP scope

This MVP adds explicit opportunity provenance, source verification and availability, structured eligibility fields, conservative eligibility evaluation, student profile facts needed for matching, real saved/follow records, application preparation workspaces and checklists, correction reports, an admin verification queue, guarded publishing, safer imports, relationship disclosures, and official links.

## Entities and relationships

- `Opportunity` remains attached to a host `PartnerOrganization` record, but `relationshipType` is independently `EXTERNAL_PUBLIC`, `FP_PARTNER`, or `FP_OWNED`. Existing records default to external public.
- `Opportunity.verifiedBy` is a named optional relation to `User`; verification dates, notes, status, availability, cycle, location, eligibility, and effort are structured fields.
- `SavedOpportunity` belongs to one student profile and one opportunity, with a unique pair and optional reopening follow state.
- `Application` keeps all historical statuses and adds preparation statuses and workspace fields. `ApplicationChecklistItem` is separate from post-acceptance onboarding.
- `OpportunityCorrectionReport` records authenticated reports and admin resolution without exposing reporter identity publicly.

## Migration notes

Migration `20260711074500_opportunity_navigator_mvp` uses additive enums, nullable fields, conservative defaults, indexes, and cascading ownership relations. It does not rename existing columns or remove enum values. Apply it through the normal reviewed deployment pipeline; do not run it manually against production from a developer machine.

## Eligibility rules

The pure eligibility engine checks only structured, explicit requirements. Closed, expired, archived, and past-deadline listings are unavailable. Explicit age, grade, geographic, and certification failures can produce `NOT_ELIGIBLE`; missing student data becomes a concern and missing listing data becomes unknown. Free-form prose, AI, and protected traits never make hard decisions. Soft specialty and opportunity-type alignment can strengthen a match but cannot override a blocker.

## Verification workflow

External and partner listings cannot publish unless they have a safe HTTP(S) official source, `VERIFIED` status, and `lastVerifiedAt`. The same shared readiness function protects both form saves and quick-publish actions. Imports always remain `DRAFT` or `PENDING_APPROVAL` and `NEEDS_REVIEW`. Admins can review missing sources, stale/due verification, passed deadlines, broken links, and student corrections in `/dashboard/admin/opportunities/verification`.

## Application workspace workflow

Starting an application upserts one student-owned `PREPARING` application, creates checklist items from known documents, resume selection, essays, and external confirmation, and redirects to the workspace. It sends no reviewer email and makes no submission claim. Students open the official host portal themselves. Explicit submission updates a preparatory record to `SUBMITTED`; later-state duplicates remain blocked.

## Authorization and privacy

Student actions derive the profile from Clerk-authenticated user context and never accept a profile ID. Admin mutations use `assertAdminAccess`. Ownership is included in saved and application queries. Mutations are rate-limited and important events are audited without resume text, essays, tokens, or sensitive profile data. The model stores age in years, never date of birth, SSNs, external passwords, or browsing history. External URLs are limited to HTTP(S).

## Known limitations

- Reopening alerts are stored but no scheduled delivery job is included.
- Schedule compatibility remains unknown until both profile and listing availability use a richer shared structure.
- Geographic checks are deliberately narrow; distance calculations and geocoding are not included.
- Checklist editing is foundational; document-specific uploads and recommendation workflows remain future work.
- This is not a verified catalog, browser extension, full AI copilot, or automatic application system.

## Recommended next phase

Add verification reminder jobs and link-health checks, staff-facing bulk review, richer structured schedules, checklist completion controls, reopening notification preferences, catalog deduplication assistance, and an audited private API only after the contract below is reviewed.
