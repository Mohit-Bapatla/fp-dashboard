import { auth, currentUser } from "@clerk/nextjs/server";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PartnerOnboardingForm } from "@/components/partner/partner-onboarding-form";
import { BrandMark } from "@/components/shared/brand-mark";
import { getVerifiedClerkEmailAddress } from "@/lib/auth/clerk-email";
import { getAppRole, getRoleFromSessionClaims } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import {
  getPartnerOnboardingBlockReason,
  initialPartnerOnboardingActionState,
  partnerOnboardingBlockMessage,
  PARTNER_ONBOARDING_PATH,
} from "@/lib/partner/onboarding";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Partner onboarding",
  robots: { follow: false, index: false },
};

export default async function PartnerOnboardingPage() {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: PARTNER_ONBOARDING_PATH });
  }

  const [clerkUser, account] = await Promise.all([
    currentUser(),
    prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        partnerMemberships: { select: { id: true }, take: 1 },
        role: true,
        studentProfile: { select: { id: true } },
      },
    }),
  ]);
  const sessionRole = getRoleFromSessionClaims(sessionClaims);
  const clerkRole = getAppRole(clerkUser?.publicMetadata.role);
  const hasPartnerMembership = Boolean(account?.partnerMemberships.length);

  if (sessionRole === "PARTNER") {
    redirect("/dashboard/partner");
  }

  if (
    sessionRole === "STAFF" ||
    sessionRole === "ADMIN" ||
    sessionRole === "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }

  const contactEmail = getVerifiedClerkEmailAddress(clerkUser);
  const blockReason = getPartnerOnboardingBlockReason({
    clerkRole,
    databaseRole: account?.role ?? null,
    hasPartnerMembership,
    hasStudentProfile: Boolean(account?.studentProfile),
    sessionRole,
  });
  const canRefreshCompletedPartner =
    blockReason === "EXISTING_PARTNER_ACCOUNT" &&
    clerkRole === "PARTNER" &&
    account?.role === "PARTNER" &&
    hasPartnerMembership;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div
        aria-hidden="true"
        className="pathway-grid absolute inset-0 opacity-70"
      />
      <div className="relative mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BrandMark />
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            href="/partners"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Partner information
          </Link>
        </div>

        <header className="mt-10 rounded-xl border border-border bg-background p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Partner onboarding
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            Create a new organization workspace.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Start a private workspace for your organization. Future Physicians
            will still verify the organization and review every opportunity
            before student publication.
          </p>
        </header>

        <div className="mt-6">
          {canRefreshCompletedPartner && contactEmail ? (
            <PartnerOnboardingForm
              contactEmail={contactEmail}
              initialState={{
                ...initialPartnerOnboardingActionState,
                status: "complete",
              }}
            />
          ) : blockReason ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <ShieldAlert aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-amber-950">
                    This account cannot self-convert
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    {partnerOnboardingBlockMessage(blockReason)}
                  </p>
                  <a
                    className="mt-5 inline-flex font-semibold text-amber-950 underline underline-offset-4"
                    href={`mailto:${siteConfig.emails.support}`}
                  >
                    {siteConfig.emails.support}
                  </a>
                </div>
              </div>
            </section>
          ) : contactEmail ? (
            <PartnerOnboardingForm
              contactEmail={contactEmail}
              initialState={initialPartnerOnboardingActionState}
            />
          ) : (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950 shadow-sm">
              Add and verify an email address in Clerk before creating an
              organization workspace. Contact{" "}
              <a
                className="font-semibold underline underline-offset-4"
                href={`mailto:${siteConfig.emails.support}`}
              >
                {siteConfig.emails.support}
              </a>{" "}
              if you need help.
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
