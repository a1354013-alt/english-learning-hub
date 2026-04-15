import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const { loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-accent" />
      </div>
    );
  }

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
            Practice vocabulary, SRS review, writing, listening, and
            AI-generated study content in one place. The product focus is
            long-term retention, measurable progress, and workflows that are
            easy to repeat.
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
              Track progress on curated videos and keep a consistent listening
              habit.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-purple-500" />
                Writing practice
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Submit writing responses and get structured feedback with
              corrections and next-step suggestions.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-green-500" />
                Daily content
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Generate deterministic daily study materials per proficiency
              level.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-indigo-500" />
                AI courses
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Create longer-form lesson packs and import course vocabulary
              directly into SRS decks.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Streaks & progress
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Keep momentum with sign-ins, streak tracking, and activity
              history.
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-muted-foreground" />
                Archive & history
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Older generated content is archived for cleanup while the app
              keeps a single source of truth in `generatedContent`.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
