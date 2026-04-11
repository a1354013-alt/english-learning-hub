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

export type WritingChallengeChoice = {
  id: number;
  proficiencyLevel: "junior_high" | "senior_high" | "college" | "advanced";
  activeDate: string;
};

export function selectDailyWritingChallenge<T extends WritingChallengeChoice>(
  today: Date,
  proficiencyLevel: T["proficiencyLevel"],
  challenges: T[]
): T | null {
  const todayDate = toTaipeiDateStr(today);
  const directMatch = challenges.find(
    (challenge) =>
      challenge.proficiencyLevel === proficiencyLevel &&
      challenge.activeDate === todayDate
  );

  if (directMatch) {
    return directMatch;
  }

  const levelChallenges = challenges
    .filter((challenge) => challenge.proficiencyLevel === proficiencyLevel)
    .sort((a, b) => a.id - b.id);

  if (levelChallenges.length === 0) {
    return null;
  }

  const index = challengeIndexForDate(today, levelChallenges.length);
  return levelChallenges[index];
}
