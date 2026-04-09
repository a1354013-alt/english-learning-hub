import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GamificationStats } from "@/components/GamificationStats";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  Archive,
  BookMarked,
  BookOpen,
  Calendar,
  Lightbulb,
  PenTool,
  Video,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

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

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [heatmapData, setHeatmapData] = useState<Array<{ date: string; count: number }>>([]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-accent" />
              <span className="text-lg font-bold">English Learning Hub</span>
            </div>
            <Button asChild>
              <a href={getLoginUrl()}>Sign in</a>
            </Button>
          </div>
        </nav>

        <div className="container space-y-8 py-20">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl font-bold tracking-tight">
              Break plateaus with a complete English practice loop
            </h1>
            <p className="text-xl text-muted-foreground">
              Practice vocabulary, SRS review, writing, listening, and AI-generated
              study content in one place. The current product focus is long-term
              retention, measurable progress, and workflows that are easy to keep
              repeating.
            </p>
            <div className="flex gap-4">
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>Start learning</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={getLoginUrl()}>Sign in for daily content</a>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  SRS review
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Review cards with SM-2 scheduling so difficult items come back at
                the right time.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-500" />
                  Video learning
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Study from transcript-based videos, click words, and add useful
                vocabulary directly into review.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-green-500" />
                  Writing feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Get AI-assisted feedback, track writing history, and turn practice
                into a repeatable habit.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  Streaks and XP
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Keep momentum with streak tracking, daily activity history, and XP
                from study sessions.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-500" />
                  Daily content
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Generate level-based vocabulary, phrases, sentences, and grammar
                practice for the day.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-red-500" />
                  AI courses
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Generate longer study packs, review them later, and import course
                vocabulary into SRS.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const completionPercentage =
    learningPath && "completionPercentage" in learningPath
      ? Number(learningPath.completionPercentage)
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="text-lg font-bold">English Learning Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.name || user?.email || "Learner"}
            </span>
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container space-y-8 py-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Your learning dashboard</h1>
          <p className="text-muted-foreground">
            Review progress, pick your next activity, and keep your study loop moving.
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
      </div>
    </div>
  );
}
