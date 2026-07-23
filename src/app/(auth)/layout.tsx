import { ClerkProvider, RedirectToTasks } from "@clerk/nextjs";
import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <ClerkProvider nonce={nonce}>
      <RedirectToTasks />
      <a
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        href="#auth-main"
      >
        Skip to content
      </a>
      {children}
    </ClerkProvider>
  );
}
