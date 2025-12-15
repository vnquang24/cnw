"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
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
  App,
  Progress,
  Avatar,
} from "antd";
import {
  Award,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  UserRound,
  Edit,
  TrendingUp,
  GraduationCap,
  ClipboardCheck,
  User,
  Camera,
} from "lucide-react";
import Image from "next/image";
import { useFindUniqueUser, useUpdateUser } from "@/generated/hooks";
import {
  useMinioControllerCreateUploadUrl,
  fetchMinioControllerGetPublicUrl,
} from "@/generated/api/cnwComponents";
import { getUserId } from "@/lib/auth";
import { formatDateForAPI, formatDateToVietnamese } from "@/lib/date-utils";
import {
  GENDER_DISPLAY_MAP,
  type EditProfileFormValues,
} from "@/lib/validations/profile.validation";
import {
  calculateCourseStats,
  calculateLessonStats,
  calculateTestStats,
  getAvatarColorByRole,
  getUserInitials,
} from "@/lib/profile-utils";
import EditProfileModal from "@/components/modal/EditProfileModal";
import AvatarUploadModal from "@/components/modal/AvatarUploadModal";

const { Title, Text } = Typography;

export default function UserProfilePage() {
  const { message } = App.useApp();
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  const queryArgs = useMemo(() => {
    return {
      where: { id: userId || "" },
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
    refetch,
  } = useFindUniqueUser(queryArgs, {
    enabled: Boolean(userId),
  });

  const updateUserMutation = useUpdateUser();
  const createUploadUrlMutation = useMinioControllerCreateUploadUrl();

  const courseStats = useMemo(
    () => calculateCourseStats(user?.userCourses),
    [user?.userCourses],
  );

  const lessonStats = useMemo(
    () => calculateLessonStats(user?.userLessons),
    [user?.userLessons],
  );

  const testStats = useMemo(
    () => calculateTestStats(user?.testResults),
    [user?.testResults],
  );

  const handleEditSubmit = async (values: EditProfileFormValues) => {
    if (!userId) return;

    try {
      const updateData: Record<string, unknown> = {};

      if (values.name !== undefined) {
        updateData.name = { set: values.name || null };
      }

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
        data: updateData as Record<string, unknown>,
      });

      message.success("Cập nhật thông tin thành công!");
      setIsEditModalVisible(false);
      refetch();
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật thông tin!");
      console.error("Update error:", error);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!userId) return;

    setUploadingAvatar(true);
    try {
      console.log("Starting avatar upload...", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      // Step 1: Generate unique object name (chỉ giữ extension, bỏ tên file gốc)
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const objectName = `avatars/${userId}-${timestamp}.${fileExtension}`;
      console.log("Object name:", objectName);

      // Step 2: Get presigned upload URL using hook
      const { url: uploadUrl } = await createUploadUrlMutation.mutateAsync({
        body: { path: objectName },
      });

      if (!uploadUrl) {
        throw new Error("Không thể tạo URL upload");
      }

      console.log("Presigned upload URL received");

      // Step 3: Upload file directly to MinIO using presigned URL (no auth needed)
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Không thể upload file lên MinIO");
      }

      console.log("File uploaded successfully to MinIO");

      // Step 4: Get public URL using generated fetch function
      let publicUrl: string;
      try {
        const result = await fetchMinioControllerGetPublicUrl({
          queryParams: { objectName },
        });
        publicUrl = result.url;

        if (!publicUrl) {
          throw new Error("Không nhận được URL công khai từ server");
        }

        console.log("Public URL:", publicUrl);
      } catch (fetchError: any) {
        console.error("Error fetching public URL:", {
          error: fetchError,
          objectName,
        });
        throw new Error(
          `Không thể lấy URL công khai: ${fetchError?.message || "Unknown error"}`,
        );
      }

      // Step 5: Update user avatar in database using ZenStack hook
      await updateUserMutation.mutateAsync({
        where: { id: userId },
        data: {
          avatarUrl: { set: publicUrl },
        },
      });

      message.success("Cập nhật avatar thành công!");
      setIsAvatarModalVisible(false);
      refetch();
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      message.error(error?.message || "Có lỗi xảy ra khi cập nhật avatar!");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!userId || isLoading || isFetching) {
    return (
      <div className="flex justify-center items-center h-96">
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Text type="secondary">Đang tải thông tin của bạn...</Text>
        </Space>
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
        className="m-4"
      />
    );
  }

  if (!user) {
    return (
      <Empty description="Không tìm thấy thông tin của bạn" className="mt-20" />
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Title level={2} className="!mb-2">
          Hồ sơ của tôi
        </Title>
        <Text type="secondary" className="text-base">
          Xem và cập nhật thông tin cá nhân, theo dõi tiến độ học tập của bạn
        </Text>
      </div>

      {/* Profile Card */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <div className="relative">
          <Button
            icon={<Edit size={16} />}
            onClick={() => setIsEditModalVisible(true)}
            type="text"
            shape="circle"
            className="absolute top-0 right-0 hover:bg-blue-50 hover:text-blue-600"
            title="Chỉnh sửa thông tin"
          />

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:pr-8">
            <div className="relative group">
              {user.avatarUrl ? (
                <div className="relative w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-gray-200">
                  <Image
                    src={user.avatarUrl}
                    alt={user.name || "Avatar"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <Avatar
                  size={120}
                  style={{
                    backgroundColor: getAvatarColorByRole(
                      user.role || undefined,
                    ),
                    fontSize: "48px",
                    fontWeight: "bold",
                  }}
                >
                  {getUserInitials(user.name, user.email)}
                </Avatar>
              )}
              <Button
                icon={<Camera size={18} />}
                onClick={() => setIsAvatarModalVisible(true)}
                type="primary"
                shape="circle"
                size="large"
                className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Thay đổi avatar"
              />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <Title level={3} className="!mb-2">
                  {user.name || "Học viên"}
                </Title>
                <Space size={8}>
                  <Tag color="blue" className="text-sm px-3 py-1">
                    {user.role === "ADMIN" ? "Quản trị viên" : "Học viên"}
                  </Tag>
                  {user.group && user.group.length > 0 && (
                    <Tag color="green" className="text-sm px-3 py-1">
                      {user.group[0].name}
                    </Tag>
                  )}
                </Space>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <InfoItem
                  icon={<Mail size={18} />}
                  label="Email"
                  value={user.email}
                />
                <InfoItem
                  icon={<Phone size={18} />}
                  label="Số điện thoại"
                  value={user.phone || "Chưa cập nhật"}
                />
                <InfoItem
                  icon={<Calendar size={18} />}
                  label="Ngày sinh"
                  value={
                    formatDateToVietnamese(
                      user.birthday ? user.birthday.toString() : null,
                    ) || "Chưa cập nhật"
                  }
                />
                <InfoItem
                  icon={<UserRound size={18} />}
                  label="Giới tính"
                  value={
                    user.gender
                      ? GENDER_DISPLAY_MAP[user.gender]
                      : "Chưa cập nhật"
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title={
                <span className="text-base font-medium">
                  Khóa học đã đăng ký
                </span>
              }
              value={courseStats.total}
              prefix={<BookOpen size={24} className="text-blue-500" />}
              valueStyle={{ color: "#1890ff", fontSize: "32px" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title={
                <span className="text-base font-medium">
                  Khóa học hoàn thành
                </span>
              }
              value={courseStats.completed}
              prefix={<Award size={24} className="text-green-500" />}
              valueStyle={{ color: "#52c41a", fontSize: "32px" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title={
                <span className="text-base font-medium">
                  Bài học đã hoàn thành
                </span>
              }
              value={lessonStats.completed}
              prefix={<BookOpen size={24} className="text-purple-500" />}
              valueStyle={{ color: "#722ed1", fontSize: "32px" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title={
                <span className="text-base font-medium">
                  Tỷ lệ đạt bài kiểm tra
                </span>
              }
              value={testStats.passRate}
              suffix="%"
              prefix={<TrendingUp size={24} className="text-orange-500" />}
              valueStyle={{ color: "#fa8c16", fontSize: "32px" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <GraduationCap size={20} className="text-blue-600" />
                <span className="text-lg font-semibold">Tiến độ học tập</span>
              </Space>
            }
            className="shadow-sm hover:shadow-md transition-shadow h-full"
          >
            <Space direction="vertical" size="large" className="w-full">
              <div>
                <div className="flex justify-between mb-2">
                  <Text>Tiến độ trung bình</Text>
                  <Text strong>{courseStats.averageProgress}%</Text>
                </div>
                <Progress
                  percent={courseStats.averageProgress}
                  status={
                    courseStats.averageProgress === 100 ? "success" : "active"
                  }
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#87d068",
                  }}
                />
              </div>

              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Tổng khóa học đã đăng ký">
                  <Text strong>{courseStats.total}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Khóa học đang học">
                  <Tag color="processing">{courseStats.inProgress}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Khóa học đã hoàn thành">
                  <Tag color="success">{courseStats.completed}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng bài học">
                  {lessonStats.total}
                </Descriptions.Item>
                <Descriptions.Item label="Bài học đang làm">
                  <Tag color="warning">{lessonStats.doing}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Bài học đã hoàn thành">
                  <Tag color="success">{lessonStats.completed}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClipboardCheck size={20} className="text-green-600" />
                <span className="text-lg font-semibold">Kết quả kiểm tra</span>
              </Space>
            }
            className="shadow-sm hover:shadow-md transition-shadow h-full"
          >
            <Space direction="vertical" size="large" className="w-full">
              <div>
                <div className="flex justify-between mb-2">
                  <Text>Tỷ lệ đạt bài kiểm tra</Text>
                  <Text strong>{testStats.passRate}%</Text>
                </div>
                <Progress
                  percent={testStats.passRate}
                  status={
                    testStats.passRate >= 80
                      ? "success"
                      : testStats.passRate >= 50
                        ? "normal"
                        : "exception"
                  }
                  strokeColor={
                    testStats.passRate >= 80
                      ? "#52c41a"
                      : testStats.passRate >= 50
                        ? "#1890ff"
                        : "#ff4d4f"
                  }
                />
              </div>

              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Tổng số bài kiểm tra">
                  <Text strong>{testStats.total}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số bài đạt">
                  <Tag color="success">{testStats.passed}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Số bài chưa đạt">
                  <Tag color="error">{testStats.failed}</Tag>
                </Descriptions.Item>
              </Descriptions>

              {testStats.total === 0 && (
                <Alert
                  message="Bạn chưa làm bài kiểm tra nào"
                  description="Hãy tham gia các khóa học và hoàn thành bài kiểm tra để đánh giá năng lực của bạn."
                  type="info"
                  showIcon
                />
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSubmit={handleEditSubmit}
        initialValues={{
          name: user.name,
          phone: user.phone,
          gender: user.gender,
          birthday: user.birthday ? user.birthday.toString() : null,
        }}
        loading={updateUserMutation.isPending}
      />

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        open={isAvatarModalVisible}
        onCancel={() => setIsAvatarModalVisible(false)}
        onUpload={handleAvatarUpload}
        currentAvatarUrl={user.avatarUrl}
        loading={uploadingAvatar}
      />
    </div>
  );
}

interface InfoItemProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-gray-600">{icon}</div>
      <div className="flex-1">
        <Text type="secondary" className="text-xs block">
          {label}
        </Text>
        <Text strong className="text-sm">
          {value}
        </Text>
      </div>
    </div>
  );
}
