import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlashCardProps {
  frontText: string;
  backText: string;
  phonetic?: string;
  audioUrl?: string;
  exampleSentence?: string;
  onReview: (quality: number) => void;
  isLoading?: boolean;
}

const QUALITY_LABELS = [
  "Forgot",
  "Very hard",
  "Hard",
  "Okay",
  "Good",
  "Perfect",
] as const;

export function FlashCard({
  frontText,
  backText,
  phonetic,
  audioUrl,
  exampleSentence,
  onReview,
  isLoading = false,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const playAudio = () => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    void audio.play();
  };

  const handleQuality = (quality: number) => {
    onReview(quality);
    setIsFlipped(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="flashcard cursor-pointer"
        onClick={() => setIsFlipped((value) => !value)}
      >
        <div className="text-center">
          {!isFlipped ? (
            <div className="space-y-4">
              <div className="flashcard-front">{frontText}</div>
              {phonetic ? (
                <div className="text-sm text-muted-foreground">/{phonetic}/</div>
              ) : null}
              {audioUrl ? (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    playAudio();
                  }}
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1 text-sm text-accent-foreground transition-opacity hover:opacity-90"
                >
                  <Volume2 className="h-4 w-4" />
                  Play audio
                </button>
              ) : null}
              <div className="text-xs text-muted-foreground">
                Click to reveal the answer
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flashcard-back">{backText}</div>
              {exampleSentence ? (
                <div className="text-sm italic text-muted-foreground">
                  Example: {exampleSentence}
                </div>
              ) : null}
              <div className="text-xs text-muted-foreground">
                Rate how well you remembered it
              </div>
            </div>
          )}
        </div>
      </div>

      {isFlipped ? (
        <div className="flex flex-wrap justify-center gap-2">
          {QUALITY_LABELS.map((label, index) => (
            <Button
              key={label}
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => handleQuality(index)}
            >
              {label} ({index})
            </Button>
          ))}
        </div>
      ) : null}

      <div className="text-center text-xs text-muted-foreground">
        Reviews are scored with the SM-2 algorithm to schedule your next card.
      </div>
    </div>
  );
}
