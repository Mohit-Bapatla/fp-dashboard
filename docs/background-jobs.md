# Background Jobs

Vercel Cron calls two secured Next.js route handlers:

- Operational route: `/api/jobs/operational-workflows` at `13:00 UTC` daily
- Student reminder route: `/api/jobs/student-reminders` at `16:00 UTC` daily
- Auth: `Authorization: Bearer ${CRON_SECRET}`

Set `CRON_SECRET` in the deployment environment. Do not expose it to client
code and do not commit local secret values.

## Local Checks

Staff, Admin, and Super Admin users can run the same workflow manually from:

`/dashboard/staff/automations`

To test the route directly, start the app and call it with the configured
secret:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/jobs/operational-workflows" `
  -Headers @{ Authorization = "Bearer $env:CRON_SECRET" }
```

Calling the route without a matching bearer token should return `401`.

The student reminder route can be checked the same way:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/jobs/student-reminders" `
  -Headers @{ Authorization = "Bearer $env:CRON_SECRET" }
```

## Workflow Rules

The runner closes expired opportunities, creates in-app notifications for stale
placement requests, due partner/contact follow-ups, delayed application reviews,
and overdue outreach tasks. It logs one `AUTOMATION_RUN_COMPLETED` audit record
per run and uses rule-specific audit records to avoid duplicate notifications on
repeated runs.

The operational runner does not send email, run AI automations, create
background resume parsing jobs, or add a workflow builder.

## Student Reminders

The student reminder runner evaluates structured application data using each
student's configured IANA timezone. It creates reminders for:

- official application deadlines at 14, 7, 3, and 1 days;
- internal target dates at 14, 7, 3, and 1 days;
- saved/followed or in-progress opportunities opening in 7 or 1 days;
- followed opportunities whose structured availability is now open;
- overdue required application tasks; and
- recommendation request/confirmation tasks due in 7, 3, or 1 days;
- scheduled interviews on the student's next local calendar day; and
- due follow-up, thank-you, and optional outcome tasks when those structured
  tasks exist.

`Notification.deduplicationKey` is unique, so repeated or concurrent cron runs
do not create duplicate reminder records. If email is enabled globally and by
the student, eligible reminder records are batched into at most one email per
student per run. Email is skipped during the student's quiet hours. Undelivered
records from the prior 48 hours remain eligible for a later daily run.
The runner claims notification rows before delivery so overlapping invocations
do not send the same batch twice; failed or disabled deliveries release the
claim for a later attempt.

On Monday in each student's timezone, students who opted into the weekly
digest receive a structured summary only when the weekly plan contains at
least one action. The digest excludes essay text, resume text, private notes,
task descriptions, and recommender message content. The same plan is available
as an in-app preview in student settings. An unsent Monday digest remains
eligible for 48 hours and is regenerated from current structured data before a
retry. A successful digest absorbs that run's pending reminder batch so the
same actions are not repeated in a second reminder-summary email.

The daily cadence fits Vercel Hobby's two-cron limit, but it cannot reliably
deliver a two-hour interview reminder or deliver immediately after quiet hours.
If the fixed daily run always falls inside a student's configured quiet hours,
email remains unsent and the in-app reminder is still available. Two-hour and
post-quiet-hour delivery require an hourly Pro-plan schedule or a durable queue
and are deferred. The current `emailedAt` claim prevents overlapping sends but
is not a durable lease; a process termination after claiming and before the
email provider responds may require an operator to clear that claim. Vercel
cron invokes production deployments only; preview deployments require a manual
authenticated route check.
