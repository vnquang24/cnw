"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Avatar,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
} from "antd";
import {
  Award,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  UserRound,
  Edit,
} from "lucide-react";
import { useFindUniqueUser, useUpdateUser } from "@/generated/hooks";
import { getUserId } from "@/lib/auth";

const { Title, Text } = Typography;
const { Option } = Select;

const genderMap: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

interface EditProfileFormValues {
  phone?: string;
  gender?: string;
  birthday?: string; // Sử dụng string cho input date
}

export default function UserProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm<EditProfileFormValues>();

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  const queryArgs = useMemo(() => {
    if (!userId) return undefined;
    return {
      where: { id: userId },
      include: {
        userCourses: true,
        userLessons: true,
        testResults: true,
        group: {
          include: {
            permission: true,
          },
        },
      },
    };
  }, [userId]);

  const {
    data: user,
    isLoading,
    isFetching,
    error,
    refetch, //Lấy refetch để cập nhật lại data sau khi edit
  } = useFindUniqueUser(queryArgs!, {
    enabled: Boolean(userId),
  });

  const updateUserMutation = useUpdateUser();

  // Helper function để format date từ ISO string sang YYYY-MM-DD cho input date
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return undefined;
    }
  };

  // Helper function để format date từ input sang ISO string cho API
  const formatDateForAPI = (inputValue: string | undefined): string | null => {
    if (!inputValue) return null;
    try {
      // Input date format là YYYY-MM-DD
      const date = new Date(inputValue + "T00:00:00");
      return date.toISOString();
    } catch {
      return null;
    }
  };

  // Hàm mở modal edit và set giá trị ban đầu cho form
  const handleOpenEditModal = () => {
    if (user) {
      form.setFieldsValue({
        phone: user.phone || undefined,
        gender: user.gender || undefined,
        birthday: formatDateForInput(user.birthday),
      });
      setIsEditModalVisible(true);
    }
  };

  // Hàm xử lý submit form edit
  const handleEditSubmit = async (values: EditProfileFormValues) => {
    if (!userId) return;

    try {
      const updateData: any = {};

      if (values.phone !== undefined) {
        updateData.phone = { set: values.phone || null };
      }

      if (values.gender !== undefined) {
        updateData.gender = { set: values.gender || null };
      }

      if (values.birthday !== undefined) {
        updateData.birthday = { set: formatDateForAPI(values.birthday) };
      }

      await updateUserMutation.mutateAsync({
        where: { id: userId },
        data: updateData,
      });

      message.success("Cập nhật thông tin thành công!");
      setIsEditModalVisible(false);
      refetch(); // Refresh data
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật thông tin!");
      console.error("Update error:", error);
    }
  };

  // Hàm đóng modal
  const handleCancelEdit = () => {
    setIsEditModalVisible(false);
    form.resetFields();
  };

  //Validator cho số điện thoại Việt Nam
  const validatePhoneNumber = (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }

    // Remove spaces và check format số VN
    const cleanedValue = value.replace(/\s/g, "");
    const phoneRegex = /^(0|84|\+84)?[3|5|7|8|9][0-9]{8}$/;

    if (!phoneRegex.test(cleanedValue)) {
      return Promise.reject(
        new Error("Số điện thoại không hợp lệ! (VD: 0901234567)"),
      );
    }
    return Promise.resolve();
  };

  //Validator cho ngày sinh
  const validateBirthday = (_: any, value: string | undefined) => {
    if (!value) {
      return Promise.resolve();
    }

    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    // Check ngày trong tương lai
    if (birthDate > today) {
      return Promise.reject(new Error("Ngày sinh không thể trong tương lai!"));
    }

    // Check tuổi hợp lệ (không quá 120 tuổi)
    if (age > 120) {
      return Promise.reject(new Error("Ngày sinh không hợp lệ!"));
    }

    // Check tuổi tối thiểu (ít nhất 1 tuổi)
    if (age < 1) {
      return Promise.reject(new Error("Ngày sinh quá gần với hiện tại!"));
    }

    return Promise.resolve();
  };

  const courseStats = useMemo(() => {
    const list = user?.userCourses ?? [];
    const total = list.length;
    const inProgress = list.filter(
      (item) => item.enrolmentStatus === "IN_PROGRESS",
    ).length;
    const completed = list.filter(
      (item) => item.enrolmentStatus === "COMPLETED",
    ).length;

    const averageProgress = total
      ? Math.round(
          list.reduce((acc, item) => acc + (item.progress ?? 0), 0) / total,
        )
      : 0;

    return { total, inProgress, completed, averageProgress };
  }, [user?.userCourses]);

  const lessonStats = useMemo(() => {
    const list = user?.userLessons ?? [];
    const total = list.length;
    const completed = list.filter((lesson) => lesson.status === "PASS").length;
    const doing = list.filter((lesson) => lesson.status === "DOING").length;

    return { total, completed, doing };
  }, [user?.userLessons]);

  const testStats = useMemo(() => {
    const list = user?.testResults ?? [];
    const total = list.length;
    const passed = list.filter((test) => test.status === "PASSED").length;

    return { total, passed };
  }, [user?.testResults]);

  if (!userId || isLoading || isFetching) {
    return (
      <div className="flex justify-center items-center h-72">
        <Spin size="large" />
        <div className="ml-4 text-gray-600">Đang tải hồ sơ học viên...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải hồ sơ"
        description="Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
      />
    );
  }

  if (!user) {
    return <Empty description="Không tìm thấy thông tin học viên." />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={3}>Hồ sơ học viên</Title>
        <Text type="secondary">
          Thông tin tài khoản và kết quả học tập tổng quan của bạn.
        </Text>
      </div>

      <Card>
        <div style={{ position: "relative" }}>
          <Button
            icon={<Edit size={16} />}
            onClick={handleOpenEditModal}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              zIndex: 1,
            }}
            type="text"
          >
            Chỉnh sửa
          </Button>

          <Space size={16} align="start">
            <Avatar size={96} style={{ backgroundColor: "#1677ff" }}>
              {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
            </Avatar>
            <Space direction="vertical" size={8}>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {user.name || "Học viên"}
                </Title>
                <Tag color="blue">{user.role || "USER"}</Tag>
              </div>
              <Space size={12} wrap>
                <InfoChip icon={<Mail size={16} />} text={user.email} />
                {user.phone && (
                  <InfoChip icon={<Phone size={16} />} text={user.phone} />
                )}
                {user.birthday && (
                  <InfoChip
                    icon={<Calendar size={16} />}
                    text={new Date(user.birthday).toLocaleDateString("vi-VN")}
                  />
                )}
                {user.gender && (
                  <InfoChip
                    icon={<UserRound size={16} />}
                    text={genderMap[user.gender] || user.gender}
                  />
                )}
              </Space>
            </Space>
          </Space>
        </div>
      </Card>

      <Modal
        title="Chỉnh sửa thông tin cá nhân"
        open={isEditModalVisible}
        onCancel={handleCancelEdit}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[{ validator: validatePhoneNumber }]}
            extra="Ví dụ: 0901234567"
          >
            <Input
              placeholder="Nhập số điện thoại"
              prefix={<Phone size={16} />}
              maxLength={11}
              allowClear
            />
          </Form.Item>

          <Form.Item label="Giới tính" name="gender">
            <Select placeholder="Chọn giới tính" allowClear>
              <Option value="MALE">Nam</Option>
              <Option value="FEMALE">Nữ</Option>
              <Option value="OTHER">Khác</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Ngày sinh"
            name="birthday"
            rules={[{ validator: validateBirthday }]}
          >
            <Input
              type="date"
              placeholder="Chọn ngày sinh"
              style={{ width: "100%" }}
              max={new Date().toISOString().split("T")[0]}
              min="1900-01-01"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCancelEdit}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateUserMutation.isPending}
              >
                Lưu thay đổi
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Khóa học đã đăng ký"
              value={courseStats.total}
              prefix={<BookOpen size={18} className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Bài học đã hoàn thành"
              value={lessonStats.completed}
              prefix={<Award size={18} className="text-emerald-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Điểm bài kiểm tra đạt"
              value={testStats.passed}
              prefix={<Award size={18} className="text-purple-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Tổng quan khóa học">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Đang học">
                {courseStats.inProgress}
              </Descriptions.Item>
              <Descriptions.Item label="Đã hoàn thành">
                {courseStats.completed}
              </Descriptions.Item>
              <Descriptions.Item label="Tiến độ trung bình">
                {courseStats.averageProgress}%
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Nhóm người dùng">
            {user.group?.length ? (
              <Space direction="vertical" size={8}>
                {user.group.map((group) => (
                  <Card key={group.id} size="small" bordered>
                    <Space direction="vertical" size={6}>
                      <Text strong>{group.name}</Text>
                      <Space size={4} wrap>
                        {group.permission?.map((permission) => (
                          <Tag key={permission.id} color="geekblue">
                            {permission.name} · {permission.permissionType}
                          </Tag>
                        ))}
                      </Space>
                    </Space>
                  </Card>
                ))}
              </Space>
            ) : (
              <Text type="secondary">Bạn chưa thuộc nhóm nào.</Text>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Tiến độ học tập">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Tổng bài học">
                {lessonStats.total}
              </Descriptions.Item>
              <Descriptions.Item label="Đang học">
                {lessonStats.doing}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Kết quả kiểm tra">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Tổng số bài">
                {testStats.total}
              </Descriptions.Item>
              <Descriptions.Item label="Số bài đạt">
                {testStats.passed}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

type InfoChipProps = {
  icon: ReactNode;
  text: string;
};

function InfoChip({ icon, text }: InfoChipProps) {
  return (
    <Tag icon={icon} color="default" style={{ padding: "4px 8px" }}>
      {text}
    </Tag>
  );
}
