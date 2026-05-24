# Matching Algorithm

The matching system is deterministic first. It explains why a student and opportunity may fit, surfaces gaps, and avoids protected/sensitive attributes.

## Inputs

Allowed signals include:

- Student specialty interests.
- Student opportunity type preferences.
- Student location and remote preference.
- Student availability where available.
- Resume extracted skills and summary.
- Opportunity type, specialty, location, remote type, paid status, eligibility, and instructions.
- Optional embedding similarity as a small boost when available.

Excluded signals include:

- Protected attributes.
- Demographics.
- Name or email.
- School prestige.
- Any sensitive document contents beyond allowed parsed resume fields.

## Score Shape

The helper returns:

- `score`: numeric fit score.
- `reasons`: positive matches.
- `gaps`: missing or weaker signals.
- supporting explanation fields used by cards and detail pages.

Recommendations rank by deterministic score first, then deadline/published recency. Optional AI may polish wording but does not change ranking.

## Search

Opportunity search uses token normalization, synonym expansion, and weighted deterministic matching across title, description, organization name, specialty, location, remote type, paid status, eligibility, and instructions. Embeddings may add a boost when present but do not replace deterministic search.

## Applicant Review

Applicant ranking/summaries are review aids only. Partner-facing UI shows fit score, strengths, gaps, suggested interview questions, and the disclaimer that AI assists review while humans make final decisions.
