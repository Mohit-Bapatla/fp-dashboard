export const appRoles = [
  "STUDENT",
  "PARTNER",
  "STAFF",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export type AppRole = (typeof appRoles)[number];

export const DEFAULT_APP_ROLE: AppRole = "STUDENT";

export type RoleSessionClaims = {
  metadata?: {
    role?: unknown;
  } | null;
} | null;

export const roleDashboardPaths: Record<AppRole, string> = {
  STUDENT: "/dashboard/student",
  PARTNER: "/dashboard/partner",
  STAFF: "/dashboard/staff",
  ADMIN: "/dashboard/admin",
  SUPER_ADMIN: "/dashboard/admin",
};

const elevatedRoles = new Set<AppRole>(["ADMIN", "SUPER_ADMIN"]);

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && appRoles.includes(value as AppRole);
}

export function getAppRole(value: unknown): AppRole {
  return isAppRole(value) ? value : DEFAULT_APP_ROLE;
}

export function getRoleFromSessionClaims(
  sessionClaims: RoleSessionClaims | undefined,
): AppRole {
  // Clerk publicMetadata.role is exposed to the app through the session token.
  // Configure Clerk session claims with:
  // { "metadata": "{{user.public_metadata}}" }
  //
  // Missing or invalid roles intentionally fall back to STUDENT so invalid
  // metadata never grants elevated access.
  return getAppRole(sessionClaims?.metadata?.role);
}

export function getDashboardPathForRole(role: AppRole) {
  return roleDashboardPaths[role];
}

export function canAccessDashboardPath(role: AppRole, pathname: string) {
  if (pathname === "/dashboard/support") {
    return true;
  }

  if (elevatedRoles.has(role)) {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  }

  const allowedPath = getDashboardPathForRole(role);

  return pathname === allowedPath || pathname.startsWith(`${allowedPath}/`);
}
