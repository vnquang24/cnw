import { useState, useCallback, useRef } from "react";
import {
  ChunkedUploader,
  ChunkedUploadOptions,
  CompleteUploadResult,
} from "@/utils/chunkedUpload";
import { message } from "antd";

export interface UseChunkedUploadOptions {
  onSuccess?: (result: CompleteUploadResult) => void;
  onError?: (error: Error) => void;
  chunkSize?: number;
  maxRetries?: number;
  baseUrl?: string;
}

export interface ChunkedUploadState {
  isUploading: boolean;
  progress: {
    uploadedChunks: number;
    totalChunks: number;
    percentage: number;
    currentChunk?: number;
  } | null;
  error: Error | null;
  result: CompleteUploadResult | null;
}

export interface ChunkedUploadActions {
  upload: (file: File, title: string, description?: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useChunkedUpload(
  options: UseChunkedUploadOptions = {},
): [ChunkedUploadState, ChunkedUploadActions] {
  const {
    onSuccess,
    onError,
    chunkSize = 10 * 1024 * 1024, // 10MB
    maxRetries = 3,
    baseUrl = "/api/video",
  } = options;

  const uploaderRef = useRef<ChunkedUploader | null>(null);

  const [state, setState] = useState<ChunkedUploadState>({
    isUploading: false,
    progress: null,
    error: null,
    result: null,
  });

  const upload = useCallback(
    async (file: File, title: string, description?: string) => {
      try {
        // Reset state
        setState({
          isUploading: true,
          progress: null,
          error: null,
          result: null,
        });

        // Create new uploader
        uploaderRef.current = new ChunkedUploader();

        const uploadOptions: ChunkedUploadOptions = {
          file,
          title,
          description,
          chunkSize,
          maxRetries,
          baseUrl,
          onProgress: (progress) => {
            setState((prev) => ({
              ...prev,
              progress,
            }));
          },
          onError: (error, chunkIndex) => {
            console.error("Chunk upload error:", error, "Chunk:", chunkIndex);
            message.error(`Upload error: ${error.message}`);
          },
        };

        const result = await uploaderRef.current.upload(uploadOptions);

        setState({
          isUploading: false,
          progress: {
            uploadedChunks: state.progress?.totalChunks || 0,
            totalChunks: state.progress?.totalChunks || 0,
            percentage: 100,
          },
          error: null,
          result,
        });

        onSuccess?.(result);
        message.success("Video uploaded successfully!");
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Upload failed");

        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: err,
        }));

        onError?.(err);
        message.error(`Upload failed: ${err.message}`);
      }
    },
    [chunkSize, maxRetries, baseUrl, onSuccess, onError],
  );

  const cancel = useCallback(() => {
    if (uploaderRef.current) {
      uploaderRef.current.cancel();
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: new Error("Upload cancelled by user"),
      }));
      message.info("Upload cancelled");
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: null,
      error: null,
      result: null,
    });
  }, []);

  return [
    state,
    {
      upload,
      cancel,
      reset,
    },
  ];
}

export default useChunkedUpload;
