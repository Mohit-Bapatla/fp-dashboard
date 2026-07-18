import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  OpportunityDiscoveryPreview,
  OpportunityWalkthrough,
} from "@/components/marketing/opportunity-product-demo";

describe("homepage opportunity product demos", () => {
  it("renders the explorer as an explicitly illustrative accessible interaction", () => {
    const markup = renderToStaticMarkup(
      createElement(OpportunityDiscoveryPreview),
    );

    expect(markup).toContain(
      'aria-label="Interactive opportunity explorer demo"',
    );
    expect(markup).toContain('aria-label="Opportunity categories"');
    expect(markup).toContain('aria-label="Opportunity preview filters"');
    expect(markup).toContain('role="group"');
    expect(markup).toContain('for="opportunity-demo-search"');
    expect(markup).toContain("Search illustrative opportunities");
    expect(markup).toContain('type="search"');
    expect(markup).toContain('data-opportunity-category="research"');
    expect(markup).toContain('data-opportunity-result-count="1"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain("Remote option");
    expect(markup).toContain("High school");
    expect(markup).toContain("Verified only");
    expect(markup).toContain("View details");
    expect(markup).toContain("Save");
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain("illustrative scenarios only");
    expect(markup).toContain("do not send data or change your account");
    expect(markup).not.toContain("<form");
  });

  it("renders one compact walkthrough animation control and narrative stages", () => {
    const markup = renderToStaticMarkup(createElement(OpportunityWalkthrough));

    expect(markup).toContain('aria-label="Guided opportunity walkthrough"');
    expect(markup).toContain('data-walkthrough-step="filters"');
    expect(markup).toContain('data-walkthrough-status="auto-paused"');
    expect(markup).toContain('aria-label="Pause animation"');
    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup).toContain('aria-label="Walkthrough stages"');
    expect(markup).toContain('aria-current="step"');
    expect(markup).toContain("Select a type");
    expect(markup).toContain("Open a verified opportunity");
    expect(markup).toContain("Review eligibility");
    expect(markup).toContain("Save or apply");
    expect(markup).toContain("Track the next step");
    expect(markup).toContain("Illustrative — not live data");
    expect(markup).not.toContain('aria-pressed="');
    expect(markup).not.toContain("Play product walkthrough");
    expect(markup).not.toContain("Pause product walkthrough");
  });
});
