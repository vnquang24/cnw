"use client";

import { Modal, Form, Input, InputNumber, App } from "antd";
import { useEffect } from "react";

const { TextArea } = Input;

interface ContentModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: ContentFormData) => Promise<void>;
  editingData?: ContentFormData | null;
  title: string;
  nextIndex: number;
}

interface ContentFormData {
  content: string;
  indexInLesson: number;
}

export default function ContentModal({
  open,
  onCancel,
  onSubmit,
  editingData,
  title,
  nextIndex,
}: ContentModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (editingData) {
        form.setFieldsValue(editingData);
      } else {
        form.setFieldsValue({
          indexInLesson: nextIndex,
          content: "",
        });
      }
    }
  }, [open, editingData, nextIndex, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
      onCancel();
      message.success(
        editingData
          ? "Cập nhật nội dung thành công!"
          : "Thêm nội dung thành công!",
      );
    } catch (error) {
      console.error("Error submitting content:", error);
      message.error("Có lỗi xảy ra!");
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={editingData ? "Cập nhật" : "Thêm"}
      cancelText="Hủy"
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="Vị trí trong bài học"
          name="indexInLesson"
          rules={[
            { required: true, message: "Vui lòng nhập vị trí!" },
            { type: "number", min: 1, message: "Vị trí phải lớn hơn 0!" },
          ]}
        >
          <InputNumber
            min={1}
            placeholder="Nhập vị trí trong bài học"
            className="w-full"
          />
        </Form.Item>

        <Form.Item
          label="Nội dung"
          name="content"
          rules={[
            { required: true, message: "Vui lòng nhập nội dung!" },
            { min: 10, message: "Nội dung phải có ít nhất 10 ký tự!" },
          ]}
        >
          <TextArea
            rows={6}
            placeholder="Nhập nội dung bài học..."
            showCount
            maxLength={2000}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
