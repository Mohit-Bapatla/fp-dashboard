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

The repository does not currently include `@clerk/testing`, test-user
provisioning, or disposable role fixtures. Consequently, missing storage states
are reported as skipped authenticated tests rather than weakening authentication
or inventing session cookies. A future credentialed CI setup should use Clerk
testing tokens and create isolated test users before generating these states.

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
