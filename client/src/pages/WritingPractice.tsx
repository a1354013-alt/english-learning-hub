import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export default function WritingPractice() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [content, setContent] = useState("");
  const [hasChecked, setHasChecked] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    score: number;
    feedback: string;
    corrections: GrammarCorrection[];
    suggestions: string[];
  } | null>(null);

  // Fetch today's writing challenge
  const { data: challenge, isLoading: challengeLoading } = trpc.writing.getTodayChallenge.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Grammar check mutation
  const grammarCheckMutation = trpc.writing.checkGrammar.useMutation({
    onSuccess: (result) => {
      setCheckResult(result);
      setHasChecked(true);
      
      if (result.corrections.length === 0) {
        toast.success("未發現文法錯誤！");
      } else {
        toast.info(`發現 ${result.corrections.length} 個需要改進的地方`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "文法檢查失敗");
    },
  });

  // Submit writing mutation
  const submitMutation = trpc.writing.submit.useMutation({
    onSuccess: (result) => {
      toast.success(`已提交！獲得 ${result.xpEarned} XP，評分 ${result.score} 分`);
      setContent("");
      setHasChecked(false);
      setCheckResult(null);
    },
    onError: (error) => {
      toast.error(error.message || "提交失敗");
    },
  });

  const handleCheckGrammar = async () => {
    if (content.length < 10) {
      toast.error("請至少寫 10 個字以上");
      return;
    }

    grammarCheckMutation.mutate({ content });
  };

  const handleSubmit = async () => {
    if (!challenge) {
      toast.error("無法取得寫作挑戰");
      return;
    }

    if (content.length < 10) {
      toast.error("請至少寫 10 個字以上");
      return;
    }

    submitMutation.mutate({
      challengeId: challenge.id,
      content,
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
      <div className="container py-8 space-y-8 max-w-4xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">寫作練習</h1>
          <p className="text-muted-foreground">
            完成每日寫作挑戰，獲得 XP 並改進您的英文寫作能力。
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Writing Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Challenge Card */}
            {challengeLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">加載挑戰中...</p>
                </CardContent>
              </Card>
            ) : challenge ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">主題</p>
                    <p className="text-foreground">{challenge.topic}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">提示</p>
                    <p className="text-foreground">{challenge.prompt}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">難度等級</p>
                    <p className="text-foreground">{challenge.proficiencyLevel.replace(/_/g, " ")}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">無法加載挑戰</p>
                </CardContent>
              </Card>
            )}

            {/* Writing Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">您的寫作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="在此輸入您的英文寫作..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-64"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleCheckGrammar}
                    disabled={grammarCheckMutation.isPending || content.length < 10}
                    variant="outline"
                    className="flex-1"
                  >
                    檢查文法
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending || content.length < 10}
                    className="flex-1"
                  >
                    提交寫作
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  字數：{content.length} / 最少 10 字
                </p>
              </CardContent>
            </Card>

            {/* Grammar Check Results */}
            {hasChecked && checkResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {checkResult.corrections.length === 0 ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        檢查完成
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        發現 {checkResult.corrections.length} 個改進點
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">整體反饋</p>
                    <p className="text-foreground">{checkResult.feedback}</p>
                  </div>

                  {checkResult.corrections.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-3">語法糾正</p>
                      <div className="space-y-3">
                        {checkResult.corrections.map((correction, idx) => (
                          <div key={idx} className="p-3 bg-muted rounded-lg space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-mono bg-red-100 text-red-800 px-2 py-1 rounded">
                                {correction.original}
                              </span>
                              <span className="text-sm">→</span>
                              <span className="text-sm font-mono bg-green-100 text-green-800 px-2 py-1 rounded">
                                {correction.corrected}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{correction.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {checkResult.suggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">改進建議</p>
                      <ul className="space-y-2">
                        {checkResult.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-sm text-foreground flex gap-2">
                            <span className="text-accent">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">寫作統計</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">字數</p>
                  <p className="text-2xl font-bold">{content.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">單詞數</p>
                  <p className="text-2xl font-bold">{content.split(/\s+/).filter(w => w.length > 0).length}</p>
                </div>
                {checkResult && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">評分</p>
                    <p className="text-2xl font-bold text-accent">{checkResult.score}/100</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">寫作提示</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>使用完整句子</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>檢查時態一致性</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>注意標點符號</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>檢查主謂一致</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
