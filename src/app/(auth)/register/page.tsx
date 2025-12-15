"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Form, Input, Button, Card, Typography, Space, Divider } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { register } from "@/lib/auth";
import { showToast } from "@/lib/toast";

const { Title, Text } = Typography;

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  const onFinish = async (values: RegisterFormData) => {
    setIsLoading(true);
    const loadingToast = showToast.loading("Đang tạo tài khoản...");

    try {
      const success = await register(
        values.email,
        values.password,
        values.name,
        values.phone,
      );

      if (success) {
        showToast.dismiss(loadingToast);
        showToast.success("Đăng ký thành công!");
        router.push("/admin/dashboard");
      } else {
        showToast.dismiss(loadingToast);
        showToast.error("Đăng ký thất bại. Email có thể đã được sử dụng.");
      }
    } catch (err) {
      showToast.dismiss(loadingToast);
      showToast.error("Có lỗi xảy ra khi đăng ký!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-96 py-8 sm:py-12 px-4 sm:px-6">
      <Card
        className="w-full max-w-md shadow-xl"
        styles={{ body: { padding: "24px 24px 32px" } }}
      >
        <div className="text-center mb-6 sm:mb-8">
          <Title level={2} className="text-xl sm:text-2xl">
            Đăng ký
          </Title>
          <Text type="secondary" className="text-sm sm:text-base">
            Tạo tài khoản để bắt đầu học tập
          </Text>
        </div>

        <Form
          form={form}
          name="register"
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            label="Họ và tên"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập họ và tên!" },
              { min: 2, message: "Họ và tên phải có ít nhất 2 ký tự!" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại!" },
              {
                pattern: /^[0-9]{10,11}$/,
                message: "Số điện thoại không hợp lệ!",
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Nhập số điện thoại"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp!"),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              icon={<UserAddOutlined />}
              className="w-full h-12"
            >
              {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </Button>
          </Form.Item>
        </Form>

        <Divider>
          <Text type="secondary">Hoặc</Text>
        </Divider>

        <div className="text-center">
          <Space>
            <Text type="secondary">Đã có tài khoản?</Text>
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Đăng nhập ngay
            </Link>
          </Space>
        </div>
      </Card>
    </div>
  );
}
