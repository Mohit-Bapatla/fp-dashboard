import {
  updateCertificateStatus,
  upsertPartnerServiceHours,
} from "@/app/dashboard/service-hours/actions";
import type { CertificateStatus } from "@/generated/prisma/enums";
import {
  formatServiceHourStatus,
  type ServiceHourRecordView,
} from "@/lib/service-hours/service-hours";

type ServiceHourPanelProps = {
  applicationId: string;
  mode: "admin" | "partner" | "student";
  records: ServiceHourRecordView[];
  redirectTo: string;
};

const certificateStatuses: CertificateStatus[] = [
  "NOT_REQUESTED",
  "PENDING_APPROVAL",
  "APPROVED",
  "ISSUED",
  "REVOKED",
];

function formatDate(value: Date | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

export function ServiceHourPanel({
  applicationId,
  mode,
  records,
  redirectTo,
}: ServiceHourPanelProps) {
  const latestRecord = records.at(0) ?? null;

  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Service hours and certificate
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Certificate v1 is tracked as status metadata only.
          </p>
        </div>
        <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {records.reduce((sum, record) => sum + record.hours, 0)} hours
        </span>
      </div>

      {records.length > 0 ? (
        <div className="mt-4 space-y-3">
          {records.map((record) => (
            <article
              className="rounded-lg border border-border bg-muted/20 p-3"
              key={record.id}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <Detail
                  label="Hours"
                  value={record.hours.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                />
                <Detail
                  label="Verification"
                  value={formatServiceHourStatus(record.verificationStatus)}
                />
                <Detail
                  label="Certificate"
                  value={formatServiceHourStatus(record.certificateStatus)}
                />
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {record.description || "No description provided."}
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Verified {formatDate(record.verifiedAt)}
              </p>
              {record.verificationNotes ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Verification notes: {record.verificationNotes}
                </p>
              ) : null}
              {record.certificateNotes ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Certificate notes: {record.certificateNotes}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          No service hours recorded yet.
        </p>
      )}

      {mode === "partner" ? (
        <form
          action={upsertPartnerServiceHours}
          className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/20 p-4"
        >
          <input name="applicationId" type="hidden" value={applicationId} />
          <input name="recordId" type="hidden" value={latestRecord?.id ?? ""} />
          <input name="redirectTo" type="hidden" value={redirectTo} />
          <div className="grid gap-3 md:grid-cols-[160px_1fr]">
            <label className="text-sm font-medium text-foreground">
              Hours
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={latestRecord?.hours ?? ""}
                min="0.25"
                name="hours"
                step="0.25"
                type="number"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Description
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={latestRecord?.description ?? ""}
                name="description"
              />
            </label>
          </div>
          <label className="text-sm font-medium text-foreground">
            Verification notes
            <textarea
              className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
              defaultValue={latestRecord?.verificationNotes ?? ""}
              name="verificationNotes"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input name="verify" type="checkbox" value="1" />
            Verify these hours and request certificate review
          </label>
          <button
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="submit"
          >
            Save service hours
          </button>
        </form>
      ) : null}

      {mode === "admin" && latestRecord ? (
        <form
          action={updateCertificateStatus}
          className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/20 p-4 md:grid-cols-[220px_1fr_auto] md:items-end"
        >
          <input name="recordId" type="hidden" value={latestRecord.id} />
          <input name="redirectTo" type="hidden" value={redirectTo} />
          <label className="text-sm font-medium text-foreground">
            Certificate status
            <select
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
              defaultValue={latestRecord.certificateStatus}
              name="certificateStatus"
            >
              {certificateStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatServiceHourStatus(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-foreground">
            Certificate notes
            <input
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
              defaultValue={latestRecord.certificateNotes ?? ""}
              name="certificateNotes"
            />
          </label>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="submit"
          >
            Update
          </button>
        </form>
      ) : null}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
