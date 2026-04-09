import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  BookOpen,
  Download,
  Eye,
  Star,
  Trash2,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface VocabularyItem {
  word: string;
  definition: string;
  chineseTranslation?: string;
  pronunciation?: string;
}

interface GrammarContent {
  title?: string;
  explanation: string;
  examples?: string[];
}

interface ReadingMaterial {
  title: string;
  content: string;
  difficulty: string;
}

interface Exercise {
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
}

type ProficiencyLevel = "junior_high" | "senior_high" | "college" | "advanced";

interface AiCourse {
  id: number;
  userId: number;
  title: string;
  topic?: string;
  proficiencyLevel: ProficiencyLevel;
  generatedAt: string | Date;
  isCompleted: boolean;
  rating?: number | null;
  vocabulary?: VocabularyItem[];
  grammar?: GrammarContent;
  readingMaterial?: ReadingMaterial;
  exercises?: Exercise[];
}

function normalizeAiCourse(input: unknown): AiCourse | null {
  if (!input || typeof input !== "object") return null;

  const obj = input as Record<string, unknown>;
  if (
    typeof obj.id !== "number" ||
    typeof obj.userId !== "number" ||
    typeof obj.title !== "string" ||
    typeof obj.proficiencyLevel !== "string" ||
    (typeof obj.generatedAt !== "string" && !(obj.generatedAt instanceof Date)) ||
    typeof obj.isCompleted !== "boolean"
  ) {
    return null;
  }

  return {
    id: obj.id,
    userId: obj.userId,
    title: obj.title,
    topic: typeof obj.topic === "string" ? obj.topic : undefined,
    proficiencyLevel: obj.proficiencyLevel as ProficiencyLevel,
    generatedAt: obj.generatedAt as string | Date,
    isCompleted: obj.isCompleted,
    rating: typeof obj.rating === "number" ? obj.rating : null,
    vocabulary: Array.isArray(obj.vocabulary) ? (obj.vocabulary as VocabularyItem[]) : undefined,
    grammar: obj.grammar && typeof obj.grammar === "object" ? (obj.grammar as GrammarContent) : undefined,
    readingMaterial:
      obj.readingMaterial && typeof obj.readingMaterial === "object"
        ? (obj.readingMaterial as ReadingMaterial)
        : undefined,
    exercises: Array.isArray(obj.exercises) ? (obj.exercises as Exercise[]) : undefined,
  };
}

function normalizeAiCourses(input: unknown): AiCourse[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(normalizeAiCourse)
    .filter((course): course is AiCourse => course !== null);
}

const levelLabels: Record<ProficiencyLevel, string> = {
  junior_high: "Junior High",
  senior_high: "Senior High",
  college: "College",
  advanced: "Advanced",
};

export default function MyCourses() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [courses, setCourses] = useState<AiCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<AiCourse | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const utils = trpc.useUtils();

  const { data: coursesList, isLoading } = trpc.aiCourse.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  const refreshCourses = async () => {
    await utils.aiCourse.list.invalidate();
  };

  const deleteMutation = trpc.aiCourse.delete.useMutation({
    onSuccess: async () => {
      toast.success("Course deleted.");
      setSelectedCourse(null);
      setShowDetails(false);
      await refreshCourses();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete the course.");
    },
  });

  const completeMutation = trpc.aiCourse.markCompleted.useMutation({
    onSuccess: async () => {
      toast.success("Course marked as completed.");
      await refreshCourses();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update completion status.");
    },
  });

  const rateMutation = trpc.aiCourse.rate.useMutation({
    onSuccess: async () => {
      toast.success("Rating saved.");
      await refreshCourses();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save rating.");
    },
  });

  const importSRSMutation = trpc.aiCourse.importToSRS.useMutation({
    onSuccess: async (result) => {
      toast.success(`Imported ${result.cardsImported} cards into SRS.`);
      await refreshCourses();
      setShowDetails(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to import the course into SRS.");
    },
  });

  useEffect(() => {
    setCourses(normalizeAiCourses(coursesList));
  }, [coursesList]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please sign in first.</p>
      </div>
    );
  }

  const renderRating = (rating?: number | null) =>
    rating ? "★".repeat(rating) : "Not rated";

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="text-lg font-bold">My AI courses</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </div>
      </nav>

      <div className="container py-8">
        {showDetails && selectedCourse ? (
          <div className="space-y-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowDetails(false);
                setSelectedCourse(null);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to courses
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>{selectedCourse.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Topic</p>
                    <p className="font-medium">{selectedCourse.topic || "General English"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Level</p>
                    <p className="font-medium">{levelLabels[selectedCourse.proficiencyLevel]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Generated at</p>
                    <p className="font-medium">
                      {new Date(selectedCourse.generatedAt).toLocaleString("en-US")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">
                      {selectedCourse.isCompleted ? "Completed" : "In progress"}
                    </p>
                  </div>
                </div>

                {selectedCourse.vocabulary?.length ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold">Vocabulary</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {selectedCourse.vocabulary.map((vocab) => (
                        <div
                          key={`${vocab.word}-${vocab.definition}`}
                          className="rounded-lg border border-border p-3"
                        >
                          <p className="font-bold">{vocab.word}</p>
                          {vocab.pronunciation ? (
                            <p className="text-sm italic text-muted-foreground">
                              /{vocab.pronunciation}/
                            </p>
                          ) : null}
                          <p className="mt-1 text-sm">{vocab.definition}</p>
                          {vocab.chineseTranslation ? (
                            <p className="mt-1 text-xs text-accent">
                              {vocab.chineseTranslation}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedCourse.grammar ? (
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">Grammar</h3>
                    <p className="font-medium">{selectedCourse.grammar.title || "Grammar focus"}</p>
                    <p className="text-sm">{selectedCourse.grammar.explanation}</p>
                    {selectedCourse.grammar.examples?.length ? (
                      <ul className="list-inside list-disc text-sm text-muted-foreground">
                        {selectedCourse.grammar.examples.map((example) => (
                          <li key={example}>{example}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                {selectedCourse.readingMaterial ? (
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">Reading material</h3>
                    <p className="font-medium">{selectedCourse.readingMaterial.title}</p>
                    <p className="whitespace-pre-wrap text-sm">
                      {selectedCourse.readingMaterial.content}
                    </p>
                  </div>
                ) : null}

                {selectedCourse.exercises?.length ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold">Exercises</h3>
                    {selectedCourse.exercises.map((exercise, index) => (
                      <div key={`${exercise.question}-${index}`} className="rounded-lg border border-border p-3">
                        <p className="font-medium">{exercise.question}</p>
                        {exercise.options?.length ? (
                          <div className="mt-2 space-y-1">
                            {exercise.options.map((option) => (
                              <p key={option} className="text-sm">
                                {option}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        {exercise.answer ? (
                          <p className="mt-2 text-sm text-green-600">Answer: {exercise.answer}</p>
                        ) : null}
                        {exercise.explanation ? (
                          <p className="text-sm text-muted-foreground">
                            {exercise.explanation}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-2 border-t border-border pt-4">
                  <p className="font-medium">Rate this course</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className="transition-transform hover:scale-110"
                        onClick={() => {
                          rateMutation.mutate({ courseId: selectedCourse.id, rating: star });
                          setSelectedCourse({ ...selectedCourse, rating: star });
                        }}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= (selectedCourse.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  {!selectedCourse.isCompleted ? (
                    <Button
                      disabled={completeMutation.isPending}
                      onClick={() => completeMutation.mutate({ courseId: selectedCourse.id })}
                    >
                      Mark as completed
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    disabled={importSRSMutation.isPending}
                    onClick={() => importSRSMutation.mutate({ courseId: selectedCourse.id })}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {importSRSMutation.isPending ? "Importing..." : "Import to SRS"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate({ courseId: selectedCourse.id })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete course
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Saved AI courses</h2>
              <Button asChild>
                <a href="/ai-course">Generate new course</a>
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-accent" />
              </div>
            ) : courses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="mb-4 text-muted-foreground">
                    You do not have any saved AI courses yet.
                  </p>
                  <Button asChild>
                    <a href="/ai-course">Generate your first course</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card key={course.id} className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Level</span>
                          <span className="font-medium">
                            {levelLabels[course.proficiencyLevel]}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Generated</span>
                          <span className="font-medium">
                            {new Date(course.generatedAt).toLocaleDateString("en-US")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <span
                            className={`font-medium ${
                              course.isCompleted ? "text-green-600" : "text-orange-600"
                            }`}
                          >
                            {course.isCompleted ? "Completed" : "In progress"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rating</span>
                          <span className="font-medium">{renderRating(course.rating)}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


