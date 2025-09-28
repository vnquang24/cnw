'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, Card, Typography, Space, Divider } from 'antd';
import { MailOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { login } from '@/lib/auth';
import { showToast } from '@/lib/toast';

const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const searchParams = useSearchParams();

  const onFinish = async (values: LoginFormData) => {
    setIsLoading(true);
    const loadingToast = showToast.loading('Đang đăng nhập...');

    try {
      const success = await login(values.email, values.password);
      if (success) {
        showToast.dismiss(loadingToast);
        showToast.success('Đăng nhập thành công!');
        
        // Lấy returnUrl từ query params hoặc mặc định là dashboard
        const returnUrl = searchParams?.get('returnUrl') || '/dashboard';
        router.push(returnUrl);
      } else {
        showToast.dismiss(loadingToast);
        showToast.error('Email hoặc mật khẩu không đúng');
      }
    } catch (err) {
      showToast.dismiss(loadingToast);
      showToast.error('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    showToast.error('Vui lòng kiểm tra lại thông tin đăng nhập');
  };

  return (
    <div className="flex items-center justify-center min-h-96 py-12 px-4 sm:px-6 lg:px-8">
      <Card 
        className="max-w-md w-full shadow-xl"
        styles={{ body: { padding: '32px' } }}
      >
        <div className="text-center mb-8">
          <Title level={2} className="!mb-2">
            Đăng nhập
          </Title>
          <Text type="secondary" className="text-base">
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
                message: 'Vui lòng nhập email!',
              },
              {
                type: 'email',
                message: 'Email không hợp lệ!',
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
                message: 'Vui lòng nhập mật khẩu!',
              },
              {
                min: 0,
                message: 'Mật khẩu phải có ít nhất 6 ký tự!',
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
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Form.Item>
        </Form>

        <Divider className="my-6">
          <Text type="secondary">Hoặc</Text>
        </Divider>

        <div className="text-center">
          <Space>
            <Text type="secondary">Chưa có tài khoản?</Text>
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Đăng ký ngay
            </Link>
          </Space>
        </div>
      </Card>
    </div>
  );
}