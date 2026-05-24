# Security and Privacy

FP Dashboard handles student and partner workflow data. The beta posture is conservative: protect sensitive routes, keep secrets server-only, avoid unnecessary document collection, and maintain auditability.

## Secrets

- Never commit `.env.local`.
- Keep Clerk secret, Supabase service role key, Resend key, OpenAI key, Cron secret, and Sentry server DSN server-only.
- Public environment variables must use the `NEXT_PUBLIC_` prefix only when intentionally safe for browsers.

## Authorization

- Dashboard pages and actions use Clerk auth plus local role guards.
- Students can access only their own profile, applications, placement requests, events, service hours, and feedback.
- Partners can access only linked organization data.
- Staff can access operational queues and CRM flows.
- Admins can access admin-only imports, moderation, analytics, quality, users, audit logs, and service-hour approval.

## Data Minimization

- Onboarding tracks status metadata instead of collecting sensitive documents.
- Service certificates are metadata/status only.
- Demo seed data is clearly fake and stores no real resumes.
- Public opportunity pages select only safe published fields.

## Rate Limiting

`ActionRateLimit` provides best-effort Prisma-backed rate limiting for sensitive actions such as resume parse/upload, application submit, CSV import, and AI-assisted actions.

## Audit and Notifications

Important changes write audit logs where practical. In-app notifications are used for clear workflow recipients. Email sending remains optional and controlled by environment configuration.

## Legal Placeholders

The app includes placeholder/process pages:

- `/privacy`
- `/terms`
- `/data-deletion`

These are not a substitute for legal review before public launch.
