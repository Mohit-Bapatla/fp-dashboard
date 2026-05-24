import "server-only";

import { auth } from "@clerk/nextjs/server";

import type {
  RecordCommentEntityType,
  RecordCommentVisibility,
  UserRole,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

export type RecordCommentView = {
  author: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: UserRole;
  } | null;
  body: string;
  createdAt: Date;
  id: string;
  visibility: RecordCommentVisibility;
};

export type RecordCommentThread = {
  allowedVisibilities: RecordCommentVisibility[];
  comments: RecordCommentView[];
};

type RecordCommentAccess = {
  canCreate: RecordCommentVisibility[];
  canView: RecordCommentVisibility[];
};

const staffRoles: UserRole[] = ["STAFF", "ADMIN", "SUPER_ADMIN"];

function isStaffRole(role: UserRole) {
  return staffRoles.includes(role);
}

async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      clerkUserId: userId,
    },
    select: {
      id: true,
      role: true,
    },
  });
}

async function getAccessForEntity({
  entityId,
  entityType,
  userId,
  userRole,
}: {
  entityId: string;
  entityType: RecordCommentEntityType;
  userId: string;
  userRole: UserRole;
}): Promise<RecordCommentAccess> {
  if (isStaffRole(userRole)) {
    return {
      canCreate: ["INTERNAL", "PARTNER_VISIBLE", "STUDENT_VISIBLE"],
      canView: ["INTERNAL", "PARTNER_VISIBLE", "STUDENT_VISIBLE"],
    };
  }

  if (entityType === "APPLICATION") {
    const application = await prisma.application.findUnique({
      where: {
        id: entityId,
      },
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
          },
        },
        studentProfile: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!application) {
      return { canCreate: [], canView: [] };
    }

    if (application.studentProfile.userId === userId) {
      return {
        canCreate: ["STUDENT_VISIBLE"],
        canView: ["STUDENT_VISIBLE"],
      };
    }

    const partnerMemberIds = application.opportunity.organization.members.map(
      (member) => member.userId,
    );

    if (partnerMemberIds.includes(userId)) {
      return {
        canCreate: ["PARTNER_VISIBLE"],
        canView: ["PARTNER_VISIBLE", "STUDENT_VISIBLE"],
      };
    }
  }

  if (entityType === "PLACEMENT_REQUEST") {
    const request = await prisma.placementRequest.findUnique({
      where: {
        id: entityId,
      },
      select: {
        partnerOrganization: {
          select: {
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
        studentProfile: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!request) {
      return { canCreate: [], canView: [] };
    }

    if (request.studentProfile.userId === userId) {
      return {
        canCreate: ["STUDENT_VISIBLE"],
        canView: ["STUDENT_VISIBLE"],
      };
    }

    const partnerMemberIds =
      request.partnerOrganization?.members.map((member) => member.userId) ?? [];

    if (partnerMemberIds.includes(userId)) {
      return {
        canCreate: ["PARTNER_VISIBLE"],
        canView: ["PARTNER_VISIBLE"],
      };
    }
  }

  if (entityType === "OUTREACH_TASK") {
    const task = await prisma.outreachTask.findUnique({
      where: {
        id: entityId,
      },
      select: {
        partnerOrganization: {
          select: {
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    const partnerMemberIds =
      task?.partnerOrganization?.members.map((member) => member.userId) ?? [];

    if (partnerMemberIds.includes(userId)) {
      return {
        canCreate: ["PARTNER_VISIBLE"],
        canView: ["PARTNER_VISIBLE"],
      };
    }
  }

  return {
    canCreate: [],
    canView: [],
  };
}

export async function getRecordCommentThread({
  entityId,
  entityType,
}: {
  entityId: string;
  entityType: RecordCommentEntityType;
}): Promise<RecordCommentThread> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      allowedVisibilities: [],
      comments: [],
    };
  }

  const access = await getAccessForEntity({
    entityId,
    entityType,
    userId: user.id,
    userRole: user.role,
  });

  if (access.canView.length === 0) {
    return {
      allowedVisibilities: [],
      comments: [],
    };
  }

  const comments = await prisma.recordComment.findMany({
    where: {
      entityId,
      entityType,
      visibility: {
        in: access.canView,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      author: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      body: true,
      createdAt: true,
      id: true,
      visibility: true,
    },
  });

  return {
    allowedVisibilities: access.canCreate,
    comments,
  };
}

export async function assertCanCreateRecordComment({
  entityId,
  entityType,
  visibility,
}: {
  entityId: string;
  entityType: RecordCommentEntityType;
  visibility: RecordCommentVisibility;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const access = await getAccessForEntity({
    entityId,
    entityType,
    userId: user.id,
    userRole: user.role,
  });

  if (!access.canCreate.includes(visibility)) {
    return null;
  }

  return user;
}
