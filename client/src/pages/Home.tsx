import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GamificationStats } from "@/components/GamificationStats";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { BookOpen, Video, PenTool, Zap, Calendar, Archive } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [mockHeatmapData, setMockHeatmapData] = useState<
    Array<{ date: string; count: number }>
  >([]);

  // Fetch gamification stats
  const { data: gamStats } = trpc.gamification.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch learning path
  const { data: learningPath } = trpc.learningPath.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Generate mock heatmap data
  useEffect(() => {
    const mockData = [];
    for (let i = 0; i < 84; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      mockData.push({
        date: date.toISOString().split("T")[0],
        count: Math.floor(Math.random() * 12),
      });
    }
    setMockHeatmapData(mockData);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        {/* Navigation */}
        <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-accent" />
              <span className="text-lg font-bold">English Learning Hub</span>
            </div>
            <Button asChild>
              <a href={getLoginUrl()}>登入</a>
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container py-20 space-y-8">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl font-bold tracking-tight">
              從國中程度到多益 700 分
            </h1>
            <p className="text-xl text-muted-foreground">
              使用 AI 驅動的智慧學習系統，通過 SRS 間隔重複、沉浸式影片學習和遊戲化激勵，逐步提升您的英文能力。
            </p>
            <div className="flex gap-4">
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>開始學習</a>
              </Button>
              <Button size="lg" variant="outline">
                了解更多
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  SRS 智慧單字卡
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  使用 SM-2 演算法，根據您的學習進度自動調整複習時間，提高記憶效率。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-500" />
                  沉浸式影片學習
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  觀看 YouTube 影片，同步字幕高亮，點擊單字即時查詢，邊看邊學。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-green-500" />
                  寫作與語法糾錯
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  每日寫作挑戰，即時語法檢查，AI 潤飾建議，提升寫作能力。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  遊戲化激勵系統
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  每日簽到、連勝追蹤、經驗值累積，學習進度可視化，保持學習動力。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  自動內容生成
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  每三天自動生成適合您當前程度的學習內容，無需手動選擇。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-red-500" />
                  智慧內容歸檔
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  已學習的內容自動按時間和難度分類歸檔，方便複習和追蹤進度。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-pink-500" />
                  AI 課程生成
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  使用本地 AI 按需生成自訂英文課程，包含詞彙、文法、閱讀和練習題。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="border-t border-border bg-background py-16">
          <div className="container text-center space-y-6">
            <h2 className="text-3xl font-bold">準備好開始了嗎？</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              加入數千名學習者，使用 English Learning Hub 達成您的英文目標。
            </p>
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>立即登入開始</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" />
            <span className="text-lg font-bold">English Learning Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              歡迎，{user?.name}
            </span>
            <Button variant="outline" size="sm">
              個人資料
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">歡迎回來！</h1>
          <p className="text-muted-foreground">
            今天繼續您的英文學習之旅吧。
          </p>
        </div>

        {/* Gamification Stats */}
        {gamStats && (
          <GamificationStats
            totalXp={gamStats.totalXp}
            currentStreak={gamStats.currentStreak}
            longestStreak={gamStats.longestStreak}
            proficiencyLevel={gamStats.proficiencyLevel}
          />
        )}

        {/* Learning Path Info */}
        {learningPath && (
          <Card>
            <CardHeader>
              <CardTitle>您的學習路徑</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">當前程度</p>
                  <p className="text-lg font-semibold">
                    {learningPath.currentLevel === "junior_high"
                      ? "國中程度"
                      : learningPath.currentLevel === "senior_high"
                        ? "高中程度"
                        : learningPath.currentLevel === "college"
                          ? "大學程度"
                          : "進階程度"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">目標程度</p>
                  <p className="text-lg font-semibold">
                    {learningPath.targetLevel === "junior_high"
                      ? "國中程度"
                      : learningPath.targetLevel === "senior_high"
                        ? "高中程度"
                        : learningPath.targetLevel === "college"
                          ? "大學程度"
                          : "進階程度"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>完成進度</span>
                  <span>{learningPath.completionPercentage ?? 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all"
                    style={{ width: `${learningPath.completionPercentage ?? 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>學習活動</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityHeatmap data={mockHeatmapData} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button className="h-24 text-lg" asChild>
            <a href="/srs">
              <Zap className="w-6 h-6 mr-2" />
              開始複習
            </a>
          </Button>
          <Button className="h-24 text-lg" variant="outline" asChild>
            <a href="/videos">
              <Video className="w-6 h-6 mr-2" />
              影片學習
            </a>
          </Button>
          <Button className="h-24 text-lg" variant="outline" asChild>
            <a href="/writing">
              <PenTool className="w-6 h-6 mr-2" />
              寫作練習
            </a>
          </Button>
          <Button className="h-24 text-lg" variant="outline" onClick={() => setLocation("/ai-course")}>
            <Zap className="w-6 h-6 mr-2" />
            生成課程
          </Button>
        </div>
      </div>
    </div>
  );
}
