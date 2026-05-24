import { addRecordComment } from "@/app/dashboard/comments/actions";
import type {
  RecordCommentEntityType,
  RecordCommentVisibility,
} from "@/generated/prisma/enums";
import type { RecordCommentThread as RecordCommentThreadData } from "@/lib/comments/record-comments";

type RecordCommentThreadProps = {
  entityId: string;
  entityType: RecordCommentEntityType;
  redirectTo: string;
  thread: RecordCommentThreadData;
  title?: string;
};

function authorName(comment: RecordCommentThreadData["comments"][number]) {
  if (!comment.author) {
    return "Former user";
  }

  const name = [comment.author.firstName, comment.author.lastName]
    .filter(Boolean)
    .join(" ");

  return name || comment.author.email;
}

function formatVisibility(visibility: RecordCommentVisibility) {
  switch (visibility) {
    case "INTERNAL":
      return "Internal";
    case "PARTNER_VISIBLE":
      return "Partner visible";
    case "STUDENT_VISIBLE":
      return "Student visible";
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function RecordCommentThread({
  entityId,
  entityType,
  redirectTo,
  thread,
  title = "Comments",
}: RecordCommentThreadProps) {
  if (thread.comments.length === 0 && thread.allowedVisibilities.length === 0) {
    return null;
  }

  return (
    <section className="mt-5 rounded-lg border border-border bg-background p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-3 space-y-3">
        {thread.comments.length > 0 ? (
          thread.comments.map((comment) => (
            <article
              className="rounded-md border border-border bg-muted/20 p-3"
              key={comment.id}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {authorName(comment)}
                </span>
                <span>{formatDate(comment.createdAt)}</span>
                <span className="rounded-md border border-border bg-background px-2 py-0.5">
                  {formatVisibility(comment.visibility)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {comment.body}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            No comments yet.
          </p>
        )}
      </div>

      {thread.allowedVisibilities.length > 0 ? (
        <form action={addRecordComment} className="mt-4 grid gap-3">
          <input name="entityId" type="hidden" value={entityId} />
          <input name="entityType" type="hidden" value={entityType} />
          <input name="redirectTo" type="hidden" value={redirectTo} />
          <label className="text-sm font-medium text-foreground">
            Visibility
            <select
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
              name="visibility"
            >
              {thread.allowedVisibilities.map((visibility) => (
                <option key={visibility} value={visibility}>
                  {formatVisibility(visibility)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-foreground">
            Add comment
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
              maxLength={2000}
              name="body"
              required
            />
          </label>
          <button
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="submit"
          >
            Add comment
          </button>
        </form>
      ) : null}
    </section>
  );
}
