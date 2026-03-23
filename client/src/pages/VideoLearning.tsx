import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft, Volume2, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface Subtitle {
  start: number;  // Start time in seconds
  end: number;    // End time in seconds
  text: string;   // Subtitle text
}

interface VideoPlayerRef {
  currentTime: number;
  duration: number;
}

export default function VideoLearning() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedWordDef, setSelectedWordDef] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [lastLoggedTime, setLastLoggedTime] = useState(0);
  const [lastCheckpointSecond, setLastCheckpointSecond] = useState(0);
  const [hasLoggedCompletion, setHasLoggedCompletion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const youtubeContainerRef = useRef<HTMLDivElement>(null);

  // Fetch videos list from video router
  const { data: videosList, isLoading: videosLoading } = trpc.video.list.useQuery(
    { level: undefined },
    { enabled: isAuthenticated }
  );

  // Fetch selected video details
  const { data: videoDetails } = trpc.video.detail.useQuery(
    { videoId: selectedVideoId || 0 },
    { enabled: !!selectedVideoId && isAuthenticated }
  );

  // Log video progress
  const logProgressMutation = trpc.video.logProgress.useMutation({
    onSuccess: (data) => {
      toast.success(`獲得 ${data.xpEarned} XP`);
    },
    onError: (error) => {
      console.error("Failed to log progress:", error);
    },
  });

  // Dictionary lookup
  const dictionaryLookup = trpc.dictionary.lookup.useQuery(
    { word: selectedWord || "" },
    { enabled: !!selectedWord && isAuthenticated }
  );

  // Add to cards mutation
  const addToCardsMutation = trpc.srs.addCard.useMutation({
    onSuccess: () => {
      toast.success(`已添加 "${selectedWord}" 到單字卡`);
      setSelectedWord(null);
      setSelectedWordDef(null);
    },
    onError: (error) => {
      toast.error(error.message || "添加失敗");
    },
  });

  const handleWordClick = (word: string) => {
    setSelectedWord(word);
  };

  const addToCards = async () => {
    if (selectedWord && selectedWordDef && videoDetails) {
      // Use video proficiency level as proficiency level
      const proficiencyLevel = videoDetails.proficiencyLevel as "junior_high" | "senior_high" | "college" | "advanced";
      addToCardsMutation.mutate({
        frontText: selectedWord,
        backText: selectedWordDef,
        proficiencyLevel,
      });
    }
  };

  const playAudio = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  // Update selected word definition from dictionary lookup
  useEffect(() => {
    if (dictionaryLookup.data) {
      const definitions = dictionaryLookup.data.definitions;
      if (Array.isArray(definitions) && definitions.length > 0) {
        setSelectedWordDef(definitions[0]);
      }
    }
  }, [dictionaryLookup.data]);

  // Initialize YouTube Player API with ready callback
  useEffect(() => {
    const w = window as any;
    if (!w.YT) {
      // Set up ready callback before loading script
      w.onYouTubeIframeAPIReady = () => {
        // API is now ready
      };
      
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
  }, []);

  // Initialize YouTube player when video changes
  useEffect(() => {
    if (videoDetails?.youtubeId && youtubeContainerRef.current) {
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
      }
      
      const w = window as any;
      let interval: NodeJS.Timeout | null = null;
      
      youtubePlayerRef.current = new w.YT.Player(youtubeContainerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoDetails.youtubeId,
        events: {
          onStateChange: (event: any) => {
            if (event.data === w.YT.PlayerState.PLAYING) {
              // Update current time every 100ms while playing
              if (interval) clearInterval(interval);
              interval = setInterval(() => {
                const time = youtubePlayerRef.current?.getCurrentTime();
                if (time !== undefined) {
                  setCurrentTime(time);
                }
              }, 100);
            } else if (event.data === w.YT.PlayerState.PAUSED || event.data === w.YT.PlayerState.ENDED) {
              // Clear interval when paused or ended
              if (interval) {
                clearInterval(interval);
                interval = null;
              }
            }
          },
        },
      });
      
      // Cleanup function to clear interval when component unmounts or video changes
      return () => {
        if (interval) clearInterval(interval);
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.destroy();
          youtubePlayerRef.current = null;
        }
      };
    }
  }, [videoDetails?.youtubeId]);

  // Set first video as default
  useEffect(() => {
    if (!selectedVideoId && videosList && videosList.length > 0) {
      setSelectedVideoId(videosList[0].id);
    }
  }, [videosList, selectedVideoId]);

  // Log progress when video time updates significantly (with throttling to prevent duplicates)
  useEffect(() => {
    if (selectedVideoId && videoDetails && currentTime > 0 && videoDetails.durationSeconds && videoDetails.durationSeconds > 0) {
      const progressPercentage = (currentTime / videoDetails.durationSeconds) * 100;
      const currentCheckpointSecond = Math.floor(currentTime / 30) * 30;
      
      // Separate checkpoint conditions
      const shouldLogByCheckpoint = currentCheckpointSecond > lastCheckpointSecond;
      const shouldLogByCompletion = progressPercentage >= 90 && !hasLoggedCompletion;
      
      if (shouldLogByCheckpoint || shouldLogByCompletion) {
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
      }
    }
  }, [currentTime, selectedVideoId, videoDetails, lastCheckpointSecond, hasLoggedCompletion]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>請先登入</p>
      </div>
    );
  }

  // Parse transcript from JSON
  const subtitles: Subtitle[] = videoDetails?.transcript
    ? (Array.isArray(videoDetails.transcript) ? videoDetails.transcript : JSON.parse(videoDetails.transcript as string))
    : [];

  // Find current subtitle based on video time (using proper start/end times)
  const currentSubtitle = subtitles.find(
    (sub) => sub.start <= currentTime && currentTime < sub.end
  );

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
      <div className="container py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">影片學習</h1>
          <p className="text-muted-foreground">
            觀看影片並同步字幕。點擊任何單字查看定義。
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* YouTube Embed or Video Player */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{videoDetails?.title || "影片播放器"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  {videoDetails?.url ? (
                    videoDetails.youtubeId ? (
                      <div ref={youtubeContainerRef} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <video
                        ref={videoRef}
                        width="100%"
                        height="100%"
                        controls
                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      >
                        <source src={videoDetails.url} type="video/mp4" />
                        您的瀏覽器不支援影片播放
                      </video>
                    )
                  ) : videosLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">加載中...</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">沒有可用的影片</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Video Description */}
            {videoDetails?.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">影片說明</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{videoDetails.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Current Subtitle */}
            {currentSubtitle && (
              <Card className="bg-accent/10 border-accent">
                <CardContent className="pt-6">
                  <p className="text-lg font-semibold text-foreground">
                    {currentSubtitle.text.split(/\s+/).map((word, idx) => (
                      <span
                        key={idx}
                        onClick={() => handleWordClick(word.replace(/[.,!?;:]/g, ""))}
                        className="cursor-pointer hover:bg-accent/20 px-1 rounded transition-colors"
                      >
                        {word}{" "}
                      </span>
                    ))}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* All Subtitles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">所有字幕</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {subtitles.length > 0 ? (
                  subtitles.map((subtitle: Subtitle, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        currentSubtitle?.start === subtitle.start
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                      onClick={() => {
                        setCurrentTime(subtitle.start);
                        // Seek YouTube player if available
                        if (youtubePlayerRef.current && videoDetails?.youtubeId) {
                          youtubePlayerRef.current.seekTo(subtitle.start);
                        }
                        // Seek HTML5 video if available
                        if (videoRef.current && !videoDetails?.youtubeId) {
                          videoRef.current.currentTime = subtitle.start;
                        }
                      }}
                    >
                      <p className="text-sm font-medium">{subtitle.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor(subtitle.start / 60)}:{String(Math.floor(subtitle.start % 60)).padStart(2, "0")} - {Math.floor(subtitle.end / 60)}:{String(Math.floor(subtitle.end % 60)).padStart(2, "0")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">暫無字幕</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Video List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">影片列表</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {videosLoading ? (
                  <p className="text-sm text-muted-foreground">加載中...</p>
                ) : videosList && videosList.length > 0 ? (
                  videosList.map((video: typeof videosList[number]) => (
                    <button
                      key={video.id}
                      onClick={() => setSelectedVideoId(video.id)}
                      className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
                        selectedVideoId === video.id
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <p className="font-medium truncate">{video.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {video.proficiencyLevel.replace(/_/g, " ")}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">沒有可用的影片</p>
                )}
              </CardContent>
            </Card>

            {/* Selected Word Definition */}
            {selectedWord && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{selectedWord}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dictionaryLookup.isLoading ? (
                    <p className="text-sm text-muted-foreground">查詢中...</p>
                  ) : selectedWordDef ? (
                    <>
                      <p className="text-sm text-muted-foreground">{selectedWordDef}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => playAudio(selectedWord)}
                          className="flex-1"
                        >
                          <Volume2 className="w-4 h-4 mr-2" />
                          發音
                        </Button>
                        <Button
                          size="sm"
                          onClick={addToCards}
                          disabled={addToCardsMutation.isPending}
                          className="flex-1"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          添加
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">未找到定義</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
