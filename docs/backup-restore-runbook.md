# Backup and restore runbook

> **Draft for review — not legal advice and not attorney approved.**

## Current evidence and limitations

- The production Supabase project reported `ACTIVE_HEALTHY` in `us-east-2` on
  July 19, 2026, with PostgreSQL 17.6. Provider-plan backup retention and
  point-in-time recovery availability were not exposed by the read-only project
  check and require owner confirmation in the Supabase dashboard.
- Repository migrations are validated separately against disposable PostgreSQL
  16 in CI. That proves migration replay, not production backup recoverability.
- No production restore was attempted. A restore drill must use an isolated,
  access-controlled disposable project and synthetic or appropriately protected
  data.

## Disposable restore evidence

On July 19, 2026, the complete 21-migration history and representative legacy
upgrade were applied to an isolated PostgreSQL 16 container. A custom-format
logical dump was created inside that container and restored into a second empty
database using `--no-owner --no-privileges --exit-on-error`. Source and restore
both reported 38 public tables, 21 finished migrations, and three RLS-enabled
private workflow tables. No production connection, user record, storage object,
or backup was read or changed. This validates the repository procedure with
synthetic data; it does not prove Supabase plan retention or a production-sized
recovery time.

## Proposed objectives (owner approval required)

- Proposed RPO: 24 hours until point-in-time recovery availability is confirmed;
  use the provider's smaller documented window if enabled.
- Proposed RTO: 8 hours for a scoped database restore and validation. This is a
  planning target, not a tested guarantee.

## Logical backup

1. Confirm source project, approved operator, encrypted destination, retention,
   and incident/change ticket. Never place a dump in Git or a shared workstation
   folder.
2. Obtain a short-lived direct database credential from the approved secret
   manager without printing it. Run a version-compatible `pg_dump` in custom
   format with no owner/ACL assumptions.
3. Record timestamp, source project reference, PostgreSQL/client versions,
   encrypted artifact size, and SHA-256 in the restricted evidence log.
4. Revoke the temporary credential and enforce encrypted artifact expiry.

## Restore drill

1. Create an isolated disposable database with no production web deployment or
   email/cron integrations attached.
2. Restore with `pg_restore --no-owner --no-privileges --exit-on-error`.
3. Run Prisma schema validation, row-count reasonableness checks, foreign-key and
   ownership-isolation checks, required migration history checks, and synthetic
   application/resume workflows without exposing record contents.
4. Confirm private storage is a separate recovery domain; database restoration
   alone does not restore deleted storage objects.
5. Destroy the disposable restore and encrypted artifact according to the
   approved retention rule. Record elapsed time and resulting RPO/RTO evidence.

## Reversal and rollback limits

- Opportunity imports should be reversed only from their import/audit manifest
  and only by an approved, reviewed operation. Never delete broadly by date or
  organization name.
- Forward-only migrations may make application rollback unsafe. Prefer a tested
  forward repair; otherwise restore a pre-migration backup into an isolated
  environment before deciding.
- User edits after the backup point may be unrecoverable or may conflict with a
  full restore. Object-storage files need independent versioning/backup evidence.
- See `docs/incident-response.md` for containment and notification decisions.
