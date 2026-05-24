import {
  addOnboardingItem,
  reviewOnboardingItem,
  submitOnboardingItemConfirmation,
} from "@/app/dashboard/onboarding/actions";
import type { ApplicationOnboardingItemStatus } from "@/generated/prisma/enums";

export type ApplicationOnboardingItemView = {
  completedAt: Date | null;
  description: string | null;
  id: string;
  required: boolean;
  reviewedAt: Date | null;
  reviewerNotes: string | null;
  status: ApplicationOnboardingItemStatus;
  studentNotes: string | null;
  submittedAt: Date | null;
  title: string;
};

type ApplicationOnboardingListProps = {
  applicationId: string;
  items: ApplicationOnboardingItemView[];
  mode: "reviewer" | "student";
  redirectTo: string;
};

function formatStatus(status: ApplicationOnboardingItemStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClassName(status: ApplicationOnboardingItemStatus) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "SUBMITTED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "NEEDS_CHANGES":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "WAIVED":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "NOT_STARTED":
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function ApplicationOnboardingList({
  applicationId,
  items,
  mode,
  redirectTo,
}: ApplicationOnboardingListProps) {
  if (items.length === 0 && mode === "student") {
    return null;
  }

  return (
    <section className="mt-5 rounded-lg border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-foreground">
        Onboarding checklist
      </h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Track confirmations and partner-specific requirements as status metadata
        only. Do not upload sensitive documents here.
      </p>

      {items.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <article
              className="rounded-md border border-border bg-muted/20 p-3"
              key={item.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <span
                  className={[
                    "rounded-md border px-2 py-0.5 text-xs font-medium",
                    statusClassName(item.status),
                  ].join(" ")}
                >
                  {formatStatus(item.status)}
                </span>
                {item.required ? (
                  <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                    Required
                  </span>
                ) : null}
              </div>
              {item.description ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
              {item.studentNotes ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Student: {item.studentNotes}
                </p>
              ) : null}
              {item.reviewerNotes ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Reviewer: {item.reviewerNotes}
                </p>
              ) : null}

              {mode === "student" &&
              item.status !== "APPROVED" &&
              item.status !== "WAIVED" ? (
                <form
                  action={submitOnboardingItemConfirmation}
                  className="mt-3 grid gap-3"
                >
                  <input name="itemId" type="hidden" value={item.id} />
                  <input name="redirectTo" type="hidden" value={redirectTo} />
                  <label className="text-sm font-medium text-foreground">
                    Confirmation notes
                    <textarea
                      className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                      defaultValue={item.studentNotes ?? ""}
                      maxLength={1000}
                      name="studentNotes"
                    />
                  </label>
                  <button
                    className="inline-flex min-h-10 w-fit items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    type="submit"
                  >
                    Submit confirmation
                  </button>
                </form>
              ) : null}

              {mode === "reviewer" ? (
                <form
                  action={reviewOnboardingItem}
                  className="mt-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-end"
                >
                  <input name="itemId" type="hidden" value={item.id} />
                  <input name="redirectTo" type="hidden" value={redirectTo} />
                  <label className="text-sm font-medium text-foreground">
                    Status
                    <select
                      className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                      defaultValue=""
                      name="status"
                      required
                    >
                      <option value="">Choose status</option>
                      <option value="APPROVED">Approved</option>
                      <option value="NEEDS_CHANGES">Needs changes</option>
                      <option value="WAIVED">Waived</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-foreground">
                    Reviewer notes
                    <input
                      className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                      defaultValue={item.reviewerNotes ?? ""}
                      name="reviewerNotes"
                    />
                  </label>
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    type="submit"
                  >
                    Save
                  </button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
          No onboarding items have been added yet.
        </p>
      )}

      {mode === "reviewer" ? (
        <form
          action={addOnboardingItem}
          className="mt-4 grid gap-3 rounded-md border border-border bg-muted/20 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-end"
        >
          <input name="applicationId" type="hidden" value={applicationId} />
          <input name="redirectTo" type="hidden" value={redirectTo} />
          <label className="text-sm font-medium text-foreground">
            New item
            <input
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
              maxLength={120}
              name="title"
              required
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Description
            <input
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
              maxLength={500}
              name="description"
            />
          </label>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
            type="submit"
          >
            Add item
          </button>
        </form>
      ) : null}
    </section>
  );
}
