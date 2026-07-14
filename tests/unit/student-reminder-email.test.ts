import { describe, expect, it } from "vitest";

import {
  buildStudentReminderSummaryEmail,
  buildStudentWeeklyDigestEmail,
} from "@/lib/email/student-reminders";

describe("student reminder emails", () => {
  it("does not create empty reminder or digest emails", () => {
    expect(
      buildStudentReminderSummaryEmail({
        baseUrl: "https://dashboard.example.org",
        items: [],
      }),
    ).toBeNull();
    expect(
      buildStudentWeeklyDigestEmail({
        baseUrl: "https://dashboard.example.org",
        plan: {
          generatedAt: new Date("2026-07-13T00:00:00.000Z"),
          items: [],
          timezone: "America/Chicago",
        },
      }),
    ).toBeNull();
  });

  it("uses absolute dashboard links without private content", () => {
    const email = buildStudentReminderSummaryEmail({
      baseUrl: "https://dashboard.example.org",
      firstName: "Student",
      items: [
        {
          actionUrl: "/dashboard/student/applications/application-1",
          body: "A required task is overdue.",
          title: "Application action",
        },
      ],
    });
    expect(email?.text).toContain(
      "https://dashboard.example.org/dashboard/student/applications/application-1",
    );
    expect(email?.text).not.toContain("essay text");
  });
});
