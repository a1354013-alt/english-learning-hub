import { Flame, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GamificationStatsProps {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  proficiencyLevel: string;
}

export function GamificationStats({
  totalXp,
  currentStreak,
  longestStreak,
  proficiencyLevel,
}: GamificationStatsProps) {
  const levelLabels: Record<string, string> = {
    junior_high: "國中程度",
    senior_high: "高中程度",
    college: "大學程度",
    advanced: "進階程度",
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "junior_high":
        return "text-green-600";
      case "senior_high":
        return "text-blue-600";
      case "college":
        return "text-purple-600";
      case "advanced":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* XP Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">總經驗值</CardTitle>
          <Zap className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalXp}</div>
          <p className="text-xs text-muted-foreground">通過學習獲得</p>
        </CardContent>
      </Card>

      {/* Current Streak Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">當前連勝</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStreak}</div>
          <p className="text-xs text-muted-foreground">天</p>
        </CardContent>
      </Card>

      {/* Longest Streak Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">最長連勝</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{longestStreak}</div>
          <p className="text-xs text-muted-foreground">天</p>
        </CardContent>
      </Card>

      {/* Proficiency Level Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">當前程度</CardTitle>
          <div className={`h-4 w-4 rounded-full ${getLevelColor(proficiencyLevel)}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-lg font-bold ${getLevelColor(proficiencyLevel)}`}>
            {levelLabels[proficiencyLevel] || proficiencyLevel}
          </div>
          <p className="text-xs text-muted-foreground">學習進度</p>
        </CardContent>
      </Card>
    </div>
  );
}
