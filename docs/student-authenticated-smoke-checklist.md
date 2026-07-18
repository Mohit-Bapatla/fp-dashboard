# Authenticated Student Smoke Checklist

Run this checklist only in a disposable or non-production environment. Use two
student accounts, one admin account, one verified opening-soon public
opportunity, one verified open external opportunity, and one configured
internal opportunity. Record the browser, viewport, account, result, and a
short evidence link or note for every numbered flow. Do not mark an unexecuted
flow as passed and do not use production data.

## Setup prerequisites

Configure `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
`CLERK_SECRET_KEY`, the Clerk redirect variables from `.env.example`,
`NEXT_PUBLIC_APP_URL`, and a non-production `CRON_SECRET`. Seed or create the
fixtures above before testing.

Keep email disabled unless real non-production delivery is intentionally in
scope. Real delivery additionally requires `RESEND_API_KEY`, `EMAIL_FROM`,
optional `EMAIL_REPLY_TO`, and `EMAIL_NOTIFICATIONS_ENABLED=true`. A successful
Resend request proves provider acceptance, not inbox delivery.

## Priority 0 and Priority 1 release flows

1. [ ] Student updates the existing profile and sees readiness links update.
2. [ ] Student views verified recommendations; unverified or unavailable
       opportunities are not presented as recommendations.
3. [ ] Student saves an opening-soon public opportunity, enables reopening
       follow, refreshes, and sees both states persist.
4. [ ] Student starts preparation for an `OPENING_SOON` opportunity and receives
       stable typed tasks without making a submission claim.
5. [ ] Student cannot submit an internal application before `opensAt`; both the
       hidden/disabled UI path and a direct forged Server Action are blocked.
6. [ ] Student cannot confirm an external submission before `opensAt`; both the
       UI path and a direct forged Server Action are blocked.
7. [ ] Student starts an open external application, opens the host portal, and
       sees clear copy that Future Physicians does not submit to the host.
8. [ ] Student completes, reopens, blocks, and unblocks ordinary tasks; required
       submission tasks remain protected by their authoritative actions.
9. [ ] Student uploads and selects an owned resume; the resume task and progress
       recalculate, and a required task cannot be skipped.
10. [ ] Student changes task state or resume selection and sees the deterministic
        next action change without a manual percentage or next-action field.
11. [ ] Student adds a private custom task with a title, private description,
        required flag, and optional due date.
12. [ ] Student edits that custom task's title, description, and due date, then
        deletes it; progress and next action recalculate and system tasks remain
        protected.
13. [ ] Student explicitly confirms an open external submission; the application
        and authoritative confirmation task update without an FP host claim.
14. [ ] Student explicitly submits the configured open internal opportunity and
        the existing internal email/review workflow runs only after confirmation.
15. [ ] Student adds a safe external URL, creates a workspace, sees "Private",
        "added by you", and "not verified" labels, and receives a duplicate
        error for the same normalized URL.
16. [ ] A second student cannot see the first student's private opportunity in
        the directory; public, partner, staff, and general-admin catalogs also
        hide it and the placeholder organization.
17. [ ] Cross-user URLs and forged form IDs cannot read or mutate another
        student's private opportunity, workspace, tasks, notifications, resume
        selection, or private notes.
18. [ ] Notification preferences, timezone, quiet hours, and digest opt-in
        persist; the secret-authenticated job creates exact action links,
        deduplicates repeated runs, respects quiet hours, supports open/dismiss,
        shows a structured weekly plan, and sends no empty digest.
19. [ ] Student requests verification of a private source; admin sees only the
        allowed source metadata, not private application notes, and resolving
        the request does not publish the opportunity.
20. [ ] With keyboard-only navigation and a viewport near 390px, student home,
        Tasks, add-external, application workspace, notifications, and settings
        have visible focus, announced form state, usable controls, no horizontal
        overflow, and the documented student-home section order.

## Deferred scope - do not execute as release flows

Priority 2-4 editors and actions are not implemented or represented as shipped
schema in this release. Do not treat these as available beta features:

- activity and story libraries;
- multiple named resume versions and status-only document tracking;
- reusable recommendation contacts and recommender email sending;
- versioned application-answer drafting or approval;
- interview-preparation and thank-you editors;
- outcome reporting and anonymous aggregate consent;
- student export/deletion, comparison, or calendar export workflows.

## Accessibility evidence

For each route exercised above, also record visible focus, associated labels,
announced error/success state, touch targets near 40px or larger, absence of
hover-only essential actions, readable status contrast, and useful loading,
empty, error, and recovery states.
