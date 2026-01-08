import { useState } from "react";
import { Volume2, RotateCw } from "lucide-react";
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
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const handleQuality = (quality: number) => {
    onReview(quality);
    setIsFlipped(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Flashcard */}
      <div
        className="flashcard cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="text-center">
          {!isFlipped ? (
            <div className="space-y-4">
              <div className="flashcard-front">{frontText}</div>
              {phonetic && (
                <div className="text-sm text-muted-foreground">/{phonetic}/</div>
              )}
              {audioUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm">聽發音</span>
                </button>
              )}
              <div className="text-xs text-muted-foreground mt-4">
                點擊查看答案
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flashcard-back">{backText}</div>
              {exampleSentence && (
                <div className="text-sm text-muted-foreground italic">
                  例句：{exampleSentence}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-4">
                點擊返回正面
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Buttons */}
      {isFlipped && (
        <div className="flex gap-2 flex-wrap justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuality(0)}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700"
          >
            忘記 (0)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuality(1)}
            disabled={isLoading}
            className="text-orange-600 hover:text-orange-700"
          >
            困難 (1)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuality(2)}
            disabled={isLoading}
            className="text-yellow-600 hover:text-yellow-700"
          >
            有點難 (2)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuality(3)}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700"
          >
            勉強記得 (3)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuality(4)}
            disabled={isLoading}
            className="text-green-600 hover:text-green-700"
          >
            記得 (4)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuality(5)}
            disabled={isLoading}
            className="text-emerald-600 hover:text-emerald-700"
          >
            完美 (5)
          </Button>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-muted-foreground text-center">
        根據 SM-2 演算法，您的評分將決定下次複習的時間
      </div>
    </div>
  );
}
