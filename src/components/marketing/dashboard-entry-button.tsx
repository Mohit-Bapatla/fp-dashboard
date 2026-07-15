import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { type AppRole, getDashboardPathForRole } from "@/lib/auth/roles";
import { getMarketingViewer } from "@/lib/auth/marketing-viewer";
import { PARTNER_ONBOARDING_PATH } from "@/lib/partner/onboarding";
import { safeInternalPath } from "@/lib/security/safe-url";
import { cn } from "@/lib/utils";

import { primaryButtonClass, secondaryButtonClass } from "./page-shell";

type DashboardEntryIntent = "student" | "partner";

type DashboardEntryAction = {
  href: string;
  label: string;
  linkType: "internal" | "mailto";
};

export function getDashboardEntryAction({
  intent = "student",
  returnTo,
  role,
}: {
  intent?: DashboardEntryIntent;
  returnTo?: string;
  role: AppRole | null;
}): DashboardEntryAction {
  if (role) {
    const label =
      role === "PARTNER"
        ? "Open Partner Dashboard"
        : role === "ADMIN" || role === "SUPER_ADMIN"
          ? "Open Admin"
          : role === "STAFF"
            ? "Open Staff Dashboard"
            : "Open Dashboard";

    return {
      href: getDashboardPathForRole(role),
      label,
      linkType: "internal",
    };
  }

  if (intent === "partner") {
    return {
      href: `/sign-up?redirect_url=${encodeURIComponent(PARTNER_ONBOARDING_PATH)}`,
      label: "Create Partner Workspace",
      linkType: "internal",
    };
  }

  const destination = safeInternalPath(
    returnTo,
    "/dashboard/student/onboarding",
  );
  return {
    href: `/sign-up?redirect_url=${encodeURIComponent(destination)}`,
    label: "Create Free Profile",
    linkType: "internal",
  };
}

export async function DashboardEntryButton({
  className,
  intent = "student",
  returnTo,
  variant = "primary",
}: {
  className?: string;
  intent?: "student" | "partner";
  returnTo?: string;
  variant?: "primary" | "secondary";
}) {
  const { role } = await getMarketingViewer();
  const action = getDashboardEntryAction({
    intent,
    returnTo,
    role,
  });
  const buttonClassName = cn(
    variant === "primary" ? primaryButtonClass : secondaryButtonClass,
    className,
  );
  const content = (
    <>
      {action.label}
      <ArrowRight aria-hidden="true" className="size-4" />
    </>
  );

  return action.linkType === "mailto" ? (
    <a className={buttonClassName} href={action.href}>
      {content}
    </a>
  ) : (
    <Link className={buttonClassName} href={action.href}>
      {content}
    </Link>
  );
}
