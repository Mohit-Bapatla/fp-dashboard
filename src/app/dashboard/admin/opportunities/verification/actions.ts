"use server";
import { revalidatePath } from "next/cache";
import {
  createAuditLog,
  getActorIdFromClerkUserId,
} from "@/lib/audit/audit-log";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { validateOpportunityOrganizationReadiness } from "@/lib/admin/opportunity-validation";
import { prisma } from "@/lib/db/prisma";
const value = (data: FormData, key: string) => {
  const v = data.get(key);
  return typeof v === "string" ? v.trim() : "";
};
function refresh() {
  revalidatePath("/dashboard/admin/opportunities");
  revalidatePath("/dashboard/admin/opportunities/verification");
}
export async function setOpportunityVerification(formData: FormData) {
  const { userId } = await assertAdminAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const id = value(formData, "opportunityId");
  const requested = value(formData, "verificationStatus");
  const allowed = [
    "VERIFIED",
    "NEEDS_REVIEW",
    "STALE",
    "BROKEN_LINK",
    "ARCHIVED",
  ] as const;
  const status = allowed.includes(requested as (typeof allowed)[number])
    ? (requested as (typeof allowed)[number])
    : "NEEDS_REVIEW";
  const current = await prisma.opportunity.findUnique({
    where: { id },
    select: {
      id: true,
      organization: { select: { verificationStatus: true } },
    },
  });
  if (!current) return;
  const organizationReadiness = validateOpportunityOrganizationReadiness({
    organizationVerificationStatus: current.organization.verificationStatus,
    verificationStatus: status,
  });
  if (!organizationReadiness.ready) return;
  await prisma.opportunity.update({
    where: { id },
    data: {
      verificationStatus: status,
      verifiedById: actorId,
      lastVerifiedAt: status === "VERIFIED" ? new Date() : undefined,
      brokenLinkDetectedAt: status === "BROKEN_LINK" ? new Date() : undefined,
      status: status === "ARCHIVED" ? "ARCHIVED" : undefined,
      availabilityStatus: status === "ARCHIVED" ? "ARCHIVED" : undefined,
    },
  });
  await createAuditLog({
    action: `OPPORTUNITY_VERIFICATION_${status}`,
    actorId,
    entityId: id,
    entityType: "Opportunity",
    metadata: { status },
  });
  refresh();
}
export async function resolveCorrectionReport(formData: FormData) {
  const { userId } = await assertAdminAccess();
  const actorId = await getActorIdFromClerkUserId(userId);
  const id = value(formData, "reportId");
  const status =
    value(formData, "resolution") === "REJECTED" ? "REJECTED" : "RESOLVED";
  await prisma.opportunityCorrectionReport.updateMany({
    where: { id, status: "OPEN" },
    data: {
      status,
      reviewedById: actorId,
      reviewedAt: new Date(),
      resolutionNotes: value(formData, "resolutionNotes") || null,
    },
  });
  await createAuditLog({
    action: `OPPORTUNITY_CORRECTION_${status}`,
    actorId,
    entityId: id,
    entityType: "OpportunityCorrectionReport",
    metadata: { status },
  });
  refresh();
}
