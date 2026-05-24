import { MessageSquareText } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import type { FeedbackType } from "@/generated/prisma/enums";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";

type AdminFeedbackPageProps = {
  searchParams: Promise<{
    feedbackType?: string;
  }>;
};

const feedbackTypes: FeedbackType[] = [
  "STUDENT_APPLICATION_EXPERIENCE",
  "STUDENT_PLACEMENT_REQUEST",
  "PARTNER_APPLICANT_QUALITY",
  "PARTNER_REVIEW_USEFULNESS",
  "STAFF_MATCH_QUALITY",
  "STAFF_PLACEMENT_DIFFICULTY",
];

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFeedbackType(value: string | undefined) {
  return value && feedbackTypes.includes(value as FeedbackType)
    ? (value as FeedbackType)
    : "";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

export default async function AdminFeedbackPage({
  searchParams,
}: AdminFeedbackPageProps) {
  await assertAdminAccess();

  const params = await searchParams;
  const feedbackType = getFeedbackType(params.feedbackType);
  const where = feedbackType ? { feedbackType } : {};
  const [feedback, totalCount, averageRows] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
      select: {
        author: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        createdAt: true,
        entityId: true,
        entityType: true,
        feedbackType: true,
        id: true,
        notes: true,
        rating: true,
        updatedAt: true,
      },
    }),
    prisma.feedback.count({ where }),
    prisma.feedback.aggregate({
      where,
      _avg: {
        rating: true,
      },
    }),
  ]);
  const averageRating = averageRows._avg.rating
    ? averageRows._avg.rating.toFixed(1)
    : "0.0";

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/feedback")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Feedback loops
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Feedback Review
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Review structured student, partner, and staff feedback tied to
              applications, placement requests, and review workflows.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <MessageSquareText aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Feedback records matching the current filter."
            label="Submissions"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Average 1-5 rating."
            label="Average rating"
            value={averageRating}
          />
          <StatCard
            helper="Visible rows are limited to the latest 100."
            label="Displayed"
            value={feedback.length.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <form className="flex flex-wrap items-end gap-4">
            <label className="min-w-72 text-sm font-medium text-foreground">
              Feedback type
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={feedbackType}
                name="feedbackType"
              >
                <option value="">Any type</option>
                {feedbackTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatEnumLabel(type)}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              type="submit"
            >
              Apply
            </button>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              href="/dashboard/admin/feedback"
            >
              Clear
            </Link>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          {feedback.length > 0 ? (
            <div className="divide-y divide-border">
              {feedback.map((item) => {
                const authorName =
                  [item.author.firstName, item.author.lastName]
                    .filter(Boolean)
                    .join(" ") || item.author.email;

                return (
                  <article
                    className="grid gap-3 py-4 lg:grid-cols-[220px_minmax(0,1fr)_120px]"
                    key={item.id}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {authorName}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        {formatEnumLabel(item.author.role)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatEnumLabel(item.feedbackType)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.entityType} | {item.entityId}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                        {item.notes || "No notes provided."}
                      </p>
                    </div>
                    <div className="lg:text-right">
                      <p className="text-lg font-semibold text-foreground">
                        {item.rating}/5
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        {formatDate(item.updatedAt)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              Feedback will appear after students, partners, or staff submit
              ratings.
            </p>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
