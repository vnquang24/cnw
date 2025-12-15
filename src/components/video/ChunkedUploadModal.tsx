import React, { useState } from "react";
import {
  Modal,
  Upload,
  Form,
  Input,
  Button,
  Progress,
  Space,
  Typography,
  Divider,
  Alert,
} from "antd";
import {
  InboxOutlined,
  VideoCameraOutlined,
  CloudUploadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useChunkedUpload } from "@/hooks/useChunkedUpload";
import { formatFileSize, estimateUploadTime } from "@/utils/chunkedUpload";
import type { UploadFile } from "antd/es/upload/interface";

const { Dragger } = Upload;
const { Title, Text } = Typography;

export interface ChunkedUploadModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: (result: any) => void;
  title?: string;
}

export default function ChunkedUploadModal({
  open,
  onCancel,
  onSuccess,
  title = "Upload Large Video File",
}: ChunkedUploadModalProps) {
  const [form] = Form.useForm();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const [uploadState, { upload, cancel, reset }] = useChunkedUpload({
    onSuccess: (result) => {
      onSuccess?.(result);
      handleClose();
    },
    onError: (error) => {
      console.error("Upload error:", error);
    },
  });

  const handleClose = () => {
    form.resetFields();
    setSelectedFile(null);
    setStartTime(null);
    reset();
    onCancel();
  };

  const handleCancel = () => {
    if (uploadState.isUploading) {
      Modal.confirm({
        title: "Cancel Upload?",
        content:
          "Are you sure you want to cancel the ongoing upload? All progress will be lost.",
        onOk: () => {
          cancel();
          handleClose();
        },
      });
    } else {
      handleClose();
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      const values = await form.validateFields();
      setStartTime(Date.now());
      await upload(selectedFile, values.title, values.description);
    } catch (error) {
      console.error("Form validation error:", error);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    return false; // Prevent default upload
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  // Calculate upload speed and ETA
  const getUploadStats = () => {
    if (
      !startTime ||
      !uploadState.progress ||
      uploadState.progress.percentage === 0
    ) {
      return { speed: 0, eta: "Calculating..." };
    }

    const elapsed = (Date.now() - startTime) / 1000; // seconds
    const uploadedBytes = selectedFile
      ? (selectedFile.size * uploadState.progress.percentage) / 100
      : 0;
    const speed = uploadedBytes / elapsed; // bytes per second
    const remainingBytes = selectedFile ? selectedFile.size - uploadedBytes : 0;
    const eta =
      speed > 0 ? estimateUploadTime(remainingBytes, speed) : "Unknown";

    return { speed, eta };
  };

  const uploadStats = getUploadStats();

  return (
    <Modal
      title={
        <Space>
          <VideoCameraOutlined />
          {title}
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      maskClosable={!uploadState.isUploading}
      closable={!uploadState.isUploading}
    >
      <Form form={form} layout="vertical">
        {/* File Upload Area */}
        <Form.Item>
          {!selectedFile ? (
            <Dragger
              name="file"
              multiple={false}
              accept="video/*"
              beforeUpload={handleFileSelect}
              showUploadList={false}
              disabled={uploadState.isUploading}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
              </p>
              <p className="ant-upload-text">
                Click or drag video file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Supports large video files (multi-GB). Files will be uploaded in
                chunks for reliability.
                <br />
                Supported formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV
              </p>
            </Dragger>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <VideoCameraOutlined className="text-2xl text-blue-500" />
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                </div>
                {!uploadState.isUploading && (
                  <Button onClick={handleRemoveFile} type="text" danger>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          )}
        </Form.Item>

        {/* Video Details Form */}
        <Form.Item
          name="title"
          label="Video Title"
          rules={[{ required: true, message: "Please enter video title" }]}
        >
          <Input
            placeholder="Enter video title"
            disabled={uploadState.isUploading}
          />
        </Form.Item>

        <Form.Item name="description" label="Description (Optional)">
          <Input.TextArea
            placeholder="Enter video description"
            rows={3}
            disabled={uploadState.isUploading}
          />
        </Form.Item>

        {/* Upload Progress */}
        {uploadState.isUploading && uploadState.progress && (
          <div className="mb-4">
            <Divider>Upload Progress</Divider>

            <div className="space-y-3">
              <Progress
                percent={Math.round(uploadState.progress.percentage)}
                status={uploadState.error ? "exception" : "active"}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
              />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Text type="secondary">Chunks: </Text>
                  <Text>
                    {uploadState.progress.uploadedChunks} /{" "}
                    {uploadState.progress.totalChunks}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">Current Chunk: </Text>
                  <Text>{(uploadState.progress.currentChunk ?? 0) + 1}</Text>
                </div>
                <div>
                  <Text type="secondary">Speed: </Text>
                  <Text>{formatFileSize(uploadStats.speed)}/s</Text>
                </div>
                <div>
                  <Text type="secondary">ETA: </Text>
                  <Text>{uploadStats.eta}</Text>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {uploadState.error && (
          <Alert
            type="error"
            message="Upload Failed"
            description={uploadState.error.message}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Success Display */}
        {uploadState.result && (
          <Alert
            type="success"
            message="Upload Completed"
            description={`Video "${uploadState.result.title}" has been uploaded successfully and is being processed.`}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <Button onClick={handleCancel} disabled={uploadState.isUploading}>
            {uploadState.isUploading ? "Cancel Upload" : "Close"}
          </Button>

          {uploadState.isUploading ? (
            <Button danger icon={<StopOutlined />} onClick={cancel}>
              Stop Upload
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={handleSubmit}
              disabled={!selectedFile || uploadState.isUploading}
            >
              Start Upload
            </Button>
          )}
        </div>
      </Form>

      {/* Upload Tips */}
      {!uploadState.isUploading && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <Title level={5} className="text-blue-700 mb-2">
            💡 Tips for Large File Upload:
          </Title>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• Files are uploaded in 10MB chunks for reliability</li>
            <li>• Upload will automatically retry failed chunks</li>
            <li>• Keep this tab open during upload</li>
            <li>• Stable internet connection recommended</li>
            <li>• Processing will begin after upload completes</li>
          </ul>
        </div>
      )}
    </Modal>
  );
}
