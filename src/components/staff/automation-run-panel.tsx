"use client";

import { useActionState } from "react";

import {
  runOperationalWorkflowsAction,
  type AutomationRunActionState,
} from "@/app/dashboard/staff/automations/actions";

const initialState: AutomationRunActionState = {
  error: null,
  result: null,
};

export function AutomationRunPanel() {
  const [state, formAction, isPending] = useActionState(
    runOperationalWorkflowsAction,
    initialState,
  );
  const result = state.result;

  return (
    <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Run operational workflows
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manually checks expired opportunities, stale placement requests, due
            follow-ups, delayed application reviews, and overdue outreach tasks.
            This does not send email or create workflow automation rules.
          </p>
        </div>
        <form action={formAction}>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Running..." : "Run now"}
          </button>
        </form>
      </div>

      {state.error ? (
        <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <AutomationMetric label="Scanned" value={result.totals.scanned} />
            <AutomationMetric label="Changed" value={result.totals.changed} />
            <AutomationMetric
              label="Notifications"
              value={result.totals.notificationsCreated}
            />
            <AutomationMetric label="Deduped" value={result.totals.deduped} />
            <AutomationMetric
              label="Duration"
              value={`${result.durationMs}ms`}
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-md border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background">
                <tr className="text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Rule</th>
                  <th className="px-3 py-2 font-medium">Scanned</th>
                  <th className="px-3 py-2 font-medium">Changed</th>
                  <th className="px-3 py-2 font-medium">Notified</th>
                  <th className="px-3 py-2 font-medium">Skipped</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {result.results.map((ruleResult) => (
                  <tr key={ruleResult.rule}>
                    <td className="px-3 py-2 font-medium text-foreground">
                      {formatRuleName(ruleResult.rule)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {ruleResult.scanned}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {ruleResult.changed}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {ruleResult.notificationsCreated}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {ruleResult.deduped}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.errors.length > 0 ? (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {result.errors.join(" ")}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function AutomationMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function formatRuleName(rule: string) {
  return rule
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}
