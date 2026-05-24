# Background Jobs

Batch E uses Vercel Cron to call a secured Next.js route handler:

- Route: `/api/jobs/operational-workflows`
- Schedule: daily, configured in `vercel.json`
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

## Workflow Rules

The runner closes expired opportunities, creates in-app notifications for stale
placement requests, due partner/contact follow-ups, delayed application reviews,
and overdue outreach tasks. It logs one `AUTOMATION_RUN_COMPLETED` audit record
per run and uses rule-specific audit records to avoid duplicate notifications on
repeated runs.

This stage does not send email, run AI automations, create background resume
parsing jobs, or add a workflow builder.
