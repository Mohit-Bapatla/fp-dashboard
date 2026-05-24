import { BadgeDollarSign, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type {
  DashboardNavItem,
  DashboardRole,
} from "@/components/dashboard/role-config";
import { StatCard } from "@/components/dashboard/stat-card";
import { prisma } from "@/lib/db/prisma";
import {
  formatCents,
  formatSponsorLabel,
  sponsorDeliverableStatuses,
  sponsorDeliverableTypes,
  sponsorshipCampaignStatuses,
  sponsorshipCommitmentStatuses,
} from "@/lib/sponsorships/sponsorships";

import {
  saveSponsorDeliverable,
  saveSponsorshipCampaign,
  saveSponsorshipCommitment,
} from "../staff/sponsorships/actions";

type SponsorshipsManagementPageProps = {
  activeHref: string;
  navItems: DashboardNavItem[];
  role: DashboardRole;
  title: string;
};

export async function SponsorshipsManagementPage({
  activeHref,
  navItems,
  role,
  title,
}: SponsorshipsManagementPageProps) {
  const [sponsors, campaigns, commitments] = await Promise.all([
    prisma.sponsorOrganization.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    }),
    prisma.sponsorshipCampaign.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        commitments: true,
      },
    }),
    prisma.sponsorshipCommitment.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        campaign: true,
        deliverables: {
          orderBy: {
            dueAt: "asc",
          },
        },
        sponsorOrganization: true,
      },
    }),
  ]);
  const totalCommittedCents = commitments
    .filter((commitment) =>
      ["COMMITTED", "RECEIVED"].includes(commitment.status),
    )
    .reduce((total, commitment) => total + (commitment.amountCents ?? 0), 0);
  const openDeliverables = commitments.reduce(
    (total, commitment) =>
      total +
      commitment.deliverables.filter((deliverable) =>
        ["TODO", "IN_PROGRESS"].includes(deliverable.status),
      ).length,
    0,
  );

  return (
    <DashboardShell navItems={navItems} role={role}>
      <div className="space-y-8">
        <header className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <BadgeDollarSign aria-hidden="true" className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Funding operations
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Track sponsorship campaigns, commitments, and deliverables as
            operational records. This module does not process payments.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Campaign records for sponsorship outreach."
            label="Campaigns"
            value={campaigns.length.toString()}
          />
          <StatCard
            helper="Committed and received amounts tracked as metadata."
            label="Committed funding"
            value={formatCents(totalCommittedCents)}
          />
          <StatCard
            helper="Deliverables still in todo or in-progress status."
            label="Open deliverables"
            value={openDeliverables.toString()}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <Plus aria-hidden="true" className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Add campaign
                </h2>
                <p className="text-sm text-muted-foreground">
                  Use campaigns for annual funds, event sponsorships, or
                  targeted asks.
                </p>
              </div>
            </div>
            <CampaignForm redirectTo={activeHref} />
          </article>

          <article className="rounded-lg border border-border bg-background p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <Plus aria-hidden="true" className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Add commitment
                </h2>
                <p className="text-sm text-muted-foreground">
                  Amounts are tracked as cents; no payment is collected.
                </p>
              </div>
            </div>
            <CommitmentForm
              campaigns={campaigns}
              redirectTo={activeHref}
              sponsors={sponsors}
            />
          </article>
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Campaigns will appear here after staff creates them.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {campaigns.map((campaign) => (
                <div className="py-4" key={campaign.id}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {campaign.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatSponsorLabel(campaign.status)} | Goal{" "}
                        {formatCents(campaign.goalAmountCents)}
                      </p>
                    </div>
                    <details>
                      <summary className="cursor-pointer text-sm font-medium text-primary">
                        Edit campaign
                      </summary>
                      <CampaignForm
                        campaign={{
                          description: campaign.description,
                          endAt: campaign.endAt,
                          goalAmountCents: campaign.goalAmountCents,
                          id: campaign.id,
                          name: campaign.name,
                          startAt: campaign.startAt,
                          status: campaign.status,
                        }}
                        redirectTo={activeHref}
                      />
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          {commitments.length === 0 ? (
            <article className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground shadow-sm">
              Sponsorship commitments will appear here after staff creates them.
            </article>
          ) : (
            commitments.map((commitment) => (
              <article
                className="rounded-lg border border-border bg-background p-6 shadow-sm"
                key={commitment.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">
                      {formatSponsorLabel(commitment.status)}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">
                      {commitment.sponsorOrganization.name}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {commitment.campaign?.name ?? "No campaign"} |{" "}
                      {formatCents(commitment.amountCents)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {commitment.notes || "No notes yet."}
                    </p>
                  </div>
                </div>

                <details className="mt-6 rounded-lg border border-border p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">
                    Edit commitment
                  </summary>
                  <CommitmentForm
                    campaigns={campaigns}
                    commitment={{
                      amountCents: commitment.amountCents,
                      campaignId: commitment.campaignId,
                      committedAt: commitment.committedAt,
                      id: commitment.id,
                      notes: commitment.notes,
                      receivedAt: commitment.receivedAt,
                      sponsorOrganizationId: commitment.sponsorOrganizationId,
                      status: commitment.status,
                    }}
                    redirectTo={activeHref}
                    sponsors={sponsors}
                  />
                </details>

                <section className="mt-6 rounded-lg border border-border p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Deliverables
                  </h3>
                  <DeliverableForm
                    commitmentId={commitment.id}
                    redirectTo={activeHref}
                  />
                  <div className="mt-4 divide-y divide-border">
                    {commitment.deliverables.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No deliverables yet.
                      </p>
                    ) : (
                      commitment.deliverables.map((deliverable) => (
                        <div className="py-3" key={deliverable.id}>
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {formatSponsorLabel(deliverable.type)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatSponsorLabel(deliverable.status)} | Due{" "}
                                {formatDate(deliverable.dueAt)}
                              </p>
                            </div>
                            <details>
                              <summary className="cursor-pointer text-sm font-medium text-primary">
                                Edit
                              </summary>
                              <DeliverableForm
                                commitmentId={commitment.id}
                                deliverable={{
                                  dueAt: deliverable.dueAt,
                                  id: deliverable.id,
                                  notes: deliverable.notes,
                                  status: deliverable.status,
                                  type: deliverable.type,
                                }}
                                redirectTo={activeHref}
                              />
                            </details>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </article>
            ))
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function CampaignForm({
  campaign,
  redirectTo,
}: {
  campaign?: {
    description: string | null;
    endAt: Date | null;
    goalAmountCents: number | null;
    id: string;
    name: string;
    startAt: Date | null;
    status: string;
  };
  redirectTo: string;
}) {
  return (
    <form
      action={saveSponsorshipCampaign}
      className="mt-6 grid gap-4 lg:grid-cols-2"
    >
      <input name="campaignId" type="hidden" value={campaign?.id ?? ""} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <Field label="Name">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={campaign?.name ?? ""}
          name="name"
          required
        />
      </Field>
      <Field label="Status">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={campaign?.status ?? "DRAFT"}
          name="status"
        >
          {sponsorshipCampaignStatuses.map((status) => (
            <option key={status} value={status}>
              {formatSponsorLabel(status)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Goal amount">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={centsToInput(campaign?.goalAmountCents)}
          min="0"
          name="goalAmount"
          step="0.01"
          type="number"
        />
      </Field>
      <Field label="Start">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={formatInputDate(campaign?.startAt)}
          name="startAt"
          type="date"
        />
      </Field>
      <Field label="End">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={formatInputDate(campaign?.endAt)}
          name="endAt"
          type="date"
        />
      </Field>
      <div className="lg:col-span-2">
        <Field label="Description">
          <textarea
            className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            defaultValue={campaign?.description ?? ""}
            name="description"
          />
        </Field>
      </div>
      <div className="lg:col-span-2">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background shadow-sm transition hover:bg-foreground/90"
          type="submit"
        >
          {campaign ? "Save campaign" : "Create campaign"}
        </button>
      </div>
    </form>
  );
}

function CommitmentForm({
  campaigns,
  commitment,
  redirectTo,
  sponsors,
}: {
  campaigns: Array<{ id: string; name: string }>;
  commitment?: {
    amountCents: number | null;
    campaignId: string | null;
    committedAt: Date | null;
    id: string;
    notes: string | null;
    receivedAt: Date | null;
    sponsorOrganizationId: string;
    status: string;
  };
  redirectTo: string;
  sponsors: Array<{ id: string; name: string }>;
}) {
  return (
    <form
      action={saveSponsorshipCommitment}
      className="mt-6 grid gap-4 lg:grid-cols-2"
    >
      <input name="commitmentId" type="hidden" value={commitment?.id ?? ""} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <Field label="Sponsor">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={commitment?.sponsorOrganizationId ?? ""}
          name="sponsorOrganizationId"
          required
        >
          <option value="">Choose sponsor</option>
          {sponsors.map((sponsor) => (
            <option key={sponsor.id} value={sponsor.id}>
              {sponsor.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Campaign">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={commitment?.campaignId ?? ""}
          name="campaignId"
        >
          <option value="">No campaign</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={commitment?.status ?? "PLEDGED"}
          name="status"
        >
          {sponsorshipCommitmentStatuses.map((status) => (
            <option key={status} value={status}>
              {formatSponsorLabel(status)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Amount">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={centsToInput(commitment?.amountCents)}
          min="0"
          name="amount"
          step="0.01"
          type="number"
        />
      </Field>
      <Field label="Committed at">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={formatInputDate(commitment?.committedAt)}
          name="committedAt"
          type="date"
        />
      </Field>
      <Field label="Received at">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={formatInputDate(commitment?.receivedAt)}
          name="receivedAt"
          type="date"
        />
      </Field>
      <div className="lg:col-span-2">
        <Field label="Notes">
          <textarea
            className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            defaultValue={commitment?.notes ?? ""}
            name="notes"
          />
        </Field>
      </div>
      <div className="lg:col-span-2">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background shadow-sm transition hover:bg-foreground/90"
          type="submit"
        >
          {commitment ? "Save commitment" : "Create commitment"}
        </button>
      </div>
    </form>
  );
}

function DeliverableForm({
  commitmentId,
  deliverable,
  redirectTo,
}: {
  commitmentId: string;
  deliverable?: {
    dueAt: Date | null;
    id: string;
    notes: string | null;
    status: string;
    type: string;
  };
  redirectTo: string;
}) {
  return (
    <form
      action={saveSponsorDeliverable}
      className="mt-4 grid gap-3 lg:grid-cols-2"
    >
      <input name="deliverableId" type="hidden" value={deliverable?.id ?? ""} />
      <input name="commitmentId" type="hidden" value={commitmentId} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <Field label="Type">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={deliverable?.type ?? "LOGO_PLACEMENT"}
          name="type"
        >
          {sponsorDeliverableTypes.map((type) => (
            <option key={type} value={type}>
              {formatSponsorLabel(type)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={deliverable?.status ?? "TODO"}
          name="status"
        >
          {sponsorDeliverableStatuses.map((status) => (
            <option key={status} value={status}>
              {formatSponsorLabel(status)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Due at">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={formatInputDate(deliverable?.dueAt)}
          name="dueAt"
          type="date"
        />
      </Field>
      <div className="lg:col-span-2">
        <Field label="Notes">
          <textarea
            className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            defaultValue={deliverable?.notes ?? ""}
            name="notes"
          />
        </Field>
      </div>
      <div className="lg:col-span-2">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
          type="submit"
        >
          {deliverable ? "Save deliverable" : "Add deliverable"}
        </button>
      </div>
    </form>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function centsToInput(value?: number | null) {
  return value === null || value === undefined ? "" : (value / 100).toFixed(2);
}

function formatDate(value: Date | null) {
  if (!value) {
    return "not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function formatInputDate(value?: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}
