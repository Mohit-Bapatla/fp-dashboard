import { prisma } from "@/lib/db/prisma";
import {
  assertPartnerAccess,
  getOrCreateCurrentPartnerUser,
} from "@/lib/partner/authorization";
import { logWorkflowFailure } from "@/lib/reliability/workflow-errors";

export async function getCurrentPartnerContext() {
  const { userId } = await assertPartnerAccess();
  try {
    const user = await getOrCreateCurrentPartnerUser(userId);
    const memberships = await prisma.partnerMember.findMany({
      where: {
        userId: user.id,
        organization: { isSystemPlaceholder: false },
      },
      orderBy: [
        {
          isPrimary: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
      include: {
        organization: true,
      },
    });

    return {
      memberships,
      organizationIds: memberships.map(
        (membership) => membership.organizationId,
      ),
      primaryOrganization: memberships.at(0)?.organization ?? null,
      user,
    };
  } catch (error) {
    logWorkflowFailure({
      action: "resolve_partner_memberships",
      category: "PARTNER",
      error,
      route: "/dashboard/partner",
      userId,
    });
    throw error;
  }
}
