# Demo Guide

Demo mode makes FP Dashboard easy to show safely without real student data.

## What Demo Mode Is

- Fake, idempotent seed data in `prisma/seed.ts`.
- A dashboard banner for recognized demo accounts.
- A walkthrough dataset covering major beta workflows.

## What Demo Mode Is Not

- It is not an auth bypass.
- It is not a public demo toggle.
- It does not create Clerk users.
- It does not include real names, real student emails, real resumes, or sensitive documents.

## Seed Demo Data

```bash
npm run db:seed
```

The seed covers:

- Demo users.
- Student profile.
- Resume metadata only.
- Partner organizations.
- Opportunities.
- Applications.
- Onboarding checklist items.
- Placement requests.
- Outreach contacts and tasks.
- Interviews and proposed slots.
- Service hours and certificate metadata.
- Events and registrations.
- Sponsors, campaigns, commitments, deliverables, and interactions.
- Feedback.
- Recommendation events.
- Audit logs.
- Notifications.

## Clerk Test Users

Create matching users in Clerk. Set the Clerk user ID to the deterministic value when using a test/dev Clerk instance, or update the seed before seeding a disposable environment.

| Email                      | Clerk user ID           | `publicMetadata.role` |
| -------------------------- | ----------------------- | --------------------- |
| `demo-student@example.com` | `user_demo_student_001` | `STUDENT`             |
| `demo-partner@example.com` | `user_demo_partner_001` | `PARTNER`             |
| `demo-staff@example.com`   | `user_demo_staff_001`   | `STAFF`               |
| `demo-admin@example.com`   | `user_demo_admin_001`   | `ADMIN`               |

Example metadata:

```json
{
  "role": "ADMIN"
}
```

The app expects Clerk session claims to expose public metadata at
`sessionClaims.metadata`. Configure the Clerk session token template with:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

After changing a demo user's role in Clerk, sign out and back in before testing
dashboard routing so the session token is refreshed.

## Suggested Demo Walkthrough

1. Sign in as `demo-student@example.com` and review the dashboard, opportunities, applications, events, and service-hour summary.
2. Sign in as `demo-partner@example.com` and review applicants, interviews, onboarding, and partner success.
3. Sign in as `demo-staff@example.com` and review placement requests, outreach, automations, embeddings, events, sponsors, and sponsorships.
4. Sign in as `demo-admin@example.com` and review analytics, imports, data quality, moderation, feedback, recommendation evaluation, service hours, and audit logs.

## Safety Checklist

- Confirm the demo banner appears for demo accounts.
- Confirm the banner does not appear for normal accounts.
- Confirm role permissions still apply.
- Confirm no real resumes or sensitive files are present.
- Confirm demo emails use `example.com`.
