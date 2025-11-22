/**
 * Format seconds to MM:SS or HH:MM:SS format
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  } else {
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}

/**
 * Parse time string (MM:SS or HH:MM:SS) to seconds
 */
export function parseTimeToSeconds(timeString: string): number {
  const parts = timeString.split(":").map((part) => parseInt(part, 10));

  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return 0;
}

/**
 * Get relative time description
 */
export function getRelativeTime(timestamp: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - timestamp.getTime()) / 1000,
  );

  if (diffInSeconds < 60) {
    return "vừa xong";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return timestamp.toLocaleDateString("vi-VN");
    }
  }
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Get time markers for video progress bar
 */
export function getTimeMarkers(
  duration: number,
  commentTimestamps: number[],
): Array<{
  time: number;
  percentage: number;
  hasComment: boolean;
}> {
  const markers: Array<{
    time: number;
    percentage: number;
    hasComment: boolean;
  }> = [];

  // Add markers at regular intervals (every 10% of video)
  for (let i = 0; i <= 10; i++) {
    const time = (duration * i) / 10;
    markers.push({
      time,
      percentage: i * 10,
      hasComment: false,
    });
  }

  // Add markers for comments
  commentTimestamps.forEach((timestamp) => {
    const percentage = (timestamp / duration) * 100;
    markers.push({
      time: timestamp,
      percentage,
      hasComment: true,
    });
  });

  // Sort by time and remove duplicates
  return markers
    .sort((a, b) => a.time - b.time)
    .filter(
      (marker, index, arr) =>
        index === 0 || Math.abs(marker.time - arr[index - 1].time) > 1,
    );
}
