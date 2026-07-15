import { cn } from "@/lib/utils";

import { roleMeta, type DashboardRole } from "./role-config";

type RoleBadgeProps = {
  role: DashboardRole;
  className?: string;
};

const badgeStyles: Record<DashboardRole, string> = {
  student:
    "border-primary/20 bg-blue-surface text-brand-navy [&_svg]:text-primary",
  partner:
    "border-secondary/25 bg-secondary/[0.08] text-brand-navy [&_svg]:text-secondary",
  staff:
    "border-primary/20 bg-primary/[0.07] text-brand-navy [&_svg]:text-primary",
  admin:
    "border-accent-warm/35 bg-accent-warm/[0.14] text-brand-navy [&_svg]:text-warning",
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const meta = roleMeta[role];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em]",
        badgeStyles[role],
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {meta.label}
    </span>
  );
}
