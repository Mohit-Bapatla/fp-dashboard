"use client";

import { useActionState } from "react";

import {
  importCsvPreview,
  previewCsvImport,
  type CsvImportActionState,
} from "@/app/dashboard/admin/data-imports/actions";
import type { ImportPreviewRow } from "@/lib/imports/data-imports";

const initialState: CsvImportActionState = {
  error: null,
  preview: null,
  summary: null,
};

const importTypeOptions = [
  {
    label: "Students",
    value: "students",
  },
  {
    label: "Partners",
    value: "partners",
  },
  {
    label: "Opportunities",
    value: "opportunities",
  },
];

const columnHints = {
  opportunities:
    "title, organizationName, type, specialty, description, location, remoteType, paidStatus, deadline, capacity, eligibilityRequirements, requiredDocuments, applicationInstructions",
  partners:
    "name, website, type, description, location, city, state, country, contactEmail, specialtyAreas, status",
  students:
    "email, firstName, lastName, school, gradeYear, major, graduationYear, city, state, country, interestedSpecialties, opportunityTypes",
};

export function DataImportPanel() {
  const [previewState, previewAction, previewPending] = useActionState(
    previewCsvImport,
    initialState,
  );
  const [importState, importAction, importPending] = useActionState(
    importCsvPreview,
    initialState,
  );
  const preview = importState.preview ?? previewState.preview;
  const summary = importState.summary;
  const error = importState.error ?? previewState.error;
  const importableCount =
    preview?.rows.filter((row) => row.importable && row.errors.length === 0)
      .length ?? 0;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          Preview CSV import
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Paste CSV content or upload a CSV file. Uploaded files are parsed from
          the request and are not stored.
        </p>

        <form action={previewAction} className="mt-5 grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[220px_220px_minmax(0,1fr)]">
            <label className="text-sm font-medium text-foreground">
              Import type
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                name="importType"
              >
                {importTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Opportunity status
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                name="defaultOpportunityStatus"
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending approval</option>
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Upload CSV
              <input
                accept=".csv,text/csv"
                className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                name="csvFile"
                type="file"
              />
            </label>
          </div>

          <label className="text-sm font-medium text-foreground">
            Paste CSV
            <textarea
              className="mt-2 min-h-56 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
              name="csvText"
              placeholder="Paste CSV content with a header row"
            />
          </label>

          <div className="grid gap-3 text-sm leading-6 text-muted-foreground lg:grid-cols-3">
            <ColumnHint label="Students" value={columnHints.students} />
            <ColumnHint label="Partners" value={columnHints.partners} />
            <ColumnHint
              label="Opportunities"
              value={columnHints.opportunities}
            />
          </div>

          <button
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={previewPending}
            type="submit"
          >
            {previewPending ? "Parsing..." : "Preview import"}
          </button>
        </form>
      </section>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {preview ? (
        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2
                className="text-lg font-semibold text-foreground"
                id="csv-import-preview-heading"
              >
                Preview rows
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {importableCount} of {preview.rows.length} rows are importable.
                Invalid and duplicate rows will be skipped.
              </p>
            </div>
            <form action={importAction}>
              <input
                name="previewPayload"
                type="hidden"
                value={JSON.stringify(preview)}
              />
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={importPending || importableCount === 0}
                type="submit"
              >
                {importPending ? "Importing..." : "Import valid rows"}
              </button>
            </form>
          </div>

          <div
            aria-labelledby="csv-import-preview-heading"
            className="mt-5 overflow-x-auto rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            role="region"
            tabIndex={0}
          >
            <table className="w-full min-w-[48rem] divide-y divide-border text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Values</th>
                  <th className="px-3 py-2 font-medium">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.rows.map((row) => (
                  <PreviewRow key={row.rowNumber} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {summary ? (
        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Import summary
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <SummaryMetric label="Created" value={summary.created} />
            <SummaryMetric label="Updated" value={summary.updated} />
            <SummaryMetric
              label="Invalid skipped"
              value={summary.skippedInvalid}
            />
            <SummaryMetric
              label="Duplicates skipped"
              value={summary.skippedDuplicates}
            />
          </div>
          {summary.errors.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-destructive">
              {summary.errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ColumnHint({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function PreviewRow({ row }: { row: ImportPreviewRow }) {
  const issueText = [...row.errors, ...row.warnings].join(" ");

  return (
    <tr>
      <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
      <td className="px-3 py-2">
        <span
          className={[
            "rounded-md border px-2 py-1 text-xs font-medium",
            row.importable && row.errors.length === 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {row.importable && row.errors.length === 0 ? "Importable" : "Skipped"}
        </span>
      </td>
      <td className="max-w-xl px-3 py-2 text-muted-foreground">
        <code className="break-words text-xs">
          {JSON.stringify(row.normalized)}
        </code>
      </td>
      <td className="px-3 py-2 text-muted-foreground">
        {issueText || "No issues"}
      </td>
    </tr>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
