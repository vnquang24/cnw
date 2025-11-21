"use client";

import { Modal, Form, Input, InputNumber, Select, App } from "antd";
import { useEffect } from "react";

interface WordModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: WordFormData) => Promise<void>;
  editingData?: WordFormData | null;
  title: string;
  nextIndex: number;
}

interface WordFormData {
  content: string;
  meaning: string;
  wordType: string;
  indexInLesson: number;
}

const wordTypeOptions = [
  { label: "Danh từ", value: "NOUN" },
  { label: "Động từ", value: "VERB" },
  { label: "Tính từ", value: "ADJECTIVE" },
  { label: "Trạng từ", value: "ADVERB" },
  { label: "Giới từ", value: "PREPOSITION" },
  { label: "Liên từ", value: "CONJUNCTION" },
  { label: "Thán từ", value: "INTERJECTION" },
  { label: "Đại từ", value: "PRONOUN" },
  { label: "Mạo từ", value: "ARTICLE" },
  { label: "Từ hạn định", value: "DETERMINER" },
  { label: "Số từ", value: "NUMERAL" },
  { label: "Khác", value: "OTHER" },
];

export default function WordModal({
  open,
  onCancel,
  onSubmit,
  editingData,
  title,
  nextIndex,
}: WordModalProps) {
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
          meaning: "",
          wordType: "NOUN",
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
          ? "Cập nhật từ vựng thành công!"
          : "Thêm từ vựng thành công!",
      );
    } catch (error) {
      console.error("Error submitting word:", error);
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
          label="Từ vựng"
          name="content"
          rules={[
            { required: true, message: "Vui lòng nhập từ vựng!" },
            { min: 1, message: "Từ vựng không được để trống!" },
          ]}
        >
          <Input placeholder="Nhập từ vựng..." maxLength={100} />
        </Form.Item>

        <Form.Item
          label="Nghĩa"
          name="meaning"
          rules={[
            { required: true, message: "Vui lòng nhập nghĩa của từ!" },
            { min: 1, message: "Nghĩa không được để trống!" },
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Nhập nghĩa của từ..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="Loại từ"
          name="wordType"
          rules={[{ required: true, message: "Vui lòng chọn loại từ!" }]}
        >
          <Select placeholder="Chọn loại từ" options={wordTypeOptions} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
