import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashCard } from "@/components/FlashCard";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useLocation } from "wouter";

const levelLabels: Record<string, string> = {
  junior_high: "Junior High",
  senior_high: "Senior High",
  college: "College",
  advanced: "Advanced",
};

export default function SRSReview() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const { data: dueCards, isLoading: cardsLoading } = trpc.srs.getDueCards.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated }
  );

  const reviewMutation = trpc.srs.reviewCard.useMutation({
    onSuccess: () => {
      if (!dueCards) return;
      if (currentCardIndex < dueCards.length - 1) {
        setCurrentCardIndex((value) => value + 1);
      } else {
        setCurrentCardIndex(-1);
      }
    },
  });

  const handleReview = (quality: number) => {
    if (!dueCards || currentCardIndex < 0 || currentCardIndex >= dueCards.length) {
      return;
    }

    reviewMutation.mutate({
      cardId: dueCards[currentCardIndex].id,
      quality,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please sign in first.</p>
      </div>
    );
  }

  if (cardsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-accent" />
      </div>
    );
  }

  if (!dueCards?.length) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-accent" />
              <span className="text-lg font-bold">English Learning Hub</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Button>
          </div>
        </nav>

        <div className="container flex min-h-[calc(100vh-64px)] items-center justify-center py-16">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-center">No cards due right now</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                You are caught up. Add more cards or come back after your next review window.
              </p>
              <Button className="w-full" onClick={() => setLocation("/")}>
                Return to dashboard
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
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-accent" />
              <span className="text-lg font-bold">English Learning Hub</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Button>
          </div>
        </nav>

        <div className="container flex min-h-[calc(100vh-64px)] items-center justify-center py-16">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Review session complete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                You reviewed all {dueCards.length} due cards in this session.
              </p>
              <p className="text-sm text-muted-foreground">
                The next review dates were recalculated with the SM-2 algorithm.
              </p>
              <Button className="w-full" onClick={() => setLocation("/")}>
                Return to dashboard
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
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="text-lg font-bold">English Learning Hub</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </div>
      </nav>

      <div className="container space-y-8 py-8">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>
              {currentCardIndex + 1} / {dueCards.length}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Card metadata</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Repetitions</p>
              <p className="font-semibold">{currentCard.repetitionCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ease factor</p>
              <p className="font-semibold">{currentCard.easinessFactor}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current interval</p>
              <p className="font-semibold">{currentCard.interval} days</p>
            </div>
            <div>
              <p className="text-muted-foreground">Difficulty level</p>
              <p className="font-semibold">
                {levelLabels[currentCard.proficiencyLevel] ?? currentCard.proficiencyLevel}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
