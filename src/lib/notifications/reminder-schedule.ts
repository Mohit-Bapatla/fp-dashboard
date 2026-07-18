const datePartFormatterCache = new Map<string, Intl.DateTimeFormat>();
const timePartFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDatePartFormatter(timezone: string) {
  const existing = datePartFormatterCache.get(timezone);
  if (existing) return existing;

  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  });
  datePartFormatterCache.set(timezone, formatter);
  return formatter;
}

function getTimePartFormatter(timezone: string) {
  const existing = timePartFormatterCache.get(timezone);
  if (existing) return existing;

  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: timezone,
  });
  timePartFormatterCache.set(timezone, formatter);
  return formatter;
}

function partValue(parts: Intl.DateTimeFormatPart[], type: string) {
  return Number(parts.find((part) => part.type === type)?.value ?? 0);
}

export function getZonedCalendarDate(now: Date, timezone: string) {
  const parts = getDatePartFormatter(timezone).formatToParts(now);

  return {
    day: partValue(parts, "day"),
    month: partValue(parts, "month"),
    year: partValue(parts, "year"),
  };
}

export function getDatabaseCalendarDate(value: Date) {
  return {
    day: value.getUTCDate(),
    month: value.getUTCMonth() + 1,
    year: value.getUTCFullYear(),
  };
}

function calendarDateNumber(value: {
  day: number;
  month: number;
  year: number;
}) {
  return Date.UTC(value.year, value.month - 1, value.day) / 86_400_000;
}

export function differenceInStudentCalendarDays(
  targetDate: Date,
  now: Date,
  timezone: string,
) {
  return (
    calendarDateNumber(getDatabaseCalendarDate(targetDate)) -
    calendarDateNumber(getZonedCalendarDate(now, timezone))
  );
}

export function differenceInZonedCalendarDays(
  targetDate: Date,
  now: Date,
  timezone: string,
) {
  return (
    calendarDateNumber(getZonedCalendarDate(targetDate, timezone)) -
    calendarDateNumber(getZonedCalendarDate(now, timezone))
  );
}

export function getStudentCalendarWindow(now: Date, timezone: string) {
  const today = getZonedCalendarDate(now, timezone);
  const start = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  return { end, start };
}

export function databaseCalendarDateKey(value: Date) {
  const { day, month, year } = getDatabaseCalendarDate(value);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function studentCalendarDateKey(now: Date, timezone: string) {
  const { day, month, year } = getZonedCalendarDate(now, timezone);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isStudentLocalMonday(now: Date, timezone: string) {
  const { day, month, year } = getZonedCalendarDate(now, timezone);

  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 1;
}

function quietHourMinutes(value: string | null | undefined) {
  if (!value || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isWithinQuietHours({
  end,
  now,
  start,
  timezone,
}: {
  end: string | null | undefined;
  now: Date;
  start: string | null | undefined;
  timezone: string;
}) {
  const startMinutes = quietHourMinutes(start);
  const endMinutes = quietHourMinutes(end);

  if (
    startMinutes == null ||
    endMinutes == null ||
    startMinutes === endMinutes
  ) {
    return false;
  }

  const parts = getTimePartFormatter(timezone).formatToParts(now);
  const currentMinutes =
    partValue(parts, "hour") * 60 + partValue(parts, "minute");

  return startMinutes < endMinutes
    ? currentMinutes >= startMinutes && currentMinutes < endMinutes
    : currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function formatDatabaseCalendarDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(value);
}
