import { MessageSquareText } from "lucide-react";

import { submitFeedback } from "@/app/dashboard/feedback/actions";
import type {
  FeedbackEntityType,
  FeedbackType,
} from "@/generated/prisma/enums";

export type ExistingFeedback = {
  notes: string | null;
  rating: number;
} | null;

type FeedbackFormProps = {
  description: string;
  entityId: string;
  entityType: FeedbackEntityType;
  existingFeedback?: ExistingFeedback;
  feedbackType: FeedbackType;
  redirectTo: string;
  title: string;
};

export function FeedbackForm({
  description,
  entityId,
  entityType,
  existingFeedback,
  feedbackType,
  redirectTo,
  title,
}: FeedbackFormProps) {
  return (
    <form
      action={submitFeedback}
      className="rounded-lg border border-border bg-background p-4"
    >
      <input name="entityId" type="hidden" value={entityId} />
      <input name="entityType" type="hidden" value={entityType} />
      <input name="feedbackType" type="hidden" value={feedbackType} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <div className="flex items-start gap-3">
        <MessageSquareText
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
        />
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[160px_minmax(0,1fr)_auto] md:items-end">
        <label className="text-sm font-medium text-foreground">
          Rating
          <select
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
            defaultValue={existingFeedback?.rating?.toString() ?? ""}
            name="rating"
            required
          >
            <option value="">Choose</option>
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Strong</option>
            <option value="3">3 - Okay</option>
            <option value="2">2 - Needs work</option>
            <option value="1">1 - Poor</option>
          </select>
        </label>
        <label className="text-sm font-medium text-foreground">
          Notes
          <textarea
            className="mt-2 min-h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
            defaultValue={existingFeedback?.notes ?? ""}
            name="notes"
            placeholder="Optional context"
          />
        </label>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          type="submit"
        >
          {existingFeedback ? "Update feedback" : "Submit feedback"}
        </button>
      </div>
    </form>
  );
}
