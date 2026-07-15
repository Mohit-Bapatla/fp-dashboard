import {
  BookmarkCheck,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  Sparkles,
} from "lucide-react";

export function DashboardPreview({
  variant = "student",
}: {
  variant?: "student" | "partner";
}) {
  if (variant === "partner") {
    return <PartnerDashboardPreview />;
  }

  return (
    <figure className="relative mx-auto w-full max-w-[620px]">
      <figcaption className="sr-only">
        Illustrative student dashboard preview
      </figcaption>
      <div
        aria-hidden="true"
        className="absolute -inset-5 rounded-[2.5rem] bg-[radial-gradient(circle_at_top_right,rgba(22,166,161,0.22),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(47,111,237,0.2),transparent_40%)] blur-2xl"
      />
      <div className="relative overflow-hidden rounded-[1.6rem] border border-white/80 bg-white p-2 shadow-[0_28px_80px_rgba(16,33,58,0.16)] ring-1 ring-border/70">
        <div className="rounded-[1.2rem] border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-error/55" />
              <span className="size-2.5 rounded-full bg-accent-warm/70" />
              <span className="size-2.5 rounded-full bg-success/60" />
            </div>
            <span className="rounded-full bg-blue-surface px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Illustrative preview
            </span>
          </div>
          <div className="grid min-h-[390px] sm:grid-cols-[132px_1fr]">
            <aside
              aria-hidden="true"
              className="hidden border-r border-border bg-white p-3 sm:block"
            >
              <div className="rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white">
                Overview
              </div>
              {["Discover", "Saved", "Applications", "Events", "Profile"].map(
                (item) => (
                  <div
                    className="mt-1 rounded-lg px-3 py-2.5 text-[11px] font-medium text-muted-foreground"
                    key={item}
                  >
                    {item}
                  </div>
                ),
              )}
            </aside>
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                    Your next step
                  </p>
                  <p className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-brand-navy">
                    Welcome back
                  </p>
                </div>
                <div className="grid size-11 place-items-center rounded-full border-[5px] border-primary/20 border-r-primary text-[9px] font-bold text-primary">
                  82%
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <PreviewStat icon={Sparkles} label="Matches" value="6" />
                <PreviewStat icon={BookmarkCheck} label="Saved" value="3" />
                <PreviewStat icon={FileCheck2} label="In progress" value="1" />
              </div>
              <div className="mt-4 rounded-xl border border-border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-brand-navy">
                      Recommended for you
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Based on interests and published requirements
                    </p>
                  </div>
                  <span className="rounded-full bg-success/10 px-2 py-1 text-[9px] font-bold text-success">
                    Verified
                  </span>
                </div>
                <div className="mt-3 rounded-lg border border-border bg-background p-3">
                  <p className="text-xs font-semibold text-brand-navy">
                    Healthcare research opportunity
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-blue-surface px-2 py-1 text-[9px] font-medium text-primary">
                      Research
                    </span>
                    <span className="rounded-md bg-white px-2 py-1 text-[9px] font-medium text-muted-foreground">
                      Remote option
                    </span>
                    <span className="rounded-md bg-white px-2 py-1 text-[9px] font-medium text-muted-foreground">
                      Eligibility published
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-warning/20 bg-accent-warm/10 p-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-warning">
                  <CalendarClock aria-hidden="true" className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-warning">
                    Upcoming deadline
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-brand-navy">
                    Review application materials
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

function PartnerDashboardPreview() {
  return (
    <figure className="overflow-hidden rounded-3xl border border-border bg-white p-2 shadow-[0_24px_70px_rgba(16,33,58,0.13)]">
      <figcaption className="sr-only">
        Illustrative partner dashboard preview
      </figcaption>
      <div className="rounded-[1.25rem] border border-border bg-background p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
              Partner overview
            </p>
            <h3 className="mt-2 text-xl font-semibold text-brand-navy">
              Applicant pipeline
            </h3>
          </div>
          <span className="rounded-full border border-border bg-white px-3 py-1 text-[10px] font-semibold text-muted-foreground">
            Illustrative preview
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <PreviewStat icon={FileCheck2} label="New applicants" value="12" />
          <PreviewStat icon={CalendarClock} label="Need review" value="4" />
          <PreviewStat icon={CheckCircle2} label="Placed" value="7" />
        </div>
        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
          {["Application received", "Under review", "Interview requested"].map(
            (label, index) => (
              <div
                className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-0"
                key={label}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`size-2.5 rounded-full ${index === 0 ? "bg-primary" : index === 1 ? "bg-accent-warm" : "bg-secondary"}`}
                  />
                  <span className="text-xs font-semibold text-brand-navy">
                    {label}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  Authorized profile
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </figure>
  );
}

function PreviewStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <Icon aria-hidden="true" className="size-3.5 text-primary" />
        <span className="text-base font-semibold text-brand-navy">{value}</span>
      </div>
      <p className="mt-2 text-[10px] font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
