import { useState, useCallback, useMemo } from "react";
import { message } from "antd";
import {
  useFindManyVideoComment,
  useCreateVideoComment,
  useUpdateVideoComment,
  useDeleteVideoComment,
} from "@/generated/hooks";
import type { VideoComment } from "@/components/video/CommentTimeline";

export interface UseVideoCommentsOptions {
  videoId: string;
  userId?: string;
  enabled?: boolean;
}

export function useVideoComments({
  videoId,
  userId,
  enabled = true,
}: UseVideoCommentsOptions) {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch comments
  const commentsQuery = useFindManyVideoComment(
    {
      where: { videoId },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { timestamp: "asc" },
    },
    { enabled: enabled && !!videoId },
  );

  // Mutations
  const createCommentMutation = useCreateVideoComment();
  const updateCommentMutation = useUpdateVideoComment();
  const deleteCommentMutation = useDeleteVideoComment();

  // Transform comments data
  const comments: VideoComment[] = useMemo(() => {
    if (!commentsQuery.data) return [];

    return commentsQuery.data.map((comment) => ({
      id: comment.id,
      content: comment.content,
      timestamp: comment.timestamp,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      userId: comment.userId,
      videoId: comment.videoId,
      parentId: comment.parentId || undefined,
      isResolved: comment.isResolved,
      user: {
        name: comment.user.name || "Người dùng",
        avatarUrl: comment.user.avatarUrl || undefined,
      },
    }));
  }, [commentsQuery.data]);

  // Get comments by timestamp range
  const getCommentsInRange = useCallback(
    (startTime: number, endTime: number) => {
      return comments.filter(
        (comment) =>
          comment.timestamp >= startTime && comment.timestamp <= endTime,
      );
    },
    [comments],
  );

  // Get comment at specific timestamp (within 5 seconds)
  const getCommentAtTime = useCallback(
    (timestamp: number, tolerance = 5) => {
      return comments.filter(
        (comment) => Math.abs(comment.timestamp - timestamp) <= tolerance,
      );
    },
    [comments],
  );

  // Add new comment
  const addComment = useCallback(
    async (timestamp: number, content: string, parentId?: string) => {
      if (!userId) {
        message.error("Bạn cần đăng nhập để thêm ghi chú");
        return;
      }

      setIsLoading(true);
      try {
        await createCommentMutation.mutateAsync({
          data: {
            videoId,
            userId,
            content: content.trim(),
            timestamp: Math.floor(timestamp),
            parentId: parentId || undefined,
            isResolved: false,
          },
        });

        // Refetch comments
        await commentsQuery.refetch();
      } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [videoId, userId, createCommentMutation, commentsQuery],
  );

  // Update comment
  const updateComment = useCallback(
    async (commentId: string, content: string) => {
      if (!userId) {
        message.error("Bạn cần đăng nhập để cập nhật ghi chú");
        return;
      }

      setIsLoading(true);
      try {
        await updateCommentMutation.mutateAsync({
          where: { id: commentId },
          data: {
            content: content.trim(),
            updatedAt: new Date(),
          },
        });

        // Refetch comments
        await commentsQuery.refetch();
      } catch (error) {
        console.error("Error updating comment:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, updateCommentMutation, commentsQuery],
  );

  // Delete comment
  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!userId) {
        message.error("Bạn cần đăng nhập để xóa ghi chú");
        return;
      }

      setIsLoading(true);
      try {
        await deleteCommentMutation.mutateAsync({
          where: { id: commentId },
        });

        // Refetch comments
        await commentsQuery.refetch();
      } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, deleteCommentMutation, commentsQuery],
  );

  // Get comment statistics
  const stats = useMemo(() => {
    const totalComments = comments.length;
    const parentComments = comments.filter((c) => !c.parentId).length;
    const replies = totalComments - parentComments;
    const uniqueTimestamps = new Set(
      comments.map((c) => Math.floor(c.timestamp / 10) * 10),
    ).size;

    // Get time distribution (comments per minute)
    const timeDistribution: { [minute: number]: number } = {};
    comments.forEach((comment) => {
      const minute = Math.floor(comment.timestamp / 60);
      timeDistribution[minute] = (timeDistribution[minute] || 0) + 1;
    });

    return {
      total: totalComments,
      parentComments,
      replies,
      uniqueTimestamps,
      timeDistribution,
    };
  }, [comments]);

  // Get comment timestamps for progress bar markers
  const commentTimestamps = useMemo(() => {
    return [...new Set(comments.map((c) => c.timestamp))].sort((a, b) => a - b);
  }, [comments]);

  return {
    comments,
    isLoading: isLoading || commentsQuery.isLoading,
    isFetching: commentsQuery.isFetching,
    error: commentsQuery.error,
    stats,
    commentTimestamps,
    addComment,
    updateComment,
    deleteComment,
    getCommentsInRange,
    getCommentAtTime,
    refetch: commentsQuery.refetch,
  };
}
