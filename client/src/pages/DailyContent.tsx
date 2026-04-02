import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// ============ Strict Type Definitions ============

interface VocabularyItem {
  word: string;
  definition: string;
  usage: string;
}

interface PhraseItem {
  phrase?: string;
  definition?: string;
  usage?: string;
}

interface SentenceItem {
  sentence?: string;
  definition?: string;
  usage?: string;
}

interface ReadingMaterialData {
  phrase?: PhraseItem;
  sentence?: SentenceItem;
}

interface GrammarItem {
  topic: string;
  explanation: string;
  example: string;
}

interface Exercise {
  type: string;
  question: string;
  options: string[];
  answer: string;
}

interface GeneratedContentData {
  id?: number;
  generatedDate: string;
  proficiencyLevel: "junior_high" | "senior_high" | "college" | "advanced";
  vocabulary?: VocabularyItem[];
  grammar?: GrammarItem[];
  readingMaterial?: ReadingMaterialData;
  exercises?: Exercise[];
  isArchived?: boolean;
}

interface ContentItem {
  id?: number;
  contentType: "vocabulary" | "phrase" | "sentence";
  content: string;
  definition: string;
  exampleUsage: string;
  proficiencyLevel: string;
}

// ============ Pure Function: Transform Generated Content ============

/**
 * Transform backend GeneratedContent to frontend ContentItem format
 * Strict typing with no 'any' casts
 */
function transformGeneratedContent(data: GeneratedContentData | GeneratedContentData[]): ContentItem[] {
  const items = Array.isArray(data) ? data : [data];
  const result: ContentItem[] = [];

  items.forEach((item) => {
    // Add vocabulary items
    if (item.vocabulary && Array.isArray(item.vocabulary)) {
      item.vocabulary.forEach((vocab: VocabularyItem) => {
        result.push({
          contentType: "vocabulary",
          content: vocab.word,
          definition: vocab.definition,
          exampleUsage: vocab.usage,
          proficiencyLevel: item.proficiencyLevel,
        });
      });
    }

    // Add phrase items
    if (item.readingMaterial?.phrase) {
      const phraseObj = item.readingMaterial.phrase;
      result.push({
        contentType: "phrase",
        content: phraseObj.phrase || "",
        definition: phraseObj.definition || "",
        exampleUsage: phraseObj.usage || "",
        proficiencyLevel: item.proficiencyLevel,
      });
    }

    // Add sentence items
    if (item.readingMaterial?.sentence) {
      const sentenceObj = item.readingMaterial.sentence;
      result.push({
        contentType: "sentence",
        content: sentenceObj.sentence || "",
        definition: sentenceObj.definition || "",
        exampleUsage: sentenceObj.usage || "",
        proficiencyLevel: item.proficiencyLevel,
      });
    }
  });

  return result;
}

// ============ Component ============

type ContentState = "loading" | "empty" | "content";

export default function DailyContent() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
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
        const transformed = transformGeneratedContent(result.data as GeneratedContentData);
        setContentItems(transformed);
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
      // Use existing content
      const transformed = transformGeneratedContent(getTodayQuery.data as GeneratedContentData[]);
      setContentItems(transformed);
      setContentState("content");
    } else if (getTodayQuery.isSuccess && getTodayQuery.data?.length === 0) {
      // No content for today, show empty state
      setContentState("empty");
    }
  }, [getTodayQuery.data, getTodayQuery.isSuccess, getTodayQuery.isLoading]);

  const handleAddToCards = (item: ContentItem) => {
    if (item.contentType === "vocabulary") {
      addToCardsMutation.mutate({
        frontText: item.content,
        backText: item.definition,
        exampleSentence: item.exampleUsage,
        proficiencyLevel: item.proficiencyLevel as "junior_high" | "senior_high" | "college" | "advanced",
      });
    } else {
      toast.error("Only vocabulary items can be added to flashcards.");
    }
  };

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
        ) : (
          // Content Display
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentItems.map((item, idx) => (
              <Card key={idx} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      {item.contentType === "vocabulary"
                        ? "Vocabulary"
                        : item.contentType === "phrase"
                          ? "Phrase"
                          : "Sentence"}
                    </CardTitle>
                    <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">
                      {item.proficiencyLevel === "junior_high"
                        ? "國中"
                        : item.proficiencyLevel === "senior_high"
                          ? "高中"
                          : item.proficiencyLevel === "college"
                            ? "大學"
                            : "進階"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-lg font-bold mb-2">{item.content}</p>
                    <p className="text-sm text-muted-foreground">{item.definition}</p>
                  </div>
                  <div className="bg-muted p-3 rounded text-sm">
                    <p className="italic text-muted-foreground">{item.exampleUsage}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddToCards(item)}
                    disabled={addToCardsMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cards
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
