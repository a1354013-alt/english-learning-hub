import { toTaipeiDateStr } from "./_core/date";

function dayNumberForTaipeiDate(date: Date): number {
  const [year, month, day] = toTaipeiDateStr(date)
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function challengeIndexForDate(
  date: Date,
  challengeCount: number
): number {
  if (challengeCount <= 0) {
    throw new Error("challengeCount must be greater than 0");
  }
  const daysSinceEpoch = dayNumberForTaipeiDate(date);
  return Math.abs(daysSinceEpoch) % challengeCount;
}
