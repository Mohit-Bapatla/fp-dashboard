import { FileClock, Search } from "lucide-react";

import {
  assignPlacementRequest,
  updatePlacementRequestNotes,
  updatePlacementRequestPriority,
  updatePlacementRequestStatus,
} from "@/app/dashboard/placement-requests/actions";
import { RecordCommentThread } from "@/components/comments/record-comment-thread";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PlacementRequestStatusBadge } from "@/components/placement-requests/placement-request-status-badge";
import type {
  OpportunityType,
  PlacementRequestStatus,
} from "@/generated/prisma/enums";
import type { RecordCommentThread as RecordCommentThreadData } from "@/lib/comments/record-comments";
import {
  formatEnumLabel,
  placementRequestPriorityOptions,
  placementRequestStatusOptions,
} from "@/lib/placement-requests/validation";

export type PlacementRequestQueueItem = {
  id: string;
  assignedStaffId: string | null;
  assignedStaff: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  availability: string[];
  createdAt: Date;
  description: string | null;
  locationPreference: string | null;
  notes: string | null;
  priority: string;
  remotePreference: string | null;
  requestedOpportunityTypes: OpportunityType[];
  requestedSpecialties: string[];
  status: PlacementRequestStatus;
  studentProfile: {
    school: string | null;
    gradeYear: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    resumes: {
      id: string;
    }[];
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
  title: string;
  updatedAt: Date;
  urgency: string | null;
  commentThread: RecordCommentThreadData;
};

export type PlacementRequestStaffOption = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

type PlacementRequestQueueProps = {
  requests: PlacementRequestQueueItem[];
  redirectTo: string;
  staffUsers: PlacementRequestStaffOption[];
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function getUserName(user: {
  email: string;
  firstName: string | null;
  lastName: string | null;
}) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return name || user.email;
}

function getLocation(request: PlacementRequestQueueItem) {
  const profileLocation = [
    request.studentProfile.city,
    request.studentProfile.state,
    request.studentProfile.country,
  ]
    .filter(Boolean)
    .join(", ");

  return request.locationPreference || profileLocation || "Not provided";
}

function TagList({
  empty,
  label,
  values,
}: {
  empty: string;
  label: string;
  values: readonly string[];
}) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {values.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
              key={value}
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

export function PlacementRequestQueue({
  redirectTo,
  requests,
  staffUsers,
}: PlacementRequestQueueProps) {
  if (requests.length === 0) {
    return (
      <EmptyState
        description="No placement requests match the current filters. Clear filters or wait for students to submit new requests."
        icon={Search}
        title="No placement requests found"
      />
    );
  }

  return (
    <div className="grid gap-5">
      {requests.map((request) => (
        <article
          className="rounded-lg border border-border bg-background p-5 shadow-sm"
          key={request.id}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <PlacementRequestStatusBadge status={request.status} />
                <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {request.priority}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-normal text-foreground">
                {request.title}
              </h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {getUserName(request.studentProfile.user)} |{" "}
                {request.studentProfile.user.email}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Created {formatDate(request.createdAt)} | Updated{" "}
                {formatDate(request.updatedAt)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 lg:min-w-80">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileClock
                  aria-hidden="true"
                  className="h-4 w-4 text-primary"
                />
                {request.studentProfile.school || "School not provided"}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {request.studentProfile.gradeYear || "Grade not provided"} |{" "}
                {getLocation(request)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Resume{" "}
                {request.studentProfile.resumes.length > 0
                  ? "uploaded"
                  : "not uploaded"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <TagList
              empty="No specialties listed"
              label="Specialties"
              values={request.requestedSpecialties}
            />
            <TagList
              empty="No opportunity types listed"
              label="Opportunity types"
              values={request.requestedOpportunityTypes.map(formatEnumLabel)}
            />
            <TagList
              empty="No availability listed"
              label="Availability"
              values={request.availability}
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Student context
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {request.description || "No student context provided."}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {request.remotePreference || "No remote preference"} |{" "}
                {request.urgency || "No urgency set"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Internal notes
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {request.notes || "No internal notes yet."}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Assigned to{" "}
                {request.assignedStaff
                  ? getUserName(request.assignedStaff)
                  : "Unassigned"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-4">
            <form
              action={updatePlacementRequestStatus}
              className="rounded-lg border border-border bg-background p-4"
            >
              <input name="requestId" type="hidden" value={request.id} />
              <input name="redirectTo" type="hidden" value={redirectTo} />
              <label className="text-sm font-medium text-foreground">
                Status
                <select
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                  defaultValue={request.status}
                  name="status"
                >
                  {placementRequestStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {formatEnumLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                type="submit"
              >
                Update status
              </button>
            </form>

            <form
              action={assignPlacementRequest}
              className="rounded-lg border border-border bg-background p-4"
            >
              <input name="requestId" type="hidden" value={request.id} />
              <input name="redirectTo" type="hidden" value={redirectTo} />
              <label className="text-sm font-medium text-foreground">
                Assignee
                <select
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                  defaultValue={request.assignedStaffId ?? ""}
                  name="assignedStaffId"
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map((staffUser) => (
                    <option key={staffUser.id} value={staffUser.id}>
                      {getUserName(staffUser)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                type="submit"
              >
                Assign
              </button>
            </form>

            <form
              action={updatePlacementRequestPriority}
              className="rounded-lg border border-border bg-background p-4"
            >
              <input name="requestId" type="hidden" value={request.id} />
              <input name="redirectTo" type="hidden" value={redirectTo} />
              <label className="text-sm font-medium text-foreground">
                Priority
                <select
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                  defaultValue={request.priority}
                  name="priority"
                >
                  {placementRequestPriorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                type="submit"
              >
                Update priority
              </button>
            </form>

            <form
              action={updatePlacementRequestNotes}
              className="rounded-lg border border-border bg-background p-4"
            >
              <input name="requestId" type="hidden" value={request.id} />
              <input name="redirectTo" type="hidden" value={redirectTo} />
              <label className="text-sm font-medium text-foreground">
                Internal notes
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                  defaultValue={request.notes ?? ""}
                  name="notes"
                />
              </label>
              <button
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                type="submit"
              >
                Save notes
              </button>
            </form>
          </div>

          <RecordCommentThread
            entityId={request.id}
            entityType="PLACEMENT_REQUEST"
            redirectTo={redirectTo}
            thread={request.commentThread}
          />
        </article>
      ))}
    </div>
  );
}
