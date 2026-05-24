# Workflow Migration Guide

This guide helps FP move gradually from Google Forms, Sheets, and manual tracking into FP Dashboard.

## What The Dashboard Replaces

- Student profile collection moves into student onboarding.
- Student applications move into opportunity application flows.
- Partner opportunity intake moves into partner/admin opportunity creation and moderation.
- Placement request triage moves into placement request queues.
- Partner outreach moves into partner organizations, contacts, and outreach tasks.
- Applicant review moves into partner/admin applicant workflows.
- Operational counts move into analytics, advanced analytics, data quality, feedback, and recommendation evaluation pages.

## What Remains Manual For Now

- Any official legal/privacy review.
- Public launch decisions and external communications.
- Payment processing and sponsorship transactions.
- External calendar, Zoom, Google Forms, or Google Sheets integrations.
- Final human decisions for student placements, acceptances, interviews, and partner approvals.

## CSV Imports

Use `/dashboard/admin/data-imports` for sanitized CSV imports:

- Students are staged through `StudentImportRecord` and claimed only by real Clerk-authenticated users.
- Partners import into partner organization records with duplicate detection.
- Opportunities import as draft or pending approval and never auto-publish.

Do not import real resumes, applications, or sensitive documents.

## When To Stop Using Forms/Sheets

Stop using an old form or sheet for a workflow only when:

- The dashboard route exists for that workflow.
- The responsible role can access it.
- A small internal test confirms the flow works.
- Data quality checks look acceptable.
- Staff know where support issues should be reported.

## Admin Replacement Checklist

- Student signup and profile completion.
- Opportunity creation and moderation.
- Applications and applicant review.
- Placement requests and assignment.
- Outreach CRM and follow-ups.
- Partner applicant review and feedback.
- Analytics, metrics, and data quality review.
