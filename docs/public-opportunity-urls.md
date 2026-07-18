# Public opportunity URL decision

This launch keeps the existing stable ID-based route:

```text
/opportunities/{opportunityId}
```

The public cards, dashboard links, return-to-authentication paths, and sitemap
already use the Opportunity primary key. The database has no unique slug field,
and the repository does not include an inventory of external bookmarks that
could be safely redirected. Adding slugs in this PR would therefore require a
schema change, collision and backfill rules, canonical-link handling, and
permanent redirects without improving the current route's stability.

If readable slugs become a launch requirement later, add them as a separate
migration and preserve every ID URL as a permanent backward-compatible route.
