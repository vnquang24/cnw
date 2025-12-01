import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Input,
  Card,
  Space,
  Typography,
  Avatar,
  Tag,
  Tooltip,
  Modal,
  message,
} from "antd";
import { MessageCircle, Clock, Edit3, Trash2, Reply, Send } from "lucide-react";
import { formatTime } from "@/utils/timeUtils";

const { TextArea } = Input;
const { Text } = Typography;

export interface VideoComment {
  id: string;
  content: string;
  timestamp: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  videoId: string;
  parentId?: string;
  isResolved: boolean;
  user: {
    name: string;
    avatarUrl?: string;
  };
  replies?: VideoComment[];
}

export interface CommentTimelineProps {
  videoId: string;
  currentTime: number;
  duration: number;
  comments: VideoComment[];
  userId?: string;
  onSeekTo: (time: number) => void;
  onAddComment: (
    timestamp: number,
    content: string,
    parentId?: string,
  ) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  className?: string;
  hideVideoPlayer?: boolean;
}

export function CommentTimeline({
  videoId,
  currentTime,
  duration,
  comments,
  userId,
  onSeekTo,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  className = "",
  hideVideoPlayer = false,
}: CommentTimelineProps) {
  const [showAddComment, setShowAddComment] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [newCommentTimestamp, setNewCommentTimestamp] = useState<number | null>(
    null,
  );
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Sort comments by timestamp
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => a.timestamp - b.timestamp);
  }, [comments]);

  const handleAddComment = () => {
    setNewCommentTimestamp(Math.floor(currentTime));
    setShowAddComment(true);
  };

  const handleSubmitComment = async () => {
    if (!newCommentContent.trim() || newCommentTimestamp === null) {
      message.warning("Vui lòng nhập nội dung ghi chú");
      return;
    }

    try {
      await onAddComment(newCommentTimestamp, newCommentContent);
      setShowAddComment(false);
      setNewCommentContent("");
      setNewCommentTimestamp(null);
      message.success("Đã thêm ghi chú");
    } catch (error) {
      message.error("Không thể thêm ghi chú");
    }
  };

  const handleSubmitEdit = async (commentId: string) => {
    if (!editingContent.trim()) {
      message.warning("Vui lòng nhập nội dung ghi chú");
      return;
    }

    try {
      await onUpdateComment(commentId, editingContent);
      setEditingCommentId(null);
      setEditingContent("");
      message.success("Đã cập nhật ghi chú");
    } catch (error) {
      message.error("Không thể cập nhật ghi chú");
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) {
      message.warning("Vui lòng nhập nội dung phản hồi");
      return;
    }

    try {
      const parentComment = comments.find((c) => c.id === parentId);
      if (parentComment) {
        await onAddComment(parentComment.timestamp, replyContent, parentId);
        setReplyingTo(null);
        setReplyContent("");
        message.success("Đã thêm phản hồi");
      }
    } catch (error) {
      message.error("Không thể thêm phản hồi");
    }
  };

  const handleDelete = (commentId: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa ghi chú này?",
      onOk: async () => {
        try {
          await onDeleteComment(commentId);
          message.success("Đã xóa ghi chú");
        } catch (error) {
          message.error("Không thể xóa ghi chú");
        }
      },
    });
  };

  return (
    <div className={`comment-timeline ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} />
          <Text strong>Ghi chú theo thời gian ({comments.length})</Text>
        </div>
        <Button
          type="primary"
          size="small"
          icon={<MessageCircle size={14} />}
          onClick={handleAddComment}
          disabled={!userId}
        >
          Thêm ghi chú tại {formatTime(currentTime)}
        </Button>
      </div>

      {/* Add comment modal */}
      <Modal
        title={`Thêm ghi chú tại ${formatTime(newCommentTimestamp || 0)}`}
        open={showAddComment}
        onCancel={() => {
          setShowAddComment(false);
          setNewCommentContent("");
          setNewCommentTimestamp(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setShowAddComment(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmitComment}>
            Thêm ghi chú
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text type="secondary">Thời gian: </Text>
            <Tag color="blue">{formatTime(newCommentTimestamp || 0)}</Tag>
          </div>
          <TextArea
            value={newCommentContent}
            onChange={(e) => setNewCommentContent(e.target.value)}
            placeholder="Nhập ghi chú của bạn tại thời điểm này..."
            rows={4}
            maxLength={1000}
            showCount
          />
        </Space>
      </Modal>

      {/* Comments list */}
      <div className="space-y-3">
        {sortedComments.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
              <Text type="secondary">Chưa có ghi chú nào</Text>
              <br />
              <Text type="secondary">
                Nhấn "Thêm ghi chú" để bắt đầu ghi chú kiến thức
              </Text>
            </div>
          </Card>
        ) : (
          sortedComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={userId}
              onSeekTo={onSeekTo}
              onEdit={(id, content) => {
                setEditingCommentId(id);
                setEditingContent(content);
              }}
              onDelete={handleDelete}
              onReply={(id) => setReplyingTo(id)}
              editingId={editingCommentId}
              editingContent={editingContent}
              onEditingContentChange={setEditingContent}
              onSubmitEdit={handleSubmitEdit}
              onCancelEdit={() => {
                setEditingCommentId(null);
                setEditingContent("");
              }}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onReplyContentChange={setReplyContent}
              onSubmitReply={handleSubmitReply}
              onCancelReply={() => {
                setReplyingTo(null);
                setReplyContent("");
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentCardProps {
  comment: VideoComment;
  currentUserId?: string;
  onSeekTo: (time: number) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string) => void;
  editingId: string | null;
  editingContent: string;
  onEditingContentChange: (content: string) => void;
  onSubmitEdit: (id: string) => void;
  onCancelEdit: () => void;
  replyingTo: string | null;
  replyContent: string;
  onReplyContentChange: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
}

function CommentCard({
  comment,
  currentUserId,
  onSeekTo,
  onEdit,
  onDelete,
  onReply,
  editingId,
  editingContent,
  onEditingContentChange,
  onSubmitEdit,
  onCancelEdit,
  replyingTo,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  onCancelReply,
}: CommentCardProps) {
  const isOwner = comment.userId === currentUserId;
  const isEditing = editingId === comment.id;
  const isReplying = replyingTo === comment.id;

  return (
    <Card size="small" className="comment-card">
      <div className="flex items-start gap-3">
        <Avatar size={32} className="bg-blue-500">
          {comment.user.name.charAt(0).toUpperCase()}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Text strong className="text-sm">
              {comment.user.name}
            </Text>
            <Tooltip
              title={`Nhấn để chuyển tới thời điểm ${formatTime(comment.timestamp)}`}
            >
              <Button
                type="link"
                size="small"
                icon={<Clock size={12} />}
                onClick={() => onSeekTo(comment.timestamp)}
                className="text-blue-500 hover:text-blue-700 p-0 h-auto"
              >
                {formatTime(comment.timestamp)}
              </Button>
            </Tooltip>
            <Text type="secondary" className="text-xs">
              {new Date(comment.createdAt).toLocaleString("vi-VN")}
            </Text>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <TextArea
                value={editingContent}
                onChange={(e) => onEditingContentChange(e.target.value)}
                rows={3}
                maxLength={1000}
                showCount
              />
              <Space size={8}>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => onSubmitEdit(comment.id)}
                >
                  Lưu
                </Button>
                <Button size="small" onClick={onCancelEdit}>
                  Hủy
                </Button>
              </Space>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                {comment.content}
              </div>

              <Space size={8}>
                <Button
                  type="text"
                  size="small"
                  icon={<Reply size={12} />}
                  onClick={() => onReply(comment.id)}
                  disabled={!currentUserId}
                >
                  Phản hồi
                </Button>

                {isOwner && (
                  <Button
                    type="text"
                    size="small"
                    icon={<Edit3 size={12} />}
                    onClick={() => onEdit(comment.id, comment.content)}
                  >
                    Sửa
                  </Button>
                )}

                {isOwner && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<Trash2 size={12} />}
                    onClick={() => onDelete(comment.id)}
                  >
                    Xóa
                  </Button>
                )}
              </Space>
            </>
          )}

          {isReplying && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <TextArea
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                placeholder="Nhập phản hồi của bạn..."
                rows={3}
                maxLength={1000}
                showCount
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button size="small" onClick={onCancelReply}>
                  Hủy
                </Button>
                <Button
                  size="small"
                  type="primary"
                  icon={<Send size={12} />}
                  onClick={() => onSubmitReply(comment.id)}
                >
                  Gửi
                </Button>
              </div>
            </div>
          )}

          {/* Display replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-gray-200">
              {comment.replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onSeekTo={onSeekTo}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={onReply}
                  editingId={editingId}
                  editingContent={editingContent}
                  onEditingContentChange={onEditingContentChange}
                  onSubmitEdit={onSubmitEdit}
                  onCancelEdit={onCancelEdit}
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  onReplyContentChange={onReplyContentChange}
                  onSubmitReply={onSubmitReply}
                  onCancelReply={onCancelReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
