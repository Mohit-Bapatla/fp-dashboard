"use client";

import { Copy, Wand2 } from "lucide-react";
import { useActionState, useRef } from "react";

import {
  generateOutreachDraft,
  type OutreachAssistantState,
} from "@/app/dashboard/staff/outreach/assistant/actions";
import {
  formatOutreachTemplateType,
  outreachTemplateTypes,
} from "@/lib/staff/outreach-assistant-options";

type Option = {
  id: string;
  label: string;
};

type OutreachAssistantFormProps = {
  contacts: Array<Option & { organizationId: string }>;
  organizations: Option[];
  placementRequests: Option[];
};

const initialState: OutreachAssistantState = {
  body: "",
  error: null,
  subject: "",
};

export function OutreachAssistantForm({
  contacts,
  organizations,
  placementRequests,
}: OutreachAssistantFormProps) {
  const [state, formAction, pending] = useActionState(
    generateOutreachDraft,
    initialState,
  );
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  return (
    <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
          <Wand2 aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Outreach draft assistant
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Generate an editable draft. Nothing is sent, saved, scheduled, or
            automated.
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-5 grid gap-4 lg:grid-cols-3">
        <label className="text-sm font-medium text-foreground">
          Template
          <select
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
            name="templateType"
            required
          >
            {outreachTemplateTypes.map((template) => (
              <option key={template} value={template}>
                {formatOutreachTemplateType(template)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-foreground">
          Organization
          <select
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
            name="organizationId"
          >
            <option value="">No organization</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-foreground">
          Contact
          <select
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
            name="contactId"
          >
            <option value="">No contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-foreground lg:col-span-2">
          Placement request
          <select
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
            name="placementRequestId"
          >
            <option value="">No placement request</option>
            {placementRequests.map((request) => (
              <option key={request.id} value={request.id}>
                {request.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-foreground">
          Specialty or focus
          <input
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
            name="specialty"
            placeholder="Cardiology, research, shadowing"
          />
        </label>
        <label className="text-sm font-medium text-foreground lg:col-span-3">
          Extra notes
          <textarea
            className="mt-2 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
            name="extraNotes"
            placeholder="Mention availability, previous conversation, or specific student need."
          />
        </label>
        <div className="lg:col-span-3">
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            <Wand2 aria-hidden="true" className="h-4 w-4" />
            {pending ? "Generating" : "Generate draft"}
          </button>
        </div>
      </form>

      {state.error ? (
        <p className="mt-4 text-sm text-red-600">{state.error}</p>
      ) : null}

      {state.subject || state.body ? (
        <div className="mt-6 space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <label className="text-sm font-medium text-foreground">
            Subject
            <input
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
              defaultValue={state.subject}
              key={`subject-${state.subject}`}
              ref={subjectRef}
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Body
            <textarea
              className="mt-2 min-h-80 w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-6 outline-none transition focus:border-foreground"
              defaultValue={state.body}
              key={`body-${state.body}`}
              ref={bodyRef}
            />
          </label>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background"
            onClick={() =>
              navigator.clipboard.writeText(
                `Subject: ${subjectRef.current?.value ?? ""}\n\n${bodyRef.current?.value ?? ""}`,
              )
            }
            type="button"
          >
            <Copy aria-hidden="true" className="h-4 w-4" />
            Copy draft
          </button>
        </div>
      ) : null}
    </section>
  );
}
