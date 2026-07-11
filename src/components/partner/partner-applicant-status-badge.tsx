import type { ApplicationStatus } from "@/generated/prisma/enums";

type PartnerApplicantStatusBadgeProps = {
  status: ApplicationStatus;
};

const statusStyles: Record<ApplicationStatus, string> = {
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  DRAFT: "border-border bg-muted text-muted-foreground",
  INTERVIEW: "border-sky-200 bg-sky-50 text-sky-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700",
  UNDER_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  WITHDRAWN: "border-slate-200 bg-slate-50 text-slate-700",
  SAVED: "border-border bg-muted text-muted-foreground", PLANNING: "border-violet-200 bg-violet-50 text-violet-700", PREPARING: "border-violet-200 bg-violet-50 text-violet-700", WAITING_FOR_RECOMMENDATION: "border-amber-200 bg-amber-50 text-amber-700", READY_TO_SUBMIT: "border-emerald-200 bg-emerald-50 text-emerald-700", WAITLISTED: "border-orange-200 bg-orange-50 text-orange-700",
};

function formatStatus(status: ApplicationStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function PartnerApplicantStatusBadge({
  status,
}: PartnerApplicantStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
      ].join(" ")}
    >
      {formatStatus(status)}
    </span>
  );
}
