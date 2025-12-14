"use client";

import { useState } from "react";
import {
  Upload,
  Button,
  message,
  Image,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Modal,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  AudioOutlined,
  FileImageOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import {
  useMinioControllerCreateUploadUrl,
  fetchMinioControllerPresignedGetObject,
} from "@/generated/api/cnwComponents";

interface MediaFileItem {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}

interface MediaUploadProps {
  value?: MediaFileItem[]; // Array of media files
  onChange?: (files: MediaFileItem[]) => void;
  accept?: string;
  maxSizeMB?: number;
  questionId?: string; // Optional: For linking to question
  disabled?: boolean; // Control upload availability
}

export default function MediaUpload({
  value = [],
  onChange,
  accept = "image/*,video/*,audio/*",
  maxSizeMB = 50,
  questionId,
  disabled = false,
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaFileItem | null>(null);

  const createUploadUrl = useMinioControllerCreateUploadUrl();

  // Debug log để kiểm tra
  console.log("MediaUpload render:", { value, questionId });

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);

      // Generate unique file path
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileExtension = file.name.split(".").pop();
      const fileName = `questions/${timestamp}-${randomStr}.${fileExtension}`;

      // Step 1: Get presigned upload URL from backend
      const uploadUrlResponse = await createUploadUrl.mutateAsync({
        body: { path: fileName },
      });

      if (!uploadUrlResponse?.url) {
        throw new Error("Failed to get upload URL");
      }

      // Step 2: Upload file to MinIO using presigned URL
      const uploadResponse = await fetch(uploadUrlResponse.url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      // Step 3: Get public download URL for the uploaded file (permanent URL)
      const publicUrlResponse = await fetchMinioControllerPresignedGetObject({
        queryParams: { objectName: fileName },
      });

      if (!publicUrlResponse?.url) {
        throw new Error("Failed to get public URL");
      }

      const downloadUrl = publicUrlResponse.url;

      // Create new media file item
      const newFile: MediaFileItem = {
        fileName: file.name,
        fileUrl: downloadUrl,
        fileType: file.type,
        fileSize: file.size,
      };

      message.success("Upload thành công!");

      // Add to array
      if (onChange) {
        onChange([...value, newFile]);
      }

      return downloadUrl;
    } catch (error) {
      console.error("Upload error:", error);
      message.error("Upload thất bại! Vui lòng thử lại.");
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const beforeUpload = (file: File) => {
    // Check file size
    // const isLt50M = file.size / 1024 / 1024 < maxSizeMB;
    // if (!isLt50M) {
    //   message.error(`File phải nhỏ hơn ${maxSizeMB}MB!`);
    //   return false;
    // }

    // Upload immediately
    handleUpload(file);

    return false; // Prevent default upload
  };

  const handleRemove = (index: number) => {
    if (onChange) {
      const newFiles = value.filter((_, i) => i !== index);
      onChange(newFiles);
    }
  };

  const handlePreview = (item: MediaFileItem) => {
    setPreviewMedia(item);
    setPreviewOpen(true);
  };

  const renderPreviewModal = () => {
    if (!previewMedia) return null;

    const isImage = previewMedia.fileType.startsWith("image/");
    const isVideo = previewMedia.fileType.startsWith("video/");
    const isAudio = previewMedia.fileType.startsWith("audio/");

    return (
      <Modal
        open={previewOpen}
        title={previewMedia.fileName}
        footer={null}
        onCancel={() => {
          setPreviewOpen(false);
          setPreviewMedia(null);
        }}
        width={isAudio ? 500 : 800}
        centered
      >
        {isImage && (
          <div style={{ textAlign: "center" }}>
            <img
              src={previewMedia.fileUrl}
              alt={previewMedia.fileName}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
              }}
            />
          </div>
        )}
        {isVideo && (
          <div style={{ width: "100%" }}>
            <video
              src={previewMedia.fileUrl}
              controls
              style={{ width: "100%", maxHeight: "70vh" }}
              preload="metadata"
            >
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          </div>
        )}
        {isAudio && (
          <div style={{ padding: "20px 0" }}>
            <audio
              src={previewMedia.fileUrl}
              controls
              style={{ width: "100%" }}
              preload="metadata"
            >
              Trình duyệt của bạn không hỗ trợ audio.
            </audio>
          </div>
        )}
      </Modal>
    );
  };

  const renderMediaItem = (item: MediaFileItem, index: number) => {
    const isImage = item.fileType.startsWith("image/");
    const isVideo = item.fileType.startsWith("video/");
    const isAudio = item.fileType.startsWith("audio/");

    return (
      <div
        key={index}
        style={{
          border: "1px solid #d9d9d9",
          borderRadius: 8,
          padding: 8,
          display: "flex",
          gap: 8,
          alignItems: "center",
          backgroundColor: "#fafafa",
        }}
      >
        {/* Thumbnail/Icon - Clickable for preview */}
        <div
          style={{
            flexShrink: 0,
            width: 60,
            height: 60,
            cursor: "pointer",
            position: "relative",
          }}
          onClick={() => handlePreview(item)}
        >
          {isImage && (
            <>
              <img
                src={item.fileUrl}
                alt={item.fileName}
                style={{
                  width: 60,
                  height: 60,
                  objectFit: "cover",
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  borderRadius: 4,
                  opacity: 0,
                  transition: "opacity 0.2s",
                }}
                className="preview-overlay"
              >
                <EyeOutlined style={{ fontSize: 20, color: "white" }} />
              </div>
            </>
          )}
          {isVideo && (
            <div
              style={{
                width: 60,
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#e6f7ff",
                borderRadius: 4,
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#bae7ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#e6f7ff";
              }}
            >
              <PlayCircleOutlined style={{ fontSize: 24, color: "#1890ff" }} />
            </div>
          )}
          {isAudio && (
            <div
              style={{
                width: 60,
                height: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f6ffed",
                borderRadius: 4,
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#d9f7be";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f6ffed";
              }}
            >
              <AudioOutlined style={{ fontSize: 24, color: "#52c41a" }} />
            </div>
          )}
        </div>

        {/* File info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            {isImage && (
              <Tag color="blue" style={{ margin: 0 }}>
                IMG
              </Tag>
            )}
            {isVideo && (
              <Tag color="purple" style={{ margin: 0 }}>
                VID
              </Tag>
            )}
            {isAudio && (
              <Tag color="green" style={{ margin: 0 }}>
                AUD
              </Tag>
            )}
            {item.fileSize && (
              <Tag style={{ margin: 0 }}>
                {(item.fileSize / 1024 / 1024).toFixed(1)} MB
              </Tag>
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#666",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.fileName}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 4 }}>
          <Button
            size="small"
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(item)}
            title="Xem trước"
          />
          <Button
            danger
            size="small"
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleRemove(index)}
            disabled={disabled}
            title="Xóa"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        <Upload
          beforeUpload={beforeUpload}
          accept={accept}
          showUploadList={false}
          multiple
          disabled={disabled}
        >
          <Button
            icon={<UploadOutlined />}
            loading={uploading}
            size="small"
            disabled={disabled}
          >
            {uploading
              ? "Đang tải lên..."
              : disabled
                ? "Chỉ upload khi sửa"
                : "Thêm media"}
          </Button>
        </Upload>

        {value.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
              {value.length} file(s)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: 8,
              }}
            >
              {value.map((item, index) => renderMediaItem(item, index))}
            </div>
          </div>
        )}
      </Space>

      {/* Preview Modal */}
      {renderPreviewModal()}

      {/* CSS for hover effect */}
      <style jsx>{`
        .preview-overlay:hover {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
}
