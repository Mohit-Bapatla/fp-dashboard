"use server";

import { Prisma } from "@/generated/prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";
import { assertStudentAccess } from "@/lib/student/authorization";
import { buildInitialApplicationTasks } from "@/lib/student/application-tasks";
import {
  type ExternalOpportunityActionState,
  validateExternalOpportunity,
} from "@/lib/student/external-opportunity-validation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { getCompletedStudentProfile } from "@/lib/student/profile-completion";
import { studentExternalOrganizationName } from "@/lib/student/external-opportunity";

export async function addExternalOpportunity(
  _previousState: ExternalOpportunityActionState,
  formData: FormData,
): Promise<ExternalOpportunityActionState> {
  const validation = validateExternalOpportunity(formData);
  if (!validation.success) {
    return {
      fieldErrors: validation.fieldErrors,
      formError: "Please fix the highlighted fields.",
      values: validation.values,
    };
  }

  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const studentProfile = getCompletedStudentProfile(user.studentProfile);
  if (!studentProfile) {
    return {
      fieldErrors: {},
      formError: "Complete student onboarding before adding an opportunity.",
      values: validation.values,
    };
  }

  const rateLimit = await enforceRateLimit({
    action: "student_external_opportunity_create",
    identifier: `user:${user.id}`,
    limit: 12,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) {
    return {
      fieldErrors: {},
      formError: formatRateLimitMessage(rateLimit),
      values: validation.values,
    };
  }

  const now = new Date();
  const availabilityStatus =
    validation.data.opensAt && validation.data.opensAt > now
      ? ("OPENING_SOON" as const)
      : ("OPEN" as const);

  let destination: string;
  try {
    const created = await prisma.$transaction(async (tx) => {
      const existingOrganization = await tx.partnerOrganization.findUnique({
        where: { name: studentExternalOrganizationName },
        select: { id: true, isSystemPlaceholder: true },
      });
      if (existingOrganization && !existingOrganization.isSystemPlaceholder) {
        throw new Error("RESERVED_EXTERNAL_ORGANIZATION_CONFLICT");
      }
      const organization = existingOrganization
        ? await tx.partnerOrganization.update({
            where: { id: existingOrganization.id },
            data: { isSystemPlaceholder: true },
            select: { id: true },
          })
        : await tx.partnerOrganization.create({
            data: {
              description:
                "System placeholder for private student-added external sources. Not a partner record.",
              isSystemPlaceholder: true,
              name: studentExternalOrganizationName,
              type: "SYSTEM_PRIVATE_EXTERNAL_SOURCE",
              verificationStatus: "UNVERIFIED",
            },
            select: { id: true },
          });
      const opportunity = await tx.opportunity.create({
        data: {
          applicationMethod: "EXTERNAL_PORTAL",
          availabilityStatus,
          deadline: validation.data.deadline,
          location: validation.data.location || null,
          officialApplicationUrl: null,
          officialSourceUrl: validation.data.normalizedSourceUrl,
          opensAt: validation.data.opensAt,
          organizationId: organization.id,
          relationshipType: "EXTERNAL_PUBLIC",
          requiredDocuments: validation.data.requiredDocuments,
          sourceType: "STUDENT_ADDED",
          status: "DRAFT",
          studentOrganizationName: validation.data.organizationName,
          studentOwnerProfileId: studentProfile.id,
          studentSourceUrlNormalized: validation.data.normalizedSourceUrl,
          title: validation.data.title,
          type: validation.data.opportunityType,
          verificationStatus: "NEEDS_REVIEW",
          visibility: "STUDENT_PRIVATE",
        },
        select: { id: true },
      });
      const application = await tx.application.create({
        data: {
          applicationMethod: "EXTERNAL_PORTAL",
          lastActivityAt: now,
          opportunityId: opportunity.id,
          privateNotes: validation.data.notes || null,
          status: validation.data.createWorkspace ? "PREPARING" : "SAVED",
          studentProfileId: studentProfile.id,
          targetDeadline: validation.data.deadline,
        },
        select: { id: true },
      });

      if (validation.data.createWorkspace) {
        const tasks = buildInitialApplicationTasks({
          applicationMethod: "EXTERNAL_PORTAL",
          deadline: validation.data.deadline,
          essayQuestionCount: null,
          now,
          opensAt: validation.data.opensAt,
          requiredDocuments: validation.data.requiredDocuments,
          studentProvidedExternal: true,
        });
        await tx.applicationTask.createMany({
          data: tasks.map((task) => ({
            ...task,
            applicationId: application.id,
          })),
          skipDuplicates: true,
        });
      }

      if (validation.data.requestVerification) {
        await tx.externalOpportunityVerificationRequest.create({
          data: {
            opportunityId: opportunity.id,
            studentProfileId: studentProfile.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: "EXTERNAL_OPPORTUNITY_ADDED",
          actorId: user.id,
          entityId: opportunity.id,
          entityType: "Opportunity",
          metadata: {
            applicationId: application.id,
            createWorkspace: validation.data.createWorkspace,
            requestVerification: validation.data.requestVerification,
            sourceType: "STUDENT_ADDED",
          },
        },
      });
      if (validation.data.createWorkspace) {
        await tx.auditLog.create({
          data: {
            action: "APPLICATION_WORKSPACE_STARTED",
            actorId: user.id,
            entityId: application.id,
            entityType: "Application",
            metadata: {
              opportunityId: opportunity.id,
              source: "STUDENT_ADDED",
            },
          },
        });
      }

      return { applicationId: application.id, opportunityId: opportunity.id };
    });

    destination = validation.data.createWorkspace
      ? `/dashboard/student/applications/${created.applicationId}`
      : `/dashboard/student/opportunities/${created.opportunityId}`;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "RESERVED_EXTERNAL_ORGANIZATION_CONFLICT"
    ) {
      return {
        fieldErrors: {},
        formError:
          "The private workspace source is unavailable. Contact support.",
        values: validation.values,
      };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        fieldErrors: {
          sourceUrl: "You already added an external application with this URL.",
        },
        formError: "This opportunity is already in your private workspace.",
        values: validation.values,
      };
    }

    return {
      fieldErrors: {},
      formError: "The opportunity could not be saved. Please try again.",
      values: validation.values,
    };
  }

  redirect(destination);
}
