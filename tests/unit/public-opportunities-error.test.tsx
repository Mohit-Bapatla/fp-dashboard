import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PublicOpportunitiesError from "@/app/(marketing)/opportunities/error";

describe("public opportunity directory error state", () => {
  it("shows a useful visitor message without exposing a database error", () => {
    const markup = renderToStaticMarkup(
      <PublicOpportunitiesError
        error={new Error("Prisma P2021: public.Opportunity does not exist")}
        reset={() => undefined}
      />,
    );

    expect(markup).toContain("Opportunities are temporarily unavailable.");
    expect(markup).toContain("Please check back shortly.");
    expect(markup).toContain('href="/contact#general-support"');
    expect(markup).toContain('href="/"');
    expect(markup).not.toMatch(/Prisma|P2021|public\.Opportunity/);
  });
});
