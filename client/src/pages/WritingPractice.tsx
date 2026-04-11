import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, BookOpen, CheckCircle } from "lucide-react";
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

  const { data: challenge, isLoading: challengeLoading } =
    trpc.writing.getTodayChallenge.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const grammarCheckMutation = trpc.writing.checkGrammar.useMutation({
    onSuccess: (result) => {
      setCheckResult(result);
      setHasChecked(true);

      if (result.corrections.length === 0) {
        toast.success("No corrections found.");
      } else {
        toast.info(`Found ${result.corrections.length} possible corrections.`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to check grammar.");
    },
  });

  const submitMutation = trpc.writing.submit.useMutation({
    onSuccess: (result) => {
      toast.success(`Submission saved. +${result.xpEarned} XP, score ${result.score}.`);
      setContent("");
      setHasChecked(false);
      setCheckResult(null);
      setTimeout(() => setLocation("/submission-history"), 400);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit writing.");
    },
  });

  const handleCheckGrammar = () => {
    if (content.trim().length < 10) {
      toast.error("Please write at least 10 characters.");
      return;
    }

    grammarCheckMutation.mutate({ content });
  };

  const handleSubmit = () => {
    if (!challenge) {
      toast.error("No challenge is available right now.");
      return;
    }

    if (content.trim().length < 10) {
      toast.error("Please write at least 10 characters.");
      return;
    }

    submitMutation.mutate({
      challengeId: challenge.id,
      content,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please sign in first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl space-y-8 py-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Writing practice</h1>
          <p className="text-muted-foreground">
            Draft a response, check grammar, and submit your work for scoring and feedback.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {challengeLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Loading daily prompt...</p>
                </CardContent>
              </Card>
            ) : challenge ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-muted-foreground">Topic</p>
                    <p>{challenge.topic}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-muted-foreground">Prompt</p>
                    <p>{challenge.prompt}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-muted-foreground">Level</p>
                    <p>{challenge.proficiencyLevel.replace(/_/g, " ")}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No writing challenge is available.</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your draft</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  className="min-h-64"
                  placeholder="Write your response here..."
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    disabled={grammarCheckMutation.isPending || content.trim().length < 10}
                    onClick={handleCheckGrammar}
                  >
                    Check grammar
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={submitMutation.isPending || content.trim().length < 10}
                    onClick={handleSubmit}
                  >
                    Submit writing
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Character count: {content.length}
                </p>
              </CardContent>
            </Card>

            {hasChecked && checkResult ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {checkResult.corrections.length === 0 ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Grammar check passed
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        {checkResult.corrections.length} suggested corrections
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-muted-foreground">
                      Overall feedback
                    </p>
                    <p>{checkResult.feedback}</p>
                  </div>

                  {checkResult.corrections.length ? (
                    <div>
                      <p className="mb-3 text-sm font-semibold text-muted-foreground">
                        Corrections
                      </p>
                      <div className="space-y-3">
                        {checkResult.corrections.map((correction, index) => (
                          <div key={`${correction.original}-${index}`} className="space-y-2 rounded-lg bg-muted p-3">
                            <div className="flex items-start gap-2">
                              <span className="rounded bg-red-100 px-2 py-1 font-mono text-sm text-red-800">
                                {correction.original}
                              </span>
                              <span className="text-sm">to</span>
                              <span className="rounded bg-green-100 px-2 py-1 font-mono text-sm text-green-800">
                                {correction.corrected}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {correction.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {checkResult.suggestions.length ? (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-muted-foreground">
                        Suggestions
                      </p>
                      <ul className="space-y-2">
                        {checkResult.suggestions.map((suggestion) => (
                          <li key={suggestion} className="flex gap-2 text-sm">
                            <span className="text-accent">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Draft stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Characters</p>
                  <p className="text-2xl font-bold">{content.length}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Words</p>
                  <p className="text-2xl font-bold">
                    {content.split(/\s+/).filter((word) => word.length > 0).length}
                  </p>
                </div>
                {checkResult ? (
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Score</p>
                    <p className="text-2xl font-bold text-accent">{checkResult.score}/100</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Writing tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Use complete sentences with clear subjects and verbs.</li>
                  <li>Check for repeated wording and overly short answers.</li>
                  <li>Support your ideas with examples when possible.</li>
                  <li>Run grammar check before submitting if you are unsure.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
