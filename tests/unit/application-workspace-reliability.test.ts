import { describe, expect, it } from "vitest";

import {
  getOfficialApplicationAction,
  parseApplicationTargetDate,
} from "@/lib/student/application-workspace";

describe("application workspace reliability", () => {
  it("rejects impossible and out-of-range dates without throwing", () => {
    expect(parseApplicationTargetDate("2026-02-30")).toEqual({
      valid: false,
      date: null,
    });
    expect(parseApplicationTargetDate("9999-99-99")).toEqual({
      valid: false,
      date: null,
    });
    expect(parseApplicationTargetDate("not-a-date")).toEqual({
      valid: false,
      date: null,
    });
  });

  it("accepts an exact UTC calendar date", () => {
    const result = parseApplicationTargetDate("2026-09-01");

    expect(result.valid).toBe(true);
    expect(result.date?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("shows an official action only for a safe external portal URL", () => {
    expect(
      getOfficialApplicationAction({
        applicationMethod: "EXTERNAL_PORTAL",
        officialApplicationUrl: "https://hospital.example/apply",
      }),
    ).toEqual({
      href: "https://hospital.example/apply",
      label: "Open official application",
    });
    expect(
      getOfficialApplicationAction({
        applicationMethod: "FP_INTERNAL",
        officialApplicationUrl: "https://hospital.example/apply",
      }),
    ).toBeNull();
    expect(
      getOfficialApplicationAction({
        applicationMethod: "EXTERNAL_PORTAL",
        officialApplicationUrl: "javascript:alert(1)",
      }),
    ).toBeNull();
  });
});
