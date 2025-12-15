"use client";

import React, { useState, useEffect } from "react";
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
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { formatDistance } from "date-fns";
import { vi } from "date-fns/locale";
import { getUserId } from "@/lib/auth";

const { Title, Text } = Typography;
const { confirm } = Modal;

export default function DevicesPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  const {
    data: devices,
    isLoading,
    refetch,
  } = useFindManyDevice(
    {
      include: {
        refreshToken: {
          select: {
            createdAt: true,
            expiresAt: true,
            revoked: true,
          },
        },
      },
      where: userId ? { userId } : undefined,
      orderBy: {
        updatedAt: "desc",
      },
    },
    {
      enabled: Boolean(userId),
    },
  );

  const deleteDevice = useAuthControllerDeleteDevice({
    onSuccess: () => {
      message.success("Đã đăng xuất khỏi thiết bị");
      refetch();
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

  const currentDeviceName =
    typeof window !== "undefined"
      ? `${window.navigator.userAgent.split(" ")[0]} - ${window.navigator.platform}`
      : "";

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
      title: "Địa chỉ IP",
      dataIndex: "ipAddress",
      key: "ipAddress",
      render: (ip: string) => <Text type="secondary">{ip || "Không rõ"}</Text>,
    },
    {
      title: "Vị trí",
      dataIndex: "location",
      key: "location",
      render: (location: string) => (
        <Text type="secondary">{location || "Không rõ"}</Text>
      ),
    },
    {
      title: "Hoạt động gần nhất",
      dataIndex: "lastActive",
      key: "lastActive",
      render: (lastActive: string) => {
        return lastActive ? (
          <Text type="secondary">
            {formatDistance(new Date(lastActive), new Date(), {
              addSuffix: true,
              locale: vi,
            })}
          </Text>
        ) : (
          <Text type="secondary">Không rõ</Text>
        );
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

  const tableData =
    devices?.map((device) => {
      const isCurrent = device.name === currentDeviceName;
      return {
        ...device,
        key: device.id,
        isCurrent,
      };
    }) || [];

  if (!userId || isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Text type="secondary">Đang tải danh sách thiết bị...</Text>
        </Space>
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Quản lý thiết bị
          </Title>
          <Text type="secondary">
            Quản lý các thiết bị đang đăng nhập tài khoản của bạn
          </Text>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
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
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng số: ${total} thiết bị`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="Không tìm thấy thiết bị nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
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
      />
    </Space>
  );
}
