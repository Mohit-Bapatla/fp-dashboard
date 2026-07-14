"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  createStudentCustomApplicationTask,
  type StudentTaskActionState,
} from "@/app/dashboard/student/tasks/actions";

const initialState: StudentTaskActionState = {
  error: null,
  success: null,
};

type ApplicationOption = {
  id: string;
  label: string;
};

export function StudentCustomTaskForm({
  applications,
}: {
  applications: ApplicationOption[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    createStudentCustomApplicationTask,
    initialState,
  );

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  if (applications.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Start an application workspace before adding a private task.
      </p>
    );
  }

  return (
    <form action={action} className="mt-5 space-y-4" ref={formRef}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-foreground">
          Application
          <select
            className="mt-2 block min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            name="applicationId"
            required
          >
            <option value="">Choose an application</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-foreground">
          Due date (optional)
          <input
            className="mt-2 block min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            name="dueAt"
            type="date"
          />
        </label>
      </div>
      <label className="block text-sm font-medium text-foreground">
        Task title
        <input
          className="mt-2 block min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          maxLength={240}
          name="title"
          required
        />
      </label>
      <label className="block text-sm font-medium text-foreground">
        Private description (optional)
        <textarea
          className="mt-2 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          maxLength={2000}
          name="description"
          rows={3}
        />
      </label>
      <label className="flex min-h-10 items-center gap-3 text-sm text-foreground">
        <input
          className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          defaultChecked
          name="required"
          type="checkbox"
        />
        Include this task in calculated progress
      </label>
      <button
        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Adding task" : "Add private task"}
      </button>
      {state.error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        >
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
