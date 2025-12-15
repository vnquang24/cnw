"use client";

import { useState } from "react";
import { Modal, Upload, message, Button, Space, Avatar } from "antd";
import { Upload as UploadIcon, User } from "lucide-react";
import type { UploadFile, UploadProps } from "antd";
import Image from "next/image";

interface AvatarUploadModalProps {
  open: boolean;
  onCancel: () => void;
  onUpload: (file: File) => Promise<void>;
  currentAvatarUrl?: string | null;
  loading?: boolean;
}

export default function AvatarUploadModal({
  open,
  onCancel,
  onUpload,
  currentAvatarUrl,
  loading = false,
}: AvatarUploadModalProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setFileList(newFileList);

    // Preview the image
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(newFileList[0].originFileObj as File);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning("Vui lòng chọn ảnh trước!");
      return;
    }

    const file = fileList[0].originFileObj as File;

    try {
      await onUpload(file);
      setFileList([]);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleCancel = () => {
    setFileList([]);
    setPreviewUrl(null);
    onCancel();
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Chỉ được upload file ảnh!");
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Ảnh phải nhỏ hơn 5MB!");
      return false;
    }

    return false; // Prevent auto upload
  };

  return (
    <Modal
      title={<div className="text-lg font-semibold">Cập nhật ảnh đại diện</div>}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
      afterClose={() => {
        setFileList([]);
        setPreviewUrl(null);
      }}
    >
      <div className="mt-6 space-y-6">
        {/* Current Avatar Preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-sm font-medium text-gray-600">Ảnh hiện tại</div>
          {currentAvatarUrl ? (
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
              <Image
                src={currentAvatarUrl}
                alt="Current avatar"
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <Avatar size={128} icon={<User size={64} />} />
          )}
        </div>

        {/* Upload Area */}
        <div className="border-t pt-6">
          <div className="text-sm font-medium text-gray-600 mb-3">
            Chọn ảnh mới
          </div>
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleChange}
            beforeUpload={beforeUpload}
            maxCount={1}
            accept="image/*"
            className="avatar-uploader"
          >
            {fileList.length === 0 && (
              <div className="flex flex-col items-center gap-2">
                <UploadIcon size={32} className="text-gray-400" />
                <div className="text-sm text-gray-600">Chọn ảnh</div>
              </div>
            )}
          </Upload>
          <div className="text-xs text-gray-500 mt-2">
            Định dạng: JPG, PNG, GIF, WEBP. Kích thước tối đa: 5MB
          </div>
        </div>

        {/* Preview New Avatar */}
        {previewUrl && (
          <div className="flex flex-col items-center gap-4 border-t pt-6">
            <div className="text-sm font-medium text-gray-600">
              Ảnh xem trước
            </div>
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-200">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-6">
          <Button onClick={handleCancel} size="large">
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={handleUpload}
            loading={loading}
            disabled={fileList.length === 0}
            size="large"
          >
            Cập nhật
          </Button>
        </div>
      </div>
    </Modal>
  );
}
