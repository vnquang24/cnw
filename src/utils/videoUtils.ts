import { message } from "antd";

export class VideoUploadError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = "VideoUploadError";
  }
}

export class HLSProcessingError extends Error {
  constructor(
    message: string,
    public videoId?: string,
    public details?: any,
  ) {
    super(message);
    this.name = "HLSProcessingError";
  }
}

export class VideoStreamingError extends Error {
  constructor(
    message: string,
    public src?: string,
    public details?: any,
  ) {
    super(message);
    this.name = "VideoStreamingError";
  }
}

// Error handling utilities (without direct message calls)
export const handleVideoError = (error: unknown, context: string) => {
  console.error(`Video error in ${context}:`, error);

  if (error instanceof VideoUploadError) {
    return {
      type: "upload",
      message: error.message,
      code: error.code,
      details: error.details,
      severity: "error" as const,
    };
  }

  if (error instanceof HLSProcessingError) {
    return {
      type: "hls",
      message: error.message,
      videoId: error.videoId,
      details: error.details,
      severity: "warning" as const,
    };
  }

  if (error instanceof VideoStreamingError) {
    return {
      type: "streaming",
      message: error.message,
      src: error.src,
      details: error.details,
      severity: "error" as const,
    };
  }

  // Generic error handling
  const errorMessage =
    error instanceof Error ? error.message : "Unknown error occurred";

  return {
    type: "generic",
    message: errorMessage,
    details: error,
    severity: "error" as const,
  };
};

// Video validation utilities
export const validateVideoFile = (
  file: File,
): { valid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith("video/")) {
    return { valid: false, error: "Chỉ được upload file video!" };
  }

  // Check file size (500MB limit)
  const maxSize = 500 * 1024 * 1024; // 500MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: "File video phải nhỏ hơn 500MB!" };
  }

  // Check supported formats
  const supportedFormats = [
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/mkv",
    "video/webm",
  ];
  if (!supportedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Định dạng không được hỗ trợ. Chỉ chấp nhận: ${supportedFormats.join(", ")}`,
    };
  }

  return { valid: true };
};

// HLS URL validation
export const validateHLSUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.endsWith(".m3u8");
  } catch {
    return false;
  }
};

// Retry mechanism for failed operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt === maxRetries) {
        throw lastError;
      }

      console.warn(
        `Operation failed, attempt ${attempt}/${maxRetries}:`,
        lastError.message,
      );
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};

// Video processing status checking
export const checkVideoProcessingStatus = async (
  videoId: string,
  onStatusUpdate?: (status: string, progress?: number) => void,
): Promise<{ completed: boolean; hlsUrl?: string; error?: string }> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/api/video/${videoId}/status`);

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    const status = await response.json();

    onStatusUpdate?.(status.status, status.progress);

    return {
      completed: status.status === "completed",
      hlsUrl: status.hlsPlaylistUrl,
      error: status.error,
    };
  } catch (error) {
    console.error("Video status check failed:", error);
    return {
      completed: false,
      error: error instanceof Error ? error.message : "Status check failed",
    };
  }
};

// Format video duration
export const formatVideoDuration = (
  seconds: number | null | undefined,
): string => {
  if (!seconds || seconds <= 0) return "--:--";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

// Generate video thumbnail URL
export const generateThumbnailUrl = (
  videoUrl: string,
  timeInSeconds: number = 1,
): string => {
  // This would typically be handled by your video processing service
  // For now, return a placeholder or the original URL
  return videoUrl.replace(/\.[^/.]+$/, "_thumbnail.jpg");
};
