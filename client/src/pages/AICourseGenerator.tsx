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
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type ProficiencyLevel = "junior_high" | "senior_high" | "college" | "advanced";

export default function AICourseGenerator() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [proficiencyLevel, setProficiencyLevel] =
    useState<ProficiencyLevel>("junior_high");
  const [topic, setTopic] = useState("");

  const generateMutation = trpc.aiCourse.generate.useMutation({
    onSuccess: () => {
      toast.success("Course generated successfully.");
      setTopic("");
      setTimeout(() => setLocation("/my-courses"), 600);
    },
    onError: error => {
      toast.error(error.message || "Failed to generate the course.");
    },
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Please enter a study topic.");
      return;
    }

    generateMutation.mutate({
      proficiencyLevel,
      topic: topic.trim(),
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
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="text-lg font-bold">AI Course Generator</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </div>
      </nav>

      <div className="container py-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Create a focused course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Generate a level-appropriate mini course with vocabulary,
                grammar, reading material, and exercises.
              </p>
              <ul className="list-inside list-disc space-y-2">
                <li>Pick a target difficulty level.</li>
                <li>Describe a clear topic or scenario.</li>
                <li>
                  Review the generated course later or import it into SRS.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generation settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty level</label>
                <Select
                  value={proficiencyLevel}
                  onValueChange={value =>
                    setProficiencyLevel(value as ProficiencyLevel)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior_high">Junior High</SelectItem>
                    <SelectItem value="senior_high">Senior High</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Topic</label>
                <Input
                  placeholder="Examples: travel English, job interviews, restaurant conversations"
                  value={topic}
                  onChange={event => setTopic(event.target.value)}
                  disabled={generateMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  More specific topics usually produce more useful courses.
                </p>
              </div>

              <Button
                className="h-12 w-full text-lg"
                disabled={generateMutation.isPending || !topic.trim()}
                onClick={handleGenerate}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating course...
                  </>
                ) : (
                  "Generate course"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
