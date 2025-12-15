"use client";
import React, { useState } from "react";
import { useFindManyDevice } from "@/generated/hooks";
import { useAuthControllerDeleteDevice } from "@/generated/api/cnwComponents";

import {
  Table,
  Button,
  Modal,
  Typography,
  Tag,
  Space,
  Card,
  Alert,
  Spin,
  Row,
  Col,
  Tooltip,
  Empty,
  message,
} from "antd";
import {
  DeleteOutlined,
  ReloadOutlined,
  MobileOutlined,
  DesktopOutlined,
  TabletOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { formatDistance } from "date-fns";
import { vi } from "date-fns/locale";
import { getUserId } from "@/lib/auth";

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const ManageDevicePage: React.FC = () => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const userId = getUserId();

  // Lấy danh sách thiết bị của người dùng hiện tại
  const {
    data: devices,
    isLoading,
    refetch,
  } = useFindManyDevice({
    include: {
      refreshToken: {
        select: {
          createdAt: true,
          expiresAt: true,
          revoked: true,
        },
      },
    },
    where: userId ? { userId: userId } : undefined,
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Sử dụng hook được tạo tự động từ OpenAPI
  const deleteDevice = useAuthControllerDeleteDevice({
    onSuccess: () => {
      message.success("Đã đăng xuất khỏi thiết bị");
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Lỗi không xác định";

      message.error("Không thể đăng xuất khỏi thiết bị: " + errorMessage);
    },
  });

  const handleRevokeDevice = (id: string, deviceName: string) => {
    confirm({
      title: "Đăng xuất từ thiết bị này?",
      content: `Hành động này sẽ đăng xuất tài khoản của bạn khỏi thiết bị "${deviceName}". Bạn sẽ cần đăng nhập lại nếu muốn sử dụng trên thiết bị này.`,
      okText: "Đăng xuất",
      okType: "danger",
      cancelText: "Hủy",
      onOk() {
        deleteDevice.mutate({
          pathParams: {
            id,
          },
        });
      },
    });
  };

  // Tạo một thiết bị hiện tại (để so sánh và hiển thị)
  const currentDeviceName =
    typeof window !== "undefined"
      ? `${window.navigator.userAgent.split(" ")[0]} - ${
          window.navigator.platform
        }`
      : "";

  // Xác định icon thiết bị
  const getDeviceIcon = (deviceName: string) => {
    if (
      deviceName.toLowerCase().includes("mobile") ||
      deviceName.toLowerCase().includes("android") ||
      deviceName.toLowerCase().includes("iphone")
    ) {
      return <Smartphone size={16} />;
    }
    if (
      deviceName.toLowerCase().includes("tablet") ||
      deviceName.toLowerCase().includes("ipad")
    ) {
      return <Tablet size={16} />;
    }
    return <Monitor size={16} />;
  };

  // Cấu hình columns cho Ant Design Table
  const columns = [
    {
      title: "Thiết bị",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: any) => (
        <Space>
          {getDeviceIcon(name)}
          <div>
            <Text strong>{name}</Text>
            {record.isCurrent && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                Hiện tại
              </Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (record: any) => {
        const isRevoked =
          record.refreshToken && record.refreshToken.length > 0
            ? record.refreshToken[0].revoked
            : false;

        return isRevoked ? (
          <Tag icon={<ExclamationCircleOutlined />} color="error">
            Đã hết hạn
          </Tag>
        ) : (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Đang hoạt động
          </Tag>
        );
      },
    },
    {
      title: "Đăng nhập gần nhất",
      key: "lastLogin",
      render: (record: any) => {
        const lastLogin =
          record.refreshToken && record.refreshToken.length > 0
            ? record.refreshToken[0].createdAt
            : record.createdAt;

        return lastLogin ? (
          <Text type="secondary">
            {formatDistance(new Date(lastLogin), new Date(), {
              addSuffix: true,
              locale: vi,
            })}
          </Text>
        ) : null;
      },
    },
    {
      title: "Hết hạn",
      key: "expiresAt",
      render: (record: any) => {
        const expiresAt =
          record.refreshToken && record.refreshToken.length > 0
            ? record.refreshToken[0].expiresAt
            : null;

        return expiresAt ? (
          <Text type="secondary">
            {formatDistance(new Date(expiresAt), new Date(), {
              addSuffix: true,
              locale: vi,
            })}
          </Text>
        ) : null;
      },
    },
    {
      title: "Hành động",
      key: "action",
      align: "right" as const,
      render: (record: any) => (
        <Tooltip
          title={
            record.isCurrent
              ? "Không thể đăng xuất khỏi thiết bị hiện tại"
              : "Đăng xuất khỏi thiết bị này"
          }
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRevokeDevice(record.id, record.name)}
            disabled={record.isCurrent}
          />
        </Tooltip>
      ),
    },
  ];

  // Chuẩn bị dữ liệu cho table
  const tableData =
    devices?.map((device) => {
      const isCurrent = device.name === currentDeviceName;
      return {
        ...device,
        key: device.id,
        isCurrent,
      };
    }) || [];

  return (
    <div style={{ padding: "24px" }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Quản lý thiết bị</Title>
          <Text type="secondary">
            Quản lý các thiết bị đang đăng nhập tài khoản của bạn
          </Text>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
            type="default"
          >
            Làm mới
          </Button>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={tableData}
          loading={isLoading}
          pagination={false}
          scroll={{ x: 600 }}
          locale={{
            emptyText: (
              <Empty
                description="Không tìm thấy thiết bị nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Text type="secondary">Tổng số: {devices?.length || 0} thiết bị</Text>
        </div>
      </Card>

      <Alert
        message="Lưu ý về quản lý thiết bị"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Bạn không thể đăng xuất khỏi thiết bị hiện tại từ trang này</li>
            <li>
              Khi bạn đăng xuất khỏi một thiết bị, người dùng trên thiết bị đó
              sẽ cần đăng nhập lại
            </li>
            <li>
              Nếu bạn phát hiện thiết bị lạ, hãy đăng xuất khỏi thiết bị đó và
              đổi mật khẩu ngay lập tức
            </li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginTop: 24 }}
      />
    </div>
  );
};

export default ManageDevicePage;
