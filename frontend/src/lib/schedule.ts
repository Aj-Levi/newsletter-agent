/**
 * Calculate the next scheduled run time in UTC based on the user's timezone.
 * Mirrors the backend python implementation.
 * 
 * @param scheduleType "DAILY" | "WEEKLY" | "MANUAL"
 * @param dayOfWeek 0=Sunday, 1=Monday, ..., 6=Saturday
 * @param hour 0-23
 * @param minute 0-59
 * @param timezone Timezone string, e.g. "Asia/Kolkata"
 */
export function calculateNextRun(
  scheduleType: "DAILY" | "WEEKLY" | "MANUAL",
  dayOfWeek: number | null,
  hour: number | null,
  minute: number | null,
  timezone: string = "Asia/Kolkata"
): Date | null {
  if (scheduleType === "MANUAL") {
    return null;
  }

  const targetHour = hour ?? 8;
  const targetMinute = minute ?? 0;

  const now = new Date();

  try {
    // Format current time in user's timezone to get local components
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const partValues = Object.fromEntries(parts.map((p) => [p.type, p.value]));

    let nowHour = parseInt(partValues.hour, 10);
    if (nowHour === 24) nowHour = 0;

    // Construct a Date object representing the user's local current time (in system local context)
    const localNow = new Date(
      parseInt(partValues.year, 10),
      parseInt(partValues.month, 10) - 1, // 0-indexed month
      parseInt(partValues.day, 10),
      nowHour,
      parseInt(partValues.minute, 10),
      parseInt(partValues.second, 10)
    );

    // Define the target run time on the same local day
    const localTarget = new Date(localNow);
    localTarget.setHours(targetHour, targetMinute, 0, 0);

    if (scheduleType === "DAILY") {
      if (localTarget <= localNow) {
        localTarget.setDate(localTarget.getDate() + 1);
      }
    } else if (scheduleType === "WEEKLY") {
      const targetDay = dayOfWeek ?? 1; // Default to Monday
      const currentDay = localNow.getDay();
      let daysAhead = targetDay - currentDay;
      if (daysAhead < 0 || (daysAhead === 0 && localTarget <= localNow)) {
        daysAhead += 7;
      }
      localTarget.setDate(localTarget.getDate() + daysAhead);
    }

    // Convert localTarget back to UTC using the difference between localNow and actual now
    const timezoneOffsetMs = localNow.getTime() - now.getTime();
    return new Date(localTarget.getTime() - timezoneOffsetMs);
  } catch (error) {
    console.error("Error calculating next run, falling back to UTC calculation:", error);
    // Basic UTC fallback
    const fallbackTarget = new Date(now);
    fallbackTarget.setUTCHours(targetHour, targetMinute, 0, 0);
    if (fallbackTarget <= now) {
      fallbackTarget.setUTCDate(fallbackTarget.getUTCDate() + 1);
    }
    return fallbackTarget;
  }
}
