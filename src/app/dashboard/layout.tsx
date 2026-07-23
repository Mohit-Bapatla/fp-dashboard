import { ClerkProvider, RedirectToTasks } from "@clerk/nextjs";
import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { clerkEmailCodeLocalization } from "@/lib/auth/clerk-email-code-localization";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <ClerkProvider localization={clerkEmailCodeLocalization} nonce={nonce}>
      <RedirectToTasks />
      {children}
    </ClerkProvider>
  );
}
