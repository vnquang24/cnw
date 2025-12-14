"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  Button,
  App,
  Avatar,
  Alert,
} from "antd";
import {
  Calendar,
  Mail,
  Phone,
  User as UserIcon,
  Edit,
  Camera,
  Shield,
} from "lucide-react";
import { useFindUniqueUser, useUpdateUser } from "@/generated/hooks";
import {
  useMinioControllerCreateUploadUrl,
  fetchMinioControllerGetPublicUrl,
} from "@/generated/api/cnwComponents";
import { getUserId } from "@/lib/auth";
import { formatDateToVietnamese, formatDateForAPI } from "@/lib/date-utils";
import {
  GENDER_DISPLAY_MAP,
  type EditProfileFormValues,
} from "@/lib/validations/profile.validation";
import { getAvatarColorByRole, getUserInitials } from "@/lib/profile-utils";
import EditProfileModal from "@/components/modal/EditProfileModal";
import AvatarUploadModal from "@/components/modal/AvatarUploadModal";

const { Title, Text } = Typography;

export default function ProfilePage() {
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
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const objectName = `avatars/${userId}-${timestamp}.${fileExtension}`;

      const { url: uploadUrl } = await createUploadUrlMutation.mutateAsync({
        body: { path: objectName },
      });

      if (!uploadUrl) {
        throw new Error("Không thể tạo URL upload");
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Không thể upload file lên server");
      }

      const result = await fetchMinioControllerGetPublicUrl({
        queryParams: { objectName },
      });
      const publicUrl = result.url;

      if (!publicUrl) {
        throw new Error("Không nhận được URL công khai từ server");
      }

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
          <Text type="secondary">Đang tải thông tin...</Text>
        </Space>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải thông tin"
        description="Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
      />
    );
  }

  if (!user) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Không tìm thấy thông tin người dùng"
      />
    );
  }

  const userInitials = getUserInitials(user.name, user.email);
  const avatarColor = getAvatarColorByRole(user.role);
  const roleLabel = user.role === "ADMIN" ? "Quản trị viên" : "Người dùng";
  const roleColor = user.role === "ADMIN" ? "red" : "blue";

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Thông tin cá nhân
          </Title>
          <Text type="secondary">Quản lý thông tin tài khoản của bạn</Text>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card>
            <Space
              direction="vertical"
              size="large"
              style={{ width: "100%", textAlign: "center" }}
            >
              <div style={{ position: "relative", display: "inline-block" }}>
                {user.avatarUrl ? (
                  <Avatar size={120} src={user.avatarUrl} />
                ) : (
                  <Avatar
                    size={120}
                    style={{ backgroundColor: avatarColor, fontSize: 40 }}
                  >
                    {userInitials}
                  </Avatar>
                )}
                <Button
                  type="primary"
                  shape="circle"
                  icon={<Camera size={16} />}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                  }}
                  onClick={() => setIsAvatarModalVisible(true)}
                />
              </div>

              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {user.name || "Chưa cập nhật"}
                </Title>
                <Text type="secondary">{user.email}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={roleColor} icon={<Shield size={12} />}>
                    {roleLabel}
                  </Tag>
                  {user.locked && <Tag color="red">Đã khóa</Tag>}
                </div>
              </div>

              <Button
                type="primary"
                icon={<Edit size={16} />}
                block
                onClick={() => setIsEditModalVisible(true)}
              >
                Chỉnh sửa thông tin
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Thông tin chi tiết">
            <Descriptions bordered column={1}>
              <Descriptions.Item
                label={
                  <Space>
                    <UserIcon size={16} />
                    <span>Họ và tên</span>
                  </Space>
                }
              >
                {user.name || <Text type="secondary">Chưa cập nhật</Text>}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Space>
                    <Mail size={16} />
                    <span>Email</span>
                  </Space>
                }
              >
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Space>
                    <Phone size={16} />
                    <span>Số điện thoại</span>
                  </Space>
                }
              >
                {user.phone || <Text type="secondary">Chưa cập nhật</Text>}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Space>
                    <Calendar size={16} />
                    <span>Ngày sinh</span>
                  </Space>
                }
              >
                {user.birthday ? (
                  formatDateToVietnamese(
                    typeof user.birthday === "string"
                      ? user.birthday
                      : user.birthday.toISOString(),
                  )
                ) : (
                  <Text type="secondary">Chưa cập nhật</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {user.gender ? (
                  GENDER_DISPLAY_MAP[user.gender]
                ) : (
                  <Text type="secondary">Chưa cập nhật</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <EditProfileModal
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSubmit={handleEditSubmit}
        initialValues={{
          name: user.name || undefined,
          phone: user.phone || undefined,
          birthday: user.birthday
            ? typeof user.birthday === "string"
              ? user.birthday
              : user.birthday.toISOString()
            : undefined,
          gender: user.gender || undefined,
        }}
        loading={updateUserMutation.isPending}
      />

      <AvatarUploadModal
        open={isAvatarModalVisible}
        onCancel={() => setIsAvatarModalVisible(false)}
        onUpload={handleAvatarUpload}
        loading={uploadingAvatar}
      />
    </Space>
  );
}
