import { Building2, Plus, Users } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";
import {
  formatSponsorLabel,
  sponsorInteractionTypes,
  sponsorStatuses,
} from "@/lib/sponsorships/sponsorships";

import {
  saveSponsorContact,
  saveSponsorInteraction,
  saveSponsorOrganization,
} from "./actions";

export default async function StaffSponsorsPage() {
  await assertPlacementQueueAccess();

  const sponsors = await prisma.sponsorOrganization.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      contacts: {
        orderBy: {
          updatedAt: "desc",
        },
      },
      interactions: {
        orderBy: {
          occurredAt: "desc",
        },
        take: 5,
        include: {
          contact: true,
        },
      },
      _count: {
        select: {
          commitments: true,
        },
      },
    },
  });
  const contactCount = sponsors.reduce(
    (total, sponsor) => total + sponsor.contacts.length,
    0,
  );

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff/sponsors")}
      role="staff"
    >
      <div className="space-y-8">
        <header className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <Building2 aria-hidden="true" className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Sponsor CRM
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Sponsors
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Track sponsor organizations, contacts, and outreach history without
            payment processing or email automation.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Sponsor organizations in the funding pipeline."
            label="Sponsors"
            value={sponsors.length.toString()}
          />
          <StatCard
            helper="People tied to sponsor organizations."
            label="Contacts"
            value={contactCount.toString()}
          />
          <StatCard
            helper="Organizations with committed or active status."
            label="Committed or active"
            value={sponsors
              .filter((sponsor) =>
                ["COMMITTED", "ACTIVE"].includes(sponsor.status),
              )
              .length.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-primary">
              <Plus aria-hidden="true" className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Add sponsor
              </h2>
              <p className="text-sm text-muted-foreground">
                Sponsor records are internal CRM metadata only.
              </p>
            </div>
          </div>
          <SponsorOrganizationForm redirectTo="/dashboard/staff/sponsors" />
        </section>

        <section className="space-y-4">
          {sponsors.length === 0 ? (
            <article className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground shadow-sm">
              Sponsor organizations will appear here after staff creates them.
            </article>
          ) : (
            sponsors.map((sponsor) => (
              <article
                className="rounded-lg border border-border bg-background p-6 shadow-sm"
                key={sponsor.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">
                      {formatSponsorLabel(sponsor.status)}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">
                      {sponsor.name}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {sponsor.description || "No description yet."}
                    </p>
                    <dl className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                      <Fact
                        label="Website"
                        value={sponsor.website || "Not set"}
                      />
                      <Fact
                        label="Contact email"
                        value={sponsor.contactEmail || "Not set"}
                      />
                      <Fact
                        label="Location"
                        value={sponsor.location || "Not set"}
                      />
                      <Fact
                        label="Donation link"
                        value={sponsor.donationUrl || "Not set"}
                      />
                    </dl>
                  </div>
                </div>

                <details className="mt-6 rounded-lg border border-border p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">
                    Edit sponsor
                  </summary>
                  <SponsorOrganizationForm
                    redirectTo="/dashboard/staff/sponsors"
                    sponsor={{
                      contactEmail: sponsor.contactEmail,
                      description: sponsor.description,
                      donationUrl: sponsor.donationUrl,
                      id: sponsor.id,
                      location: sponsor.location,
                      name: sponsor.name,
                      status: sponsor.status,
                      website: sponsor.website,
                    }}
                  />
                </details>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  <section className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2">
                      <Users
                        aria-hidden="true"
                        className="h-4 w-4 text-primary"
                      />
                      <h3 className="text-sm font-semibold text-foreground">
                        Contacts
                      </h3>
                    </div>
                    <SponsorContactForm
                      redirectTo="/dashboard/staff/sponsors"
                      sponsorId={sponsor.id}
                    />
                    <div className="mt-4 divide-y divide-border">
                      {sponsor.contacts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No contacts yet.
                        </p>
                      ) : (
                        sponsor.contacts.map((contact) => (
                          <div className="py-3" key={contact.id}>
                            <p className="text-sm font-medium text-foreground">
                              {[contact.firstName, contact.lastName]
                                .filter(Boolean)
                                .join(" ")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {contact.title || "No title"} |{" "}
                              {contact.email || "No email"}
                            </p>
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm font-medium text-primary">
                                Edit contact
                              </summary>
                              <SponsorContactForm
                                contact={{
                                  email: contact.email,
                                  firstName: contact.firstName,
                                  id: contact.id,
                                  lastName: contact.lastName,
                                  title: contact.title,
                                }}
                                redirectTo="/dashboard/staff/sponsors"
                                sponsorId={sponsor.id}
                              />
                            </details>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="rounded-lg border border-border p-4">
                    <h3 className="text-sm font-semibold text-foreground">
                      Contact history
                    </h3>
                    <SponsorInteractionForm
                      contacts={sponsor.contacts}
                      redirectTo="/dashboard/staff/sponsors"
                      sponsorId={sponsor.id}
                    />
                    <div className="mt-4 divide-y divide-border">
                      {sponsor.interactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No interactions yet.
                        </p>
                      ) : (
                        sponsor.interactions.map((interaction) => (
                          <div className="py-3" key={interaction.id}>
                            <p className="text-sm font-medium text-foreground">
                              {formatSponsorLabel(interaction.type)}
                            </p>
                            <p className="text-sm leading-6 text-muted-foreground">
                              {interaction.body}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function SponsorOrganizationForm({
  redirectTo,
  sponsor,
}: {
  redirectTo: string;
  sponsor?: {
    contactEmail: string | null;
    description: string | null;
    donationUrl: string | null;
    id: string;
    location: string | null;
    name: string;
    status: string;
    website: string | null;
  };
}) {
  return (
    <form
      action={saveSponsorOrganization}
      className="mt-6 grid gap-4 lg:grid-cols-2"
    >
      <input name="sponsorId" type="hidden" value={sponsor?.id ?? ""} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <Field label="Name">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={sponsor?.name ?? ""}
          name="name"
          required
        />
      </Field>
      <Field label="Status">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={sponsor?.status ?? "PROSPECT"}
          name="status"
        >
          {sponsorStatuses.map((status) => (
            <option key={status} value={status}>
              {formatSponsorLabel(status)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Website">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={sponsor?.website ?? ""}
          name="website"
          type="url"
        />
      </Field>
      <Field label="Contact email">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={sponsor?.contactEmail ?? ""}
          name="contactEmail"
          type="email"
        />
      </Field>
      <Field label="Location">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={sponsor?.location ?? ""}
          name="location"
        />
      </Field>
      <Field label="Donation link">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={sponsor?.donationUrl ?? ""}
          name="donationUrl"
          type="url"
        />
      </Field>
      <div className="lg:col-span-2">
        <Field label="Description">
          <textarea
            className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            defaultValue={sponsor?.description ?? ""}
            name="description"
          />
        </Field>
      </div>
      <div className="lg:col-span-2">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background shadow-sm transition hover:bg-foreground/90"
          type="submit"
        >
          {sponsor ? "Save sponsor" : "Create sponsor"}
        </button>
      </div>
    </form>
  );
}

function SponsorContactForm({
  contact,
  redirectTo,
  sponsorId,
}: {
  contact?: {
    email: string | null;
    firstName: string;
    id: string;
    lastName: string | null;
    title: string | null;
  };
  redirectTo: string;
  sponsorId: string;
}) {
  return (
    <form action={saveSponsorContact} className="mt-4 grid gap-3">
      <input name="contactId" type="hidden" value={contact?.id ?? ""} />
      <input name="sponsorOrganizationId" type="hidden" value={sponsorId} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <input
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        defaultValue={contact?.firstName ?? ""}
        name="firstName"
        placeholder="First name"
        required
      />
      <input
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        defaultValue={contact?.lastName ?? ""}
        name="lastName"
        placeholder="Last name"
      />
      <input
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        defaultValue={contact?.email ?? ""}
        name="email"
        placeholder="Email"
        type="email"
      />
      <input
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        defaultValue={contact?.title ?? ""}
        name="title"
        placeholder="Title"
      />
      <button
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
        type="submit"
      >
        {contact ? "Save contact" : "Add contact"}
      </button>
    </form>
  );
}

function SponsorInteractionForm({
  contacts,
  redirectTo,
  sponsorId,
}: {
  contacts: Array<{ firstName: string; id: string; lastName: string | null }>;
  redirectTo: string;
  sponsorId: string;
}) {
  return (
    <form action={saveSponsorInteraction} className="mt-4 grid gap-3">
      <input name="sponsorOrganizationId" type="hidden" value={sponsorId} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <select
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        name="type"
      >
        {sponsorInteractionTypes.map((type) => (
          <option key={type} value={type}>
            {formatSponsorLabel(type)}
          </option>
        ))}
      </select>
      <select
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        name="contactId"
      >
        <option value="">No specific contact</option>
        {contacts.map((contact) => (
          <option key={contact.id} value={contact.id}>
            {[contact.firstName, contact.lastName].filter(Boolean).join(" ")}
          </option>
        ))}
      </select>
      <textarea
        className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        name="body"
        placeholder="Interaction notes"
        required
      />
      <button
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
        type="submit"
      >
        Add interaction
      </button>
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
