# Production opportunity write plan

- Project ref: `ksuzzfzufotrwrxdrynl`
- Environment: production
- Database/schema: `postgres.public`
- Current Opportunity rows: 7
- Demo rows detected: 7
- Create: 30
- Update: 0
- Unchanged: 0
- Archive: 6
- Restore: 0
- Duplicate: 0
- Rejected: 0
- Needs review: 0
- Dataset SHA-256: `ec7db26f023d358fc318545aa93157d5cbe4fb5fa8e92b21e959e7513c0c8881`
- Dry-run approval digest: `5e84e021eeb984c26f42b06fc0b27db245bc8661d9cc18fb8dcd7b9e767489a0`
- Transaction strategy: validate and research outside the transaction; lock matched rows in stable ID order; merge at most 500 planned rows in one atomic Serializable transaction with a 60-second timeout.
- Rollback strategy: reverse the committed import using OpportunityChangeEvent before/after snapshots; demo records are archived, never deleted.

No command in this plan is authorized until the owner explicitly approves the exact counts and approval phrase.
