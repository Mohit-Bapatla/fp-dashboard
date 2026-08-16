import { describe, expect, it } from "vitest";

import robots from "@/app/robots";

describe("recruiter demo indexing controls", () => {
  it("disallows the demo route family in robots.txt", () => {
    const rules = robots().rules;
    expect(rules).toMatchObject({
      disallow: expect.arrayContaining(["/demo", "/demo/"]),
    });
  });
});
