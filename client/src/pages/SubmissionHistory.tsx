import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";

// Infer SubmissionItem type from tRPC query output
type SubmissionItem = {
  id: number;
  userId: number;
  challengeId: number;
  content: string;
  feedback: string | null;
  errors: unknown;
  score: number | null;
  xpEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function SubmissionHistory() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Fetch submission history
  const { data: submissions, isLoading } = trpc.writing.listSubmissions.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

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
            <span className="text-lg font-bold">提交歷史</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/writing")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回寫作
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">寫作提交歷史</h1>
          <p className="text-muted-foreground">
            查看您過去的所有寫作提交記錄
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : !submissions || submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">還沒有提交記錄</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission: SubmissionItem) => (
              <Card key={submission.id} className="overflow-hidden">
                <div
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === submission.id ? null : submission.id)
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-base">
                            {new Date(submission.createdAt).toLocaleDateString("zh-TW")}
                          </CardTitle>
                          <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">
                            評分: {submission.score}/100
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-600 rounded">
                            +{submission.xpEarned} XP
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {submission.content}
                        </p>
                      </div>
                      <div className="ml-4">
                        {expandedId === submission.id ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </div>

                {expandedId === submission.id && (
                  <CardContent className="space-y-4 border-t border-border pt-4">
                    <div>
                      <h4 className="font-semibold mb-2">您的內容</h4>
                      <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                        {submission.content}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">反饋</h4>
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded text-sm">
                        {submission.feedback}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">評分</p>
                        <p className="text-lg font-bold">{submission.score}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">XP 獲得</p>
                        <p className="text-lg font-bold text-green-600">+{submission.xpEarned}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">提交時間</p>
                        <p className="text-xs">
                          {new Date(submission.createdAt).toLocaleTimeString("zh-TW")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
