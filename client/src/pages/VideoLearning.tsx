import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft, Volume2 } from "lucide-react";
import { useLocation } from "wouter";

interface Subtitle {
  start: number;
  duration: number;
  text: string;
}

export default function VideoLearning() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Mock video data
  const videoId = "dQw4w9WgXcQ"; // YouTube video ID
  const subtitles: Subtitle[] = [
    {
      start: 0,
      duration: 3,
      text: "Welcome to English Learning Hub",
    },
    {
      start: 3,
      duration: 3,
      text: "Today we will learn about common English phrases",
    },
    {
      start: 6,
      duration: 3,
      text: "Let's start with the phrase 'How are you?'",
    },
  ];

  const mockDictionary: Record<string, string> = {
    Welcome: "歡迎；受歡迎",
    Learning: "學習",
    Hub: "中心；樞紐",
    common: "常見的；普通的",
    English: "英文；英語",
    phrases: "短語；片語",
    start: "開始",
    learn: "學習",
    about: "關於",
  };

  const handleWordClick = (word: string) => {
    setSelectedWord(word);
  };

  const addToCards = () => {
    if (selectedWord) {
      alert(`Added "${selectedWord}" to your flashcards!`);
      setSelectedWord(null);
    }
  };

  const playAudio = (word: string) => {
    // In a real app, this would use text-to-speech API
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
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
          <h1 className="text-3xl font-bold">Immersive Video Learning</h1>
          <p className="text-muted-foreground">
            Watch videos with synchronized subtitles. Click on any word to see its definition.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* YouTube Embed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Video Player</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </CardContent>
            </Card>

            {/* Subtitles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Subtitles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {subtitles.map((subtitle, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg transition-colors ${
                      currentTime >= subtitle.start &&
                      currentTime < subtitle.start + subtitle.duration
                        ? "bg-accent/20 border-l-4 border-accent"
                        : "bg-muted/50"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">
                      {subtitle.text.split(/\s+/).map((word, wordIdx) => (
                        <span
                          key={wordIdx}
                          onClick={() => handleWordClick(word.replace(/[.,!?;:]/g, ""))}
                          className="cursor-pointer hover:bg-accent/30 px-1 rounded transition-colors"
                        >
                          {word}{" "}
                        </span>
                      ))}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dictionary Lookup */}
            {selectedWord && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Word Definition</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-lg font-bold">{selectedWord}</p>
                    <p className="text-sm text-muted-foreground">
                      {mockDictionary[selectedWord] || "Definition not found"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => playAudio(selectedWord)}
                      className="flex-1"
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      Pronounce
                    </Button>
                    <Button
                      size="sm"
                      onClick={addToCards}
                      className="flex-1"
                    >
                      Add to Cards
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Video Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Title</p>
                  <p className="font-semibold">Common English Phrases</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold">10 minutes</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Level</p>
                  <p className="font-semibold">Beginner</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Words Learned</p>
                  <p className="font-semibold">0</p>
                </div>
              </CardContent>
            </Card>

            {/* Learning Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Learning Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Pause & Repeat</p>
                  <p className="text-muted-foreground">
                    Pause the video and repeat after the speaker to improve pronunciation.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Click Words</p>
                  <p className="text-muted-foreground">
                    Click on any word in the subtitles to see its definition.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Save Words</p>
                  <p className="text-muted-foreground">
                    Add new words to your flashcards for later review.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
