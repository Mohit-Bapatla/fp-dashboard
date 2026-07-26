# End-to-end tests

Every browser spec must import `test` and `expect` from `./fixtures`. The auto
fixture fails a test when it observes a browser page exception, same-origin
request failure, same-origin HTTP 5xx response, unexpected console warning or
error, a visible Next.js error overlay, or a known application error boundary.

The console allowances are exact, documented notices: Clerk's development-key
notice, Clerk's hosted development-page CSP fallback notice, and Chromium's
unsupported `web-share` and blocked `compute-pressure` permissions-policy
notices inside the cross-origin YouTube iframe. Add another allowance only when
the exact message is understood and documented; never allow broad phrases such
as `Error`, `Failed`, or an entire vendor.

The request-failure allowances are aborted GETs for Next's exact development
font URL, `/__nextjs_font/geist-latin.woff2`, and Turbopack's encoded
development HMR-client chunk path. Chromium cancels those requests when a
multi-page test intentionally navigates again. Other fonts, application chunks,
production assets, failure modes, and every same-origin HTTP 5xx response still
fail.

## Authenticated role routing

The default suite never signs in with production credentials. Authenticated
route checks run only when a storage-state file from a Clerk development
instance is supplied through one or more of these variables:

- `PLAYWRIGHT_STUDENT_STORAGE_STATE`
- `PLAYWRIGHT_PARTNER_STORAGE_STATE`
- `PLAYWRIGHT_STAFF_STORAGE_STATE`
- `PLAYWRIGHT_ADMIN_STORAGE_STATE`
- `PLAYWRIGHT_SUPER_ADMIN_STORAGE_STATE`

Each state must belong to a development test user whose Clerk session claim has
the corresponding `metadata.role`, and whose user/database relationships exist
in the disposable E2E database. Keep state files outside the repository and do
not reuse production sessions.

The focused reliability suite uses `@clerk/testing` separately from these
storage-state routing checks:

```text
npm run test:e2e:reliability
```

It refuses non-development Clerk keys, requires
`DISPOSABLE_TEST_DATABASE_URL` to name a local reliability database, creates
unique `+clerk_test_` development identities, seeds the matching database
fixtures, and removes the Clerk identities in global teardown. Failed identity
deletions fail the suite with a sanitized count and status; partial setup also
attempts the same cleanup before failing.

CI reads these exact secrets only from the `ci-clerk-development` GitHub
Environment:

- `CLERK_E2E_SECRET_KEY`
- `CLERK_E2E_PUBLISHABLE_KEY`

An owner must create that environment in **Settings > Environments**, restrict
deployment branches to the PR branch policy the repository uses, then add both
values from a dedicated Clerk development instance. Enter values only in
GitHub's secret form; do not paste them into an issue, PR, Actions variable,
terminal transcript, or chat. No fixed test-user email or password secret is
needed because each run creates unique disposable identities.

The separately named `Authenticated reliability configuration` job reports
`NOT CONFIGURED` when either secret is absent. In that state,
`Authenticated reliability tests (Clerk development)` is natively skipped and
must not be treated as coverage. A passing coverage check is possible only
after the Playwright command executes successfully. Production Clerk keys fail
configuration, remote or production database URLs fail global setup, fork PRs
do not access the environment, and CI neither uploads nor retains authenticated
browser artifacts.

## Accessibility smoke coverage

`accessibility.spec.ts` runs axe WCAG A/AA rules across every public marketing
route at the 390 px viewport. This is a regression check, not a claim of WCAG
conformance: keyboard behavior, focus management, readable reflow, contrast in
real display conditions, and authenticated dashboard states still require
manual review. Authenticated axe scans should be added when the development
storage states above are available.

The seminar scan verifies that the YouTube embed has a non-empty title, then
excludes the cross-origin player subtree. YouTube currently injects a roleless
`div` with `aria-label` inside that vendor-controlled document; first-party
ARIA rules remain enabled everywhere else.

## Disposable onboarding reset

`npm run test:reset:onboarding` is a local test utility for repeating student
onboarding. It requires `NODE_ENV=test`, an explicit internal user ID beginning
with `reliability_`, and `DISPOSABLE_TEST_DATABASE_URL` pointing to localhost
database `fp_reliability` or `fp_dashboard_reliability_test`.

The utility clears onboarding fields, the two onboarding audit events, and only
applications whose IDs begin with `reliability_` for that student. It does not
read `DATABASE_URL`, delete Clerk users, or expose a web route.

`npm run test:seed:reliability` provisions the matching two-student,
two-organization, two-partner, and admin database fixtures. It has the same
local-database and `NODE_ENV=test` guards and requires five Clerk development
user IDs through the documented `DISPOSABLE_*_CLERK_ID` environment variables.
