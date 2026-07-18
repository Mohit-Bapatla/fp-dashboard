import { ArrowRight, CalendarCheck2 } from "lucide-react";
import Link from "next/link";

import type {
  StudentWeeklyPlan,
  WeeklyPlanItemCategory,
} from "@/lib/student/weekly-plan";

const categoryLabels: Record<WeeklyPlanItemCategory, string> = {
  CONFIRMATION: "Confirm",
  DEADLINE: "Deadline",
  DUE_SOON: "Due soon",
  INTERVIEW: "Interview",
  NEW_OPPORTUNITY: "New match",
  OPENING: "Opening",
  OVERDUE: "Overdue",
};

export function StudentWeeklyPlanPreview({
  plan,
}: {
  plan: StudentWeeklyPlan;
}) {
  return (
    <section
      className="rounded-xl border border-border bg-background p-6 shadow-sm"
      id="weekly-plan"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary">
          <CalendarCheck2 aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Weekly preview
          </p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">
            Your FP plan for this week
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Built from application deadlines, required tasks, interviews, and
            verified opportunities. Timezone: {plan.timezone}.
          </p>
        </div>
      </div>

      {plan.items.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
          Nothing urgent is scheduled this week. FP will not send an empty
          weekly digest.
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {plan.items.map((item) => (
            <li className="rounded-lg border border-border p-4" key={item.key}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {categoryLabels[item.category]}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
                <Link
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  href={item.actionUrl}
                >
                  Open
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
