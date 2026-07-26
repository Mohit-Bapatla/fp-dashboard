import { Mail } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SupportCard } from "@/app/dashboard/support/page";
import DashboardError from "@/app/dashboard/error";
import ApplicationWorkspaceError from "@/app/dashboard/student/applications/[applicationId]/error";
import { DASHBOARD_SUPPORT_ACTION } from "@/lib/support-contact";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("dashboard support navigation", () => {
  it("uses the public contact page as the canonical dashboard support action", () => {
    expect(DASHBOARD_SUPPORT_ACTION).toEqual({
      href: "/contact",
      label: "Contact support",
    });
  });

  it("renders the dashboard error-boundary support control as a real link", () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardError, {
        error: new Error("test"),
        reset: vi.fn(),
      }),
    );

    expect(markup).toContain('href="/contact"');
    expect(markup).toContain(">Contact support</a>");
  });

  it("renders the authenticated support control as a real contact link", () => {
    const markup = renderToStaticMarkup(
      createElement(SupportCard, {
        actionLabel: DASHBOARD_SUPPORT_ACTION.label,
        description: "Open support.",
        href: DASHBOARD_SUPPORT_ACTION.href,
        icon: Mail,
        title: "Contact support",
      }),
    );

    expect(markup).toContain('href="/contact"');
    expect(markup).toContain(">Contact support</a>");
    expect(markup).not.toContain("mailto:");
  });

  it("keeps the application workspace error recoverable", () => {
    const markup = renderToStaticMarkup(
      createElement(ApplicationWorkspaceError, {
        error: Object.assign(new Error("test"), { digest: "SAFE1234" }),
        reset: vi.fn(),
      }),
    );

    expect(markup).toContain(">Try again</button>");
    expect(markup).toContain('href="/contact"');
    expect(markup).toMatch(/Support reference: FP-APP-\d{8}-[A-Z0-9]{6}/);
    expect(markup).not.toContain("SAFE1234");
    expect(markup).not.toContain("Error: test");
  });
});
