const TAIPEI_TIME_ZONE = "Asia/Taipei";

const taipeiDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TAIPEI_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Converts a Date into YYYY-MM-DD based on Taipei local date semantics.
 */
export function toTaipeiDateStr(date: Date): string {
  const parts = taipeiDateFormatter.formatToParts(date);
  const year = parts.find(part => part.type === "year")?.value;
  const month = parts.find(part => part.type === "month")?.value;
  const day = parts.find(part => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format Taipei date");
  }

  return `${year}-${month}-${day}`;
}

export { TAIPEI_TIME_ZONE };
