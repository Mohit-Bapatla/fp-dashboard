"use client";

import { useActionState } from "react";

import {
  deleteStudentCustomApplicationTask,
  updateStudentCustomApplicationTask,
  updateStudentApplicationTaskStatus,
  type StudentTaskActionState,
} from "@/app/dashboard/student/tasks/actions";
import type { ApplicationTaskStatus } from "@/generated/prisma/enums";

const initialState: StudentTaskActionState = {
  error: null,
  success: null,
};

type StudentTaskControlsProps = {
  completionRequiresApplicationAction: boolean;
  customTaskEditable: boolean;
  description: string | null;
  dueAt: string | null;
  required: boolean;
  status: ApplicationTaskStatus;
  taskId: string;
  title: string;
};

export function StudentTaskControls({
  completionRequiresApplicationAction,
  customTaskEditable,
  description,
  dueAt,
  required,
  status,
  taskId,
  title,
}: StudentTaskControlsProps) {
  const [statusState, statusAction, statusPending] = useActionState(
    updateStudentApplicationTaskStatus,
    initialState,
  );
  const [editState, editAction, editPending] = useActionState(
    updateStudentCustomApplicationTask,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStudentCustomApplicationTask,
    initialState,
  );
  const closed = status === "COMPLETE" || status === "SKIPPED";
  const hasGenericStatusControls =
    !completionRequiresApplicationAction || !closed;

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      {completionRequiresApplicationAction ? (
        <p className="text-sm leading-6 text-muted-foreground">
          {closed
            ? "This completion was recorded by the submission workflow and cannot be reopened here."
            : "Use Open action to submit or confirm through the application workflow; this task cannot be completed manually."}
        </p>
      ) : null}

      {hasGenericStatusControls ? (
        <div
          aria-label="Task status controls"
          className="flex flex-wrap gap-2"
          role="group"
        >
          {closed ? (
            <StatusButton
              action={statusAction}
              disabled={statusPending}
              label={statusPending ? "Reopening" : "Reopen"}
              status="NOT_STARTED"
              taskId={taskId}
            />
          ) : (
            <>
              {!completionRequiresApplicationAction ? (
                <StatusButton
                  action={statusAction}
                  disabled={statusPending}
                  label={statusPending ? "Updating" : "Complete"}
                  primary
                  status="COMPLETE"
                  taskId={taskId}
                />
              ) : null}
              {status !== "IN_PROGRESS" ? (
                <StatusButton
                  action={statusAction}
                  disabled={statusPending}
                  label="Start"
                  status="IN_PROGRESS"
                  taskId={taskId}
                />
              ) : null}
              {status !== "BLOCKED" ? (
                <StatusButton
                  action={statusAction}
                  disabled={statusPending}
                  label="Mark blocked"
                  status="BLOCKED"
                  taskId={taskId}
                />
              ) : (
                <StatusButton
                  action={statusAction}
                  disabled={statusPending}
                  label="Clear blocker"
                  status="IN_PROGRESS"
                  taskId={taskId}
                />
              )}
              {!required ? (
                <StatusButton
                  action={statusAction}
                  disabled={statusPending}
                  label="Skip"
                  status="SKIPPED"
                  taskId={taskId}
                />
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {customTaskEditable ? (
        <details className="rounded-lg border border-border bg-muted/20 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Edit or delete private task
          </summary>
          <form action={editAction} className="mt-4 grid gap-4">
            <input name="taskId" type="hidden" value={taskId} />
            <label className="block text-sm font-medium text-foreground">
              Title
              <input
                className="mt-1 block min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                defaultValue={title}
                maxLength={240}
                name="title"
                required
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Private description
              <textarea
                className="mt-1 block min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                defaultValue={description ?? ""}
                maxLength={2000}
                name="description"
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Due date
              <input
                className="mt-1 block min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                defaultValue={dueAt ?? ""}
                name="dueAt"
                type="date"
              />
            </label>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:justify-self-start"
              disabled={editPending || deletePending}
              type="submit"
            >
              {editPending ? "Saving changes" : "Save changes"}
            </button>
          </form>
          <form
            action={deleteAction}
            className="mt-4 border-t border-border pt-4"
            onSubmit={(event) => {
              if (!window.confirm("Delete this private task?")) {
                event.preventDefault();
              }
            }}
          >
            <input name="taskId" type="hidden" value={taskId} />
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={deletePending || editPending}
              type="submit"
            >
              {deletePending ? "Deleting" : "Delete private task"}
            </button>
          </form>
        </details>
      ) : null}

      {statusState.error || editState.error || deleteState.error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {statusState.error ?? editState.error ?? deleteState.error}
        </p>
      ) : null}
      {statusState.success || editState.success || deleteState.success ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        >
          {statusState.success ?? editState.success ?? deleteState.success}
        </p>
      ) : null}
    </div>
  );
}

function StatusButton({
  action,
  disabled,
  label,
  primary = false,
  status,
  taskId,
}: {
  action: (payload: FormData) => void;
  disabled: boolean;
  label: string;
  primary?: boolean;
  status: ApplicationTaskStatus;
  taskId: string;
}) {
  return (
    <form action={action}>
      <input name="taskId" type="hidden" value={taskId} />
      <input name="status" type="hidden" value={status} />
      <button
        className={
          primary
            ? "inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            : "inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        }
        disabled={disabled}
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
