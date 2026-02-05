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
  Edit2,
  Download,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface AiCourse {
  id: number;
  title: string;
  topic?: string;
  proficiencyLevel: string;
  generatedAt: string;
  isCompleted: boolean;
  rating?: number;
  notes?: string;
  vocabulary?: any[];
  grammar?: any;
  readingMaterial?: any;
  exercises?: any[];
}

export default function MyCourses() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [courses, setCourses] = useState<AiCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<AiCourse | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch courses
  const { data: coursesList, isLoading } = trpc.aiCourse.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  // Delete course mutation
  const deleteMutation = trpc.aiCourse.delete.useMutation({
    onSuccess: () => {
      toast.success("課程已刪除");
      // Refresh the list
      if (coursesList) {
        setCourses(coursesList.filter((c) => c.id !== selectedCourse?.id));
      }
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
      if (selectedCourse) {
        setSelectedCourse({ ...selectedCourse, isCompleted: true });
      }
    },
    onError: (error) => {
      toast.error(error.message || "標記失敗");
    },
  });

  // Rate course mutation
  const rateMutation = trpc.aiCourse.rate.useMutation({
    onSuccess: () => {
      toast.success("評分已保存");
    },
    onError: (error) => {
      toast.error(error.message || "評分失敗");
    },
  });

  // Add notes mutation
  const notesMutation = trpc.aiCourse.addNotes.useMutation({
    onSuccess: () => {
      toast.success("筆記已保存");
    },
    onError: (error) => {
      toast.error(error.message || "保存失敗");
    },
  });

  useEffect(() => {
    if (coursesList) {
      setCourses(coursesList);
    }
  }, [coursesList]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>請先登入</p>
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
            <span className="text-lg font-bold">我的課程</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首頁
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-8">
        {showDetails && selectedCourse ? (
          // Course Details View
          <div className="space-y-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowDetails(false);
                setSelectedCourse(null);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回列表
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>{selectedCourse.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Course Metadata */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">主題</p>
                    <p className="font-medium">{selectedCourse.topic || "未指定"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">程度</p>
                    <p className="font-medium">
                      {selectedCourse.proficiencyLevel === "junior_high"
                        ? "國中程度"
                        : selectedCourse.proficiencyLevel === "senior_high"
                          ? "高中程度"
                          : selectedCourse.proficiencyLevel === "college"
                            ? "大學程度"
                            : "進階程度"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">生成時間</p>
                    <p className="font-medium">
                      {new Date(selectedCourse.generatedAt).toLocaleString("zh-TW")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">狀態</p>
                    <p className="font-medium">
                      {selectedCourse.isCompleted ? "✓ 已完成" : "進行中"}
                    </p>
                  </div>
                </div>

                {/* Vocabulary */}
                {selectedCourse.vocabulary && selectedCourse.vocabulary.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg">詞彙</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {selectedCourse.vocabulary.map((vocab: any, idx: number) => (
                        <div key={idx} className="border border-border rounded-lg p-3">
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
                {selectedCourse.grammar && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">文法</h3>
                    <p className="font-medium">{selectedCourse.grammar.title}</p>
                    <p className="text-sm">{selectedCourse.grammar.explanation}</p>
                  </div>
                )}

                {/* Reading Material */}
                {selectedCourse.readingMaterial && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">閱讀材料</h3>
                    <p className="font-medium">{selectedCourse.readingMaterial.title}</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedCourse.readingMaterial.content}
                    </p>
                  </div>
                )}

                {/* Exercises */}
                {selectedCourse.exercises && selectedCourse.exercises.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg">練習題</h3>
                    {selectedCourse.exercises.map((exercise: any, idx: number) => (
                      <div key={idx} className="border border-border rounded-lg p-3">
                        <p className="font-medium">{exercise.question}</p>
                        {exercise.options && (
                          <div className="mt-2 space-y-1">
                            {exercise.options.map((option: string, optIdx: number) => (
                              <p
                                key={optIdx}
                                className={`text-sm ${
                                  option.startsWith(exercise.answer)
                                    ? "text-green-600 font-medium"
                                    : ""
                                }`}
                              >
                                {option}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Rating */}
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="font-medium">評分</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => {
                          rateMutation.mutate({
                            courseId: selectedCourse.id,
                            rating: star,
                          });
                          setSelectedCourse({
                            ...selectedCourse,
                            rating: star,
                          });
                        }}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (selectedCourse.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-border pt-4">
                  {!selectedCourse.isCompleted && (
                    <Button
                      onClick={() =>
                        completeMutation.mutate({
                          courseId: selectedCourse.id,
                        })
                      }
                      disabled={completeMutation.isPending}
                    >
                      標記為完成
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement import to SRS
                      alert("導入 SRS 功能開發中...");
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    導入 SRS
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      deleteMutation.mutate({
                        courseId: selectedCourse.id,
                      })
                    }
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    刪除課程
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Courses List View
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">已生成的課程</h2>
              <Button asChild>
                <a href="/ai-course">生成新課程</a>
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              </div>
            ) : courses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">還沒有生成任何課程</p>
                  <Button asChild>
                    <a href="/ai-course">立即生成課程</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">
                        {course.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">程度:</span>
                          <span className="font-medium">
                            {course.proficiencyLevel === "junior_high"
                              ? "國中"
                              : course.proficiencyLevel === "senior_high"
                                ? "高中"
                                : course.proficiencyLevel === "college"
                                  ? "大學"
                                  : "進階"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">生成時間:</span>
                          <span className="font-medium">
                            {new Date(course.generatedAt).toLocaleDateString(
                              "zh-TW"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">狀態:</span>
                          <span
                            className={`font-medium ${
                              course.isCompleted
                                ? "text-green-600"
                                : "text-orange-600"
                            }`}
                          >
                            {course.isCompleted ? "✓ 已完成" : "進行中"}
                          </span>
                        </div>
                        {course.rating && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">評分:</span>
                            <span className="font-medium">
                              {"⭐".repeat(course.rating)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCourse(course);
                            setShowDetails(true);
                          }}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCourse(course);
                            setShowDetails(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
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
