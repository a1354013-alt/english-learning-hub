import { Flame, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GamificationStatsProps {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  proficiencyLevel: string;
}

const levelLabels: Record<string, string> = {
  junior_high: "Junior High",
  senior_high: "Senior High",
  college: "College",
  advanced: "Advanced",
};

export function GamificationStats({
  totalXp,
  currentStreak,
  longestStreak,
  proficiencyLevel,
}: GamificationStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total XP</CardTitle>
          <Zap className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalXp}</div>
          <p className="text-xs text-muted-foreground">
            Earned from study activity
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current streak</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStreak}</div>
          <p className="text-xs text-muted-foreground">
            Consecutive active days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Longest streak</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{longestStreak}</div>
          <p className="text-xs text-muted-foreground">Best run so far</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current level</CardTitle>
          <div className="h-3 w-3 rounded-full bg-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {levelLabels[proficiencyLevel] ?? proficiencyLevel}
          </div>
          <p className="text-xs text-muted-foreground">
            Learning track difficulty
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
