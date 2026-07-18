-- Legacy completed parses may contain contact headers or unnormalized arrays.
-- Require one explicit re-analysis before the new student review is displayed.
UPDATE "Resume"
SET "analyzedAt" = NULL
WHERE "analyzedAt" IS NOT NULL;
