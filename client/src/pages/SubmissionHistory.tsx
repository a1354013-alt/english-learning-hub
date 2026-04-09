import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";

interface SubmissionItem {
  id: number;
  content: string;
  feedback: string | null;
  score: number | null;
  xpEarned: number;
  createdAt: Date;
}

export default function SubmissionHistory() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: submissions, isLoading } = trpc.writing.listSubmissions.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please sign in first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="text-lg font-bold">Submission history</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/writing")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to writing
          </Button>
        </div>
      </nav>

      <div className="container space-y-6 py-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Writing submissions</h1>
          <p className="text-muted-foreground">
            Review previous drafts, AI feedback, and the XP earned from each submission.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-accent" />
          </div>
        ) : !submissions?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No writing submissions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission: SubmissionItem) => (
              <Card key={submission.id} className="overflow-hidden">
                <div
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() =>
                    setExpandedId((current) =>
                      current === submission.id ? null : submission.id
                    )
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <CardTitle className="text-base">
                            {new Date(submission.createdAt).toLocaleDateString("en-US")}
                          </CardTitle>
                          <span className="rounded bg-accent/20 px-2 py-1 text-xs text-accent">
                            Score: {submission.score ?? "-"}
                          </span>
                          <span className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-600">
                            +{submission.xpEarned} XP
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {submission.content}
                        </p>
                      </div>
                      <div>
                        {expandedId === submission.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </div>

                {expandedId === submission.id ? (
                  <CardContent className="space-y-4 border-t border-border pt-4">
                    <div>
                      <h4 className="mb-2 font-semibold">Submitted writing</h4>
                      <div className="rounded bg-muted p-3 text-sm whitespace-pre-wrap">
                        {submission.content}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 font-semibold">AI feedback</h4>
                      <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-950">
                        {submission.feedback || "No feedback stored for this submission."}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center">
                        <p className="mb-1 text-xs text-muted-foreground">Score</p>
                        <p className="text-lg font-bold">{submission.score ?? "-"}</p>
                      </div>
                      <div className="text-center">
                        <p className="mb-1 text-xs text-muted-foreground">XP earned</p>
                        <p className="text-lg font-bold text-green-600">+{submission.xpEarned}</p>
                      </div>
                      <div className="text-center">
                        <p className="mb-1 text-xs text-muted-foreground">Submitted at</p>
                        <p className="text-xs">
                          {new Date(submission.createdAt).toLocaleTimeString("en-US")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
