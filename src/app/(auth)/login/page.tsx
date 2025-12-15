"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Form, Input, Button, Card, Typography, Space, Divider } from "antd";
import { MailOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import { getUserInfo, login, type UserRole } from "@/lib/auth";
import { showToast } from "@/lib/toast";

const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

function LoginFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-fill form from URL params for demo purposes
  const emailParam = searchParams?.get("email") || "";
  const passwordParam = searchParams?.get("password") || "";
  const autoLoginParam = searchParams?.get("autoLogin") === "true";

  // Set initial form values from URL params
  useState(() => {
    if (emailParam || passwordParam) {
      form.setFieldsValue({
        email: emailParam,
        password: passwordParam,
      });

      // Auto login if autoLogin=true
      if (autoLoginParam && emailParam && passwordParam) {
        setTimeout(() => {
          form.submit();
        }, 500);
      }
    }
  });

  const onFinish = async (values: LoginFormData) => {
    setIsLoading(true);
    const loadingToast = showToast.loading("Đang đăng nhập...");

    try {
      const success = await login(values.email, values.password);
      if (success) {
        showToast.dismiss(loadingToast);
        showToast.success("Đăng nhập thành công!");

        const userInfo = getUserInfo();
        console.log("User info after login:", userInfo);
        const role = userInfo?.role as UserRole | undefined;

        const getDefaultRoute = (userRole?: UserRole) => {
          if (userRole === "ADMIN") return "/admin/dashboard";
          if (userRole === "USER") return "/user/courses";
          return "/admin/dashboard";
        };

        const isRouteAllowed = (
          userRole: UserRole | undefined,
          target: string,
        ) => {
          if (!target) return false;
          if (userRole === "ADMIN") return target.startsWith("/admin");
          if (userRole === "USER") return target.startsWith("/user");
          return false;
        };

        const requestedReturnUrl = searchParams?.get("returnUrl") || "";
        const fallbackRoute = getDefaultRoute(role);
        const safeDestination =
          requestedReturnUrl && isRouteAllowed(role, requestedReturnUrl)
            ? requestedReturnUrl
            : fallbackRoute;

        router.push(safeDestination);
      } else {
        showToast.dismiss(loadingToast);
        showToast.error("Email hoặc mật khẩu không đúng");
      }
    } catch (err) {
      showToast.dismiss(loadingToast);
      showToast.error("Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    showToast.error("Vui lòng kiểm tra lại thông tin đăng nhập");
  };

  return (
    <div className="flex items-center justify-center min-h-96 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <Card
        className="w-full max-w-md shadow-xl"
        styles={{ body: { padding: "24px 24px 32px" } }}
      >
        <div className="text-center mb-6 sm:mb-8">
          <Title level={2} className="!mb-2 text-xl sm:text-2xl">
            Đăng nhập
          </Title>
          <Text type="secondary" className="text-sm sm:text-base">
            Chào mừng bạn quay trở lại
          </Text>
        </div>

        <Form
          form={form}
          name="login"
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập email!",
              },
              {
                type: "email",
                message: "Email không hợp lệ!",
              },
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder="Nhập địa chỉ email"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mật khẩu!",
              },
              {
                min: 0,
                message: "Mật khẩu phải có ít nhất 6 ký tự!",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              icon={<LoginOutlined />}
              className="w-full h-12 text-base font-medium"
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </Form.Item>
        </Form>

        <Divider className="my-6">
          <Text type="secondary">Hoặc</Text>
        </Divider>

        <div className="text-center">
          <Space>
            <Text type="secondary">Chưa có tài khoản?</Text>
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Đăng ký ngay
            </Link>
          </Space>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-96">
          Đang tải...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
