# Browser Extension API Plan (Draft, Not a Stable Public API)

This document describes a possible future contract. No extension or public API is shipped by the MVP.

## Contract outline

All endpoints would require short-lived, audience-bound authentication, CSRF/replay protection for writes, per-user rate limits, schema validation, and student ownership checks.

| Capability | Proposed method and path | Constraints |
| --- | --- | --- |
| Approved profile read | `GET /api/extension/v1/profile` | Return only explicitly approved autofill facts; omit private notes and raw resume text. |
| Field mapping | `GET /api/extension/v1/field-mappings` | Versioned allowlist; never infer or overwrite factual profile fields. |
| Save external application | `POST /api/extension/v1/opportunities/save` | Store source URL, host, and student-approved facts as an unverified draft; never publish. |
| Create/update workspace | `PUT /api/extension/v1/applications/{id}` | Owner-scoped status, deadline, checklist, and next action only. |
| Save essay question | `POST /api/extension/v1/applications/{id}/questions` | Store the question only after user action; treat webpage content as untrusted. |
| Create AI draft | `POST /api/extension/v1/applications/{id}/drafts` | Server-only optional model; use approved facts; label output as a draft. |
| Save approved answer | `PUT /api/extension/v1/applications/{id}/answers/{id}` | Persist only after explicit student approval; exclude answer bodies from logs. |
| Mark submitted | `POST /api/extension/v1/applications/{id}/submission-confirmations` | Require an explicit user gesture and confirmation; never submit a host form. |
| Audit events | `POST /api/extension/v1/audit-events` | Allowlisted event types and minimal metadata; no page bodies, credentials, or browsing history. |

## Browser security posture

- Use OAuth authorization code with PKCE and short-lived access tokens; keep refresh material in extension-protected storage only if risk review approves it.
- Request the least privilege possible: `activeTab`, `storage`, and narrowly scoped host permissions only after a user activates the extension on a page.
- Do not request browsing-history access, broad always-on page access, or password-manager permissions.
- Never read or store portal passwords, session cookies, SSNs, date of birth, payment data, or unrelated page content.
- Require student review before saving extracted facts, questions, or answers. AI output cannot silently overwrite facts.
- Do not click a final submit control or automate submission under any condition.

Before implementation, complete threat modeling, minor-user privacy review, API versioning and revocation design, extension-store permission review, retention policy, abuse controls, and end-to-end authorization tests.
