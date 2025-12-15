import React, { useState, useRef, useCallback } from "react";
import HLSPlayer from "./HLSPlayer";

export interface EnhancedVideoPlayerProps {
  videoId: string;
  src: string;
  poster?: string;
  title?: string;
  userId?: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export default function EnhancedVideoPlayer({
  videoId,
  src,
  poster,
  title,
  userId,
  className = "",
  width = "100%",
  height = "auto",
  onTimeUpdate,
}: EnhancedVideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  return (
    <div className={`enhanced-video-player ${className}`}>
      <div className="video-player-section">
        <HLSPlayer
          ref={playerRef}
          src={src}
          poster={poster}
          width={width}
          height={height}
          onTimeUpdate={(time: number, dur: number) => {
            setCurrentTime(time);
            setDuration(dur);
            if (onTimeUpdate) onTimeUpdate(time, dur);
          }}
        />
      </div>
    </div>
  );
}
