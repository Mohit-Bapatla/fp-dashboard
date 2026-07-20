# Opportunity freshness maintenance

The protected `GET /api/jobs/opportunity-maintenance` route is report-only and
requires `CRON_SECRET`. Production scheduling is intentionally not enabled by
this change.

## Safety properties

- Selects at most 25 due public, published listings per run and uses a 15-minute
  singleton lock.
- Resolves every hostname and redirect hop, rejects non-public addresses and
  reserved test domains, and pins the request to the validated address.
- Limits requests to 10 seconds, five redirects, and 64 KiB of response content.
- Stores only opportunity IDs, status, HTTP status, error code, redirect count,
  and public-content hash in an audit summary—never source URLs or response text.
- Reports healthy, redirected, content-changed, likely-closed, likely-reopened,
  bot-protected, blocked, timed-out, and broken checks for human review. Closure
  and reopening are conservative phrase signals, not authoritative state. The
  job never publishes, archives, marks closed, rewrites, or deletes an
  opportunity.
- Existing admin verification rules separately surface overdue verification,
  passed deadlines, missing sources, correction reports, and archived status.

## Activation and operations

1. Test authorization rejection and one authorized run in a preview attached to
   a disposable database. Do not aim it at production during validation.
2. Review the admin verification page and audit summary. Confirm a second call
   within 15 minutes is skipped.
3. Configure monitoring for non-2xx responses and missing expected runs.
4. Only after owner approval, add a Vercel Cron schedule and document the exact
   cadence. Never include the secret in the URL or logs.
5. Treat timeouts, access-denied/bot-protected responses, redirects, and content
   changes as review signals, not proof that a program closed.

Rollback: remove the schedule first, then revert the route/job/verifier code.
Existing audit summaries can remain as operational history or be removed only
under the approved retention policy.
