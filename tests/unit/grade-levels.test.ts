import { describe, expect, it } from "vitest";
import {
  parseGradeLevelCode,
  parseGradeLevelCodes,
} from "@/lib/matching/grade-levels";

describe("grade-level canonicalization", () => {
  it.each([
    "High school junior",
    "11th grade",
    "Grade 11",
    "Junior",
    "11",
    "HS_11",
  ])("maps %s to HS_11", (value) => {
    expect(parseGradeLevelCode(value)).toBe("HS_11");
  });
  it.each([
    ["High school freshman", "HS_9"],
    ["10th grade", "HS_10"],
    ["High school senior", "HS_12"],
    ["College freshman", "COLLEGE_1"],
    ["College sophomore", "COLLEGE_2"],
    ["College junior", "COLLEGE_3"],
    ["College senior", "COLLEGE_4"],
    ["Graduate student", "GRADUATE"],
    ["Medical student", "MEDICAL"],
    ["Gap year / post-baccalaureate", "GAP_YEAR_POST_BACC"],
  ])("maps %s to %s", (value, expected) =>
    expect(parseGradeLevelCode(value)).toBe(expected),
  );
  it("keeps unrecognized grades unknown", () => {
    expect(parseGradeLevelCode("advanced learner cohort alpha")).toBeNull();
    expect(parseGradeLevelCodes(["Junior", "cohort alpha"])).toEqual({
      codes: ["HS_11"],
      unknownValues: ["cohort alpha"],
    });
  });
});
