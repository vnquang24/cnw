"use client";

import React, {
  useRef,
  useEffect,
  useState,
  memo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Alert, Spin } from "antd";

interface HLSPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  width?: string | number;
  height?: string | number;
  title?: string;
  showCommentMarkers?: boolean;
  commentTimestamps?: number[];
  onError?: (error: string) => void;
  onReady?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

const HLSPlayer = forwardRef<any, HLSPlayerProps>(
  (
    {
      src,
      poster,
      className = "",
      autoPlay = false,
      controls = true,
      width = "100%",
      height = "auto",
      title,
      showCommentMarkers = false,
      commentTimestamps = [],
      onError,
      onReady,
      onTimeUpdate,
    },
    ref,
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      getCurrentTime: () => {
        return videoRef.current?.currentTime || 0;
      },
      getDuration: () => {
        return videoRef.current?.duration || 0;
      },
      play: () => {
        videoRef.current?.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
    }));

    useEffect(() => {
      if (!videoRef.current || !src || isInitialized) return;

      const video = videoRef.current;
      setLoading(true);
      setError(null);
      setIsInitialized(true);

      const handleLoadedMetadata = () => {
        setLoading(false);
        onReady?.();
      };

      const handleVideoError = () => {
        const errorMsg = "Failed to load video";
        setError(errorMsg);
        setLoading(false);
        onError?.(errorMsg);
      };

      const handleTimeUpdate = () => {
        if (video && onTimeUpdate) {
          onTimeUpdate(video.currentTime, video.duration || 0);
        }
      };

      // Check if HLS is supported natively (Safari)
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("error", handleVideoError);
        video.addEventListener("timeupdate", handleTimeUpdate);
      } else {
        // Use hls.js for other browsers
        import("hls.js")
          .then(({ default: Hls }) => {
            if (Hls.isSupported()) {
              const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
                maxBufferLength: 30,
                maxMaxBufferLength: 600,
                liveSyncDurationCount: 3,
                liveMaxLatencyDurationCount: 10,
              });

              hlsRef.current = hls;

              hls.loadSource(src);
              hls.attachMedia(video);

              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log("HLS manifest loaded successfully");
                setLoading(false);
                onReady?.();
              });

              video.addEventListener("timeupdate", handleTimeUpdate);

              hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
                console.error("HLS error:", data);

                if (data.fatal) {
                  switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                      console.log("Fatal network error, trying to recover...");
                      hls.startLoad();
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      console.log("Fatal media error, trying to recover...");
                      hls.recoverMediaError();
                      break;
                    default:
                      console.log("Fatal error, destroying HLS instance");
                      const errorMsg = `Fatal error: ${data.details}`;
                      setError(errorMsg);
                      setLoading(false);
                      onError?.(errorMsg);
                      hls.destroy();
                      break;
                  }
                } else {
                  // Non-fatal errors
                  console.warn("Non-fatal HLS error:", data);
                }
              });

              hls.on(Hls.Events.FRAG_LOADED, () => {
                if (loading) {
                  setLoading(false);
                  onReady?.();
                }
              });

              // Handle quality levels
              hls.on(Hls.Events.LEVEL_SWITCHED, (_event: any, data: any) => {
                console.log("Quality level switched to:", data.level);
              });
            } else {
              const errorMsg = "HLS is not supported in this browser";
              setError(errorMsg);
              setLoading(false);
              onError?.(errorMsg);
            }
          })
          .catch((error) => {
            console.error("Failed to load hls.js:", error);
            const errorMsg = "Failed to load video player";
            setError(errorMsg);
            setLoading(false);
            onError?.(errorMsg);
          });
      }

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        if (video) {
          video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          video.removeEventListener("error", handleVideoError);
        }
        setIsInitialized(false);
      };
    }, [src]);

    if (error) {
      return (
        <Alert
          message="Video Error"
          description={error}
          type="error"
          showIcon
          className={className}
        />
      );
    }

    return (
      <div className={`relative ${className}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 rounded-lg">
            <Spin size="large" />
          </div>
        )}
        <video
          ref={videoRef}
          controls={controls}
          poster={poster}
          autoPlay={autoPlay}
          style={{ width, height }}
          className="w-full h-auto rounded-lg"
          preload="metadata"
          playsInline
          crossOrigin="anonymous"
        >
          <p>Your browser doesn't support HLS video streaming.</p>
        </video>
      </div>
    );
  },
);

HLSPlayer.displayName = "HLSPlayer";

// Memoized version to prevent unnecessary re-renders
const MemoizedHLSPlayer = memo(HLSPlayer);

// Export a simpler version for modal use
export const SimpleHLSPlayer = memo(
  ({
    src,
    poster,
    className,
  }: {
    src: string;
    poster?: string;
    className?: string;
  }) => {
    return (
      <MemoizedHLSPlayer
        src={src}
        poster={poster}
        className={className}
        controls={true}
        autoPlay={false}
      />
    );
  },
);

SimpleHLSPlayer.displayName = "SimpleHLSPlayer";

export default MemoizedHLSPlayer;
