import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Plus, Volume2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

declare namespace YT {
  interface Player {
    getCurrentTime(): number;
    seekTo(seconds: number): void;
    destroy(): void;
  }
  namespace PlayerState {
    const PLAYING: number;
    const PAUSED: number;
    const ENDED: number;
  }
}

interface Subtitle {
  start: number;
  end: number;
  text: string;
}

export default function VideoLearning() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedWordDef, setSelectedWordDef] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [lastCheckpointSecond, setLastCheckpointSecond] = useState(0);
  const [hasLoggedCompletion, setHasLoggedCompletion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<YT.Player | null>(null);
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  const youtubeAPIReadyRef = useRef(false);
  const youtubeAPIPromiseRef = useRef<Promise<void> | null>(null);

  const { data: videosList, isLoading: videosLoading } = trpc.video.list.useQuery(
    { level: undefined },
    { enabled: isAuthenticated }
  );

  const { data: videoDetails } = trpc.video.detail.useQuery(
    { videoId: selectedVideoId || 0 },
    { enabled: !!selectedVideoId && isAuthenticated }
  );

  const logProgressMutation = trpc.video.logProgress.useMutation({
    onSuccess: (data) => {
      if (data.xpEarned > 0) {
        toast.success(`Earned ${data.xpEarned} XP from video study.`);
      }
    },
  });

  const dictionaryLookup = trpc.dictionary.lookup.useQuery(
    { word: selectedWord || "" },
    { enabled: !!selectedWord && isAuthenticated }
  );

  const addToCardsMutation = trpc.srs.addCard.useMutation({
    onSuccess: () => {
      toast.success(`Added "${selectedWord}" to your cards.`);
      setSelectedWord(null);
      setSelectedWordDef(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add the card.");
    },
  });

  const handleWordClick = (word: string) => {
    const cleaned = word.replace(/[.,!?;:"'()]/g, "").trim();
    if (!cleaned) return;
    setSelectedWord(cleaned);
  };

  const addToCards = () => {
    if (!selectedWord || !selectedWordDef || !videoDetails) return;

    addToCardsMutation.mutate({
      frontText: selectedWord,
      backText: selectedWordDef,
      proficiencyLevel: videoDetails.proficiencyLevel,
    });
  };

  const playAudio = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!dictionaryLookup.data) {
      setSelectedWordDef(null);
      return;
    }

    const definitions = dictionaryLookup.data.definitions;
    if (Array.isArray(definitions) && definitions.length > 0) {
      setSelectedWordDef(String(definitions[0]));
    } else {
      setSelectedWordDef(null);
    }
  }, [dictionaryLookup.data]);

  useEffect(() => {
    const w = window as typeof window & {
      YT?: typeof YT;
      onYouTubeIframeAPIReady?: () => void;
    };

    if (!w.YT) {
      if (!youtubeAPIPromiseRef.current) {
        youtubeAPIPromiseRef.current = new Promise<void>((resolve) => {
          w.onYouTubeIframeAPIReady = () => {
            youtubeAPIReadyRef.current = true;
            resolve();
          };
        });
      }

      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
    } else {
      youtubeAPIReadyRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!videoDetails?.youtubeId || !youtubeContainerRef.current) return;

    const w = window as typeof window & { YT: any };
    let interval: NodeJS.Timeout | null = null;
    let isMounted = true;

    const initializePlayer = async () => {
      if (!youtubeAPIReadyRef.current && youtubeAPIPromiseRef.current) {
        await youtubeAPIPromiseRef.current;
      }

      if (!isMounted || !youtubeContainerRef.current) return;

      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = new w.YT.Player(youtubeContainerRef.current, {
        height: "100%",
        width: "100%",
        videoId: videoDetails.youtubeId,
        events: {
          onStateChange: (event: { data: number }) => {
            if (event.data === w.YT.PlayerState.PLAYING) {
              if (interval) clearInterval(interval);
              interval = setInterval(() => {
                if (youtubePlayerRef.current) {
                  setCurrentTime(youtubePlayerRef.current.getCurrentTime());
                }
              }, 200);
            } else if (
              event.data === w.YT.PlayerState.PAUSED ||
              event.data === w.YT.PlayerState.ENDED
            ) {
              if (interval) {
                clearInterval(interval);
                interval = null;
              }
            }
          },
        },
      });
    };

    void initializePlayer();

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
    };
  }, [videoDetails?.youtubeId]);

  useEffect(() => {
    if (!selectedVideoId && videosList?.length) {
      setSelectedVideoId(videosList[0].id);
    }
  }, [selectedVideoId, videosList]);

  useEffect(() => {
    setCurrentTime(0);
    setLastCheckpointSecond(0);
    setHasLoggedCompletion(false);
  }, [selectedVideoId]);

  useEffect(() => {
    if (!selectedVideoId || !videoDetails?.durationSeconds || currentTime <= 0) return;

    const progressPercentage = (currentTime / videoDetails.durationSeconds) * 100;
    const currentCheckpointSecond = Math.floor(currentTime / 30) * 30;
    const shouldLogByCheckpoint = currentCheckpointSecond > lastCheckpointSecond;
    const shouldLogByCompletion = progressPercentage >= 90 && !hasLoggedCompletion;

    if (!shouldLogByCheckpoint && !shouldLogByCompletion) return;

    if (shouldLogByCheckpoint) {
      setLastCheckpointSecond(currentCheckpointSecond);
    }
    if (shouldLogByCompletion) {
      setHasLoggedCompletion(true);
    }

    logProgressMutation.mutate({
      videoId: selectedVideoId,
      currentTime,
      duration: videoDetails.durationSeconds,
    });
  }, [
    currentTime,
    hasLoggedCompletion,
    lastCheckpointSecond,
    logProgressMutation,
    selectedVideoId,
    videoDetails,
  ]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please sign in first.</p>
      </div>
    );
  }

  const safeParseTranscript = (data: unknown): Subtitle[] => {
    try {
      if (Array.isArray(data)) {
        return data as Subtitle[];
      }
      if (typeof data === "string") {
        return JSON.parse(data) as Subtitle[];
      }
      return [];
    } catch (error) {
      console.error("Failed to parse transcript:", error);
      return [];
    }
  };

  const subtitles = videoDetails?.transcript
    ? safeParseTranscript(videoDetails.transcript)
    : [];

  const currentSubtitle = subtitles.find(
    (subtitle) => subtitle.start <= currentTime && currentTime < subtitle.end
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="text-lg font-bold">English Learning Hub</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </div>
      </nav>

      <div className="container space-y-8 py-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Video learning</h1>
          <p className="text-muted-foreground">
            Watch a lesson, follow the transcript, and turn useful words into review cards.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {videoDetails?.title || "Video player"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video overflow-hidden rounded-lg bg-black">
                  {videoDetails?.url ? (
                    videoDetails.youtubeId ? (
                      <div ref={youtubeContainerRef} style={{ width: "100%", height: "100%" }} />
                    ) : (
                      <video
                        ref={videoRef}
                        controls
                        width="100%"
                        height="100%"
                        onTimeUpdate={(event) => {
                          setCurrentTime(event.currentTarget.currentTime);
                        }}
                      >
                        <source src={videoDetails.url} type="video/mp4" />
                        Your browser does not support the embedded video player.
                      </video>
                    )
                  ) : videosLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">Loading videos...</p>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No video selected.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {videoDetails?.description ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{videoDetails.description}</p>
                </CardContent>
              </Card>
            ) : null}

            {currentSubtitle ? (
              <Card className="border-accent bg-accent/10">
                <CardContent className="pt-6">
                  <p className="text-lg font-semibold">
                    {currentSubtitle.text.split(/\s+/).map((word, index) => (
                      <span
                        key={`${word}-${index}`}
                        className="cursor-pointer rounded px-1 transition-colors hover:bg-accent/20"
                        onClick={() => handleWordClick(word)}
                      >
                        {word}{" "}
                      </span>
                    ))}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Transcript</CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 space-y-3 overflow-y-auto">
                {subtitles.length ? (
                  subtitles.map((subtitle, index) => (
                    <div
                      key={`${subtitle.start}-${index}`}
                      className={`cursor-pointer rounded-lg p-3 transition-colors ${
                        currentSubtitle?.start === subtitle.start
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                      onClick={() => {
                        setCurrentTime(subtitle.start);
                        if (youtubePlayerRef.current && videoDetails?.youtubeId) {
                          youtubePlayerRef.current.seekTo(subtitle.start);
                        }
                        if (videoRef.current && !videoDetails?.youtubeId) {
                          videoRef.current.currentTime = subtitle.start;
                        }
                      }}
                    >
                      <p className="text-sm font-medium">{subtitle.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor(subtitle.start / 60)}:
                        {String(Math.floor(subtitle.start % 60)).padStart(2, "0")} -{" "}
                        {Math.floor(subtitle.end / 60)}:
                        {String(Math.floor(subtitle.end % 60)).padStart(2, "0")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No transcript is available.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available videos</CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 space-y-2 overflow-y-auto">
                {videosLoading ? (
                  <p className="text-sm text-muted-foreground">Loading videos...</p>
                ) : videosList?.length ? (
                  videosList.map((video) => (
                    <button
                      key={video.id}
                      className={`w-full rounded-lg p-2 text-left text-sm transition-colors ${
                        selectedVideoId === video.id
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                      onClick={() => setSelectedVideoId(video.id)}
                    >
                      <p className="truncate font-medium">{video.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {video.proficiencyLevel.replace(/_/g, " ")}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No videos are available.</p>
                )}
              </CardContent>
            </Card>

            {selectedWord ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{selectedWord}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dictionaryLookup.isLoading ? (
                    <p className="text-sm text-muted-foreground">Looking up the word...</p>
                  ) : selectedWordDef ? (
                    <>
                      <p className="text-sm text-muted-foreground">{selectedWordDef}</p>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          size="sm"
                          variant="outline"
                          onClick={() => playAudio(selectedWord)}
                        >
                          <Volume2 className="mr-2 h-4 w-4" />
                          Speak
                        </Button>
                        <Button
                          className="flex-1"
                          size="sm"
                          disabled={addToCardsMutation.isPending}
                          onClick={addToCards}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add card
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No cached definition was found for this word yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
