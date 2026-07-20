# Production-readiness audit record

> **Draft for review — not legal advice and not attorney approved.**

Baseline: `main` at `f0712d7b1d6a14a3e7661f202ffa885188fd3b9b`, reviewed July 19, 2026.

## Confirmed baseline findings

- Public routes rendered without detected horizontal overflow, but the
  opportunity searchbox exposed the generic name “Search”; data-request and
  Clerk auth pages lacked the standard skip-link treatment.
- HSTS and no-store headers were observed on the public deployment. CSP,
  clickjacking, MIME-sniffing, referrer, permissions, and cross-origin policies
  were absent.
- Privacy, terms, and data-deletion content were beta placeholders. There was no
  accessibility statement, retention matrix, claims registry, vendor inventory,
  incident runbook, or restore runbook.
- Public metrics and grant amounts lacked repository evidence. “Partner” wording
  could be inferred from relationship type without checking organization status.
- Server actions generally enforced authenticated student ownership, partner
  membership, or admin role. Existing negative tests cover key IDOR boundaries;
  an independent security assessment was not performed.
- Resume storage was private and owner-scoped with size/extension/MIME checks,
  but upload content signatures and unguessable object names were not enforced.
- Production rate limiting used Upstash when configured and durable Prisma
  fallback otherwise, hashed identifiers, and failed closed if durable storage
  failed in production. The daily operational workflow now removes expired
  fallback rows, and HTTP rate-limit responses include `Retry-After`.
- Read-only Supabase security advisors returned 38 informational
  `rls_enabled_no_policy` notices and no warning/error notices. This matches a
  server-service-role architecture where direct anon access is denied, but the
  architecture and key handling still require periodic review.
- `npm audit --audit-level=high` reported zero vulnerabilities at baseline.
  GitHub Actions used least-privilege contents access but floating major action
  tags and lacked explicit typecheck, audit, secret scan, browser, and whitespace
  steps.

## Hardening scope

This branch adds security headers and tests; accurate public disclosures;
minimum-age enforcement at profile creation; resume signature checks;
redacted telemetry; a bounded, report-only URL verifier; CI checks; and the
review documents indexed in `docs/legal-review-package.md`. It does not mutate
production data, enable production cron, claim certification, or replace legal,
accessibility, or security professional review.
