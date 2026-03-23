import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface ReadingMaterialItem {
  phrase?: string;
  definition?: string;
  usage?: string;
  sentence?: string;
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
  vocabulary?: Array<{ word: string; definition: string; usage: string }>;
  grammar?: GrammarItem[];
  readingMaterial?: { phrase?: ReadingMaterialItem; sentence?: ReadingMaterialItem };
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

export default function DailyContent() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);

  // Fetch learning path to get proficiency level
  const { data: learningPath } = trpc.learningPath.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get today's content first
  const getTodayQuery = trpc.content.getTodayContent.useQuery(
    { proficiencyLevel: learningPath?.currentLevel || "junior_high" },
    { enabled: isAuthenticated && !!learningPath }
  );

  // Generate content mutation (only if no content exists)
  const generateMutation = trpc.content.generateToday.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        const transformed = transformGeneratedContent(result.data);
        setContentItems(transformed);
      }
    },
    onError: () => {
      // Error is handled by toast in the component
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

  // Transform backend GeneratedContent to frontend ContentItem format
  const transformGeneratedContent = (data: GeneratedContentData | GeneratedContentData[]): ContentItem[] => {
    const items = Array.isArray(data) ? data : [data];
    const result: ContentItem[] = [];

    items.forEach((item) => {
      // Add vocabulary items
      if (item.vocabulary && Array.isArray(item.vocabulary)) {
        item.vocabulary.forEach((vocab) => {
          result.push({
            contentType: "vocabulary",
            content: vocab.word,
            definition: vocab.definition,
            exampleUsage: vocab.usage,
            proficiencyLevel: item.proficiencyLevel,
          });
        });
      }

      // Add phrase items - readingMaterial.phrase is an object with phrase, definition, usage
      if (item.readingMaterial?.phrase) {
        const phraseObj = item.readingMaterial.phrase;
        result.push({
          contentType: "phrase",
          content: typeof phraseObj === "string" ? phraseObj : phraseObj.phrase || "",
          definition: typeof phraseObj === "object" ? phraseObj.definition || "" : "",
          exampleUsage: typeof phraseObj === "object" ? phraseObj.usage || "" : "",
          proficiencyLevel: item.proficiencyLevel,
        });
      }

      // Add sentence items - readingMaterial.sentence is an object with sentence, definition, usage
      if (item.readingMaterial?.sentence) {
        const sentenceObj = item.readingMaterial.sentence;
        result.push({
          contentType: "sentence",
          content: typeof sentenceObj === "string" ? sentenceObj : sentenceObj.sentence || "",
          definition: typeof sentenceObj === "object" ? sentenceObj.definition || "" : "",
          exampleUsage: typeof sentenceObj === "object" ? sentenceObj.usage || "" : "",
          proficiencyLevel: item.proficiencyLevel,
        });
      }
    });

    return result;
  };

  useEffect(() => {
    if (getTodayQuery.data && getTodayQuery.data.length > 0) {
      // Use existing content
      const transformed = transformGeneratedContent(getTodayQuery.data);
      setContentItems(transformed);
    } else if (getTodayQuery.isSuccess && getTodayQuery.data?.length === 0 && learningPath && isAuthenticated) {
      // No content for today, generate new
      generateMutation.mutate({
        proficiencyLevel: learningPath.currentLevel,
      });
    }
  }, [getTodayQuery.data, getTodayQuery.isSuccess, learningPath, isAuthenticated]);

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

        {getTodayQuery.isLoading || generateMutation.isPending ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : contentItems.length === 0 ? (
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
                    <p className="text-sm text-muted-foreground">
                      {item.definition}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Example:</p>
                    <p className="italic">{item.exampleUsage}</p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleAddToCards(item)}
                    disabled={addToCardsMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cards
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">About Daily Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">Automatic Generation</p>
              <p className="text-muted-foreground">
                New content is automatically generated every 3 days tailored to your current proficiency level.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Progressive Learning</p>
              <p className="text-muted-foreground">
                Content difficulty increases as you progress from junior high to advanced level.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Add to Flashcards</p>
              <p className="text-muted-foreground">
                Click "Add to Cards" to add vocabulary items to your SRS flashcard system for spaced repetition learning.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Content Archiving</p>
              <p className="text-muted-foreground">
                Old content (older than 30 days) is automatically archived for reference.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
