export type StudentNotificationPreferenceValues = {
  deadlineAlertsEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  interviewReminderEnabled: boolean;
  openingAlertsEnabled: boolean;
  outcomeReminderEnabled: boolean;
  quietHoursEnd: string;
  quietHoursStart: string;
  recommendationReminderEnabled: boolean;
  taskReminderEnabled: boolean;
  timezone: string;
  weeklyDigestEnabled: boolean;
};

export type StudentNotificationPreferenceFieldErrors = Partial<
  Record<keyof StudentNotificationPreferenceValues, string>
>;

export const defaultStudentNotificationPreferenceValues: StudentNotificationPreferenceValues =
  {
    deadlineAlertsEnabled: true,
    emailEnabled: false,
    inAppEnabled: true,
    interviewReminderEnabled: true,
    openingAlertsEnabled: true,
    outcomeReminderEnabled: true,
    quietHoursEnd: "07:00",
    quietHoursStart: "22:00",
    recommendationReminderEnabled: true,
    taskReminderEnabled: true,
    timezone: "America/Chicago",
    weeklyDigestEnabled: false,
  };

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function isValidIanaTimezone(value: string) {
  if (!value || value.length > 100) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function isValidQuietHour(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function notificationPreferenceValuesFromFormData(
  formData: FormData,
): StudentNotificationPreferenceValues {
  return {
    deadlineAlertsEnabled: getBoolean(formData, "deadlineAlertsEnabled"),
    emailEnabled: getBoolean(formData, "emailEnabled"),
    inAppEnabled: getBoolean(formData, "inAppEnabled"),
    interviewReminderEnabled: getBoolean(formData, "interviewReminderEnabled"),
    openingAlertsEnabled: getBoolean(formData, "openingAlertsEnabled"),
    outcomeReminderEnabled: getBoolean(formData, "outcomeReminderEnabled"),
    quietHoursEnd: getString(formData, "quietHoursEnd"),
    quietHoursStart: getString(formData, "quietHoursStart"),
    recommendationReminderEnabled: getBoolean(
      formData,
      "recommendationReminderEnabled",
    ),
    taskReminderEnabled: getBoolean(formData, "taskReminderEnabled"),
    timezone: getString(formData, "timezone"),
    weeklyDigestEnabled: getBoolean(formData, "weeklyDigestEnabled"),
  };
}

export function validateStudentNotificationPreferenceForm(formData: FormData) {
  const values = notificationPreferenceValuesFromFormData(formData);
  const errors: StudentNotificationPreferenceFieldErrors = {};

  if (!isValidIanaTimezone(values.timezone)) {
    errors.timezone = "Enter a valid IANA timezone, such as America/Chicago.";
  }

  const hasQuietStart = Boolean(values.quietHoursStart);
  const hasQuietEnd = Boolean(values.quietHoursEnd);

  if (hasQuietStart !== hasQuietEnd) {
    const message = "Enter both quiet-hour times, or leave both blank.";
    errors.quietHoursStart = message;
    errors.quietHoursEnd = message;
  } else if (hasQuietStart && hasQuietEnd) {
    if (!isValidQuietHour(values.quietHoursStart)) {
      errors.quietHoursStart = "Enter a valid 24-hour time.";
    }

    if (!isValidQuietHour(values.quietHoursEnd)) {
      errors.quietHoursEnd = "Enter a valid 24-hour time.";
    }

    if (
      values.quietHoursStart === values.quietHoursEnd &&
      !errors.quietHoursStart &&
      !errors.quietHoursEnd
    ) {
      const message = "Quiet hours must start and end at different times.";
      errors.quietHoursStart = message;
      errors.quietHoursEnd = message;
    }
  }

  return Object.keys(errors).length > 0
    ? { errors, success: false as const, values }
    : { data: values, success: true as const, values };
}
