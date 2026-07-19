# Real opportunity import system

The importer is a production-guarded, official-source-only pipeline. Dry run is the default. It normalizes and validates source records, detects duplicates, preserves active field overrides, scores data quality, produces review artifacts, and plans archive operations without deleting referenced fixtures.

## Current curated dataset

- Source: `data/opportunities/official-opportunities-2026-07-19.json`
- Records: 30
- Dataset SHA-256: `ec7db26f023d358fc318545aa93157d5cbe4fb5fa8e92b21e959e7513c0c8881`
- Policy: primary/official organization sources only
- Categories: 14 volunteering, 10 programs, 3 research, 2 internships, and 1 shadowing opportunity

The original target was roughly 200-400 records, but source accuracy, active-cycle evidence, and official provenance take priority over count. Closed cycles, aggregator-only listings, ambiguous deadlines, and contradictory eligibility claims were excluded rather than guessed.

## Dry run

```powershell
npm run opportunities:import -- --dataset data/opportunities/official-opportunities-2026-07-19.json --environment production --archive-fixtures --out artifacts/opportunity-import/2026-07-19-production-dry-run
```

The verified read-only production dry run observed `postgres.public`, project ref `ksuzzfzufotrwrxdrynl`, and 7 opportunity rows. Its plan is:

- Create: 30
- Update: 0
- Unchanged: 0
- Reject: 0
- Duplicate: 0
- Needs review: 0
- Archive: 6 public fixtures
- Restore: 0

The dry-run approval digest binds the normalized plan and database-state hash while excluding only generation timestamps, so it can be reproduced during an approved guarded run. The exact current digest is recorded in the generated `dry-run.json` and `production-write-plan.md` artifacts.

Current dry-run approval digest: `5e84e021eeb984c26f42b06fc0b27db245bc8661d9cc18fb8dcd7b9e767489a0`

Artifacts are under `artifacts/opportunity-import/2026-07-19-production-dry-run/` and include normalized JSON, publication-review CSV, action summaries, duplicate/rejection/review reports, a production write plan, and URL-verification results.

## URL verification

```powershell
npm run opportunities:verify -- --dataset data/opportunities/official-opportunities-2026-07-19.json --out artifacts/opportunity-import/2026-07-19-production-dry-run/url-verification
```

The verifier resolves DNS before connection, rejects private or mixed public/private results, pins the request to a validated public address, revalidates redirects, limits body size and redirects, and uses bounded concurrency, timeout, and retry behavior. It records response evidence and a content fingerprint. It never auto-publishes, auto-unpublishes, or auto-archives a record.

The current 31-URL report contains 24 healthy results, 6 official redirects, and 1 HTTP 403 bot block from an official HHS page. The blocked response remains a human-review item; it is not treated as proof that the program is invalid.

## Production prerequisites

No production command is authorized by this document. Before a write:

1. Reconcile live migration history, including the missing `20260715020500_secure_private_workflow_tables` entry and restored migration checksums.
2. Take a fresh logical backup and prove it can be restored to a disposable target.
3. Apply and validate `20260719120000_real_opportunity_import_system` in a disposable database first.
4. Re-run the full dry run against production and verify the exact project ref, database, schema, row count, dataset hash, action counts, and generated approval phrase.
5. Obtain explicit owner approval for that exact plan.
6. Run the guarded import once. A production commit requires `--commit`, `--allow-production`, the expected identity/count flags, the dry-run hash, and the exact approval phrase.
7. Review all imported records in the admin queue before publication. Imports default to `PENDING_APPROVAL`.

## Archive and reversal behavior

- Referenced demo records are archived, never deleted.
- Every committed run and row is stored in an import ledger.
- Active field overrides are preserved during refreshes.
- Each changed opportunity receives complete before/after snapshots in `OpportunityChangeEvent`.
- Reversal is a reviewed administrative operation based on those snapshots. Do not apply an automated reversal without comparing intervening edits and taking a new backup.

## Recurring checks

The weekly `/api/jobs/opportunity-verification` job follows the existing `CRON_SECRET` authorization pattern. It checks a bounded batch and creates verification-review records. Non-healthy results require human review and do not silently alter publication status. Until the additive schema exists, the route fails closed with a service-unavailable response.
