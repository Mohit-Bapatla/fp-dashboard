ALTER TABLE "Resume"
ADD COLUMN "uploadedAt" TIMESTAMP(3),
ADD COLUMN "analyzedAt" TIMESTAMP(3);

UPDATE "Resume"
SET
  "uploadedAt" = "updatedAt",
  "analyzedAt" = CASE
    WHEN "parseStatus" = 'COMPLETED' THEN "updatedAt"
    ELSE NULL
  END;

ALTER TABLE "Resume"
ALTER COLUMN "uploadedAt" SET NOT NULL,
ALTER COLUMN "uploadedAt" SET DEFAULT CURRENT_TIMESTAMP;
