"use client";

import { Download } from "lucide-react";
import { useActionState, useEffect } from "react";

import {
  createPartnerApplicantResumeSignedUrl,
  type PartnerApplicantResumeActionState,
} from "@/app/dashboard/partner/applicants/actions";

type PartnerResumeDownloadButtonProps = {
  applicationId: string;
  disabled?: boolean;
};

const initialState: PartnerApplicantResumeActionState = {
  error: null,
  signedUrl: null,
};

export function PartnerResumeDownloadButton({
  applicationId,
  disabled,
}: PartnerResumeDownloadButtonProps) {
  const [state, action, pending] = useActionState(
    createPartnerApplicantResumeSignedUrl,
    initialState,
  );

  useEffect(() => {
    if (state.signedUrl) {
      window.location.href = state.signedUrl;
    }
  }, [state.signedUrl]);

  return (
    <div>
      <form action={action}>
        <input name="applicationId" type="hidden" value={applicationId} />
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || pending}
          type="submit"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          {pending ? "Preparing" : "View/download"}
        </button>
      </form>
      {state.error ? (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      ) : null}
    </div>
  );
}
