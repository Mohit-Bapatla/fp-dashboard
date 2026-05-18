import { prisma } from "@/lib/db/prisma";
import {
  assertPartnerAccess,
  getOrCreateCurrentPartnerUser,
} from "@/lib/partner/authorization";

export async function getCurrentPartnerContext() {
  const { userId } = await assertPartnerAccess();
  const user = await getOrCreateCurrentPartnerUser(userId);
  const memberships = await prisma.partnerMember.findMany({
    where: {
      userId: user.id,
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
    organizationIds: memberships.map((membership) => membership.organizationId),
    primaryOrganization: memberships.at(0)?.organization ?? null,
    user,
  };
}
