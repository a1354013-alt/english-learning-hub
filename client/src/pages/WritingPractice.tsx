import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

interface GrammarError {
  position: number;
  error: string;
  suggestion: string;
}

export default function WritingPractice() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<GrammarError[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const dailyPrompt =
    "Write about your daily routine and what you did today. (Write at least 100 words)";

  const handleCheckGrammar = async () => {
    setIsChecking(true);
    // Simulate API call to LanguageTool
    setTimeout(() => {
      // Mock errors for demonstration
      const mockErrors: GrammarError[] = [];
      if (content.includes("I go")) {
        mockErrors.push({
          position: content.indexOf("I go"),
          error: "Tense inconsistency",
          suggestion: "Consider using 'I went' if referring to past",
        });
      }
      setErrors(mockErrors);
      setHasChecked(true);
      setIsChecking(false);
    }, 1000);
  };

  const handleSubmit = () => {
    if (content.length < 100) {
      alert("Please write at least 100 words");
      return;
    }
    // Submit to backend
    alert("Writing submitted successfully!");
    setContent("");
    setErrors([]);
    setHasChecked(false);
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
          <h1 className="text-3xl font-bold">Daily Writing Challenge</h1>
          <p className="text-muted-foreground">
            Improve your writing skills with daily prompts and real-time grammar checking.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Writing Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Today's Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed">{dailyPrompt}</p>
              </CardContent>
            </Card>

            {/* Writing Area */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Writing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Start writing here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-64 resize-none"
                />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {content.length} characters | {content.split(/\s+/).filter(w => w).length} words
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCheckGrammar}
                      disabled={isChecking || content.length === 0}
                    >
                      {isChecking ? "Checking..." : "Check Grammar"}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={content.length < 100}
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Grammar Errors */}
            {hasChecked && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {errors.length === 0 ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        No Errors Found
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        {errors.length} Issue{errors.length !== 1 ? "s" : ""} Found
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                {errors.length > 0 && (
                  <CardContent className="space-y-3">
                    {errors.map((error, idx) => (
                      <div key={idx} className="space-y-1 pb-3 border-b last:border-b-0">
                        <p className="text-sm font-medium text-yellow-700">
                          {error.error}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {error.suggestion}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Writing Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Use Past Tense</p>
                  <p className="text-muted-foreground">
                    When describing what you did, use past tense consistently.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Check Punctuation</p>
                  <p className="text-muted-foreground">
                    Ensure proper use of periods, commas, and apostrophes.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Vary Sentence Structure</p>
                  <p className="text-muted-foreground">
                    Mix simple and complex sentences for better readability.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submissions</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Score</span>
                  <span className="font-semibold">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Streak</span>
                  <span className="font-semibold">0 days</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
