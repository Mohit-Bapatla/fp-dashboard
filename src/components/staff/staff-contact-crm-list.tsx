import { Mail, Search, UserRound } from "lucide-react";

import { saveOutreachContact } from "@/app/dashboard/staff/crm-actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatDateInput } from "@/lib/staff/crm-validation";

export type StaffContactCrmItem = {
  id: string;
  email: string | null;
  firstName: string;
  lastContactedAt: Date | null;
  lastName: string | null;
  nextFollowUpAt: Date | null;
  notes: string | null;
  organizationId: string;
  organization: {
    name: string;
  };
  phone: string | null;
  title: string | null;
};

export type StaffOrganizationOption = {
  id: string;
  name: string;
};

type StaffContactCrmListProps = {
  contacts: StaffContactCrmItem[];
  organizations: StaffOrganizationOption[];
  redirectTo: string;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function ContactForm({
  contact,
  organizations,
  redirectTo,
}: {
  contact?: StaffContactCrmItem;
  organizations: StaffOrganizationOption[];
  redirectTo: string;
}) {
  return (
    <form
      action={saveOutreachContact}
      className="grid gap-4 rounded-lg border border-border bg-background p-4 lg:grid-cols-3"
    >
      <input name="redirectTo" type="hidden" value={redirectTo} />
      {contact ? (
        <input name="contactId" type="hidden" value={contact.id} />
      ) : null}
      <label className="text-sm font-medium text-foreground">
        Organization
        <select
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={contact?.organizationId ?? ""}
          name="organizationId"
          required
        >
          <option value="">Choose organization</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground">
        First name
        <input
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={contact?.firstName ?? ""}
          name="firstName"
          required
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Last name
        <input
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={contact?.lastName ?? ""}
          name="lastName"
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Email
        <input
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={contact?.email ?? ""}
          name="email"
          type="email"
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Phone
        <input
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={contact?.phone ?? ""}
          name="phone"
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Title
        <input
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={contact?.title ?? ""}
          name="title"
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Last contacted
        <input
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={formatDateInput(contact?.lastContactedAt)}
          name="lastContactedAt"
          type="date"
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Next follow-up
        <input
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={formatDateInput(contact?.nextFollowUpAt)}
          name="nextFollowUpAt"
          type="date"
        />
      </label>
      <label className="text-sm font-medium text-foreground lg:col-span-3">
        Notes
        <textarea
          className="mt-2 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={contact?.notes ?? ""}
          name="notes"
        />
      </label>
      <div className="lg:col-span-3">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          type="submit"
        >
          {contact ? "Save contact" : "Create contact"}
        </button>
      </div>
    </form>
  );
}

export function NewContactForm({
  organizations,
  redirectTo,
}: {
  organizations: StaffOrganizationOption[];
  redirectTo: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">
        Create outreach contact
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Add a person connected to a partner organization for outreach tracking.
      </p>
      <div className="mt-5">
        <ContactForm organizations={organizations} redirectTo={redirectTo} />
      </div>
    </section>
  );
}

export function StaffContactCrmList({
  contacts,
  organizations,
  redirectTo,
}: StaffContactCrmListProps) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        description="No outreach contacts match the current filters. Add a new contact or clear filters."
        icon={Search}
        title="No contacts found"
      />
    );
  }

  return (
    <div className="grid gap-5">
      {contacts.map((contact) => (
        <article
          className="rounded-lg border border-border bg-background p-5 shadow-sm"
          key={contact.id}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <UserRound aria-hidden="true" className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-normal text-foreground">
                {[contact.firstName, contact.lastName]
                  .filter(Boolean)
                  .join(" ")}
              </h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {contact.organization.name} | {contact.title || "No title"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 lg:min-w-80">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail aria-hidden="true" className="h-4 w-4 text-primary" />
                {contact.email || "No email"}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {contact.phone || "No phone"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Last {formatDate(contact.lastContactedAt)} | Next{" "}
                {formatDate(contact.nextFollowUpAt)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Notes</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {contact.notes || "No contact notes yet."}
            </p>
          </div>

          <details className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              Edit contact
            </summary>
            <div className="mt-4">
              <ContactForm
                contact={contact}
                organizations={organizations}
                redirectTo={redirectTo}
              />
            </div>
          </details>
        </article>
      ))}
    </div>
  );
}
