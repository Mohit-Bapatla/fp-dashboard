# Auth and RBAC

FP Dashboard uses Clerk for authentication and a local Prisma `User` row for application role and ownership checks.

## Roles

- `STUDENT`: student dashboard, own profile, own applications, own placement requests, own events, own service hours, and student feedback.
- `PARTNER`: linked organization dashboard, own opportunities, applicants, interviews, onboarding, service hours, and partner feedback.
- `STAFF`: placement queues, outreach, automations, embeddings refresh, staff events, sponsors, sponsorships, and operational workflows.
- `ADMIN`: admin dashboards, data imports, moderation, analytics, service hours, users, audit logs, and staff capabilities.
- `SUPER_ADMIN`: reserved top-level admin role with admin-level access.

## Clerk Metadata

Create Clerk users normally. Assign role through `publicMetadata.role`, for example:

```json
{
  "role": "STUDENT"
}
```

The local app creates or updates the corresponding `User` row through existing onboarding/user helpers. Demo seed data expects deterministic Clerk test user IDs documented in [demo-guide.md](demo-guide.md).

## Guard Helpers

- `assertStudentAccess()` protects student-only actions and pages.
- `assertPartnerAccess()` protects partner-only flows and organization scoping.
- `assertPlacementQueueAccess()` protects staff/admin operational flows.
- `assertAdminAccess()` protects admin/super-admin pages and mutations.

Ownership checks are still required after role checks. For example, a partner must be linked to the application opportunity's organization, and a student must own the student profile/application being mutated.

## Public Routes

Public opportunity previews select only safe published opportunity fields and return `notFound()` for draft, pending, closed, archived, rejected, or missing opportunities.

## Demo Mode

Demo mode is a label, not an authorization shortcut. The banner appears only after a real Clerk-authenticated demo user maps to a seeded local user.
