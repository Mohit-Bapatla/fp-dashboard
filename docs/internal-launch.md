# Internal Launch Guide

Use this checklist before FP Dashboard becomes the team's daily operating workspace.

## Launch Readiness Checklist

- Confirm required environment variables are configured in local, preview, and production environments.
- Confirm all Prisma migrations are applied and `npm run db:generate` has been run.
- Confirm Clerk users have the expected `publicMetadata.role` values.
- Confirm demo users can sign in and show the demo banner.
- Confirm the Supabase Storage resume bucket exists and is private.
- Confirm optional Resend, Sentry, and OpenAI settings are intentionally enabled or left blank.
- Confirm the Vercel deployment builds and protected dashboard routes redirect correctly.
- Confirm `CRON_SECRET` is configured before enabling scheduled workflow calls.
- Confirm `npm run db:seed` has been tested only in safe demo/non-production environments.

## Staff/Admin Quick Start

- Admins should verify data imports, data quality, partner verification, opportunity moderation, analytics, service hours, feedback, and audit logs.
- Staff should run placement requests, outreach contacts, outreach tasks, automations, events, sponsors, and sponsorships through the dashboard.
- Use the authenticated support page for beta launch issues. Include role, URL, steps to reproduce, expected behavior, actual behavior, and screenshots where useful.

## Launch Boundary

This is an internal launch checklist. It does not open unrestricted public signup, replace legal/privacy review, or certify the app for broad external use.
