import {
  cancelInterviewRequest,
  completeInterviewRequest,
  createInterviewRequest,
  respondToInterviewRequest,
} from "@/app/dashboard/interviews/actions";
import type { InterviewRequestStatus } from "@/generated/prisma/enums";
import {
  formatInterviewStatus,
  type InterviewRequestView,
} from "@/lib/interviews/interviews";

type InterviewRequestPanelProps = {
  applicationId: string;
  interviewRequests: InterviewRequestView[];
  mode: "partner" | "student" | "readonly";
  redirectTo: string;
};

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function isOpen(status: InterviewRequestStatus) {
  return !["CANCELED", "COMPLETED", "DECLINED"].includes(status);
}

export function InterviewRequestPanel({
  applicationId,
  interviewRequests,
  mode,
  redirectTo,
}: InterviewRequestPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Interview scheduling
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Manual interview requests and proposed times. External calendars are
            not connected.
          </p>
        </div>
        <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {interviewRequests.length} request
          {interviewRequests.length === 1 ? "" : "s"}
        </span>
      </div>

      {interviewRequests.length > 0 ? (
        <div className="mt-4 space-y-3">
          {interviewRequests.map((request) => (
            <article
              className="rounded-lg border border-border bg-muted/20 p-3"
              key={request.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {formatInterviewStatus(request.status)}
                </p>
                {request.selectedSlotId ? (
                  <p className="text-xs font-medium text-muted-foreground">
                    Slot selected
                  </p>
                ) : null}
              </div>
              {request.meetingLink ? (
                <a
                  className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
                  href={request.meetingLink}
                  rel="noreferrer"
                  target="_blank"
                >
                  Meeting link
                </a>
              ) : null}
              <p className="mt-2 text-sm text-muted-foreground">
                {request.location || "No location provided."}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {request.notes || "No partner notes provided."}
              </p>
              {request.studentResponseNotes ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  Student response: {request.studentResponseNotes}
                </p>
              ) : null}
              {request.proposedSlots.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {request.proposedSlots.map((slot) => (
                    <p
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
                      key={slot.id}
                    >
                      {formatDateTime(slot.startsAt)} -{" "}
                      {formatDateTime(slot.endsAt)}
                      {slot.selected ? " | selected" : ""}
                    </p>
                  ))}
                </div>
              ) : null}

              {mode === "student" && isOpen(request.status) ? (
                <form
                  action={respondToInterviewRequest}
                  className="mt-3 grid gap-3"
                >
                  <input name="interviewId" type="hidden" value={request.id} />
                  <input name="redirectTo" type="hidden" value={redirectTo} />
                  <label className="text-sm font-medium text-foreground">
                    Select proposed time
                    <select
                      className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                      name="slotId"
                    >
                      <option value="">No slot selected</option>
                      {request.proposedSlots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {formatDateTime(slot.startsAt)} -{" "}
                          {formatDateTime(slot.endsAt)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-foreground">
                    Response notes
                    <textarea
                      className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                      name="studentResponseNotes"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                      name="response"
                      type="submit"
                      value="accept"
                    >
                      Accept / select
                    </button>
                    <button
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                      name="response"
                      type="submit"
                      value="decline"
                    >
                      Decline
                    </button>
                  </div>
                </form>
              ) : null}

              {mode === "partner" && isOpen(request.status) ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={completeInterviewRequest}>
                    <input
                      name="interviewId"
                      type="hidden"
                      value={request.id}
                    />
                    <input name="redirectTo" type="hidden" value={redirectTo} />
                    <button
                      className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                      type="submit"
                    >
                      Mark complete
                    </button>
                  </form>
                  <form action={cancelInterviewRequest}>
                    <input
                      name="interviewId"
                      type="hidden"
                      value={request.id}
                    />
                    <input name="redirectTo" type="hidden" value={redirectTo} />
                    <button
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                      type="submit"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          No interview requests yet.
        </p>
      )}

      {mode === "partner" ? (
        <form
          action={createInterviewRequest}
          className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/20 p-4"
        >
          <input name="applicationId" type="hidden" value={applicationId} />
          <input name="redirectTo" type="hidden" value={redirectTo} />
          <label className="text-sm font-medium text-foreground">
            Proposed slots
            <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
              One per line: start | end. Example: 2026-06-01T09:00 |
              2026-06-01T09:30
            </span>
            <textarea
              className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
              name="slots"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-foreground">
              Meeting link
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                name="meetingLink"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Location
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                name="location"
              />
            </label>
          </div>
          <label className="text-sm font-medium text-foreground">
            Notes
            <textarea
              className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
              name="notes"
            />
          </label>
          <button
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="submit"
          >
            Request interview
          </button>
        </form>
      ) : null}
    </section>
  );
}
