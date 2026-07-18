"use server";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import { optionalSafeExternalUrl } from "@/lib/security/safe-url";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";
const categories = [
  "BROKEN_LINK",
  "INCORRECT_DEADLINE",
  "ELIGIBILITY_ERROR",
  "PROGRAM_CLOSED",
  "DUPLICATE",
  "OTHER",
] as const;
const value = (data: FormData, key: string) => {
  const v = data.get(key);
  return typeof v === "string" ? v.trim() : "";
};
export async function reportIncorrectOpportunity(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  if (!user.studentProfile) return;
  const opportunityId = value(formData, "opportunityId"),
    rawCategory = value(formData, "category"),
    details = value(formData, "details").slice(0, 2000),
    sourceUrl = value(formData, "sourceUrl");
  const category = categories.includes(
    rawCategory as (typeof categories)[number],
  )
    ? (rawCategory as (typeof categories)[number])
    : "OTHER";
  if (!opportunityId || !optionalSafeExternalUrl(sourceUrl)) return;
  const rate = await enforceRateLimit({
    action: "opportunity_correction_report",
    identifier: `user:${user.id}`,
    limit: 10,
    windowSeconds: 3600,
  });
  if (!rate.allowed) return;
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, visibility: "PUBLIC_DIRECTORY" },
    select: { id: true },
  });
  if (!opportunity) return;
  const report = await prisma.opportunityCorrectionReport.create({
    data: {
      opportunityId,
      reporterId: user.id,
      category,
      details: details || null,
      sourceUrl: sourceUrl || null,
    },
    select: { id: true },
  });
  await createAuditLog({
    action: "OPPORTUNITY_CORRECTION_REPORTED",
    actorId: user.id,
    entityId: report.id,
    entityType: "OpportunityCorrectionReport",
    metadata: { opportunityId, category },
  });
  revalidatePath(`/dashboard/student/opportunities/${opportunityId}`);
}
