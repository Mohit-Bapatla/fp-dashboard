# Incident-response runbook

> **Draft for review — not legal advice and not attorney approved.**

Do not place credentials, private contacts, resume contents, or student details
in this repository or general incident channels. Use the designated private
incident system once the owner establishes it.

## First response

1. Assign an incident lead, timestamp the report, set a preliminary severity,
   and open a restricted evidence log.
2. Contain the smallest affected surface: revoke a session, disable a key,
   pause a job, block a route, or isolate a deployment. Preserve evidence before
   destructive cleanup when safe.
3. Record exact deployed SHA, environment, provider status, affected data class,
   time range, and known user impact. Never paste secrets or document contents.
4. Rotate exposed credentials through the provider, update Vercel environment
   variables, redeploy, revoke old sessions/keys, and verify the old credential
   fails.
5. Escalate to the affected vendor and to counsel/fiscal sponsor when notification,
   nonprofit, contractual, or student/minor obligations may apply.
6. Recover from a known-good version or validated backup, verify authorization
   boundaries and data integrity, monitor recurrence, and obtain incident-lead
   approval before closing containment.
7. Complete a blameless post-incident review with root cause, timeline, control
   gaps, owners, due dates, and evidence that corrective actions worked.

## Scenario checklist

| Scenario                      | Immediate containment                                                    | Required follow-up                                                                 |
| ----------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Suspected credential exposure | Revoke/rotate; identify deployments and logs that used it                | Review access logs, sessions, repository history, and vendor audit events          |
| Unauthorized account access   | Revoke sessions; protect the account; preserve auth events               | Verify role/profile/org boundaries and decide user notification with counsel       |
| Student-data exposure         | Restrict access and stop further disclosure                              | Determine affected people/data/time; counsel leads notification analysis           |
| Malicious upload              | Quarantine the object and suspend processing without downloading locally | Preserve hashes/metadata, review uploader activity, add detection/blocking         |
| Database incident             | Restrict credentials and writes; capture provider status                 | Integrity checks, point-in-time/logical restore decision, ownership-negative tests |
| Third-party vendor incident   | Disable or isolate integration when feasible                             | Vendor escalation, data-scope assessment, key rotation, contract notice review     |
| Opportunity scam/report       | Hide or mark the listing for human review; preserve source evidence      | Contact host when appropriate, review affected applications, warn users if needed  |
| Website compromise            | Roll back or disable affected deployment and rotate deploy credentials   | Compare SHA/artifacts, inspect CI, dependencies, headers, and unauthorized changes |
| Availability outage           | Use status page/provider diagnostics; avoid unsafe data fixes            | Restore service, verify queued jobs/idempotency, publish factual status updates    |

## Notification decision

The incident lead documents facts; privacy/nonprofit counsel determines legal
notification duties and timing; the owner approves operational communications.
Messages must be accurate, avoid speculation, state protective steps, and give a
safe support channel.
