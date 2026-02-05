import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AICourseGenerator() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [proficiencyLevel, setProficiencyLevel] = useState("junior_high");
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate course mutation
  const generateMutation = trpc.aiCourse.generate.useMutation({
    onSuccess: () => {
      toast.success("課程生成成功！");
      setIsGenerating(false);
      setTopic("");
      setTimeout(() => setLocation("/my-courses"), 1000);
    },
    onError: (error: any) => {
      toast.error(error.message || "課程生成失敗");
      setIsGenerating(false);
    },
  });

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("請輸入課程主題");
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate({
      proficiencyLevel: proficiencyLevel as any,
      topic: topic.trim(),
    });
  };

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
            <span className="text-lg font-bold">AI 課程生成</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首頁
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle>使用 AI 生成自訂英文課程</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                使用本地 Ollama AI 模型，根據您的英文程度和感興趣的主題，自動生成完整的英文課程。課程包含：
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>精選詞彙與短語（含發音、定義、中文翻譯）</li>
                <li>文法解釋與示例</li>
                <li>主題相關的閱讀材料</li>
                <li>互動練習題與答案</li>
              </ul>
            </CardContent>
          </Card>

          {/* Generation Form */}
          <Card>
            <CardHeader>
              <CardTitle>課程設置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Proficiency Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">英文程度</label>
                <Select value={proficiencyLevel} onValueChange={setProficiencyLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior_high">國中程度</SelectItem>
                    <SelectItem value="senior_high">高中程度</SelectItem>
                    <SelectItem value="college">大學程度</SelectItem>
                    <SelectItem value="advanced">進階程度</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Topic Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">課程主題</label>
                <Input
                  placeholder="例如：旅遊、美食、科技、運動..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  輸入您想學習的主題，AI 將根據該主題生成相關的英文課程。
                </p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full h-12 text-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    生成中... (約 30 秒)
                  </>
                ) : (
                  "生成課程"
                )}
              </Button>

              {isGenerating && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    ⏳ 正在使用 AI 生成課程，請耐心等候...
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    首次生成可能需要下載模型，可能需要更長時間。
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>提示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                ✨ <strong>具體主題效果更好：</strong> 例如「商務英文會議」比「商務」更具體，生成的課程品質更高。
              </p>
              <p>
                ⚡ <strong>生成時間：</strong> 首次生成需要下載 AI 模型，可能需要 1-2 分鐘。後續生成會更快。
              </p>
              <p>
                📚 <strong>課程保存：</strong> 生成的課程會自動保存，您可以在「我的課程」頁面查看、編輯和評分。
              </p>
              <p>
                🔄 <strong>導入 SRS：</strong> 課程中的詞彙可以導入到 SRS 系統進行複習。
              </p>
            </CardContent>
          </Card>

          {/* View My Courses Link */}
          <div className="text-center">
            <Button variant="outline" asChild>
              <a href="/my-courses">查看已生成的課程</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
