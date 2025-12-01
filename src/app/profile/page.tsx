"use client";

import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Divider,
  Typography,
  Space,
  Avatar,
  Upload,
  message,
  Tabs,
  Switch,
  InputNumber,
} from "antd";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Save,
  Bell,
  Shield,
  Globe,
} from "lucide-react";
import { getUserInfo } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface ProfileFormData {
  // Thông tin cá nhân
  name: string;
  email: string;
  phone: string;
  birthday: dayjs.Dayjs;
  gender: "MALE" | "FEMALE" | "OTHER";

  // Bảo mật
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;

  // Cài đặt
  emailNotifications: boolean;
  smsNotifications: boolean;
  language: string;
  timezone: string;
}

export default function ProfilePage() {
  const [form] = Form.useForm<ProfileFormData>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load user info từ token
    const userInfo = getUserInfo();
    if (userInfo) {
      form.setFieldsValue({
        name: userInfo.name || "",
        email: userInfo.sub || "",
        phone: "", // TODO: Lấy từ API user profile
        birthday: undefined, // TODO: Lấy từ API user profile
        gender: "OTHER", // TODO: Lấy từ API user profile
        emailNotifications: true,
        smsNotifications: false,
        language: "vi",
        timezone: "Asia/Ho_Chi_Minh",
      });
    }
  }, [form]);

  const handleSavePersonalInfo = async (values: Partial<ProfileFormData>) => {
    setLoading(true);
    try {
      // TODO: Gọi API cập nhật thông tin cá nhân
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      showToast.success("Cập nhật thông tin cá nhân thành công!");
    } catch (error) {
      showToast.error("Có lỗi xảy ra khi cập nhật thông tin!");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: Partial<ProfileFormData>) => {
    if (values.newPassword !== values.confirmPassword) {
      showToast.error("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    setLoading(true);
    try {
      // TODO: Gọi API đổi mật khẩu
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      showToast.success("Đổi mật khẩu thành công!");
      form.setFieldsValue({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      showToast.error("Có lỗi xảy ra khi đổi mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (values: Partial<ProfileFormData>) => {
    setLoading(true);
    try {
      // TODO: Gọi API cập nhật cài đặt
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      showToast.success("Cập nhật cài đặt thành công!");
    } catch (error) {
      showToast.error("Có lỗi xảy ra khi cập nhật cài đặt!");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (info: any) => {
    if (info.file.status === "done") {
      showToast.success("Cập nhật ảnh đại diện thành công!");
    } else if (info.file.status === "error") {
      showToast.error("Có lỗi xảy ra khi tải ảnh lên!");
    }
  };

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <Title level={2} className="!mb-2">
          Quản lý thông tin cá nhân
        </Title>
        <Text type="secondary" className="text-base">
          Quản lý và cập nhật thông tin cá nhân, bảo mật và cài đặt tài khoản
        </Text>
      </div>

      <Tabs
        defaultActiveKey="personal"
        size="large"
        items={[
          {
            key: "personal",
            label: (
              <Space>
                <User size={16} />
                <span>Thông tin cá nhân</span>
              </Space>
            ),
            children: (
              <Card className="shadow-sm">
                <Row gutter={[24, 24]}>
                  {/* Ảnh đại diện */}
                  <Col xs={24} lg={6}>
                    <div className="flex flex-col items-center gap-4">
                      <Avatar
                        size={140}
                        icon={<User size={64} />}
                        className="border-4 border-gray-200"
                      />
                      <Upload
                        name="avatar"
                        showUploadList={false}
                        onChange={handleAvatarUpload}
                        beforeUpload={() => false}
                      >
                        <Button
                          type="primary"
                          icon={<Camera size={16} />}
                          size="large"
                          className="w-full"
                        >
                          Thay đổi ảnh đại diện
                        </Button>
                      </Upload>
                      <Text type="secondary" className="text-xs text-center">
                        JPG, PNG hoặc GIF. Tối đa 5MB
                      </Text>
                    </div>
                  </Col>

                  {/* Form thông tin cá nhân */}
                  <Col xs={24} lg={18}>
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSavePersonalInfo}
                      initialValues={{
                        emailNotifications: true,
                        smsNotifications: false,
                        language: "vi",
                        timezone: "Asia/Ho_Chi_Minh",
                      }}
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label={
                              <span className="font-medium">Họ và tên</span>
                            }
                            name="name"
                            rules={[
                              {
                                required: true,
                                message: "Vui lòng nhập họ và tên!",
                              },
                              {
                                min: 2,
                                message: "Họ và tên phải có ít nhất 2 ký tự!",
                              },
                            ]}
                          >
                            <Input
                              prefix={
                                <User size={16} className="text-gray-400" />
                              }
                              placeholder="Nhập họ và tên"
                              size="large"
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            label={<span className="font-medium">Email</span>}
                            name="email"
                            rules={[
                              {
                                required: true,
                                message: "Vui lòng nhập email!",
                              },
                              { type: "email", message: "Email không hợp lệ!" },
                            ]}
                          >
                            <Input
                              prefix={
                                <Mail size={16} className="text-gray-400" />
                              }
                              placeholder="Nhập email"
                              size="large"
                              disabled
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            label={
                              <span className="font-medium">Số điện thoại</span>
                            }
                            name="phone"
                            rules={[
                              {
                                pattern: /^[0-9+\-\s()]+$/,
                                message: "Số điện thoại không hợp lệ!",
                              },
                            ]}
                          >
                            <Input
                              prefix={
                                <Phone size={16} className="text-gray-400" />
                              }
                              placeholder="Nhập số điện thoại"
                              size="large"
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            label={
                              <span className="font-medium">Ngày sinh</span>
                            }
                            name="birthday"
                          >
                            <DatePicker
                              style={{ width: "100%" }}
                              placeholder="Chọn ngày sinh"
                              format="DD/MM/YYYY"
                              size="large"
                            />
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            label={
                              <span className="font-medium">Giới tính</span>
                            }
                            name="gender"
                          >
                            <Select placeholder="Chọn giới tính" size="large">
                              <Option value="MALE">Nam</Option>
                              <Option value="FEMALE">Nữ</Option>
                              <Option value="OTHER">Khác</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider className="my-6" />

                      <Form.Item className="mb-0">
                        <Space size="middle">
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            icon={<Save size={18} />}
                            size="large"
                          >
                            Lưu thông tin cá nhân
                          </Button>
                          <Button
                            size="large"
                            onClick={() => form.resetFields()}
                          >
                            Đặt lại
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            key: "security",
            label: (
              <Space>
                <Shield size={16} />
                <span>Bảo mật</span>
              </Space>
            ),
            children: (
              <Card className="shadow-sm">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleChangePassword}
                >
                  <div className="mb-6">
                    <Title level={4} className="!mb-2">
                      <Space>
                        <Lock size={20} />
                        Đổi mật khẩu
                      </Space>
                    </Title>
                    <Text type="secondary">
                      Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                    </Text>
                  </div>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12} lg={8}>
                      <Form.Item
                        label={
                          <span className="font-medium">Mật khẩu hiện tại</span>
                        }
                        name="currentPassword"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập mật khẩu hiện tại!",
                          },
                        ]}
                      >
                        <Input.Password
                          prefix={<Lock size={16} className="text-gray-400" />}
                          placeholder="Nhập mật khẩu hiện tại"
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12} lg={8}>
                      <Form.Item
                        label={
                          <span className="font-medium">Mật khẩu mới</span>
                        }
                        name="newPassword"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng nhập mật khẩu mới!",
                          },
                          {
                            min: 6,
                            message: "Mật khẩu phải có ít nhất 6 ký tự!",
                          },
                        ]}
                      >
                        <Input.Password
                          prefix={<Lock size={16} className="text-gray-400" />}
                          placeholder="Nhập mật khẩu mới"
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12} lg={8}>
                      <Form.Item
                        label={
                          <span className="font-medium">
                            Xác nhận mật khẩu mới
                          </span>
                        }
                        name="confirmPassword"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng xác nhận mật khẩu mới!",
                          },
                        ]}
                      >
                        <Input.Password
                          prefix={<Lock size={16} className="text-gray-400" />}
                          placeholder="Nhập lại mật khẩu mới"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider className="my-6" />

                  <Form.Item className="mb-0">
                    <Space size="middle">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<Shield size={18} />}
                        size="large"
                      >
                        Cập nhật mật khẩu
                      </Button>
                      <Button
                        size="large"
                        onClick={() =>
                          form.resetFields([
                            "currentPassword",
                            "newPassword",
                            "confirmPassword",
                          ])
                        }
                      >
                        Hủy
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: "settings",
            label: (
              <Space>
                <Bell size={16} />
                <span>Cài đặt</span>
              </Space>
            ),
            children: (
              <Card className="shadow-sm">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSaveSettings}
                >
                  <div className="mb-6">
                    <Title level={4} className="!mb-2">
                      <Space>
                        <Bell size={20} />
                        Cài đặt thông báo
                      </Space>
                    </Title>
                    <Text type="secondary">
                      Quản lý cách bạn nhận thông báo và cài đặt hệ thống
                    </Text>
                  </div>

                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                      <Card className="h-full">
                        <Space
                          direction="vertical"
                          size="large"
                          className="w-full"
                        >
                          <div>
                            <Text strong className="text-base">
                              Thông báo qua email
                            </Text>
                            <div className="mt-2">
                              <Form.Item
                                name="emailNotifications"
                                valuePropName="checked"
                                className="mb-0"
                              >
                                <Switch
                                  checkedChildren={<Mail size={14} />}
                                  unCheckedChildren={<Mail size={14} />}
                                />
                              </Form.Item>
                            </div>
                            <Text
                              type="secondary"
                              className="text-sm block mt-2"
                            >
                              Nhận thông báo về khóa học, bài tập qua email
                            </Text>
                          </div>
                        </Space>
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
                      <Card className="h-full">
                        <Space
                          direction="vertical"
                          size="large"
                          className="w-full"
                        >
                          <div>
                            <Text strong className="text-base">
                              Thông báo qua SMS
                            </Text>
                            <div className="mt-2">
                              <Form.Item
                                name="smsNotifications"
                                valuePropName="checked"
                                className="mb-0"
                              >
                                <Switch
                                  checkedChildren={<Phone size={14} />}
                                  unCheckedChildren={<Phone size={14} />}
                                />
                              </Form.Item>
                            </div>
                            <Text
                              type="secondary"
                              className="text-sm block mt-2"
                            >
                              Nhận thông báo khẩn cấp qua tin nhắn SMS
                            </Text>
                          </div>
                        </Space>
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="font-medium">Ngôn ngữ</span>}
                        name="language"
                      >
                        <Select
                          placeholder="Chọn ngôn ngữ"
                          size="large"
                          suffixIcon={<Globe size={16} />}
                        >
                          <Option value="vi">
                            <Space>
                              <Globe size={14} />
                              Tiếng Việt
                            </Space>
                          </Option>
                          <Option value="en">
                            <Space>
                              <Globe size={14} />
                              English
                            </Space>
                          </Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        label={<span className="font-medium">Múi giờ</span>}
                        name="timezone"
                      >
                        <Select placeholder="Chọn múi giờ" size="large">
                          <Option value="Asia/Ho_Chi_Minh">
                            Asia/Ho_Chi_Minh (GMT+7)
                          </Option>
                          <Option value="UTC">UTC (GMT+0)</Option>
                          <Option value="America/New_York">
                            America/New_York (GMT-5)
                          </Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider className="my-6" />

                  <Form.Item className="mb-0">
                    <Space size="middle">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<Save size={18} />}
                        size="large"
                      >
                        Lưu cài đặt
                      </Button>
                      <Button size="large" onClick={() => form.resetFields()}>
                        Đặt lại
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
