import "server-only";

import type { StudentWeeklyPlan } from "@/lib/student/weekly-plan";

export type ReminderEmailItem = {
  actionUrl: string | null;
  body: string | null;
  title: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function absoluteDashboardUrl(actionUrl: string | null, baseUrl: string) {
  if (!actionUrl?.startsWith("/dashboard/") || actionUrl.startsWith("//")) {
    return null;
  }

  try {
    const base = new URL(baseUrl);
    if (base.protocol !== "https:" && base.protocol !== "http:") return null;
    return new URL(actionUrl, base).toString();
  } catch {
    return null;
  }
}

function greeting(firstName: string | null | undefined) {
  return firstName?.trim() ? `Hi ${firstName.trim()},` : "Hello,";
}

export function buildStudentReminderSummaryEmail({
  baseUrl,
  firstName,
  items,
}: {
  baseUrl: string;
  firstName?: string | null;
  items: ReminderEmailItem[];
}) {
  if (items.length === 0) return null;

  const limitedItems = items.slice(0, 10);
  const subject =
    limitedItems.length === 1
      ? "One FP action needs your attention"
      : `${limitedItems.length} FP actions need your attention`;
  const textItems = limitedItems.map((item) => {
    const url = absoluteDashboardUrl(item.actionUrl, baseUrl);
    return [
      `- ${item.title}${item.body ? `: ${item.body}` : ""}`,
      url ? `  ${url}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });
  const text = [
    greeting(firstName),
    "Here is your current Future Physicians reminder summary:",
    textItems.join("\n"),
    "Open FP Dashboard to review the source details before taking action.",
  ].join("\n\n");
  const htmlItems = limitedItems
    .map((item) => {
      const url = absoluteDashboardUrl(item.actionUrl, baseUrl);
      const link = url
        ? `<p style="margin:8px 0 0"><a href="${escapeHtml(url)}">Open this action in FP Dashboard</a></p>`
        : "";
      return `<li style="margin:0 0 16px"><strong>${escapeHtml(item.title)}</strong>${item.body ? `<p style="margin:6px 0 0">${escapeHtml(item.body)}</p>` : ""}${link}</li>`;
    })
    .join("");
  const html = [
    `<p>${escapeHtml(greeting(firstName))}</p>`,
    "<p>Here is your current Future Physicians reminder summary:</p>",
    `<ul>${htmlItems}</ul>`,
    "<p>Open FP Dashboard to review the source details before taking action.</p>",
  ].join("");

  return { html, subject, text };
}

export function buildStudentWeeklyDigestEmail({
  baseUrl,
  firstName,
  plan,
}: {
  baseUrl: string;
  firstName?: string | null;
  plan: StudentWeeklyPlan;
}) {
  if (plan.items.length === 0) return null;

  const items = plan.items.slice(0, 12);
  const subject = "Your FP plan for this week";
  const textItems = items.map((item) => {
    const url = absoluteDashboardUrl(item.actionUrl, baseUrl);
    return [`- ${item.title}: ${item.detail}`, url ? `  ${url}` : null]
      .filter(Boolean)
      .join("\n");
  });
  const text = [
    greeting(firstName),
    "Your structured FP plan for this week:",
    textItems.join("\n"),
    `Dates are shown using ${plan.timezone}. This summary does not include essay, resume, or private-note content.`,
  ].join("\n\n");
  const htmlItems = items
    .map((item) => {
      const url = absoluteDashboardUrl(item.actionUrl, baseUrl);
      const link = url
        ? `<p style="margin:8px 0 0"><a href="${escapeHtml(url)}">Open this action in FP Dashboard</a></p>`
        : "";
      return `<li style="margin:0 0 16px"><strong>${escapeHtml(item.title)}</strong><p style="margin:6px 0 0">${escapeHtml(item.detail)}</p>${link}</li>`;
    })
    .join("");
  const html = [
    `<p>${escapeHtml(greeting(firstName))}</p>`,
    "<p>Your structured FP plan for this week:</p>",
    `<ul>${htmlItems}</ul>`,
    `<p>Dates are shown using ${escapeHtml(plan.timezone)}. This summary does not include essay, resume, or private-note content.</p>`,
  ].join("");

  return { html, subject, text };
}
