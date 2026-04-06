import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { transformGeneratedContent, GeneratedContentData } from "@/utils/contentTransform";

// ============ Component ============

type ContentState = "loading" | "empty" | "content";

export default function DailyContent() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [contentData, setContentData] = useState<GeneratedContentData | null>(null);
  const [contentState, setContentState] = useState<ContentState>("loading");

  // Fetch learning path to get proficiency level
  const { data: learningPath } = trpc.learningPath.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get today's content first
  const getTodayQuery = trpc.content.getTodayContent.useQuery(
    { proficiencyLevel: learningPath?.currentLevel || "junior_high" },
    { enabled: isAuthenticated && !!learningPath }
  );

  // Generate content mutation (only triggered manually)
  const generateMutation = trpc.content.generateToday.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        const transformed = transformGeneratedContent(result.data);
        setContentData(transformed);
        setContentState("content");
        toast.success("Content generated successfully!");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate content");
    },
  });

  // Add to cards mutation
  const addToCardsMutation = trpc.srs.addCard.useMutation({
    onSuccess: () => {
      toast.success("已添加到單字卡");
    },
    onError: (error) => {
      toast.error(error.message || "添加失敗");
    },
  });

  // Three-state control: loading -> empty/content
  useEffect(() => {
    if (getTodayQuery.isLoading) {
      setContentState("loading");
      return;
    }

    if (getTodayQuery.data && getTodayQuery.data.length > 0) {
      // Use existing content - transform first item
      const transformed = transformGeneratedContent(getTodayQuery.data[0]);
      setContentData(transformed);
      setContentState("content");
    } else if (getTodayQuery.isSuccess && getTodayQuery.data?.length === 0) {
      // No content for today, show empty state
      setContentState("empty");
    }
  }, [getTodayQuery.data, getTodayQuery.isSuccess, getTodayQuery.isLoading]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in first</p>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Today's Learning Content</h1>
          <p className="text-muted-foreground">
            New content is automatically generated every 3 days based on your proficiency level.
          </p>
        </div>

        {/* Loading State */}
        {contentState === "loading" ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : contentState === "empty" ? (
          // Empty State with Manual Generate Button
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No content generated yet. Click the button below to generate today's content.
              </p>
              <Button
                onClick={() => {
                  if (learningPath) {
                    generateMutation.mutate({
                      proficiencyLevel: learningPath.currentLevel,
                    });
                  }
                }}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? "Generating..." : "Generate Content"}
              </Button>
            </CardContent>
          </Card>
        ) : contentData ? (
          // Content Display
          <div className="space-y-6">
            {/* Vocabulary Section */}
            {contentData.vocabulary && contentData.vocabulary.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>📚 Vocabulary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contentData.vocabulary.map((item, idx) => (
                    <div key={idx} className="border-l-4 border-accent pl-4 py-2">
                      <p className="font-semibold text-lg">{item.word}</p>
                      <p className="text-sm text-muted-foreground">{item.definition}</p>
                      <p className="text-sm italic mt-2">例：{item.usage}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          addToCardsMutation.mutate({
                            frontText: item.word,
                            backText: item.definition,
                            exampleSentence: item.usage,
                            proficiencyLevel: "junior_high",
                          });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add to Cards
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Phrase Section */}
            {contentData.phrases && contentData.phrases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>💬 Phrases</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contentData.phrases.map((item, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-semibold text-lg">{item.phrase}</p>
                      <p className="text-sm text-muted-foreground">{item.definition}</p>
                      <p className="text-sm italic mt-2">例：{item.usage}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Sentence Section */}
            {contentData.sentences && contentData.sentences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>✍️ Sentences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contentData.sentences.map((item, idx) => (
                    <div key={idx} className="border-l-4 border-green-500 pl-4 py-2">
                      <p className="font-semibold text-lg">{item.sentence}</p>
                      <p className="text-sm text-muted-foreground">{item.definition}</p>
                      <p className="text-sm italic mt-2">例：{item.usage}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Grammar Section */}
            {contentData.grammar && (
              <Card>
                <CardHeader>
                  <CardTitle>🎓 Grammar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">{contentData.grammar.topic}</p>
                    <p className="text-sm text-muted-foreground mt-2">{contentData.grammar.explanation}</p>
                    <p className="text-sm italic mt-2">例：{contentData.grammar.example}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
