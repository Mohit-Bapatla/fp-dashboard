"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit/audit-log";
import { getRoleFromSessionClaims } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import { createNotifications } from "@/lib/notifications/notifications";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getSafeRedirect(formData: FormData) {
  const redirectTo = getString(formData, "redirectTo");

  return redirectTo.startsWith("/dashboard") ? redirectTo : "/dashboard";
}

function parseSlots(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [startValue, endValue] = line.split("|").map((part) => part.trim());
      const startsAt = new Date(startValue);
      const endsAt = new Date(endValue || startValue);

      if (
        Number.isNaN(startsAt.getTime()) ||
        Number.isNaN(endsAt.getTime()) ||
        endsAt < startsAt
      ) {
        return null;
      }

      return {
        endsAt,
        startsAt,
      };
    })
    .filter((slot): slot is { endsAt: Date; startsAt: Date } => Boolean(slot));
}

function revalidateInterviewPaths(redirectTo: string) {
  revalidatePath(redirectTo);
  revalidatePath("/dashboard/partner");
  revalidatePath("/dashboard/partner/applicants");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/applications");
  revalidatePath("/dashboard/admin/applications");
  revalidatePath("/dashboard/notifications");
}

export async function createInterviewRequest(formData: FormData) {
  const context = await getCurrentPartnerContext();
  const applicationId = getString(formData, "applicationId");
  const meetingLink = getString(formData, "meetingLink");
  const location = getString(formData, "location");
  const notes = getString(formData, "notes");
  const slots = parseSlots(getString(formData, "slots"));
  const redirectTo = getSafeRedirect(formData);

  if (!applicationId || context.organizationIds.length === 0) {
    redirect(redirectTo);
  }

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      opportunity: {
        visibility: "PUBLIC_DIRECTORY",
        organizationId: {
          in: context.organizationIds,
        },
        organization: {
          isSystemPlaceholder: false,
        },
      },
      status: {
        not: "WITHDRAWN",
      },
    },
    select: {
      id: true,
      status: true,
      studentProfile: {
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },
      },
      opportunity: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!application) {
    redirect(redirectTo);
  }

  const interview = await prisma.interviewRequest.create({
    data: {
      applicationId: application.id,
      createdById: context.user.id,
      location: location || null,
      meetingLink: meetingLink || null,
      notes: notes || null,
      proposedSlots: {
        create: slots,
      },
    },
    select: {
      id: true,
    },
  });

  await Promise.all([
    prisma.application.update({
      where: {
        id: application.id,
      },
      data: {
        reviewedAt: new Date(),
        status: "INTERVIEW",
      },
    }),
    createNotifications([application.studentProfile.user.id], {
      body: `A partner requested an interview for ${application.opportunity.title}.`,
      title: "Interview requested",
    }),
    createAuditLog({
      action: "INTERVIEW_REQUEST_CREATED",
      actorId: context.user.id,
      entityId: interview.id,
      entityType: "InterviewRequest",
      metadata: {
        applicationId: application.id,
        slotCount: slots.length,
      },
    }),
  ]);

  revalidateInterviewPaths(redirectTo);
  redirect(redirectTo);
}

export async function cancelInterviewRequest(formData: FormData) {
  const context = await getCurrentPartnerContext();
  const interviewId = getString(formData, "interviewId");
  const redirectTo = getSafeRedirect(formData);

  const interview = await prisma.interviewRequest.findFirst({
    where: {
      id: interviewId,
      application: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: context.organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
        },
      },
      status: {
        notIn: ["CANCELED", "COMPLETED"],
      },
    },
    select: {
      id: true,
      application: {
        select: {
          studentProfile: {
            select: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
          opportunity: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  if (!interview) {
    redirect(redirectTo);
  }

  await Promise.all([
    prisma.interviewRequest.update({
      where: {
        id: interview.id,
      },
      data: {
        canceledAt: new Date(),
        canceledById: context.user.id,
        status: "CANCELED",
      },
    }),
    createNotifications([interview.application.studentProfile.user.id], {
      body: `The interview request for ${interview.application.opportunity.title} was canceled.`,
      title: "Interview canceled",
    }),
    createAuditLog({
      action: "INTERVIEW_REQUEST_CANCELED",
      actorId: context.user.id,
      entityId: interview.id,
      entityType: "InterviewRequest",
      metadata: {},
    }),
  ]);

  revalidateInterviewPaths(redirectTo);
  redirect(redirectTo);
}

export async function completeInterviewRequest(formData: FormData) {
  const context = await getCurrentPartnerContext();
  const interviewId = getString(formData, "interviewId");
  const redirectTo = getSafeRedirect(formData);

  const interview = await prisma.interviewRequest.findFirst({
    where: {
      id: interviewId,
      application: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: context.organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
        },
      },
      status: {
        in: ["SCHEDULED", "STUDENT_RESPONDED", "REQUESTED"],
      },
    },
    select: {
      id: true,
      application: {
        select: {
          studentProfile: {
            select: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
          opportunity: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  if (!interview) {
    redirect(redirectTo);
  }

  await Promise.all([
    prisma.interviewRequest.update({
      where: {
        id: interview.id,
      },
      data: {
        completedAt: new Date(),
        status: "COMPLETED",
      },
    }),
    createNotifications([interview.application.studentProfile.user.id], {
      body: `The interview for ${interview.application.opportunity.title} was marked complete.`,
      title: "Interview completed",
    }),
    createAuditLog({
      action: "INTERVIEW_REQUEST_COMPLETED",
      actorId: context.user.id,
      entityId: interview.id,
      entityType: "InterviewRequest",
      metadata: {},
    }),
  ]);

  revalidateInterviewPaths(redirectTo);
  redirect(redirectTo);
}

export async function respondToInterviewRequest(formData: FormData) {
  const { userId } = await assertStudentAccess();
  const interviewId = getString(formData, "interviewId");
  const response = getString(formData, "response");
  const slotId = getString(formData, "slotId");
  const notes = getString(formData, "studentResponseNotes");
  const redirectTo = getSafeRedirect(formData);
  const user = await getCurrentStudentProfile(userId);

  if (!user.studentProfile || !interviewId) {
    redirect(redirectTo);
  }

  const interview = await prisma.interviewRequest.findFirst({
    where: {
      id: interviewId,
      application: {
        studentProfileId: user.studentProfile.id,
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: {
            isSystemPlaceholder: false,
          },
        },
      },
      status: {
        in: ["REQUESTED", "STUDENT_RESPONDED", "SCHEDULED"],
      },
    },
    select: {
      application: {
        select: {
          opportunity: {
            select: {
              organization: {
                select: {
                  members: {
                    select: {
                      userId: true,
                    },
                  },
                },
              },
              title: true,
            },
          },
        },
      },
      id: true,
      proposedSlots: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!interview) {
    redirect(redirectTo);
  }

  const selectedSlot = interview.proposedSlots.find(
    (slot) => slot.id === slotId,
  );
  const status = response === "decline" ? "DECLINED" : "SCHEDULED";

  await prisma.$transaction(async (tx) => {
    if (selectedSlot) {
      await tx.proposedInterviewSlot.updateMany({
        where: {
          interviewRequestId: interview.id,
        },
        data: {
          selected: false,
        },
      });
      await tx.proposedInterviewSlot.update({
        where: {
          id: selectedSlot.id,
        },
        data: {
          selected: true,
        },
      });
    }

    await tx.interviewRequest.update({
      where: {
        id: interview.id,
      },
      data: {
        respondedAt: new Date(),
        scheduledAt: status === "SCHEDULED" ? new Date() : null,
        selectedSlotId: selectedSlot?.id ?? null,
        status,
        studentResponseNotes: notes || null,
      },
    });
  });

  await Promise.all([
    createNotifications(
      interview.application.opportunity.organization.members.map(
        (member) => member.userId,
      ),
      {
        body: `A student responded to the interview request for ${interview.application.opportunity.title}.`,
        title: "Interview response received",
      },
    ),
    createAuditLog({
      action: "INTERVIEW_REQUEST_STUDENT_RESPONSE",
      actorId: user.id,
      entityId: interview.id,
      entityType: "InterviewRequest",
      metadata: {
        response,
        selectedSlotId: selectedSlot?.id ?? null,
      },
    }),
  ]);

  revalidateInterviewPaths(redirectTo);
  redirect(redirectTo);
}

export async function assertInterviewViewerRole() {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return {
    role: getRoleFromSessionClaims(sessionClaims),
    userId,
  };
}
