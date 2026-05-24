import "server-only";

import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db/prisma";

export const demoAccounts = [
  {
    clerkUserId: "user_demo_student_001",
    email: "demo-student@example.com",
    role: "STUDENT",
  },
  {
    clerkUserId: "user_demo_partner_001",
    email: "demo-partner@example.com",
    role: "PARTNER",
  },
  {
    clerkUserId: "user_demo_staff_001",
    email: "demo-staff@example.com",
    role: "STAFF",
  },
  {
    clerkUserId: "user_demo_admin_001",
    email: "demo-admin@example.com",
    role: "ADMIN",
  },
] as const;

const demoEmails: Set<string> = new Set(
  demoAccounts.map((account) => account.email),
);
const demoClerkUserIds: Set<string> = new Set(
  demoAccounts.map((account) => account.clerkUserId),
);

export function isDemoAccount(account: {
  clerkUserId?: string | null;
  email?: string | null;
}) {
  const email = account.email?.toLowerCase();

  return Boolean(
    (email && demoEmails.has(email)) ||
    (account.clerkUserId && demoClerkUserIds.has(account.clerkUserId)),
  );
}

export async function getCurrentDemoAccount() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      clerkUserId: true,
      email: true,
      firstName: true,
      id: true,
      lastName: true,
      role: true,
    },
  });

  if (!user || !isDemoAccount(user)) {
    return null;
  }

  return user;
}
