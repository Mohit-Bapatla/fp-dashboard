import { describe, expect, it } from "vitest";

import {
  isValidIanaTimezone,
  validateStudentNotificationPreferenceForm,
} from "@/lib/student/notification-preference-validation";

function validForm() {
  const form = new FormData();
  form.set("inAppEnabled", "on");
  form.set("deadlineAlertsEnabled", "on");
  form.set("openingAlertsEnabled", "on");
  form.set("taskReminderEnabled", "on");
  form.set("recommendationReminderEnabled", "on");
  form.set("interviewReminderEnabled", "on");
  form.set("outcomeReminderEnabled", "on");
  form.set("timezone", "America/Chicago");
  form.set("quietHoursStart", "22:00");
  form.set("quietHoursEnd", "07:00");
  return form;
}

describe("student notification preference validation", () => {
  it("accepts an IANA timezone and overnight quiet hours", () => {
    const result = validateStudentNotificationPreferenceForm(validForm());
    expect(result.success).toBe(true);
    expect(result.values.timezone).toBe("America/Chicago");
    expect(result.values.quietHoursStart).toBe("22:00");
  });

  it("rejects invalid timezones", () => {
    const form = validForm();
    form.set("timezone", "Central Time");
    const result = validateStudentNotificationPreferenceForm(form);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.timezone).toContain("IANA timezone");
    }
    expect(isValidIanaTimezone("UTC")).toBe(true);
  });

  it("requires a complete, non-zero quiet-hour range", () => {
    const missingEnd = validForm();
    missingEnd.delete("quietHoursEnd");
    expect(validateStudentNotificationPreferenceForm(missingEnd).success).toBe(
      false,
    );

    const sameTime = validForm();
    sameTime.set("quietHoursEnd", "22:00");
    expect(validateStudentNotificationPreferenceForm(sameTime).success).toBe(
      false,
    );
  });
});
