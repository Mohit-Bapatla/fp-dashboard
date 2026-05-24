# Database Schema

The Prisma schema models FP Dashboard as a multi-role operations system. This document summarizes the main durable entities; use `prisma/schema.prisma` as the source of truth.

## Identity

- `User`: local app user linked to Clerk by `clerkUserId`, with `UserRole`.
- `StudentProfile`: profile, preferences, location, interests, availability, and student-specific metadata.
- `PartnerMember`: links partner users to partner organizations.

## Opportunity and Application Flow

- `PartnerOrganization`: partner profile, CRM status, verification fields, and organization metadata.
- `Opportunity`: partner opportunity with moderation fields, status, type, specialty, deadline, requirements, and instructions.
- `Application`: student application tied to a student profile and opportunity.
- `ApplicationOnboardingItem`: post-acceptance checklist/status item for an application.
- `InterviewRequest` and `ProposedInterviewSlot`: interview scheduling without external calendar APIs.
- `ServiceHourRecord`: verified hours and certificate metadata/status.

## Student Support and Outreach

- `Resume`: private resume metadata, parse status, parsed text, summary, and extracted structured fields.
- `PlacementRequest`: student/staff placement request workflow.
- `OutreachContact` and `OutreachTask`: staff outreach CRM records.
- `RecordComment`: chronological comments on applications, placement requests, and outreach tasks with visibility controls.

## Program Operations

- `ProgramEvent` and `EventRegistration`: internal event management and student registrations.
- `SponsorOrganization`, `SponsorContact`, `SponsorshipCampaign`, `SponsorshipCommitment`, `SponsorDeliverable`, `SponsorInteraction`: sponsorship/funding CRM.

## Quality, Analytics, and Evaluation

- `Feedback`: rating/notes tied to applications, opportunities, placement requests, or users.
- `RecommendationEvent`: impressions, clicks, applications, and search-result events.
- `DataQualityAcknowledgement`: admin acknowledgement ledger for data quality issues.
- `EmbeddingRecord`: JSON embedding storage for optional semantic similarity.
- `ActionRateLimit`: best-effort Prisma-backed rate limit ledger.

## Notifications and Audit

- `Notification`: in-app notification records.
- `AuditLog`: append-style audit records for important admin, workflow, automation, and demo actions.
- `AdminNote`: internal notes for admin/staff workflows.

## Demo Data

`prisma/seed.ts` creates fake demo rows with deterministic IDs. It does not create real Clerk users, store real resumes, or include sensitive documents.

## Migration Policy

- Add migrations only for durable product state.
- Keep schema changes focused and named by stage.
- Do not use migrations for demo-only behavior.
- Run `npm run db:validate`, `npm run db:migrate`, and `npm run db:generate` after schema changes.
