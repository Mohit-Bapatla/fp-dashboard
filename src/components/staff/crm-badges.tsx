import type {
  OutreachTaskStatus,
  PartnerStatus,
} from "@/generated/prisma/enums";
import {
  formatEnumLabel,
  type OutreachTaskPriority,
} from "@/lib/staff/crm-validation";

const partnerStatusStyles: Record<PartnerStatus, string> = {
  CONTACTED: "border-blue-200 bg-blue-50 text-blue-700",
  FOLLOW_UP_NEEDED: "border-amber-200 bg-amber-50 text-amber-700",
  INTERESTED: "border-sky-200 bg-sky-50 text-sky-700",
  MEETING_SCHEDULED: "border-violet-200 bg-violet-50 text-violet-700",
  NOT_CONTACTED: "border-border bg-muted text-muted-foreground",
  NO_RESPONSE: "border-slate-200 bg-slate-50 text-slate-700",
  PARTNERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PAUSED: "border-slate-200 bg-slate-50 text-slate-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

const taskStatusStyles: Record<OutreachTaskStatus, string> = {
  BLOCKED: "border-red-200 bg-red-50 text-red-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  NOT_STARTED: "border-border bg-muted text-muted-foreground",
  WAITING: "border-amber-200 bg-amber-50 text-amber-700",
};

const taskPriorityStyles: Record<OutreachTaskPriority, string> = {
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  LOW: "border-slate-200 bg-slate-50 text-slate-700",
  NORMAL: "border-border bg-muted text-muted-foreground",
  URGENT: "border-red-200 bg-red-50 text-red-700",
};

export function PartnerStatusBadge({ status }: { status: PartnerStatus }) {
  return (
    <span
      className={[
        "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium",
        partnerStatusStyles[status],
      ].join(" ")}
    >
      {formatEnumLabel(status)}
    </span>
  );
}

export function OutreachTaskStatusBadge({
  status,
}: {
  status: OutreachTaskStatus;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium",
        taskStatusStyles[status],
      ].join(" ")}
    >
      {formatEnumLabel(status)}
    </span>
  );
}

export function OutreachTaskPriorityBadge({
  priority,
}: {
  priority: OutreachTaskPriority;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium",
        taskPriorityStyles[priority],
      ].join(" ")}
    >
      {priority}
    </span>
  );
}
