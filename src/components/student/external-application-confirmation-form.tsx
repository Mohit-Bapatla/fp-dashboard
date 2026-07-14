import { confirmExternalApplicationSubmission } from "@/app/dashboard/student/opportunities/[opportunityId]/apply/actions";

export function ExternalApplicationConfirmationForm({
  officialApplicationUrl,
  opportunityId,
}: {
  officialApplicationUrl: string;
  opportunityId: string;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        This application is submitted directly on the host organization&apos;s
        website. Future Physicians does not submit the form or control the host
        portal.
      </div>
      <a
        className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        href={officialApplicationUrl}
        rel="noreferrer"
        target="_blank"
      >
        Open official application
      </a>
      <form action={confirmExternalApplicationSubmission} className="space-y-4">
        <input name="opportunityId" type="hidden" value={opportunityId} />
        <label className="flex items-start gap-3 rounded-lg border border-border p-4 text-sm">
          <input
            className="mt-1"
            name="confirmedExternalSubmission"
            required
            type="checkbox"
          />
          <span>
            I confirm that I personally submitted this application through the
            host organization&apos;s portal.
          </span>
        </label>
        <button
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          type="submit"
        >
          Confirm external submission
        </button>
      </form>
    </div>
  );
}
