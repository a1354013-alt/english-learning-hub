import { GamificationStats } from "@/components/GamificationStats";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BookMarked,
  Calendar,
  Lightbulb,
  PenTool,
  Video,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const levelLabels: Record<string, string> = {
  junior_high: "Junior High",
  senior_high: "Senior High",
  college: "College",
  advanced: "Advanced",
};

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [heatmapData, setHeatmapData] = useState<
    Array<{ date: string; count: number }>
  >([]);

  const { data: gamStats } = trpc.gamification.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: learningPath } = trpc.learningPath.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: studyLogs } = trpc.studyLog.listRecent.useQuery(
    { days: 84 },
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!studyLogs) return;

    const dateActivityMap = new Map<string, number>();

    for (let i = 0; i < 84; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dateActivityMap.set(formatDateKey(date), 0);
    }

    for (const log of studyLogs) {
      const key = formatDateKey(new Date(log.createdAt));
      if (dateActivityMap.has(key)) {
        dateActivityMap.set(key, (dateActivityMap.get(key) ?? 0) + 1);
      }
    }

    setHeatmapData(
      Array.from(dateActivityMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    );
  }, [studyLogs]);

  const completionPercentage = learningPath
    ? (learningPath.completionPercentage ?? 0)
    : 0;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Your learning dashboard</h1>
        <p className="text-muted-foreground">
          Review progress, pick your next activity, and keep your study loop
          moving.
        </p>
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.name || user?.email || "Learner"}
        </p>
      </div>

      {gamStats ? (
        <GamificationStats
          totalXp={gamStats.totalXp}
          currentStreak={gamStats.currentStreak}
          longestStreak={gamStats.longestStreak}
          proficiencyLevel={gamStats.proficiencyLevel}
        />
      ) : null}

      {learningPath ? (
        <Card>
          <CardHeader>
            <CardTitle>Learning path</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Current level</p>
                <p className="text-lg font-semibold">
                  {levelLabels[learningPath.currentLevel]}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target level</p>
                <p className="text-lg font-semibold">
                  {levelLabels[learningPath.targetLevel]}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-accent transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Consistency</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap data={heatmapData} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Button className="h-24 text-lg" asChild>
          <a href="/srs">
            <Zap className="mr-2 h-6 w-6" />
            Review cards
          </a>
        </Button>
        <Button className="h-24 text-lg" variant="outline" asChild>
          <a href="/videos">
            <Video className="mr-2 h-6 w-6" />
            Videos
          </a>
        </Button>
        <Button className="h-24 text-lg" variant="outline" asChild>
          <a href="/writing">
            <PenTool className="mr-2 h-6 w-6" />
            Writing
          </a>
        </Button>
        <Button className="h-24 text-lg" variant="outline" asChild>
          <a href="/daily-content">
            <Lightbulb className="mr-2 h-6 w-6" />
            Daily content
          </a>
        </Button>
        <Button className="h-24 text-lg" variant="outline" asChild>
          <a href="/my-courses">
            <BookMarked className="mr-2 h-6 w-6" />
            My courses
          </a>
        </Button>
        <Button
          className="h-24 text-lg"
          variant="outline"
          onClick={() => setLocation("/ai-course")}
        >
          <Zap className="mr-2 h-6 w-6" />
          Generate course
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Button variant="outline" asChild>
          <a href="/daily-content">
            <Calendar className="mr-2 h-4 w-4" />
            View today's content
          </a>
        </Button>
      </div>
    </div>
  );
}
