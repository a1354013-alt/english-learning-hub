import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Trash2,
  Eye,
  Star,
  ArrowLeft,

  Download,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// Use tRPC inferred type for courses from aiCourse.list query
// Inferred from server/db.ts getAiCourses return type
type AiCourse = {
  id: number;
  userId: number;
  title: string;
  topic: string | undefined;
  description: string | null;
  proficiencyLevel: "junior_high" | "senior_high" | "college" | "advanced";
  generatedAt: Date;
  isCompleted: boolean;
  rating: number | null;
  vocabulary: unknown[];
  grammar: Record<string, unknown>;
  readingMaterial: Record<string, unknown>;
  exercises: unknown[];
  createdAt: Date;
  updatedAt: Date;
};

interface VocabularyItem {
  word: string;
  definition: string;
  chineseTranslation: string;
  pronunciation?: string;
  example?: string;
  usage?: string;
}

interface GrammarContent {
  title?: string;
  topic?: string;
  explanation: string;
  examples?: string[];
}

interface ReadingMaterial {
  title: string;
  content: string;
  difficulty: string;
}

interface Exercise {
  type?: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  answer?: string;
  explanation?: string;
}

type ProficiencyLevel = "junior_high" | "senior_high" | "college" | "advanced";

export default function MyCourses() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [courses, setCourses] = useState<AiCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<AiCourse | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const utils = trpc.useUtils();

  // Fetch courses
  const { data: coursesList, isLoading } = trpc.aiCourse.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  // Delete course mutation
  const deleteMutation = trpc.aiCourse.delete.useMutation({
    onSuccess: () => {
      toast.success("課程已刪除");
      utils.aiCourse.list.invalidate();
      setSelectedCourse(null);
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  // Mark completed mutation
  const completeMutation = trpc.aiCourse.markCompleted.useMutation({
    onSuccess: () => {
      toast.success("課程已標記為完成");
      utils.aiCourse.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "標記失敗");
    },
  });

  // Rate course mutation
  const rateMutation = trpc.aiCourse.rate.useMutation({
    onSuccess: () => {
      toast.success("評分已保存");
      utils.aiCourse.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "評分失敗");
    },
  });

  // Import SRS mutation
  const importSRSMutation = trpc.aiCourse.importToSRS.useMutation({
    onSuccess: () => {
      toast.success("詞彙已導入 SRS 系統");
      utils.aiCourse.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "導入失敗");
    },
  });

  useEffect(() => {
    if (coursesList) {
      // coursesList is already properly typed from tRPC query
      setCourses(coursesList);
    }
  }, [coursesList]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">請先登入</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {!showDetails ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">我的課程</h1>
              <p className="text-muted-foreground">
                查看和管理您生成的所有英文學習課程
              </p>
            </div>

            {courses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      還沒有課程。前往 AI 課程生成器建立您的第一個課程！
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card
                    key={course.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          {course.topic || "無特定主題"}
                        </p>
                        <p className="text-muted-foreground">
                          難度: {course.proficiencyLevel}
                        </p>
                        <p className="text-muted-foreground">
                          {course.isCompleted ? "✓ 已完成" : "未完成"}
                        </p>
                        {course.rating !== null && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < course.rating!
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        查看詳情
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : selectedCourse ? (
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDetails(false);
                setSelectedCourse(null);
              }}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>{selectedCourse.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">主題</p>
                    <p className="text-muted-foreground">
                      {selectedCourse.topic || "無特定主題"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">難度</p>
                    <p className="text-muted-foreground">
                      {selectedCourse.proficiencyLevel}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">狀態</p>
                    <p className="text-muted-foreground">
                      {selectedCourse.isCompleted ? "✓ 已完成" : "未完成"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">生成時間</p>
                    <p className="text-muted-foreground">
                      {new Date(selectedCourse.generatedAt).toLocaleDateString(
                        "zh-TW"
                      )}
                    </p>
                  </div>
                </div>

                {/* Vocabulary */}
                {Array.isArray(selectedCourse.vocabulary) &&
                  selectedCourse.vocabulary.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-lg">詞彙</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {selectedCourse.vocabulary.map((vocab: any, idx: number) => (
                          <div
                            key={idx}
                            className="border border-border rounded-lg p-3"
                          >
                            <p className="font-bold">{vocab.word}</p>
                            <p className="text-sm text-muted-foreground italic">
                              /{vocab.pronunciation}/
                            </p>
                            <p className="text-sm mt-1">{vocab.definition}</p>
                            <p className="text-xs text-accent mt-1">
                              {vocab.chineseTranslation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Grammar */}
                {selectedCourse.grammar &&
                  typeof selectedCourse.grammar === "object" &&
                  "explanation" in selectedCourse.grammar && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg">文法</h3>
                      <p className="font-medium">
                        {typeof (selectedCourse.grammar as Record<string, unknown>).topic === "string" ? String((selectedCourse.grammar as Record<string, unknown>).topic) :
                          typeof (selectedCourse.grammar as Record<string, unknown>).title === "string" ? String((selectedCourse.grammar as Record<string, unknown>).title) : ""}
                      </p>
                      <p className="text-sm">
                        {typeof (selectedCourse.grammar as Record<string, unknown>).explanation === "string" ? String((selectedCourse.grammar as Record<string, unknown>).explanation) : ""}
                      </p>
                    </div>
                  )}

                {/* Reading Material */}
                {selectedCourse.readingMaterial &&
                  typeof selectedCourse.readingMaterial === "object" &&
                  "title" in selectedCourse.readingMaterial && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg">閱讀材料</h3>
                      <p className="font-medium">
                        {typeof (selectedCourse.readingMaterial as Record<string, unknown>).title === "string" ? String((selectedCourse.readingMaterial as Record<string, unknown>).title) : ""}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {typeof (selectedCourse.readingMaterial as Record<string, unknown>).content === "string" ? String((selectedCourse.readingMaterial as Record<string, unknown>).content) : ""}
                      </p>
                    </div>
                  )}

                {/* Exercises */}
                {Array.isArray(selectedCourse.exercises) &&
                  selectedCourse.exercises.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-lg">練習題</h3>
                      {selectedCourse.exercises.map((exercise: unknown, idx: number) => {
                        const ex = exercise as Record<string, unknown>;
                        return (
                          <div
                            key={idx}
                            className="border border-border rounded-lg p-3"
                          >
                            <p className="font-medium">{typeof ex.question === "string" ? String(ex.question) : ""}</p>
                            {Array.isArray(ex.options) && Array.isArray(ex.options) && (
                              <div className="mt-2 space-y-1">
                                {(ex.options as string[]).map(
                                  (option: string, optIdx: number) => (
                                    <p
                                      key={optIdx}
                                      className="text-sm text-muted-foreground"
                                    >
                                      {String.fromCharCode(65 + optIdx)}.{" "}
                                      {option}
                                    </p>
                                  )
                                )}
                              </div>
                            )}
                            {typeof ex.explanation === "string" && (
                              <p className="text-xs text-accent mt-2">
                                解釋: {String(ex.explanation)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  {!selectedCourse.isCompleted && (
                    <Button
                      onClick={() => {
                        completeMutation.mutate({
                          courseId: selectedCourse.id,
                        });
                      }}
                      disabled={completeMutation.isPending}
                    >
                      標記為完成
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (
                        !selectedCourse?.vocabulary ||
                        !Array.isArray(selectedCourse.vocabulary) ||
                        selectedCourse.vocabulary.length === 0
                      ) {
                        toast.error("此課程沒有詞彙可導入");
                        return;
                      }

                      importSRSMutation.mutate({
                        courseId: selectedCourse.id,
                      });
                    }}
                    disabled={importSRSMutation.isPending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    導入 SRS
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (
                        confirm("確定要刪除此課程嗎？此操作無法撤銷。")
                      ) {
                        deleteMutation.mutate({
                          courseId: selectedCourse.id,
                        });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    刪除
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
