export type VideoProgressLog = {
  videoId: number | null;
  checkpointSecond: number | null;
};

export function normalizeCheckpointSecond(currentTime: number): number {
  return Math.max(0, Math.floor(currentTime));
}

export function shouldDeduplicateVideoProgress(
  recentLogs: VideoProgressLog[],
  videoId: number,
  checkpointSecond: number
): boolean {
  return recentLogs.some(
    log => log.videoId === videoId && log.checkpointSecond === checkpointSecond
  );
}
