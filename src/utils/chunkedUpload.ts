/**
 * Chunked Upload Utility for Large Video Files
 * Supports uploading multi-GB files by splitting them into chunks
 */

export interface ChunkedUploadOptions {
  file: File;
  title: string;
  description?: string;
  chunkSize?: number; // Default: 10MB
  onProgress?: (progress: {
    uploadedChunks: number;
    totalChunks: number;
    percentage: number;
    currentChunk?: number;
  }) => void;
  onError?: (error: Error, chunkIndex?: number) => void;
  maxRetries?: number; // Default: 3
  baseUrl?: string; // Default: '/api/video'
}

export interface UploadSession {
  uploadId: string;
  totalChunks: number;
  chunkSize: number;
}

export interface ChunkUploadResult {
  uploadId: string;
  chunkIndex: number;
  uploaded: number;
  total: number;
  progress: number;
}

export interface CompleteUploadResult {
  id: string;
  title: string;
  originalFile: string;
  message: string;
  [key: string]: any;
}

export class ChunkedUploader {
  private abortController: AbortController | null = null;
  private isUploading = false;

  /**
   * Upload large file using chunked upload
   */
  async upload(options: ChunkedUploadOptions): Promise<CompleteUploadResult> {
    const {
      file,
      title,
      description,
      chunkSize = 10 * 1024 * 1024, // 10MB default
      onProgress,
      onError,
      maxRetries = 3,
      baseUrl = "/api/video",
    } = options;

    // Calculate chunks
    const totalChunks = Math.ceil(file.size / chunkSize);

    try {
      this.isUploading = true;
      this.abortController = new AbortController();

      // Step 1: Initialize upload session
      const session = await this.initializeUpload({
        filename: file.name,
        fileSize: file.size,
        totalChunks,
        title,
        description,
        baseUrl,
      });

      // Step 2: Upload chunks
      await this.uploadChunks({
        file,
        session,
        chunkSize,
        onProgress,
        onError,
        maxRetries,
        baseUrl,
      });

      // Step 3: Complete upload
      const result = await this.completeUpload(session.uploadId, baseUrl);

      this.isUploading = false;
      return result;
    } catch (error) {
      this.isUploading = false;
      if (error instanceof Error) {
        onError?.(error);
      }
      throw error;
    }
  }

  /**
   * Cancel ongoing upload
   */
  cancel(): void {
    if (this.abortController && this.isUploading) {
      this.abortController.abort();
      this.isUploading = false;
    }
  }

  /**
   * Check if upload is in progress
   */
  get uploading(): boolean {
    return this.isUploading;
  }

  /**
   * Initialize chunked upload session
   */
  private async initializeUpload(params: {
    filename: string;
    fileSize: number;
    totalChunks: number;
    title: string;
    description?: string;
    baseUrl: string;
  }): Promise<UploadSession> {
    const response = await fetch(`${params.baseUrl}/upload/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: params.filename,
        fileSize: params.fileSize,
        totalChunks: params.totalChunks,
        title: params.title,
        description: params.description,
      }),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to initialize upload: ${error}`);
    }

    const data = await response.json();
    return {
      uploadId: data.uploadId,
      totalChunks: params.totalChunks,
      chunkSize:
        data.chunkSize || Math.ceil(params.fileSize / params.totalChunks),
    };
  }

  /**
   * Upload all chunks with retry logic
   */
  private async uploadChunks(params: {
    file: File;
    session: UploadSession;
    chunkSize: number;
    onProgress?: ChunkedUploadOptions["onProgress"];
    onError?: ChunkedUploadOptions["onError"];
    maxRetries: number;
    baseUrl: string;
  }): Promise<void> {
    const {
      file,
      session,
      chunkSize,
      onProgress,
      onError,
      maxRetries,
      baseUrl,
    } = params;
    const uploadedChunks = new Set<number>();

    // Upload chunks with concurrency control (max 3 concurrent uploads)
    const concurrency = 3;
    const chunks = Array.from({ length: session.totalChunks }, (_, i) => i);

    for (let i = 0; i < chunks.length; i += concurrency) {
      const batch = chunks.slice(i, i + concurrency);

      await Promise.all(
        batch.map(async (chunkIndex) => {
          let retries = 0;

          while (retries < maxRetries) {
            try {
              await this.uploadSingleChunk({
                file,
                uploadId: session.uploadId,
                chunkIndex,
                chunkSize,
                baseUrl,
              });

              uploadedChunks.add(chunkIndex);

              // Report progress
              onProgress?.({
                uploadedChunks: uploadedChunks.size,
                totalChunks: session.totalChunks,
                percentage: (uploadedChunks.size / session.totalChunks) * 100,
                currentChunk: chunkIndex,
              });

              break; // Success, exit retry loop
            } catch (error) {
              retries++;

              if (retries >= maxRetries) {
                const err =
                  error instanceof Error
                    ? error
                    : new Error(`Failed to upload chunk ${chunkIndex}`);
                onError?.(err, chunkIndex);
                throw err;
              }

              // Wait before retry (exponential backoff)
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, retries) * 1000),
              );
            }
          }
        }),
      );
    }
  }

  /**
   * Upload a single chunk
   */
  private async uploadSingleChunk(params: {
    file: File;
    uploadId: string;
    chunkIndex: number;
    chunkSize: number;
    baseUrl: string;
  }): Promise<ChunkUploadResult> {
    const { file, uploadId, chunkIndex, chunkSize, baseUrl } = params;

    // Calculate chunk boundaries
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    // Create form data
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("chunkIndex", chunkIndex.toString());

    const response = await fetch(`${baseUrl}/upload/chunk/${uploadId}`, {
      method: "POST",
      body: formData,
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload chunk ${chunkIndex}: ${error}`);
    }

    return response.json();
  }

  /**
   * Complete the chunked upload
   */
  private async completeUpload(
    uploadId: string,
    baseUrl: string,
  ): Promise<CompleteUploadResult> {
    const response = await fetch(`${baseUrl}/upload/complete/${uploadId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to complete upload: ${error}`);
    }

    return response.json();
  }

  /**
   * Get upload status
   */
  static async getUploadStatus(
    uploadId: string,
    baseUrl = "/api/video",
  ): Promise<any> {
    const response = await fetch(`${baseUrl}/upload/status/${uploadId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get upload status: ${error}`);
    }

    return response.json();
  }

  /**
   * Cancel upload session
   */
  static async cancelUpload(
    uploadId: string,
    baseUrl = "/api/video",
  ): Promise<void> {
    const response = await fetch(`${baseUrl}/upload/cancel/${uploadId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to cancel upload: ${error}`);
    }
  }
}

/**
 * Utility function to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Utility function to estimate upload time
 */
export function estimateUploadTime(
  fileSize: number,
  uploadSpeed: number,
): string {
  if (uploadSpeed === 0) return "Unknown";

  const seconds = fileSize / uploadSpeed;

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
