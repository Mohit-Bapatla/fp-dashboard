# Production incident runbook

## Confirm deployment provenance

1. In GitHub, record the deployed commit’s full 40-character SHA.
2. In Vercel, open the canonical Production deployment for
   `www.futurephysicians.org`; record its deployment ID, state, environment,
   and Git SHA.
3. Treat Production as confirmed only when the Vercel SHA exactly equals the
   intended GitHub `main` SHA. A Preview name or commit message is not proof.
4. Do not use `fp-dashboard-rosy.vercel.app` as the canonical health target.

## Run the read-only public smoke

From a clean checkout of the deployed revision:

```text
npm ci
npx playwright install chromium
npm run smoke:production
```

The command is fixed to `https://www.futurephysicians.org`. It performs no
sign-in, account creation, Clerk mutation, or database write. Save the concise
pass/fail output with the incident record.

## Use a support reference

References have the form `FP-CATEGORY-YYYYMMDD-XXXXXX`. Search the configured
server logs and Sentry tag `supportReference` for the exact value, then confirm
the nearby `workflowCategory`, route/action, timestamp, deployed SHA,
environment, error classification, hashed user identifier, and retry flag.
Never ask a user to provide a password, verification code, private note,
application response, resume, partner comment, or health/demographic detail.

## Classify the failure

- Validation: a named field is invalid; correct that field. A support reference
  is normally unnecessary.
- Authentication: Clerk has no valid session or the account form failed to
  mount. Do not change production Clerk settings during triage.
- Authorization: the session exists but the role or organization scope denies
  the record. Stop if unrelated organization data is visible.
- Database: a safe classification such as constraint, schema, write, or
  concurrency appears. Do not inspect unrelated user rows.
- Network or external dependency: request, timeout, Clerk, email, storage, or
  another provider failed. Retry once only when the UI says it is safe.
- Optional-data failure: the core record remains usable while resume,
  notification, task, feedback, or comment data is unavailable. Do not describe
  the whole workflow as down.

## Reproduce safely

Use a local production build or exact-SHA Preview, Clerk development keys,
unique `+clerk_test_` identities, and a localhost database named
`fp_reliability` or `fp_dashboard_reliability_test`. Run migrations into that
disposable PostgreSQL 16 database, then:

```text
npm run build
npm run test:e2e:reliability
```

Never point `DISPOSABLE_TEST_DATABASE_URL` at Supabase or any remote host.
Authentication checks use the canonical domain or an authorized Preview; do
not broaden Clerk origins to accommodate a noncanonical alias.

## Stop conditions and rollback

Stop all write testing immediately if real user/application data appears, an
organization boundary is crossed, Production receives an authenticated write,
or the deployed SHA cannot be proven. Also stop on repeated 5xx responses,
framework error boundaries, or a critical onboarding/application/partner
failure.

Rollback is appropriate only with incident-owner authorization after a
critical regression is tied to the current exact SHA and the immediately
previous Production deployment is verified as known-good. Record both
deployment IDs and SHAs. Do not manually promote an arbitrary Preview.

Without explicit approval, never change Supabase schema/data, migrations,
Clerk production settings/users, DNS, domains, environment variables, homepage
metrics, real users/applications, or unrelated product behavior.

## Intern report template

- Page or action:
- Approximate time and timezone:
- Error message:
- Support reference:
- Desktop or mobile:
- Browser:
- Did retry work:
- Screenshot with personal information removed:

Do not include passwords, verification codes, private application answers,
identification documents, resumes, private notes, or partner comments.

## Google OAuth diagnostic

Use normal standalone Chrome with Clerk development. Confirm the Google button
starts Clerk’s supported flow, local/authorized Preview callbacks stay on their
expected origin, cancellation returns to a usable form, an OAuth error offers
recovery, and the verified email reconciles to one local user. Do not change
Clerk production settings and do not claim Production OAuth coverage unless the
canonical domain was exercised under separately explicit authorization.
