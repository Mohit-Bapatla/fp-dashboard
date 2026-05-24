import { cn } from "@/lib/utils";

import { roleMeta, type DashboardRole } from "./role-config";

type RoleBadgeProps = {
  role: DashboardRole;
  className?: string;
};

const badgeStyles: Record<DashboardRole, string> = {
  student:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
  partner:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  staff:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  admin:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const meta = roleMeta[role];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
        badgeStyles[role],
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
