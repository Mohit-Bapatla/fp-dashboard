import { describe, expect, it } from "vitest";

import {
  getAliasedValue,
  normalizeDuplicateKey,
  parseCsv,
  splitImportList,
} from "@/lib/imports/csv";

describe("CSV helpers", () => {
  it("parses quoted CSV fields and normalizes headers", () => {
    const result = parseCsv(
      'Email,Full Name,Notes\n"a@example.com","Ada","one, two"',
    );

    expect(result.errors).toEqual([]);
    expect(result.headers).toEqual(["email", "fullname", "notes"]);
    expect(result.rows[0]?.values.notes).toBe("one, two");
  });

  it("reports unclosed quoted fields", () => {
    const result = parseCsv('Email\n"unfinished');

    expect(result.errors).toContain("CSV has an unclosed quoted field.");
  });

  it("resolves aliases and duplicate keys", () => {
    expect(
      getAliasedValue({ contactemail: "team@example.com" }, [
        "email",
        "contact email",
      ]),
    ).toBe("team@example.com");
    expect(splitImportList("a; b, c|d")).toEqual(["a", "b", "c", "d"]);
    expect(normalizeDuplicateKey(" Future   Clinic ")).toBe("future clinic");
  });
});
