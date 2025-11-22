"use client";

import {
  Modal,
  Form,
  Input,
  Upload,
  Button,
  Space,
  Progress,
  Alert,
} from "antd";
import { Upload as UploadIcon, X, Video } from "lucide-react";
import { useState, useEffect } from "react";
import type { UploadFile } from "antd";

interface VideoFormData {
  title: string;
  description?: string;
  indexInLesson: number;
}

interface VideoModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (
    values: VideoFormData,
    file: File,
    onProgress?: (progress: number) => void,
  ) => Promise<void>;
  editingData?: {
    title: string;
    description?: string;
    indexInLesson: number;
    id: string;
  } | null;
  title: string;
  nextIndex: number;
}

// Export HLS Player from dedicated component
export { default as HLSVideoPlayer, SimpleHLSPlayer } from "../video/HLSPlayer";

export default function VideoModal({
  open,
  onCancel,
  onSubmit,
  editingData,
  title,
  nextIndex,
}: VideoModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "complete"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (open) {
      if (editingData) {
        form.setFieldsValue({
          title: editingData.title,
          description: editingData.description || "",
          indexInLesson: editingData.indexInLesson,
        });
        setFileList([]);
      } else {
        form.setFieldsValue({
          title: "",
          description: "",
          indexInLesson: nextIndex,
        });
        setFileList([]);
      }
      setUploadProgress(0);
      setUploadStatus("idle");
      setStatusMessage("");
    }
  }, [open, editingData, nextIndex, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!editingData && fileList.length === 0) {
        Modal.error({
          title: "Lỗi",
          content: "Vui lòng chọn file video để upload!",
        });
        return;
      }

      setLoading(true);
      setUploadProgress(0);
      setUploadStatus("uploading");
      setStatusMessage("Đang tải video lên...");

      const file = fileList[0]?.originFileObj as File;

      // Upload with real progress tracking
      await onSubmit(values, file, (progress: number) => {
        setUploadProgress(progress);
        if (progress < 70) {
          setStatusMessage("Đang tải video lên...");
          setUploadStatus("uploading");
        } else if (progress < 90) {
          setStatusMessage("Đang xử lý video...");
          setUploadStatus("processing");
        } else {
          setStatusMessage("Hoàn tất!");
          setUploadStatus("complete");
        }
      });

      setUploadProgress(100);
      setUploadStatus("complete");
      setStatusMessage("Upload thành công!");

      // Small delay to show success state
      setTimeout(() => {
        form.resetFields();
        setFileList([]);
        onCancel();
      }, 1000);
    } catch (error) {
      console.error("Video modal error:", error);
      setUploadStatus("idle");
      setStatusMessage("Có lỗi xảy ra khi upload video!");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setUploadProgress(0);
    setUploadStatus("idle");
    setStatusMessage("");
    onCancel();
  };

  const beforeUpload = (file: File) => {
    const isVideo = file.type.startsWith("video/");
    if (!isVideo) {
      Modal.error({
        title: "Lỗi",
        content: "Chỉ được upload file video!",
      });
      return false;
    }

    const isLt500M = file.size / 1024 / 1024 < 500;
    if (!isLt500M) {
      Modal.error({
        title: "Lỗi",
        content: "File video phải nhỏ hơn 500MB!",
      });
      return false;
    }

    setFileList([
      {
        uid: file.name,
        name: file.name,
        status: "done",
        originFileObj: file,
      } as UploadFile,
    ]);
    return false; // Prevent auto upload
  };

  const handleRemove = () => {
    setFileList([]);
  };

  return (
    <Modal
      title={
        <Space>
          <Video className="w-5 h-5 text-purple-600" />
          <span>{title}</span>
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={loading}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          className="bg-purple-600 hover:bg-purple-700!"
        >
          {editingData ? "Cập nhật" : "Tải lên"}
        </Button>,
      ]}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="Tiêu đề video"
          name="title"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề video!" }]}
        >
          <Input placeholder="Ví dụ: Giới thiệu về TypeScript" />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea
            rows={3}
            placeholder="Mô tả ngắn về nội dung video..."
          />
        </Form.Item>

        <Form.Item
          label="Vị trí trong bài học"
          name="indexInLesson"
          rules={[
            { required: true, message: "Vui lòng nhập vị trí!" },
            { type: "number", min: 1, message: "Vị trí phải >= 1!" },
          ]}
        >
          <Input type="number" min={1} />
        </Form.Item>

        {!editingData && (
          <Form.Item
            label="File video"
            required
            tooltip="Chấp nhận các định dạng: MP4, AVI, MOV, MKV. Tối đa 500MB"
          >
            <Upload
              beforeUpload={beforeUpload}
              onRemove={handleRemove}
              fileList={fileList}
              maxCount={1}
              accept="video/*"
            >
              {fileList.length === 0 && (
                <Button
                  icon={<UploadIcon className="w-4 h-4" />}
                  className="w-full"
                  size="large"
                >
                  Chọn file video
                </Button>
              )}
            </Upload>
            {fileList.length > 0 && (
              <Alert
                message={`Đã chọn: ${fileList[0].name}`}
                type="success"
                showIcon
                className="mt-2"
                closable
                onClose={handleRemove}
              />
            )}
          </Form.Item>
        )}

        {loading && uploadProgress > 0 && (
          <Alert
            message={statusMessage}
            description={
              <div className="space-y-2">
                <Progress
                  percent={uploadProgress}
                  status={uploadStatus === "complete" ? "success" : "active"}
                  strokeColor={{
                    "0%": "#108ee9",
                    "70%": "#87d068",
                    "100%": "#52c41a",
                  }}
                />
                {uploadStatus === "processing" && (
                  <div className="text-sm text-gray-600">
                    Video đang được xử lý thành HLS format để tối ưu
                    streaming...
                  </div>
                )}
              </div>
            }
            type={uploadStatus === "complete" ? "success" : "info"}
            showIcon
            className="mt-4"
          />
        )}

        {editingData && (
          <Alert
            message="Chế độ chỉnh sửa"
            description="Bạn chỉ có thể sửa thông tin video. Để thay đổi file video, vui lòng xóa và tạo mới."
            type="warning"
            showIcon
            className="mt-2"
          />
        )}
      </Form>
    </Modal>
  );
}
