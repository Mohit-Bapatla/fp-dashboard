import {
  createElement,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: ReactNode;
    href: string;
  }) => createElement("a", { href, ...props }, children),
}));
vi.mock("@/app/dashboard/student/saved/actions", () => ({
  saveOpportunity: vi.fn(),
  setFollowReopening: vi.fn(),
  unsaveOpportunity: vi.fn(),
}));
vi.mock("@/app/dashboard/student/applications/workspace-actions", () => ({
  startApplicationWorkspace: vi.fn(),
}));
vi.mock(
  "@/app/dashboard/student/opportunities/[opportunityId]/correction-actions",
  () => ({ reportIncorrectOpportunity: vi.fn() }),
);

import {
  getStudentOpportunityOnboardingHref,
  StudentOpportunityPrimaryActions,
} from "@/components/student/student-opportunity-detail";

describe("student opportunity profile-required actions", () => {
  it("encodes the intended dashboard destination for onboarding", () => {
    expect(
      getStudentOpportunityOnboardingHref(
        "/dashboard/student/opportunities/opp-1/apply?source=public",
      ),
    ).toBe(
      "/dashboard/student/onboarding?returnTo=%2Fdashboard%2Fstudent%2Fopportunities%2Fopp-1%2Fapply%3Fsource%3Dpublic",
    );
  });

  it("replaces no-op mutation forms with return-preserving onboarding links", () => {
    const markup = renderToStaticMarkup(
      createElement(StudentOpportunityPrimaryActions, {
        applyState: { kind: "needsProfile" },
        canSave: true,
        isSaved: false,
        opportunityId: "opp-1",
      }),
    );

    expect(markup).not.toContain("<form");
    expect(markup).toContain("Complete profile to prepare");
    expect(markup).toContain("Complete profile to save");
    expect(markup).toContain(
      "/dashboard/student/onboarding?returnTo=%2Fdashboard%2Fstudent%2Fopportunities%2Fopp-1%2Fapply",
    );
    expect(markup).toContain(
      "/dashboard/student/onboarding?returnTo=%2Fdashboard%2Fstudent%2Fopportunities%2Fopp-1",
    );
  });

  it("does not render save controls for a private student opportunity", () => {
    const markup = renderToStaticMarkup(
      createElement(StudentOpportunityPrimaryActions, {
        applyState: { kind: "canPrepare", submissionAllowed: true },
        canSave: false,
        isSaved: false,
        opportunityId: "opp-private",
      }),
    );

    expect(markup).not.toContain("Save");
    expect(markup).toContain("Start application");
  });
});
