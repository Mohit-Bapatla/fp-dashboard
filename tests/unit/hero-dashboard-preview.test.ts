import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardPreview } from "@/components/marketing/dashboard-preview";

describe("interactive hero dashboard preview", () => {
  it("renders six accessible student preview tabs with Overview selected", () => {
    const markup = renderToStaticMarkup(createElement(DashboardPreview));

    expect(markup.match(/aria-pressed=/g)).toHaveLength(6);
    expect(markup).toContain('aria-label="Dashboard preview tabs"');
    expect(markup).toContain('role="group"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('data-autoplay-status="waiting"');
    expect(markup).toContain("Overview");
    expect(markup).toContain("Discover");
    expect(markup).toContain("Saved");
    expect(markup).toContain("Applications");
    expect(markup).toContain("Events");
    expect(markup).toContain("Profile");
    expect(markup).toContain("Interactive preview");
    expect(markup).toContain('aria-label="Pause dashboard preview"');
    expect(markup).not.toContain("<nav");
  });

  it("preserves the illustrative partner preview", () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardPreview, { variant: "partner" }),
    );

    expect(markup).toContain("Partner overview");
    expect(markup).toContain("Applicant pipeline");
    expect(markup).not.toContain('aria-label="Dashboard preview tabs"');
  });
});
