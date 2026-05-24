import { ArrowRight, FileClock, MapPin } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import {
  FeedbackForm,
  type ExistingFeedback,
} from "@/components/feedback/feedback-form";
import { PlacementRequestProgress } from "@/components/placement-requests/placement-request-progress";
import { PlacementRequestStatusBadge } from "@/components/placement-requests/placement-request-status-badge";
import type {
  OpportunityType,
  PlacementRequestStatus,
} from "@/generated/prisma/enums";
import { formatEnumLabel } from "@/lib/placement-requests/validation";

export type StudentPlacementRequestListItem = {
  id: string;
  availability: string[];
  createdAt: Date;
  description: string | null;
  locationPreference: string | null;
  priority: string;
  remotePreference: string | null;
  requestedOpportunityTypes: OpportunityType[];
  requestedSpecialties: string[];
  status: PlacementRequestStatus;
  title: string;
  updatedAt: Date;
  urgency: string | null;
  feedback: ExistingFeedback;
};

type StudentPlacementRequestListProps = {
  requests: StudentPlacementRequestListItem[];
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
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

export function StudentPlacementRequestList({
  requests,
}: StudentPlacementRequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          description="If the opportunity board does not have the right fit, submit a personalized request so the placement team can help research options."
          icon={FileClock}
          title="No placement requests yet"
        />
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          href="/dashboard/student/placement-requests/new"
        >
          New placement request
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
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
              <p className="mt-2 text-sm text-muted-foreground">
                Created {formatDate(request.createdAt)} | Updated{" "}
                {formatDate(request.updatedAt)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 lg:min-w-72">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MapPin aria-hidden="true" className="h-4 w-4 text-primary" />
                {request.locationPreference || "Location not specified"}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {request.remotePreference || "No remote preference"} |{" "}
                {request.urgency || "No urgency set"}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <PlacementRequestProgress status={request.status} />
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

          {request.description ? (
            <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Request context
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {request.description}
              </p>
            </div>
          ) : null}

          <div className="mt-5">
            <FeedbackForm
              description="Rate the placement support experience and add context for the FP team."
              entityId={request.id}
              entityType="PLACEMENT_REQUEST"
              existingFeedback={request.feedback}
              feedbackType="STUDENT_PLACEMENT_REQUEST"
              redirectTo="/dashboard/student/placement-requests"
              title="Placement request feedback"
            />
          </div>
        </article>
      ))}
    </div>
  );
}
