"use client";

import { Button, Form, Input, Modal, Select, Space, message } from "antd";
import { Phone, User } from "lucide-react";
import { useEffect } from "react";
import { formatDateForInput, getBirthdayConstraints } from "@/lib/date-utils";
import {
  GENDER_OPTIONS,
  editProfileSchema,
  type EditProfileFormValues,
} from "@/lib/validations/profile.validation";

const { Option } = Select;

interface EditProfileModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: EditProfileFormValues) => Promise<void>;
  initialValues?: {
    name?: string | null;
    phone?: string | null;
    gender?: string | null;
    birthday?: string | null;
  };
  loading?: boolean;
}

export default function EditProfileModal({
  open,
  onCancel,
  onSubmit,
  initialValues,
  loading = false,
}: EditProfileModalProps) {
  const [form] = Form.useForm<EditProfileFormValues>();
  const { minDate, maxDate } = getBirthdayConstraints();

  // Set initial values when modal opens
  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue({
        name: initialValues.name || undefined,
        phone: initialValues.phone || undefined,
        gender:
          (initialValues.gender as "MALE" | "FEMALE" | "OTHER") || undefined,
        birthday: formatDateForInput(initialValues.birthday),
      });
    }
  }, [open, initialValues, form]);

  const handleSubmit = async (values: EditProfileFormValues) => {
    try {
      // Validate with Zod
      const validatedData = editProfileSchema.parse(values);
      await onSubmit(validatedData);
      form.resetFields();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("Có lỗi xảy ra khi cập nhật thông tin!");
      }
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Custom validator for Ant Design Form using Zod
  const zodValidator = (schema: { parse: (value: unknown) => void }) => {
    return (_: unknown, value: unknown) => {
      try {
        schema.parse(value);
        return Promise.resolve();
      } catch (error) {
        const err = error as { errors?: Array<{ message: string }> };
        return Promise.reject(
          new Error(err.errors?.[0]?.message || "Validation error"),
        );
      }
    };
  };

  return (
    <Modal
      title={
        <div className="text-lg font-semibold">Chỉnh sửa thông tin cá nhân</div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
      afterClose={() => form.resetFields()}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        className="mt-6"
      >
        <Form.Item
          label={<span className="font-medium">Họ và tên</span>}
          name="name"
          rules={[
            {
              validator: zodValidator(editProfileSchema.shape.name),
            },
          ]}
        >
          <Input
            placeholder="Nhập họ và tên đầy đủ"
            prefix={<User size={16} className="text-gray-400" />}
            maxLength={100}
            allowClear
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-medium">Số điện thoại</span>}
          name="phone"
          rules={[
            {
              validator: zodValidator(editProfileSchema.shape.phone),
            },
          ]}
          extra={
            <span className="text-xs text-gray-500">
              Ví dụ: 0901234567 hoặc +84901234567
            </span>
          }
        >
          <Input
            placeholder="Nhập số điện thoại"
            prefix={<Phone size={16} className="text-gray-400" />}
            maxLength={13}
            allowClear
            size="large"
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label={<span className="font-medium">Giới tính</span>}
            name="gender"
          >
            <Select placeholder="Chọn giới tính" allowClear size="large">
              {GENDER_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="font-medium">Ngày sinh</span>}
            name="birthday"
            rules={[
              {
                validator: zodValidator(editProfileSchema.shape.birthday),
              },
            ]}
          >
            <Input
              type="date"
              placeholder="Chọn ngày sinh"
              style={{ width: "100%" }}
              max={maxDate}
              min={minDate}
              size="large"
            />
          </Form.Item>
        </div>

        <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={handleCancel} size="large">
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
            >
              Lưu thay đổi
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
