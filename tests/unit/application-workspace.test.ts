import { describe, expect, it } from "vitest";
import { canSubmitExistingApplication } from "@/lib/student/application-workspace";
describe("application workspace submission", () => {
  it("allows a preparing application to transition to submitted", () => expect(canSubmitExistingApplication("PREPARING")).toBe(true));
  it("blocks duplicate submitted and outcome applications", () => {
    expect(canSubmitExistingApplication("SUBMITTED")).toBe(false);
    expect(canSubmitExistingApplication("ACCEPTED")).toBe(false);
  });
});
