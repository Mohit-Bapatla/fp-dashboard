# AI Systems

FP Dashboard uses AI only as an optional assistant layer. Deterministic functionality is always the source of truth, and the app works without `OPENAI_API_KEY`.

## Server-Only Boundary

OpenAI helpers, resume parsing helpers, Supabase admin helpers, PDF/DOCX parsing, and embedding generation remain in server-only modules and server actions. Client components receive only safe derived text and structured values.

## Resume Parsing

Resume parsing downloads private files server-side, extracts text when supported, and stores:

- `parsedText`
- `parsedSummary`
- `extractedSkills`
- `extractedEducation`
- `extractedExperience`
- `extractedCertifications`
- `parseStatus`

If optional AI is unavailable, deterministic parsing and safe failure states still work.

## Applicant Summaries

Partner applicant review uses deterministic summaries based on allowed profile, resume, application, and opportunity fields. OpenAI may polish wording only. It must not automate accept/reject decisions.

## Outreach Assistant

Staff outreach drafts use templates first. OpenAI may polish the editable subject/body when a key is present. The app never sends outreach automatically in this flow.

## Embeddings

Embeddings are stored as JSON in `EmbeddingRecord`, not pgvector. They are used as optional similarity boosts for search/recommendations and similar opportunities. Missing embeddings or missing OpenAI key falls back to deterministic search and matching.

## Safety Rules

- Do not score protected or sensitive attributes.
- Do not use name, email, demographics, or school prestige for scoring.
- Do not hide reasons or gaps.
- Show disclaimers where AI assists review.
- Humans make final decisions.
