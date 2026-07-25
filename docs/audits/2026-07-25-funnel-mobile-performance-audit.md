# Future Physicians funnel, mobile, and performance audit

Audit date: 2026-07-25 CDT  
Production URL: https://fp-dashboard-rosy.vercel.app  
Production deployment commit tested: `8e1dc75c0fc7a6e568526857c375043789124d7b`  
Audit branch: `codex/funnel-mobile-performance-audit`  
Implementation commits: `5753513`, `eb334d0`, `3d90bbb`  
Status vocabulary: **Verified fact**, **Strong inference**, **Hypothesis**, and **Not measurable**

## 1. Executive summary

**Verified fact:** the primary funnel problem is after account creation, not a proven authentication outage. In the exact database cohort beginning 2026-07-19 00:00 CDT, 45 student accounts were created, six reached a persisted onboarding step, and five completed a profile. That is 11.1% signup-cohort profile completion. Thirty-nine of the 45 accounts have neither a profile nor a persisted onboarding-step audit event. Current data cannot say whether those students reached onboarding, saw an error, abandoned before the first save, or never intended to continue.

**Verified fact:** current onboarding is four screens with 11 required data categories plus a first-time minimum-age affirmation. A resume is not required. Matching value is withheld until the final screen even though useful initial ranking can be produced from grade, coarse location, interests, and opportunity type. Age and certifications remain essential only for opportunities whose eligibility rules use them.

**Verified fact:** the homepage's critical hero was inside a client-side reveal wrapper that began at `opacity: 0`. On a repeatable iPhone-sized slow-network profile, the browser reported the small brand mark as LCP because the meaningful headline was not initially paintable. The fix renders the headline, explanation, calls to action, and product preview directly from server HTML while retaining below-fold reveals. In the controlled before/after comparison, median FCP/LCP stayed 764 ms, CLS stayed 0, and the LCP element changed from the brand mark to the actual `h1`. This is a correctness and perceived-loading fix, not a claimed synthetic timing reduction.

**Verified fact:** mobile form controls used 14 px text below the `sm` breakpoint, which can trigger unwanted iOS Safari zoom. The onboarding form also blocked Enter on ordinary inputs. Controls now use at least 16 px text on mobile, 44 px minimum height, relevant autofill tokens, and normal form submission semantics.

**Verified fact:** Vercel Analytics and Speed Insights are installed and enabled on Vercel. They provide route/RUM data, but the application has no first-touch or last-touch attribution store, no UTM persistence, and no complete acquisition/onboarding event model. Existing `RecommendationEvent` and `AuditLog` records partially cover recommendation and saved onboarding transitions. No new vendor or schema was added.

No P0 security, authorization, data-loss, or deterministic authentication failure was found. The branch is suitable for preview deployment after review, but the funnel is not proven fixed. Production deployment and the progressive-onboarding/analytics schema work require approval.

## 2. Scope and environment

### Repository and deployment

- Repository: Next.js 16.2.11 App Router, React 19.2.4, TypeScript, Tailwind 4.
- Authentication: Clerk 7.3.5 with middleware, server role checks, safe return URLs, and role-specific dashboard routing.
- Data: Prisma 7.8.0 and PostgreSQL 17 in the connected Supabase project.
- Test stack: Vitest 4.1.7, Playwright 1.60.0, and axe accessibility checks.
- Monitoring: Sentry 10.53.0, `@vercel/analytics` 2.0.1, and `@vercel/speed-insights` 2.0.0.
- CI: GitHub Actions on Node 22 with PostgreSQL 16 migration validation.
- Build output: 86 App Router routes plus proxy middleware.
- Local host: macOS on Apple hardware; Node used by the shell reported v26 for ad-hoc scripts while project CI targets Node 22.

The task originally opened at commit `4847762`, 16 commits behind `origin/main`. Before establishing a baseline, the audit branch was fast-forwarded to the exact deployed production source, `8e1dc75`. All comparisons and fixes in this report use `8e1dc75` as the authoritative starting commit.

No `AGENTS.md` file exists in the repository. README files, architecture/auth/security/deployment documentation, `package.json`, Prisma schema, all 21 migrations, CI, analytics integration, environment-variable documentation, and test configuration were reviewed.

### Safety boundaries observed

- Production data access was read-only and aggregate/anonymized.
- No student, partner, opportunity, application, placement, task, or staff record was modified.
- No production schema or migration was changed.
- No real email, notification, message, external application, or contact was sent.
- No credential, token, cookie, complete student record, resume, or direct identifier was printed or captured.
- No new vendor, dependency, paid feature, or production deployment was introduced.
- Test databases and processes were disposable and local.

## 3. Baseline repository health

| Gate             | Authoritative baseline at `8e1dc75`                             | Fixed branch                                              |
| ---------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| Install          | `npm ci` passed; 929 packages                                   | Unchanged lockfile                                        |
| Formatting       | Passed                                                          | Passed                                                    |
| Type checking    | Passed after deleting stale generated `.next` types             | Passed                                                    |
| ESLint           | Passed                                                          | Passed                                                    |
| Unit tests       | 80 files, 365 tests passed                                      | 80 files, 368 tests passed                                |
| Prisma schema    | Valid                                                           | Valid                                                     |
| Migrations       | 21/21; clean install, parity, and representative upgrade passed | 21/21 repeated and passed                                 |
| Production build | Passed; 86 routes                                               | Passed; 86 routes                                         |
| Secret scan      | No high-confidence tracked secrets                              | Passed                                                    |
| Dependency audit | Exit 0 at high threshold; seven moderate transitive advisories  | Same                                                      |
| Browser list/run | 89 Chromium executions before changes                           | 107 executions across Chromium plus focused WebKit matrix |

The first type-check failure referenced a removed route inside `.next`; deleting only that generated directory and rerunning passed. It was environmental, not a source defect.

The seven moderate advisories are transitive through Prisma development tooling, MCP tooling, `shadcn`, Hono, and Valibot. `npm audit` offers only forced upgrades outside current dependency ranges or with a breaking `shadcn` change. None was automatically applied.

## 4. Exact date-matched cohort analysis

### Cohort definition

- Start: 2026-07-19 00:00:00 America/Chicago (`2026-07-19T05:00:00Z`).
- Query end: approximately 2026-07-25 01:50 America/Chicago.
- Signup cohort: `User.role = STUDENT` and `User.createdAt` in the interval.
- Started onboarding: unique user with a persisted step-save `AuditLog` action in the interval.
- Completed onboarding: unique user with exact action `STUDENT_ONBOARDING_COMPLETED` in the interval.
- Current completeness: existing profile meets the repository's nine-field completion predicate. Names are User fields and are not part of that utility.
- Visitor metrics are the user's Vercel snapshot for approximately July 19–24, not the same end time as the database query.

### Verified cohort

| Metric                                            |         Count | Rate/notes                                              |
| ------------------------------------------------- | ------------: | ------------------------------------------------------- |
| All accounts created                              |            46 | 45 student, one non-student                             |
| Student signup cohort                             |            45 | Exact database cohort                                   |
| Student cohort with any persisted onboarding step |             6 | 13.3% of student signups                                |
| Persisted step-save events                        |            28 | Seven unique starters across all account creation dates |
| Student cohort with completed profile             |             5 | 11.1% of student signups                                |
| Exact completion events in period                 |             6 | One completion belongs to an earlier signup             |
| Student cohort with no saved-step instrumentation |            39 | 86.7%                                                   |
| Median account-to-completion time                 | 317.4 seconds | 5.29 minutes, among the five completers                 |
| Completed in under 5 minutes                      |             2 | Of five                                                 |
| Completed in under 1 hour                         |             4 | Of five                                                 |
| Completed in under 24 hours                       |             4 | Of five                                                 |
| Completed after 24 hours                          |             1 | Cannot prove an abandoned-return session                |
| Resumes created                                   |             0 | Period                                                  |
| Recommendation impressions                        |           192 | Eight unique students                                   |
| Opportunity clicks                                |             0 | Period                                                  |
| Saves                                             |             3 | One unique student                                      |
| Applications started                              |             4 | Three unique students                                   |
| Applications submitted                            |             0 | Period                                                  |

### Daily account/profile creation

| Local date     | Student signups | Profiles created | Recommendation impressions |
| -------------- | --------------: | ---------------: | -------------------------: |
| Jul 19         |               2 |                0 |                          0 |
| Jul 20         |               3 |                0 |                         78 |
| Jul 21         |               8 |                0 |                         48 |
| Jul 22         |               5 |                0 |                          0 |
| Jul 23         |              10 |                0 |                          0 |
| Jul 24         |              13 |                1 |                          0 |
| Jul 25 partial |               4 |                6 |                         66 |

Profile creation and account creation timestamps are not interchangeable. The Jul 25 profile count includes work by users whose accounts may predate Jul 25.

### All-time aggregate context

| Metric                                       | All-time count |
| -------------------------------------------- | -------------: |
| Accounts                                     |             60 |
| Student accounts                             |             52 |
| Non-student accounts                         |              8 |
| Profiles                                     |             11 |
| Profiles currently complete                  |             10 |
| Profiles currently incomplete                |              1 |
| Students with no profile                     |             41 |
| Resume metadata records                      |              3 |
| Recommendation impressions / unique students |       232 / 10 |
| Opportunity clicks / unique students         |          1 / 1 |
| Saves / unique students                      |          4 / 2 |
| Applications / unique students               |         12 / 6 |
| Submitted applications / unique students     |          4 / 3 |

There were no normalized duplicate-email groups and no conservative test/demo-pattern student signups in the period. This does not prove every account is a genuine student; it only means the available fields did not match the conservative aggregate filters.

## 5. Funnel table

The upper funnel and database cohort have incompatible end times and identity models. They must not be presented as a single exact sequential funnel.

| Stage                          |                 Value | Classification                                           |
| ------------------------------ | --------------------: | -------------------------------------------------------- |
| Vercel visitors                |                   542 | User-provided, approximately Jul 19–24                   |
| Reached `/sign-up`             |           130 (24.0%) | User-provided route visitors; not unique signup attempts |
| Student accounts created       |                    45 | Verified database cohort through Jul 25 01:50 CDT        |
| Visitor-to-account upper bound |                  8.3% | Directional only: `45 / 542`; date mismatch              |
| Persisted onboarding start     |   6 (13.3% of cohort) | Verified lower bound; first page views are not recorded  |
| Completed profile              |   5 (11.1% of cohort) | Verified signup-cohort rate                              |
| Visitor-to-profile             |                  0.9% | Directional only: `5 / 542`; date mismatch               |
| Recommendation viewer          | 8 unique period users | Verified, not restricted to signup cohort                |
| Saver                          |  1 unique period user | Verified, not restricted to signup cohort                |
| Application starter            | 3 unique period users | Verified, not restricted to signup cohort                |
| Application submitter          |        0 period users | Verified                                                 |

**Strong inference:** the largest measurable loss is between account creation and the first persisted onboarding save.  
**Not measurable:** whether those 39 users saw onboarding, which field they abandoned on, whether OAuth lost acquisition context, and whether a client/server error occurred before persistence.

## 6. Limitations of current analytics

- Vercel route visitors cannot be joined to authenticated database users.
- There is no anonymous acquisition ID carried into account creation.
- There is no first-touch or last-touch attribution record.
- UTMs are not intentionally persisted across page navigation or OAuth.
- `accounts.google.com` can appear as a referrer after OAuth, but the database cannot show whether it replaced a genuine acquisition source.
- There is no reliable `landing_viewed`, CTA, signup-start, signup-complete, OAuth-return, onboarding-view, validation-failure, abandonment, or public opportunity-detail-view event.
- Existing step-save audit events begin only after a successful save; they do not observe pre-save abandonment or client validation failure.
- No session-level event records make “returned after abandonment” measurable.
- Current conservative test-account filtering is heuristic. Admin/staff traffic is not universally excluded from route analytics.
- `RecommendationEvent` provides useful product evidence but does not complete the acquisition funnel.

## 7. Desktop and browser findings

### Verified passes

- Homepage headline and primary CTA are visible and link correctly.
- Anonymous visitors can browse the opportunity inventory and public detail pages.
- Search/filter behavior, back/forward navigation, mobile menu, and route transitions passed automated checks.
- Sign-in and sign-up pages load on production; known Clerk vendor CSP notices are informational.
- Safe return URLs, dashboard role routing, anonymous protection, and student/admin separation have unit coverage.
- Refresh/resume logic and server-side step persistence exist for onboarding.
- Public WCAG A/AA axe checks passed in three isolated repetitions (nine executions).

### Browser-matrix defect found and fixed

WebKit upgraded local HTTP asset URLs because the production CSP unconditionally included `upgrade-insecure-requests`. The directive is now emitted only in Vercel HTTPS environments. Production security remains unchanged, while local production-mode Safari/WebKit verification works.

The browser matrix now covers:

- Desktop Chromium.
- Desktop WebKit for focused acquisition regressions.
- iPhone 13 WebKit emulation.
- 320×700, 375×667, 390×844, and 430×932.
- 844×390 landscape.
- History back/forward between home and opportunities.
- Above-fold CTA visibility and horizontal overflow.

An external YouTube iframe emitted a Chromium GPU driver performance warning during one full concurrent run. The same axe tests passed 9/9 when isolated. The runtime monitor was not weakened to hide it.

The complete CI-shaped suite then passed on repeat: 80 passed, 27 authenticated-state scenarios intentionally skipped, and zero failed across 107 executions.

## 8. Physical-iPhone findings

**Not tested as of this report draft.** Safari developer features were enabled and the Apps and Devices Inspection window was opened, but only “This Computer” appeared. No iPhone or iPhone Safari tab was visible, so no physical-device claim, model, iOS version, screenshot, console trace, network trace, OAuth transition, keyboard check, file upload, or session-persistence result is recorded.

The device-dependent test rows remain `NOT_RUN`. Completion requires:

1. The iPhone unlocked with Safari open.
2. Web Inspector enabled on the iPhone if it is not already enabled.
3. Trust/connection established with this Mac.
4. A dedicated test account, with authentication performed by the user.
5. A preview deployment of the fixed commit for a full post-fix authenticated pass, or explicit approval of an equivalent safe test environment.

The production URL still serves `8e1dc75`; therefore production physical testing alone cannot verify this branch's mobile input and hero fixes.

## 9. Authentication findings

**Verified source behavior:**

- Clerk middleware is used only where required; public marketing routes remain public.
- Anonymous dashboard requests are redirected to sign-in with a return destination.
- Pending auth sessions use a recoverable sign-in redirect.
- Role claims map to role-specific dashboards.
- Students cannot access admin paths, and admins retain their intended routes.
- Onboarding and partner onboarding have explicit server-side eligibility checks.
- Return URLs are normalized and reject unsafe external destinations.
- Incomplete students are returned to onboarding; complete students reach the student dashboard.

**Production browser evidence:** the signed-out production suite passed public auth-page smoke coverage. Twenty-seven authenticated scenarios were intentionally skipped because no repository test storage states were provided. Google credentials were not automated.

**Not measurable/tested:** a real new-account Google round trip, popup blocking, physical-iPhone OAuth return, and a real incomplete-account return on the current branch. No deterministic redirect loop or runtime error cluster was found in the available Vercel runtime logs.

## 10. Onboarding findings

### Current model

- Four screens.
- Eleven required data categories: first name, last name, school, grade year, city, state, country, interests/specialties, opportunity types, availability, and career goals.
- First-time users also affirm the minimum age.
- Four primary save/continue submissions.
- Resume upload is not part of onboarding and is not required.
- Each successful step upserts the profile and writes an audit action.
- The final completion action is idempotent and redirects to the intended student destination.
- Product matching value is not shown until final completion.

### Friction

- The amount of required information exceeds what initial matching needs.
- Name and school are useful profile data, not ranking prerequisites.
- Availability and career goals improve ranking/explanations but can follow initial value.
- The copy did not clearly state required fields, immediate payoff, or that resume upload could wait.
- Mobile controls used 14 px type and could trigger iOS zoom.
- Global Enter suppression made keyboard submission nonstandard.
- Current instrumentation cannot identify validation, network, session-expiry, or pre-save abandonment.

### Proposed progressive-profile model

This is a recommendation, not an implemented redesign.

| Collection point               | Fields                                                                                                                    | Rationale                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Before initial matching        | Grade; city + state or ZIP/metro; interests; opportunity type                                                             | Sufficient for useful candidate ranking against current grade, geography, specialty, and type logic |
| After initial value            | First/last name if absent from identity provider; school; availability; career goals                                      | Improves profile, ranking, and guidance without blocking first value                                |
| Before saving                  | Authenticated account only; no additional profile field                                                                   | Saving does not require more eligibility data                                                       |
| Before starting an application | Confirm identity fields and any application-required contact/profile data; resume only when the workflow benefits from it | Collect at the point of explained need                                                              |
| Specific eligibility checks    | Minimum age/birth-date-derived eligibility, certification, country/state constraints, prerequisites                       | Required only when an opportunity rule depends on it                                                |
| Optional enrichment            | Resume, experience, free-text goals, notification preferences                                                             | Improves recommendations and application reuse                                                      |

Grade + coarse location + interests alone are close but not quite ideal: opportunity type is a low-friction fourth input already used by matching and prevents obviously irrelevant results. Age/certification must be requested before asserting eligibility for affected opportunities. Initial results should be labeled “potential matches” until those conditional checks are complete.

## 11. Conversion and trust review

1. A first-time student can understand within five seconds that FP helps build a path into healthcare and discover opportunities.
2. “Create Free Profile” communicates price but is administrative; the adjacent “Explore Opportunities” path provides value-first browsing.
3. Real opportunities are publicly inspectable without an account.
4. Trust material exists across impact, partner, about, privacy, and methodology copy, though it is distributed.
5. “Verified” and partner/source concepts are visible, but the exact verification scope should stay aligned with the claims registry.
6. The audience and free nature of the student profile are communicated.
7. The exact post-signup flow was less clear; the onboarding copy now says matching follows completion.
8. Visitors receive opportunity-list value before signup, but personalized value waits until an extensive profile is complete.
9. Four screens are not inherently excessive, but 11 required categories before first personalized value are.
10. Resume is correctly optional but this was not explicit enough; the copy now states it can be added later.
11. After completion, dashboard/opportunity recommendations provide a concrete next action.
12. Persisted progress supports continuation, but there is no measured reminder/return funnel.
13. Mobile landing copy is substantial but bounded; the primary heading/CTA are above fold at tested sizes.
14. Labels, required markers, error associations, and explanations are generally clear; why each later field is necessary can be improved in a progressive redesign.

## 12. Performance findings

### User-provided RUM context

Approximate Jul 19–24 values: FCP 2.73 s, LCP 6.97 s, INP 96 ms, CLS 0, TTFB 0.55 s, homepage score 56. These are field measurements from a different window and population than the lab tests.

### Deployed production lab baseline

Three cold contexts per route:

| Route/profile              | Median FCP | Median LCP |    TTFB |     Load | First-party JS | CLS |
| -------------------------- | ---------: | ---------: | ------: | -------: | -------------: | --: |
| Home, desktop 1440×900     |     352 ms |     352 ms | 34.2 ms | 421.8 ms |      373,987 B |   0 |
| Opportunities, desktop     |     360 ms |     676 ms | 34.4 ms |        — |      352,231 B |   0 |
| Sign-up, desktop           |     328 ms |     328 ms |       — |        — |      307,422 B |   0 |
| Sign-in, desktop           |     336 ms |     336 ms |       — |        — |      307,422 B |   0 |
| Home, mobile slow profile  |     824 ms |     824 ms | 34.4 ms | 2,561 ms |      373,987 B |   0 |
| Opportunities, mobile slow |     832 ms |          — |       — | 2,444 ms |      352,231 B |   0 |
| Sign-up, mobile slow       |     860 ms |          — |       — | 3,309 ms |              — |   0 |
| Sign-in, mobile slow       |     860 ms |          — |       — | 3,316 ms |              — |   0 |

Slow profile: iPhone 13 emulation at 390×664, 1.6 Mbps down, 750 Kbps up, 150 ms latency, 4× CPU slowdown. The deployed homepage LCP element was the brand-mark text, not the hero heading.

### Isolated before/after at identical source environment

Five cold contexts per build:

| Metric               |  Before `8e1dc75` | After `5753513` |            Measured change |
| -------------------- | ----------------: | --------------: | -------------------------: |
| Median FCP           |            764 ms |          764 ms |                       0 ms |
| Median LCP           |            764 ms |          764 ms |                       0 ms |
| LCP element          | Brand-mark `span` |       Hero `h1` | Correct meaningful element |
| Median load          |        2,476.2 ms |      2,467.1 ms |       -9.1 ms; noise-scale |
| First-party transfer |         445,199 B |       445,209 B |                      +10 B |
| JS transfer          |         355,209 B |       355,212 B |                       +3 B |
| Long tasks           |             74 ms |           74 ms |                       0 ms |
| CLS                  |                 0 |               0 |                          0 |
| Max console errors   |                 0 |               0 |                          0 |
| Max failed requests  |                 0 |               0 |                          0 |

The fixed build met the lab goals of LCP <2.5 s, FCP <1.8 s, and zero meaningful layout shift under the agreed profile. Field RUM must be rechecked after production deployment; the branch does not prove a field-metric improvement.

### Root cause

The hero media was not oversized—there is no critical hero image/video to compress. Fonts use `next/font`, and Vercel telemetry is not duplicated. The critical defect was hydration-gated presentation: `MarketingReveal` initially hid the entire hero and revealed it from a client effect. The browser therefore selected a much smaller visible element as LCP. Below-fold reveal components remain client-side and are no longer on the critical hero path.

Current post-build uncompressed client chunk inventory is approximately:

- Homepage: 277,621 bytes across 10 referenced JS chunks.
- Opportunities: 196,332 bytes across nine referenced JS chunks.
- Onboarding: 409,611 bytes across 13 referenced JS chunks.

These build-manifest sizes are prioritization signals, not network-transfer values. The branch intentionally did not attempt a broad authenticated-bundle refactor.

## 13. Accessibility findings

- Existing axe WCAG A/AA route coverage found no detectable violation in isolated repetitions.
- Heading structure and link purposes on primary marketing surfaces are coherent.
- Onboarding controls have labels, required markers, `aria-invalid`, error IDs, and required semantics.
- Touch targets are at least 44 px for the controls modified in this audit.
- Mobile control font size is now 16 px before `sm`, reducing iOS zoom risk.
- Critical hero content is visible before hydration and with JavaScript delays.
- Reduced-motion behavior keeps revealed content visible; the existing test was updated to verify below-fold animation rather than requiring the hero animation.
- Enter now follows native form semantics, except the custom specialty chip input where Enter intentionally adds a chip.
- Automated coverage does not replace VoiceOver, hardware keyboard, zoom, contrast-in-context, and physical safe-area/keyboard checks; those remain pending on a real iPhone.

## 14. Attribution findings and proposal

### Current state

- Vercel Analytics and Speed Insights are enabled only in Vercel runtime environments.
- No other product analytics provider is installed.
- No first-touch/last-touch fields or UTM model exists.
- No test/admin exclusion consistently connects route analytics to database cohorts.
- OAuth source preservation is not implemented; whether Google overwrote acquisition for any user is not measurable.
- A first-party, privacy-safe state-transition model is justified, but it requires a schema decision and approval.

### Attribution design

On first eligible landing, store a random anonymous acquisition ID and sanitized first-touch fields in a same-site, secure cookie: source, medium, campaign, content, term, landing path, referrer category, and timestamp. Never replace first touch. Update a separate last-touch set only for a genuine external arrival; ignore same-origin navigation and known OAuth/auth provider referrers. Carry only the opaque ID through Clerk return state/metadata where supported, then server-side link it once to the new User. Keep raw URLs and free text out of the record.

Normalize keys as `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term`. Limit values to a short allowlisted character set and length. Treat missing values as `direct`/`unknown`, not as Google. Add unit and E2E tests for first-touch immutability, last-touch updates, internal-navigation exclusion, OAuth return, and expired-cookie behavior.

### Minimal privacy-safe event taxonomy

Global prohibited properties for every event: name, email, exact street address, resume or essay content, free-text profile values, auth/session tokens, sensitive demographics, and raw query strings. Proposed retention is 13 months for aggregate product events, with shorter raw-event retention if a final policy requires it. This is a proposal only.

| Event                          | Trigger and identity                               | Allowed properties                                                       | Source / dedupe                                            | Side, persistence, funnel use                          |
| ------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------ |
| `landing_viewed`               | First qualifying marketing page load; anonymous ID | landing path enum, sanitized UTM set, referrer category, device category | Client navigation; once per anon ID + path + 30 min        | Client capture; persist 13 mo; acquisition denominator |
| `primary_cta_clicked`          | Primary home CTA activation; anonymous             | CTA enum, destination path, viewport category                            | Client; event ID, once per activation                      | Client capture; persist; landing intent                |
| `opportunities_viewed`         | Public inventory rendered; anonymous/auth          | filter-count bucket, result-count bucket, page                           | Client after usable render; anon/session + route state     | Client capture; persist; discovery                     |
| `opportunity_viewed`           | Public/private detail rendered; anonymous/auth     | opportunity ID, source surface, eligibility-state enum                   | Server page render preferred; actor + opportunity + 30 min | Server; persist; discovery depth                       |
| `signup_started`               | Clerk sign-up UI becomes usable; anonymous         | acquisition ID, auth surface, device category                            | Client; once per anon/session                              | Client capture; persist; signup denominator            |
| `signup_completed`             | User creation/sync succeeds; authenticated         | user ID, auth-method enum, acquisition ID                                | Server/User source of truth; unique user                   | Server; persist; signup conversion                     |
| `signin_completed`             | Existing session established                       | user ID, auth-method enum, return-path enum                              | Server/session; once per session                           | Server; persist; return conversion                     |
| `oauth_returned`               | App receives verified OAuth callback/session       | provider enum, return-path enum, state-preserved boolean                 | Server callback/session; provider transaction ID hash      | Server; persist; OAuth reliability                     |
| `auth_error`                   | Recoverable auth failure shown                     | error-code enum, phase enum, provider enum                               | Server/client boundary; event ID + code                    | Persist sanitized event; auth diagnostics              |
| `onboarding_started`           | First onboarding page render for incomplete user   | user ID, first-touch age bucket, resume-step index                       | Server; unique user + completion cycle                     | Server; persist; onboarding denominator                |
| `onboarding_step_viewed`       | A step becomes usable                              | step index/name enum, resumed boolean                                    | Client; user + step + cycle                                | Client capture; persist; step reach                    |
| `onboarding_step_completed`    | Step transaction commits                           | step index/name enum, attempt count bucket                               | Existing server AuditLog; transaction ID                   | Server; persist; step conversion                       |
| `onboarding_validation_failed` | Submission rejected                                | step enum, field-code enums, error-count bucket                          | Server validation result; request ID                       | Server; persist; friction diagnosis                    |
| `onboarding_abandoned`         | No completion within defined 24 h window           | last completed step enum, elapsed bucket                                 | Derived job/query; user + cycle unique                     | Server-derived; persist/derive; abandonment            |
| `profile_completed`            | Completion transaction commits                     | completion version, elapsed bucket                                       | Existing exact AuditLog; unique user/version               | Server; persist; primary conversion                    |
| `recommendation_viewed`        | Recommendation impression rendered                 | opportunity ID, rank bucket, model/version enum                          | Existing RecommendationEvent; impression key/window        | Server/client confirmed; persist; activation           |
| `opportunity_saved`            | Save transaction commits                           | opportunity ID, source surface                                           | Database save source; unique active save state             | Server; persist; activation                            |
| `opportunity_dismissed`        | Dismiss transaction commits                        | opportunity ID, reason enum only                                         | Database state; user + opportunity + state version         | Server; persist; recommendation quality                |
| `application_started`          | Workspace/application record commits               | opportunity ID, pathway enum internal/external                           | Application row; unique application                        | Server; persist; activation                            |
| `application_submitted`        | Internal submit transaction commits                | opportunity ID, pathway enum, final status enum                          | Application transition; application + transition           | Server; persist; outcome                               |

The required `landing_viewed` through `application_submitted` taxonomy is intentionally smaller than a clickstream. Existing database transitions should remain the source of truth wherever possible.

## 15. Privacy and security observations

- All inspected public-schema workflow tables have RLS enabled with no policies. Anonymous direct access was denied in verification. This is consistent with a server-only Prisma architecture and is not, by itself, an exposure.
- Supabase's `rls_enabled_no_policy` advisor is informational for this architecture; document the intention so a future direct-client feature does not assume access.
- Private dashboard responses use strict no-store headers.
- CSP uses per-request nonces, strict dynamic scripts, frame restrictions, and explicit Clerk/Sentry/Vercel endpoints.
- The local WebKit fix preserves `upgrade-insecure-requests` on Vercel HTTPS deployments.
- Security headers, safe redirects, role boundaries, webhook paths, and server actions have unit coverage.
- No high-confidence secret was found in tracked text.
- No production runtime-error cluster was found in the available seven-day Vercel logs.
- Duplicate normalized email groups were zero in the aggregate query.
- No role/profile inconsistency was observed in aggregate: all profiles belonged to students; no student had partner membership.

Reference: Supabase database linter rule `0008_rls_enabled_no_policy`: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## 16. Prioritized issue list

### P0

None verified.

### P1

| ID   | Finding                                                                | Evidence                         | State                                          |
| ---- | ---------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------- |
| P1-1 | Signup-to-profile completion is 11.1%; 86.7% have no saved-step signal | Exact 45-user cohort             | Diagnosis; progressive redesign needs approval |
| P1-2 | No pre-save/onboarding abandonment observability                       | Schema and event audit           | Proposal needs schema approval                 |
| P1-3 | Hero meaning was hidden until client reveal/hydration                  | Actual LCP element and source    | Fixed in `5753513`                             |
| P1-4 | Mobile form text could trigger iOS zoom; Enter was blocked             | CSS/form handler inspection      | Fixed in `5753513`                             |
| P1-5 | First/last-touch and UTMs do not survive as first-party truth          | Schema/auth/analytics inspection | Design proposed; approval required             |
| P1-6 | Fixed branch has not completed a physical-iPhone authenticated pass    | Safari device not visible        | Blocked on device + preview                    |

### P2

| ID   | Finding                                                            | Evidence                                        | State                                  |
| ---- | ------------------------------------------------------------------ | ----------------------------------------------- | -------------------------------------- |
| P2-1 | Onboarding payoff/required/resume copy was ambiguous               | UI review                                       | Fixed in `5753513`                     |
| P2-2 | CI had Chromium only                                               | Playwright/CI configuration                     | Fixed in `eb334d0`                     |
| P2-3 | Local production CSP broke WebKit HTTP validation                  | Reproduced WebKit asset upgrades                | Fixed in `eb334d0`                     |
| P2-4 | Authenticated client bundle is comparatively large                 | Build manifest: onboarding ~410 KB uncompressed | Backlog, measure before refactor       |
| P2-5 | Third-party YouTube GPU warning can flake strict concurrent checks | One full run; 9/9 isolated passes               | Monitor; do not suppress broadly       |
| P2-6 | Seven moderate transitive dev-tool advisories                      | `npm audit`                                     | Schedule controlled dependency upgrade |

## 17. Fixes implemented

### Commit `5753513` — mobile acquisition and onboarding UX

- Removed the client reveal gate from the critical homepage hero.
- Kept below-fold reveals and reduced-motion behavior.
- Restored normal Enter submission on onboarding inputs.
- Preserved Enter-to-add behavior for custom specialty chips.
- Added 16 px mobile input/select/textarea type and 44 px minimum controls.
- Added autofill semantics for name, school, city, state, and country.
- Clarified required fields, immediate matching payoff, and optional-later resume.
- Updated the marketing interaction regression.

### Commit `eb334d0` — WebKit acquisition regression coverage

- Added desktop WebKit and iPhone WebKit focused projects.
- Added viewport, landscape, overflow, CTA, and history regressions.
- CI now installs Chromium and WebKit.
- Made `upgrade-insecure-requests` conditional on Vercel HTTPS runtime.
- Recognized WebKit's exact `cancelled` navigation signal only where the existing superseded-navigation policy applies.
- Added unit coverage for CSP and browser cancellation behavior.

### Commit `3d90bbb` — public performance harness

- Added `npm run audit:performance:public`.
- Added bounded public routes and 1–10 cold runs.
- Reports actual LCP element, FCP, LCP, CLS, TTFB, load timing, long-task duration, first-party/JS transfer, console errors, and failed requests.
- Includes a documented iPhone 13 slow-network/CPU profile.

## 18. Tests added and changed

- Six new browser scenarios execute in three projects: 18 new executions.
- Four portrait viewport checks: 320, 375, 390, and 430 px widths.
- One landscape check at 844×390.
- One back/forward route-history check.
- Three new unit cases across CSP and runtime cancellation policy.
- Existing reveal coverage now asserts the hero is not hydration-hidden and below-fold reduced-motion behavior still works.
- Unit count increased from 365 to 368.
- Browser count increased from 89 to 107.

## 19. Required test matrix

The machine-readable form is `docs/audits/2026-07-25-funnel-mobile-performance-test-results.json`.

| ID       | Surface                    | Device/browser                 | Auth                     | Preconditions/steps               | Expected                             | Actual                                        | Status  | Severity | Evidence                 | Mode   | Regression | Fix                  |
| -------- | -------------------------- | ------------------------------ | ------------------------ | --------------------------------- | ------------------------------------ | --------------------------------------------- | ------- | -------- | ------------------------ | ------ | ---------- | -------------------- |
| HP-D-01  | Homepage                   | Chromium desktop               | Anonymous                | Load home; inspect hero/CTAs      | Immediate useful hero                | Visible; no runtime error                     | PASS    | P1       | E2E + lab                | Auto   | Yes        | `5753513`            |
| HP-I-01  | Homepage                   | iPhone WebKit emulation        | Anonymous                | 320/375/390/430 widths            | CTA above fold; no overflow          | 18 matrix executions pass                     | PASS    | P1       | `browser-matrix.spec.ts` | Auto   | Yes        | `eb334d0`            |
| OD-D-01  | Opportunity discovery      | Chromium desktop               | Anonymous                | Browse, search, filter, detail    | Public discovery works               | Passed                                        | PASS    | P1       | E2E smoke                | Auto   | Existing   | —                    |
| OD-I-01  | Opportunity discovery      | iPhone WebKit emulation        | Anonymous                | Open from home; history           | Route and history stable             | Passed                                        | PASS    | P1       | Browser matrix           | Auto   | Yes        | `eb334d0`            |
| SU-D-01  | Sign-up                    | Chromium production            | Anonymous                | Load sign-up                      | Clerk UI/recovery surface loads      | Passed with allowed vendor notices            | PASS    | P1       | Production E2E           | Auto   | Existing   | —                    |
| SU-P-01  | Sign-up                    | Physical iPhone Safari         | Anonymous                | Open and start signup             | Usable, no zoom/popup issue          | Device not visible                            | NOT_RUN | P1       | Safari inspection        | Manual | No         | —                    |
| AU-O-01  | Google OAuth return        | Physical iPhone Safari         | Test account             | User completes Google auth        | State and intended return preserved  | Not run; credentials never automated          | NOT_RUN | P1       | Required manual pass     | Manual | No         | —                    |
| AU-R-01  | Incomplete-account return  | Server/unit + physical pending | Student incomplete       | Reopen dashboard                  | Resume intended step                 | Source/unit behavior passes; physical pending | PARTIAL | P1       | Auth/onboarding tests    | Mixed  | Existing   | —                    |
| ON-F-01  | Onboarding fresh start     | Unit/action                    | Student incomplete       | Load and save each step           | Four resumable steps                 | Passed                                        | PASS    | P1       | Unit/action suite        | Auto   | Existing   | —                    |
| ON-R-01  | Onboarding refresh         | Unit/action                    | Partially complete       | Save, refresh                     | Resume saved step/data               | Passed at action/source level                 | PASS    | P1       | Unit tests               | Auto   | Existing   | —                    |
| ON-B-01  | Onboarding back            | Unit/action                    | Partially complete       | Back then forward                 | Data/state preserved                 | Passed at action/source level                 | PASS    | P1       | Unit tests               | Auto   | Existing   | —                    |
| ON-V-01  | Validation failure         | Unit/action                    | Invalid fields           | Submit                            | Clear field errors, values retained  | Passed                                        | PASS    | P1       | Unit tests               | Auto   | Existing   | —                    |
| ON-S-01  | Server failure             | Unit/action                    | Forced transaction error | Submit/retry                      | No false completion; recoverable     | Passed                                        | PASS    | P0       | Unit tests               | Auto   | Existing   | —                    |
| ON-PK-01 | Onboarding keyboard        | Physical iPhone Safari         | Test student             | Focus/type/Enter/dismiss keyboard | No zoom/obscured CTA; native submit  | CSS/automated fix verified; physical not run  | NOT_RUN | P1       | Source + pending device  | Manual | Yes        | `5753513`            |
| ON-PF-01 | Resume/file upload         | Physical iPhone Safari         | Test student             | Upload harmless file later        | Picker clear; safe success/failure   | Not run                                       | NOT_RUN | P1       | Pending device           | Manual | No         | —                    |
| ON-C-01  | Profile completion         | Unit/action                    | Valid final step         | Duplicate final submit            | One complete profile, idempotent     | Passed                                        | PASS    | P0       | Unit tests               | Auto   | Existing   | —                    |
| ON-D-01  | Post-completion redirect   | Unit/auth                      | Complete student         | Finish onboarding                 | Intended dashboard                   | Passed at server/unit level                   | PASS    | P1       | Unit tests               | Auto   | Existing   | —                    |
| AC-S-01  | Save opportunity           | Unit/action                    | Complete student         | Save twice                        | One saved state/idempotent           | Passed                                        | PASS    | P1       | Unit tests               | Auto   | Existing   | —                    |
| AC-A-01  | Start application          | Unit/action                    | Eligible student         | Begin internal/external pathway   | Workspace starts; no external submit | Passed at action level                        | PASS    | P1       | Unit tests               | Auto   | Existing   | —                    |
| AU-L-01  | Logout/login return        | Physical iPhone + source       | Test account             | Logout, login, close/reopen       | Correct destination/session behavior | Source checks pass; physical not run          | PARTIAL | P1       | Auth tests               | Mixed  | Existing   | —                    |
| RB-S-01  | Student attempts admin     | Unit/auth                      | Student                  | Request admin route               | Redirect/deny                        | Passed                                        | PASS    | P0       | Role tests               | Auto   | Existing   | —                    |
| RB-A-01  | Anonymous attempts student | Chromium + unit                | Anonymous                | Request dashboard                 | Sign-in with safe return             | Passed                                        | PASS    | P0       | E2E/unit                 | Auto   | Existing   | —                    |
| PF-H-01  | Homepage performance       | Chromium slow profile          | Anonymous                | Five cold contexts                | LCP <2.5 s; real hero is LCP         | 764 ms; hero `h1`; CLS 0                      | PASS    | P1       | Audit harness            | Auto   | Yes        | `5753513`, `3d90bbb` |
| RS-M-01  | Mobile overflow            | WebKit/Chromium emulation      | Anonymous                | Five viewport/orientation states  | No horizontal overflow               | Passed                                        | PASS    | P1       | Browser matrix           | Auto   | Yes        | `eb334d0`            |
| PF-S-01  | Slow network               | Chromium iPhone profile        | Anonymous                | 1.6 Mbps/150 ms/4× CPU            | Useful content; no failures          | Passed; 0 console/request failures            | PASS    | P1       | Audit harness            | Auto   | Yes        | `3d90bbb`            |
| AX-01    | Accessibility basics       | Chromium + axe                 | Anonymous                | Scan public routes                | No WCAG A/AA detectable issue        | 9/9 isolated pass                             | PASS    | P1       | axe E2E                  | Auto   | Existing   | —                    |

## 20. Proposed changes requiring approval

1. **Progressive onboarding redesign and completion semantics.** Reduce the initial match gate to grade, coarse location, interests, and opportunity type; collect other fields after showing potential matches. This changes product behavior and required-field policy.
2. **First-party attribution/event persistence.** Add a minimal schema or approved reuse of an existing audit model, with opaque anonymous IDs, sanitized UTMs, source categories, dedupe keys, and retention enforcement.
3. **Clerk acquisition handoff.** Persist the opaque acquisition ID safely through OAuth and link it server-side on account creation. This touches authentication integration and needs focused review.
4. **Preview and production deployment.** A preview is needed for the physical post-fix authenticated iPhone pass. Production deployment requires explicit approval.
5. **Dedicated non-production auth storage states.** Provision test Clerk users/storage state for complete, incomplete, admin, staff, and partner roles so the 27 authenticated E2E scenarios run in CI without production accounts.
6. **Controlled dependency upgrade.** Resolve Hono/Valibot/Prisma transitive advisories in a separate branch with migration/build/regression validation; do not use `npm audit fix --force` blindly.
7. **Authenticated bundle investigation.** Profile the ~410 KB uncompressed onboarding chunk inventory before choosing code-splitting changes.

No PostHog, paid Vercel event feature, or other vendor is recommended before exhausting the first-party and existing-database options.

## 21. Rollback plan

- Revert `5753513` to restore the prior hero reveal and input behavior.
- Revert `eb334d0` to remove WebKit projects and restore prior local CSP/test handling. Production CSP behavior is unchanged by this commit when `VERCEL` is present.
- Revert `3d90bbb` to remove only the audit script/package command.
- No database rollback is required because there is no schema or data mutation.
- No vendor/configuration rollback is required.
- After any rollback, rerun format, type, lint, unit, build, Chromium smoke, and the relevant performance comparison.

## 22. Deployment checklist and order

1. Review the three implementation commits and this report.
2. Create a Vercel preview from this branch; do not promote it.
3. Run full signed-out Chromium/WebKit automation against the preview.
4. Run the complete physical-iPhone Safari test against the preview with a dedicated test account.
5. Confirm Clerk preview-domain and OAuth return configuration without changing production auth.
6. Re-run the slow-profile audit against preview and compare the real LCP element.
7. Obtain explicit production-deployment approval.
8. Deploy the three code commits without any schema change.
9. Run production smoke: homepage, opportunity inventory/detail, sign-up, sign-in, safe protected redirect, and test-account onboarding.
10. Monitor before considering the progressive-onboarding or analytics migration as a second release.

## 23. Post-deployment monitoring

### First 24 hours

- Vercel deployment/runtime errors and Sentry error rate.
- Homepage field FCP/LCP/CLS and actual lab LCP element.
- `/` → `/sign-up` and `/opportunities` route reach.
- Clerk sign-in/sign-up failures and redirect anomalies.
- New student accounts, first saved onboarding step, and exact completions.
- Completion transaction errors and duplicate audit events.
- Opportunity recommendation impressions, saves, and application starts.
- Compare mobile/iOS separately where Vercel provides the segment.

Rollback if the hero/CTA is missing, WebKit assets fail, auth redirects regress, server error rate materially increases, or profile completion transactions fail.

### Seven days

- Exact student signup cohort completion at 1 h, 24 h, and 7 d.
- Share of signups with no first saved step.
- Step-save reach by step using existing actions.
- Median time to profile completion.
- Unique recommendation viewers, savers, and application starters among each signup cohort.
- Homepage mobile/iOS LCP p75 and bounce/route-exit trend.
- Organic/social/referral mix only as directional route analytics until first-touch exists.
- Support reports related to iOS zoom, keyboard, OAuth, or resume upload.

## 24. Targets for the next 500 visitors

Because attribution is incomplete, these are operational targets, not statistical promises.

| Metric                                    | Current directional/verified      | Next-500 target                                |
| ----------------------------------------- | --------------------------------- | ---------------------------------------------- |
| Reach `/sign-up`                          | ~24% user-provided                | Maintain ≥22%; do not trade quality for clicks |
| Visitor → student account                 | ≤8.3% directional                 | ≥10% with aligned dates/identity               |
| Signup → first persisted onboarding step  | 13.3% verified                    | ≥50%                                           |
| Signup → completed useful profile in 24 h | 8.9% (4/45)                       | ≥30% before traffic expansion                  |
| Signup → completed profile in 7 d         | 11.1% current observed            | ≥40%                                           |
| Completed profile → recommendation view   | Not cohort-measurable             | ≥80% once instrumented                         |
| Completed profile → save                  | Not cohort-measurable             | ≥20%                                           |
| Completed profile → application start     | Not cohort-measurable             | ≥10%                                           |
| Homepage mobile LCP p75                   | User snapshot ~6.97 s overall LCP | <2.5 s after enough field samples              |
| Homepage CLS                              | 0                                 | ≤0.05                                          |
| Auth/runtime critical errors              | No cluster found                  | 0 deterministic funnel blocker                 |

Do not buy substantial additional traffic until signup-to-first-step and signup-to-profile completion improve or instrumentation proves the apparent loss is a measurement artifact.

## 25. Commands and evidence

Substantive safe commands run:

```text
git fetch --all --prune
git switch -c codex/funnel-mobile-performance-audit
git merge --ff-only origin/main
npm ci
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run db:validate
npm run security:secrets
npm run security:audit
npm run build
MIGRATION_VALIDATION_DATABASE_URL=<disposable-local-postgres> npm run db:migrate:validate
npx playwright test --list
PLAYWRIGHT_BASE_URL=https://fp-dashboard-rosy.vercel.app npx playwright test
npx playwright test tests/e2e/browser-matrix.spec.ts
npx playwright test tests/e2e/accessibility.spec.ts --project=chromium --repeat-each=3
CI=true GITHUB_ACTIONS=true E2E_PUBLIC_ONLY=true PLAYWRIGHT_WEB_SERVER_COMMAND="npm start" npm run test:e2e
node scripts/audit-public-performance.mjs --base-url=https://fp-dashboard-rosy.vercel.app --profile=desktop --runs=3 --routes=/,/opportunities,/sign-up,/sign-in
node scripts/audit-public-performance.mjs --base-url=https://fp-dashboard-rosy.vercel.app --profile=mobile-slow-4g --runs=3 --routes=/,/opportunities,/sign-up,/sign-in
node scripts/audit-public-performance.mjs --base-url=http://127.0.0.1:3101 --profile=mobile-slow-4g --runs=5 --routes=/
node scripts/audit-public-performance.mjs --base-url=http://127.0.0.1:3102 --profile=mobile-slow-4g --runs=5 --routes=/
git diff --check
```

Environment values and credentials are intentionally omitted. Production cohort work used read-only aggregate database queries; no row-level output was retained in this report.

## 26. Final conclusion

The code now makes the homepage's value proposition paint immediately, removes two concrete iPhone-form hazards, improves onboarding expectation-setting, and adds repeatable WebKit/performance coverage. Those are verified improvements with low rollback cost.

The business outcome is not yet proven. The exact cohort shows severe loss after signup, but current instrumentation cannot locate it before the first successful save. A progressive value-first onboarding model and privacy-safe first-party attribution are the highest-leverage next changes, both requiring approval. A real post-fix physical-iPhone authenticated pass is also still required before claiming that a student can complete the entire flow reliably on the primary iOS platform.
