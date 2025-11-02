"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Button, Select } from "antd";

export interface CourseFormData {
  title: string;
  description: string;
  duration: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  status: "ACTIVE" | "INACTIVE";
}

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CourseFormData) => void;
  initialData?: CourseFormData;
  mode: "add" | "edit";
}

export function CourseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: CourseFormDialogProps) {
  const [form] = Form.useForm<CourseFormData>();

  // Reset form khi dialog mở/đóng hoặc initialData thay đổi
  useEffect(() => {
    if (open) {
      if (initialData) {
        form.setFieldsValue({
          title: initialData.title,
          description: initialData.description,
          duration: initialData.duration,
          level: initialData.level,
          status: initialData.status,
        });
      } else {
        // Reset form và set default values cho add mode
        form.resetFields();
        form.setFieldsValue({
          level: "BEGINNER",
          status: "ACTIVE",
        });
      }
    } else {
      // Reset form khi đóng dialog
      form.resetFields();
    }
  }, [open, initialData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
      form.resetFields();
      onOpenChange(false);
    } catch (error) {
      // Validation errors sẽ tự động hiển thị bởi Ant Design Form
      console.error("Validation failed:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      title={mode === "add" ? "Thêm khóa học mới" : "Sửa khóa học"}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          {mode === "add" ? "Thêm" : "Lưu"}
        </Button>,
      ]}
      width={500}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        {/* Title Field */}
        <Form.Item
          label="Tên khóa học"
          name="title"
          rules={[
            { required: true, message: "Vui lòng nhập tên khóa học" },
            { max: 255, message: "Tên khóa học không được vượt quá 255 ký tự" },
          ]}
        >
          <Input placeholder="Nhập tên khóa học..." />
        </Form.Item>

        {/* Description Field */}
        <Form.Item
          label="Mô tả"
          name="description"
          rules={[{ required: true, message: "Vui lòng nhập mô tả khóa học" }]}
        >
          <Input.TextArea placeholder="Nhập mô tả khóa học..." rows={4} />
        </Form.Item>

        {/* Duration Field */}
        <Form.Item
          label="Thời lượng (phút)"
          name="duration"
          rules={[
            { required: true, message: "Vui lòng nhập thời lượng" },
            { type: "number", min: 1, message: "Thời lượng phải lớn hơn 0" },
          ]}
        >
          <InputNumber
            placeholder="Nhập thời gian tính bằng phút..."
            style={{ width: "100%" }}
            min={1}
            step={1}
          />
        </Form.Item>

        {/* Level Field */}
        <Form.Item
          label="Cấp độ"
          name="level"
          rules={[{ required: true, message: "Vui lòng chọn cấp độ" }]}
        >
          <Select placeholder="Chọn cấp độ khóa học">
            <Select.Option value="BEGINNER">Cơ bản</Select.Option>
            <Select.Option value="INTERMEDIATE">Trung cấp</Select.Option>
            <Select.Option value="ADVANCED">Nâng cao</Select.Option>
          </Select>
        </Form.Item>

        {/* Status Field */}
        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
        >
          <Select placeholder="Chọn trạng thái khóa học">
            <Select.Option value="ACTIVE">Đang hoạt động</Select.Option>
            <Select.Option value="INACTIVE">Đã hủy</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
