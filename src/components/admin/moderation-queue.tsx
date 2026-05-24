import {
  archiveModeratedOpportunity,
  clearOpportunityFlags,
  flagOpportunity,
  publishModeratedOpportunity,
  rejectModeratedOpportunity,
  updatePartnerVerification,
} from "@/app/dashboard/admin/moderation/actions";
import type {
  OpportunityStatus,
  PartnerVerificationStatus,
} from "@/generated/prisma/enums";

export type ModerationPartnerItem = {
  contactEmail: string | null;
  id: string;
  name: string;
  verificationChecklist: string[];
  verificationNotes: string | null;
  verificationStatus: PartnerVerificationStatus;
};

export type ModerationOpportunityItem = {
  checks: string[];
  deadline: Date | null;
  id: string;
  moderationFlags: string[];
  moderationNotes: string | null;
  organization: {
    name: string;
    verificationStatus: PartnerVerificationStatus;
  };
  status: OpportunityStatus;
  title: string;
};

type ModerationQueueProps = {
  opportunities: ModerationOpportunityItem[];
  partners: ModerationPartnerItem[];
  redirectTo: string;
};

const verificationStatuses: PartnerVerificationStatus[] = [
  "UNVERIFIED",
  "IN_REVIEW",
  "VERIFIED",
  "SUSPENDED",
];

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

export function ModerationQueue({
  opportunities,
  partners,
  redirectTo,
}: ModerationQueueProps) {
  return (
    <div className="grid gap-8">
      <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          Partner verification
        </h2>
        <div className="mt-5 grid gap-4">
          {partners.length > 0 ? (
            partners.map((partner) => (
              <article
                className="rounded-lg border border-border bg-muted/20 p-4"
                key={partner.id}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {partner.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {partner.contactEmail ?? "No contact email"}
                    </p>
                  </div>
                  <span className="w-fit rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {formatEnumLabel(partner.verificationStatus)}
                  </span>
                </div>
                <form
                  action={updatePartnerVerification}
                  className="mt-4 grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
                >
                  <input
                    name="organizationId"
                    type="hidden"
                    value={partner.id}
                  />
                  <input name="redirectTo" type="hidden" value={redirectTo} />
                  <label className="text-sm font-medium text-foreground">
                    Verification
                    <select
                      className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                      defaultValue={partner.verificationStatus}
                      name="verificationStatus"
                    >
                      {verificationStatuses.map((status) => (
                        <option key={status} value={status}>
                          {formatEnumLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-foreground">
                    Checklist
                    <textarea
                      className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                      defaultValue={partner.verificationChecklist.join("\n")}
                      name="verificationChecklist"
                      placeholder="One checklist item per line"
                    />
                  </label>
                  <label className="text-sm font-medium text-foreground">
                    Notes
                    <textarea
                      className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                      defaultValue={partner.verificationNotes ?? ""}
                      name="verificationNotes"
                    />
                  </label>
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    type="submit"
                  >
                    Save
                  </button>
                </form>
              </article>
            ))
          ) : (
            <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              No unverified partner records need review.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          Opportunity moderation
        </h2>
        <div className="mt-5 grid gap-4">
          {opportunities.length > 0 ? (
            opportunities.map((opportunity) => (
              <article
                className="rounded-lg border border-border bg-muted/20 p-4"
                key={opportunity.id}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {opportunity.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {opportunity.organization.name} | Deadline{" "}
                      {formatDate(opportunity.deadline)}
                    </p>
                  </div>
                  <span className="w-fit rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {formatEnumLabel(opportunity.status)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[...opportunity.checks, ...opportunity.moderationFlags].map(
                    (flag) => (
                      <span
                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                        key={flag}
                      >
                        {flag}
                      </span>
                    ),
                  )}
                  {opportunity.checks.length === 0 &&
                  opportunity.moderationFlags.length === 0 ? (
                    <span className="text-sm text-muted-foreground">
                      No active checks or flags.
                    </span>
                  ) : null}
                </div>

                {opportunity.moderationNotes ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {opportunity.moderationNotes}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                  <form
                    action={flagOpportunity}
                    className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
                  >
                    <input
                      name="opportunityId"
                      type="hidden"
                      value={opportunity.id}
                    />
                    <input name="redirectTo" type="hidden" value={redirectTo} />
                    <label className="text-sm font-medium text-foreground">
                      Flag
                      <input
                        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                        name="flag"
                        placeholder="e.g. Needs clearer instructions"
                        required
                      />
                    </label>
                    <label className="text-sm font-medium text-foreground">
                      Notes
                      <input
                        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                        name="moderationNotes"
                      />
                    </label>
                    <button
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                      type="submit"
                    >
                      Flag
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2">
                    <ModerationButton
                      action={publishModeratedOpportunity}
                      label="Publish"
                      opportunityId={opportunity.id}
                      redirectTo={redirectTo}
                    />
                    <ModerationButton
                      action={rejectModeratedOpportunity}
                      label="Reject"
                      opportunityId={opportunity.id}
                      redirectTo={redirectTo}
                    />
                    <ModerationButton
                      action={archiveModeratedOpportunity}
                      label="Archive"
                      opportunityId={opportunity.id}
                      redirectTo={redirectTo}
                    />
                    <ModerationButton
                      action={clearOpportunityFlags}
                      label="Clear flags"
                      opportunityId={opportunity.id}
                      redirectTo={redirectTo}
                    />
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              No opportunities currently need moderation.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function ModerationButton({
  action,
  label,
  opportunityId,
  redirectTo,
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  opportunityId: string;
  redirectTo: string;
}) {
  return (
    <form action={action}>
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <button
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-foreground transition hover:bg-muted"
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
