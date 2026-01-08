import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashCard } from "@/components/FlashCard";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function SRSReview() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Fetch due cards
  const { data: dueCards, isLoading: cardsLoading } =
    trpc.srs.getDueCards.useQuery(
      { limit: 20 },
      { enabled: isAuthenticated }
    );

  // Review card mutation
  const reviewMutation = trpc.srs.reviewCard.useMutation({
    onSuccess: () => {
      // Move to next card
      if (currentCardIndex < (dueCards?.length || 0) - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        // All cards reviewed
        setCurrentCardIndex(-1);
      }
    },
  });

  const handleReview = (quality: number) => {
    if (dueCards && currentCardIndex < dueCards.length) {
      const card = dueCards[currentCardIndex];
      reviewMutation.mutate({
        cardId: card.id,
        quality,
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>請先登入</p>
      </div>
    );
  }

  if (cardsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!dueCards || dueCards.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-accent" />
              <span className="text-lg font-bold">English Learning Hub</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁
            </Button>
          </div>
        </nav>

        {/* Empty State */}
        <div className="container py-16 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-center">沒有待複習的卡片</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                恭喜！您已完成今日所有複習。明天再來吧！
              </p>
              <Button onClick={() => setLocation("/")} className="w-full">
                返回首頁
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentCardIndex === -1) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-accent" />
              <span className="text-lg font-bold">English Learning Hub</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首頁
            </Button>
          </div>
        </nav>

        {/* Completion State */}
        <div className="container py-16 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-center">完成複習！</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                您已完成所有 {dueCards.length} 張卡片的複習。
              </p>
              <p className="text-sm text-muted-foreground">
                根據 SM-2 演算法，系統已自動調整下次複習時間。
              </p>
              <Button onClick={() => setLocation("/")} className="w-full">
                返回首頁
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentCard = dueCards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / dueCards.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" />
            <span className="text-lg font-bold">English Learning Hub</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首頁
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-8 space-y-8">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>複習進度</span>
            <span>
              {currentCardIndex + 1} / {dueCards.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="flex justify-center py-8">
          <div className="w-full max-w-2xl">
            <FlashCard
              frontText={currentCard.frontText}
              backText={currentCard.backText}
              phonetic={currentCard.phonetic || undefined}
              audioUrl={currentCard.audioUrl || undefined}
              exampleSentence={currentCard.exampleSentence || undefined}
              onReview={handleReview}
              isLoading={reviewMutation.isPending}
            />
          </div>
        </div>

        {/* Card Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">卡片信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">重複次數</p>
                <p className="font-semibold">{currentCard.repetitionCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">難度係數</p>
                <p className="font-semibold">{currentCard.easinessFactor}</p>
              </div>
              <div>
                <p className="text-muted-foreground">複習間隔</p>
                <p className="font-semibold">{currentCard.interval} 天</p>
              </div>
              <div>
                <p className="text-muted-foreground">難度級別</p>
                <p className="font-semibold">
                  {currentCard.proficiencyLevel === "junior_high"
                    ? "國中"
                    : currentCard.proficiencyLevel === "senior_high"
                      ? "高中"
                      : currentCard.proficiencyLevel === "college"
                        ? "大學"
                        : "進階"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
