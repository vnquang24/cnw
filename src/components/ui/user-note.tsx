import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Space,
  Tag,
  Typography,
  message,
  Modal,
  Spin,
  Empty,
} from "antd";
import {
  Edit3,
  Save,
  X,
  MessageSquare,
  Tags,
  Lock,
  Unlock,
} from "lucide-react";
import { InfoBadge } from "@/components/ui/info-badge";
import { StatusTag } from "@/components/ui/status-tag";

const { TextArea } = Input;
const { Text } = Typography;

interface UserNoteProps {
  componentId: string;
  userId: string | null;
  componentType: string;
  componentTitle: string;
  open: boolean;
  onClose: () => void;
}

interface Note {
  id: string;
  content: string;
  isPrivate: boolean;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

export function UserNote({
  componentId,
  userId,
  componentType,
  componentTitle,
  open,
  onClose,
}: UserNoteProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    if (userId && componentId) {
      fetchNote();
    }
  }, [userId, componentId]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetchUserNote({ userId, componentId });
      // setNote(response);

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data for demonstration
      const mockNote = {
        id: "note-1",
        content:
          "Đây là ghi chú mẫu cho nội dung học này. Tôi cần nhớ những điểm quan trọng...",
        isPrivate: true,
        tags: "quan trọng, cần ôn lại",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Simulate 50% chance of having existing note
      if (Math.random() > 0.5) {
        setNote(mockNote);
        setEditContent(mockNote.content);
        setEditTags(mockNote.tags);
        setIsPrivate(mockNote.isPrivate);
      }
    } catch (error) {
      message.error("Không thể tải ghi chú!");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId || !editContent.trim()) {
      message.warning("Vui lòng nhập nội dung ghi chú!");
      return;
    }

    setSaving(true);
    try {
      const noteData = {
        userId,
        componentId,
        content: editContent.trim(),
        isPrivate,
        tags: editTags.trim(),
      };

      // TODO: Replace with actual API call
      if (note) {
        // Update existing note
        // await updateUserNote({ id: note.id, ...noteData });
        setNote({ ...note, ...noteData, updatedAt: new Date().toISOString() });
        message.success("Cập nhật ghi chú thành công!");
      } else {
        // Create new note
        // const newNote = await createUserNote(noteData);
        const newNote = {
          id: `note-${Date.now()}`,
          ...noteData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setNote(newNote);
        message.success("Tạo ghi chú thành công!");
      }

      setIsEditing(false);
    } catch (error) {
      message.error("Có lỗi xảy ra khi lưu ghi chú!");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (note) {
      setEditContent(note.content);
      setEditTags(note.tags);
      setIsPrivate(note.isPrivate);
    } else {
      setEditContent("");
      setEditTags("");
      setIsPrivate(true);
    }
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!note) return;

    Modal.confirm({
      title: "Xóa ghi chú",
      content: "Bạn có chắc chắn muốn xóa ghi chú này không?",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          // TODO: Replace with actual API call
          // await deleteUserNote({ id: note.id });
          setNote(null);
          setEditContent("");
          setEditTags("");
          message.success("Xóa ghi chú thành công!");
        } catch (error) {
          message.error("Có lỗi xảy ra khi xóa ghi chú!");
        }
      },
    });
  };

  const tagList = note?.tags
    ? note.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  if (!userId) {
    return null;
  }

  return (
    <Modal
      title={
        <Space size={8}>
          <MessageSquare size={16} />
          <Text strong>Ghi chú của tôi</Text>
          <InfoBadge
            icon={<Tags size={12} />}
            text={componentTitle}
            type="secondary"
            size="small"
          />
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" tip="Đang tải ghi chú..." />
        </div>
      ) : (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {!isEditing && (
            <Space
              size={8}
              style={{ width: "100%", justifyContent: "flex-end" }}
            >
              {note && (
                <StatusTag
                  status={note.isPrivate ? "default" : "success"}
                  icon={
                    note.isPrivate ? <Lock size={12} /> : <Unlock size={12} />
                  }
                  text={note.isPrivate ? "Riêng tư" : "Công khai"}
                  minWidth={80}
                />
              )}
              <Button
                type="primary"
                icon={note ? <Edit3 size={14} /> : <MessageSquare size={14} />}
                onClick={handleEdit}
                size="small"
              >
                {note ? "Chỉnh sửa" : "Thêm ghi chú"}
              </Button>
            </Space>
          )}

          {isEditing ? (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <TextArea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Nhập ghi chú của bạn..."
                rows={6}
              />

              <Input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Nhập các thẻ, phân cách bằng dấu phẩy (ví dụ: quan trọng, cần ôn lại)"
                prefix={<Tags size={14} />}
                maxLength={200}
              />

              <Space size={8} align="center">
                <Button
                  type={isPrivate ? "default" : "primary"}
                  size="small"
                  icon={isPrivate ? <Lock size={14} /> : <Unlock size={14} />}
                  onClick={() => setIsPrivate(!isPrivate)}
                >
                  {isPrivate ? "Riêng tư" : "Công khai"}
                </Button>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {isPrivate ? "Chỉ bạn mới xem được" : "Mọi người có thể xem"}
                </Text>
              </Space>

              <Space size={8}>
                <Button
                  type="primary"
                  icon={<Save size={14} />}
                  onClick={handleSave}
                  loading={saving}
                >
                  Lưu ghi chú
                </Button>
                <Button icon={<X size={14} />} onClick={handleCancel}>
                  Hủy
                </Button>
                {note && (
                  <Button danger onClick={handleDelete}>
                    Xóa
                  </Button>
                )}
              </Space>
            </Space>
          ) : note ? (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #e9ecef",
                }}
              >
                <Text style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {note.content}
                </Text>
              </div>

              {tagList.length > 0 && (
                <Space size={4} wrap>
                  <Tags size={14} style={{ color: "#666" }} />
                  {tagList.map((tag, index) => (
                    <Tag key={index} color="blue" style={{ margin: 0 }}>
                      {tag}
                    </Tag>
                  ))}
                </Space>
              )}

              <Space size={16} style={{ fontSize: 12, color: "#666" }}>
                <InfoBadge
                  icon={<MessageSquare size={12} />}
                  text={`Tạo: ${new Date(note.createdAt).toLocaleString("vi-VN")}`}
                  type="secondary"
                  size="small"
                />
                {note.updatedAt !== note.createdAt && (
                  <InfoBadge
                    icon={<Edit3 size={12} />}
                    text={`Sửa: ${new Date(note.updatedAt).toLocaleString("vi-VN")}`}
                    type="secondary"
                    size="small"
                  />
                )}
              </Space>
            </Space>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có ghi chú nào"
              style={{ margin: "20px 0" }}
            />
          )}
        </Space>
      )}
    </Modal>
  );
}
