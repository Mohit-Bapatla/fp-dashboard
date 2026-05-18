import type { PlacementRequestStatus } from "@/generated/prisma/enums";
import { formatEnumLabel } from "@/lib/placement-requests/validation";

type PlacementRequestStatusBadgeProps = {
  status: PlacementRequestStatus;
};

const statusStyles: Record<PlacementRequestStatus, string> = {
  ASSIGNED: "border-blue-200 bg-blue-50 text-blue-700",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-700",
  NEW: "border-border bg-muted text-muted-foreground",
  OPPORTUNITY_FOUND: "border-emerald-200 bg-emerald-50 text-emerald-700",
  OUTREACH_IN_PROGRESS: "border-sky-200 bg-sky-50 text-sky-700",
  PARTNER_CONTACTED: "border-violet-200 bg-violet-50 text-violet-700",
  PLACED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RESEARCHING: "border-amber-200 bg-amber-50 text-amber-700",
  STUDENT_REFERRED: "border-teal-200 bg-teal-50 text-teal-700",
  WAITING_FOR_PARTNER: "border-orange-200 bg-orange-50 text-orange-700",
};

export function PlacementRequestStatusBadge({
  status,
}: PlacementRequestStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
      ].join(" ")}
    >
      {formatEnumLabel(status)}
    </span>
  );
}
