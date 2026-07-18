import { describe, expect, it } from "vitest";

import {
  differenceInStudentCalendarDays,
  isStudentLocalMonday,
  isWithinQuietHours,
  studentCalendarDateKey,
} from "@/lib/notifications/reminder-schedule";

describe("student reminder calendar scheduling", () => {
  it("uses the student's local date across the spring DST boundary", () => {
    const target = new Date("2026-03-09T00:00:00.000Z");
    expect(
      differenceInStudentCalendarDays(
        target,
        new Date("2026-03-08T05:30:00.000Z"),
        "America/Chicago",
      ),
    ).toBe(2);
    expect(
      differenceInStudentCalendarDays(
        target,
        new Date("2026-03-08T14:00:00.000Z"),
        "America/Chicago",
      ),
    ).toBe(1);
  });

  it("supports quiet hours that cross midnight", () => {
    expect(
      isWithinQuietHours({
        end: "07:00",
        now: new Date("2026-07-13T04:00:00.000Z"),
        start: "22:00",
        timezone: "America/Chicago",
      }),
    ).toBe(true);
    expect(
      isWithinQuietHours({
        end: "07:00",
        now: new Date("2026-07-13T15:00:00.000Z"),
        start: "22:00",
        timezone: "America/Chicago",
      }),
    ).toBe(false);
  });

  it("keys weekly digests by the student's Monday", () => {
    const now = new Date("2026-07-13T16:00:00.000Z");
    expect(isStudentLocalMonday(now, "America/Chicago")).toBe(true);
    expect(studentCalendarDateKey(now, "America/Chicago")).toBe("2026-07-13");
  });
});
