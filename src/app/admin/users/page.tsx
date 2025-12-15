"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Avatar,
  Spin,
  Modal,
  Form,
  DatePicker,
  App,
  Drawer,
  Descriptions,
} from "antd";
import {
  Users,
  UserPlus,
  Search,
  Plus,
  Edit,
  Eye,
  Shield,
  Lock,
  Unlock,
  Trash2,
} from "lucide-react";
import {
  useFindManyUser,
  useUpdateUser,
  useDeleteUser,
  useFindUniqueUser,
} from "@/generated/hooks";
import { useAuthControllerRegister } from "@/generated/api/cnwComponents";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Can } from "@/components/permissions/Can";

const { Title, Text } = Typography;
const { Option } = Select;

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  locked: boolean;
  gender?: string | null;
  birthday?: Date | null;
  avatarUrl?: string | null;
  createdAt: Date;
  _count?: {
    userCourses: number;
    testResults: number;
    createdCourses: number;
    devices?: number;
  };
};

export default function UsersPage() {
  return (
    <App>
      <UsersPageContent />
    </App>
  );
}

function UsersPageContent() {
  const [searchText, setSearchText] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingRoleUpdate, setPendingRoleUpdate] = useState<{
    userId: string;
    role: string;
  } | null>(null);

  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();

  // Fetch users from database
  const { data: users, isLoading } = useFindManyUser({
    include: {
      _count: {
        select: {
          userCourses: true,
          testResults: true,
          createdCourses: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch user detail for viewing
  const { data: viewingUser } = useFindUniqueUser(
    {
      where: { id: viewingId || "" },
      include: {
        _count: {
          select: {
            userCourses: true,
            testResults: true,
            createdCourses: true,
            devices: true,
          },
        },
      },
    },
    {
      enabled: !!viewingId,
    },
  );

  // Mutations
  const createUserMutation = useAuthControllerRegister({
    onSuccess: async (data, variables) => {
      // After successful registration, update role if needed
      const selectedRole = form.getFieldValue("role");
      if (selectedRole && selectedRole !== "USER") {
        // Need to find the user by email to get their ID
        const email = variables.body.email;
        setPendingRoleUpdate({ userId: email, role: selectedRole });
        // Trigger a query refetch to get the new user
        await queryClient.invalidateQueries({ queryKey: ["User"] });
      } else {
        message.success("Tạo người dùng thành công!");
        queryClient.invalidateQueries({ queryKey: ["User"] });
        setModalOpen(false);
        form.resetFields();
      }
    },
    onError: (error: any) => {
      message.error(
        error?.payload?.message || "Có lỗi xảy ra khi tạo người dùng!",
      );
    },
  });

  const updateUserMutation = useUpdateUser({
    onSuccess: () => {
      message.success("Cập nhật người dùng thành công!");
      queryClient.invalidateQueries({ queryKey: ["User"] });
      setModalOpen(false);
      setEditingId(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.message || "Có lỗi xảy ra khi cập nhật người dùng!");
    },
  });

  const deleteUserMutation = useDeleteUser({
    onSuccess: () => {
      message.success("Xóa người dùng thành công!");
      queryClient.invalidateQueries({ queryKey: ["User"] });
    },
    onError: (error: any) => {
      message.error(error.message || "Có lỗi xảy ra khi xóa người dùng!");
    },
  });

  // Handle pending role update after user creation
  useEffect(() => {
    if (pendingRoleUpdate && users) {
      const newUser = users.find((u) => u.email === pendingRoleUpdate.userId);
      if (newUser && newUser.role !== pendingRoleUpdate.role) {
        // Update the role
        updateUserMutation.mutate(
          {
            where: { id: newUser.id },
            data: { role: pendingRoleUpdate.role as any },
          },
          {
            onSuccess: () => {
              message.success("Tạo người dùng và cập nhật vai trò thành công!");
              setModalOpen(false);
              form.resetFields();
              setPendingRoleUpdate(null);
            },
            onError: () => {
              message.warning(
                "Tạo người dùng thành công nhưng không thể cập nhật vai trò!",
              );
              setModalOpen(false);
              form.resetFields();
              setPendingRoleUpdate(null);
            },
          },
        );
      } else if (newUser) {
        // User already has correct role
        message.success("Tạo người dùng thành công!");
        setModalOpen(false);
        form.resetFields();
        setPendingRoleUpdate(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRoleUpdate, users]);

  // Handlers
  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      gender: user.gender,
      birthday: user.birthday ? dayjs(user.birthday) : undefined,
    });
    setModalOpen(true);
  };

  const handleView = (userId: string) => {
    setViewingId(userId);
    setDrawerOpen(true);
  };

  const handleDelete = (userId: string) => {
    modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa người dùng này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => {
        deleteUserMutation.mutate({ where: { id: userId } });
      },
    });
  };

  const handleToggleLock = (user: User) => {
    const newLockedState = !user.locked;
    modal.confirm({
      title: newLockedState ? "Khóa tài khoản" : "Mở khóa tài khoản",
      content: `Bạn có chắc chắn muốn ${
        newLockedState ? "khóa" : "mở khóa"
      } tài khoản này?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: () => {
        updateUserMutation.mutate({
          where: { id: user.id },
          data: { locked: newLockedState },
        });
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingId) {
        // Update existing user
        const updateData: any = {
          name: values.name,
          role: values.role,
        };

        if (values.gender) updateData.gender = values.gender;
        if (values.birthday)
          updateData.birthday = values.birthday.toISOString();

        updateUserMutation.mutate({
          where: { id: editingId },
          data: updateData,
        });
      } else {
        // Create new user - using auth register API
        createUserMutation.mutate({
          body: {
            name: values.name,
            email: values.email,
            password: values.password,
            phone: values.phone || "0000000000", // Required field, use default if not provided
            gender: values.gender,
            birthday: values.birthday
              ? values.birthday.format("YYYY-MM-DD")
              : undefined,
          },
        });
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  // Transform and filter users
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase());
      const matchesFilter =
        filterRole === "all" || user.role === filterRole.toUpperCase();
      return matchesSearch && matchesFilter;
    });
  }, [users, searchText, filterRole]);

  // Statistics
  const statistics = useMemo(() => {
    if (!users) return { total: 0, students: 0, instructors: 0, active: 0 };

    return {
      total: users.length,
      students: users.filter((u) => u.role === "USER").length,
      instructors: users.filter((u) => u.role === "ADMIN").length,
      active: users.filter((u) => !u.locked).length,
    };
  }, [users]);

  const columns = [
    {
      title: "Người dùng",
      key: "user",
      render: (_: any, record: User) => (
        <Space>
          <Avatar size={40} src={record.avatarUrl || undefined}>
            {record.name?.charAt(0) || "U"}
          </Avatar>
          <div>
            <div style={{ fontWeight: "bold" }}>{record.name || "N/A"}</div>
            <div style={{ color: "#666", fontSize: "12px" }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: string) => {
        const roleMap = {
          ADMIN: { color: "red", text: "Quản trị viên" },
          USER: { color: "green", text: "Người dùng" },
        };
        const roleInfo = roleMap[role as keyof typeof roleMap] || {
          color: "default",
          text: role,
        };
        return (
          <Tag color={roleInfo.color} icon={undefined}>
            {roleInfo.text}
          </Tag>
        );
      },
    },
    {
      title: "Thống kê",
      key: "stats",
      render: (_: any, record: User) => {
        if (record.role === "USER") {
          return (
            <div>
              <div>Khóa học: {record._count?.userCourses || 0}</div>
              <div>Bài kiểm tra: {record._count?.testResults || 0}</div>
            </div>
          );
        } else {
          return (
            <div>
              <div>Khóa học tạo: {record._count?.createdCourses || 0}</div>
            </div>
          );
        }
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: any, record: User) => {
        const isActive = !record.locked;
        return (
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "Hoạt động" : "Đã khóa"}
          </Tag>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: Date) => (
        <Text type="secondary">
          {new Date(date).toLocaleDateString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<Eye className="w-4 h-4" />}
            size="small"
            onClick={() => handleView(record.id)}
          >
            Xem
          </Button>
          <Can do="UPDATE" on="User">
            <Button
              type="link"
              icon={<Edit className="w-4 h-4" />}
              size="small"
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
          </Can>
          <Can do="UPDATE" on="User">
            <Button
              type="link"
              danger={record.locked}
              icon={
                record.locked ? (
                  <Unlock className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )
              }
              size="small"
              onClick={() => handleToggleLock(record)}
            >
              {record.locked ? "Mở khóa" : "Khóa"}
            </Button>
          </Can>
          <Can do="DELETE" on="User">
            <Button
              type="link"
              danger
              icon={<Trash2 className="w-4 h-4" />}
              size="small"
              onClick={() => handleDelete(record.id)}
            >
              Xóa
            </Button>
          </Can>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Quản lý người dùng</Title>
        <Text type="secondary">
          Quản lý và theo dõi tất cả người dùng trong hệ thống
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng người dùng"
              value={statistics.total}
              prefix={<Users size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Người dùng"
              value={statistics.students}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Quản trị viên"
              value={statistics.instructors}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={statistics.active}
              prefix={<UserPlus size={20} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} lg={18}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                prefix={<Search size={14} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full sm:w-[300px]"
              />
              <Select
                value={filterRole}
                onChange={setFilterRole}
                className="w-full sm:w-[150px]"
              >
                <Option value="all">Tất cả vai trò</Option>
                <Option value="admin">Quản trị viên</Option>
                <Option value="user">Người dùng</Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} lg={6} style={{ textAlign: "right" }}>
            <Can do="CREATE" on="User">
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={handleCreate}
                className="w-full sm:w-auto"
              >
                Thêm người dùng mới
              </Button>
            </Can>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1000 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} người dùng`,
            responsive: true,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingId ? "Chỉnh sửa người dùng" : "Tạo người dùng mới"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false);
          setEditingId(null);
          form.resetFields();
        }}
        width={600}
        confirmLoading={
          createUserMutation.isPending || updateUserMutation.isPending
        }
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Họ và tên"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>

          {!editingId && (
            <>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu" },
                  { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                  {
                    pattern: /^[0-9]{10}$/,
                    message: "Số điện thoại phải có 10 chữ số",
                  },
                ]}
              >
                <Input placeholder="Nhập số điện thoại (10 chữ số)" />
              </Form.Item>
            </>
          )}

          <Form.Item name="gender" label="Giới tính">
            <Select placeholder="Chọn giới tính" allowClear>
              <Option value="MALE">Nam</Option>
              <Option value="FEMALE">Nữ</Option>
            </Select>
          </Form.Item>

          <Form.Item name="birthday" label="Ngày sinh">
            <DatePicker
              style={{ width: "100%" }}
              placeholder="Chọn ngày sinh"
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Details Drawer */}
      <Drawer
        title="Thông tin người dùng"
        placement="right"
        onClose={() => {
          setDrawerOpen(false);
          setViewingId(null);
        }}
        open={drawerOpen}
        width={500}
      >
        {viewingUser && (
          <div>
            <div className="flex flex-col items-center mb-6">
              <Avatar size={80} src={viewingUser.avatarUrl || undefined}>
                {viewingUser.name?.charAt(0) || "U"}
              </Avatar>
              <h3 className="text-xl font-semibold mt-3">
                {viewingUser.name || "N/A"}
              </h3>
              <p className="text-gray-500">{viewingUser.email}</p>
              <Tag
                color={viewingUser.role === "ADMIN" ? "red" : "green"}
                className="mt-2"
              >
                {viewingUser.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
              </Tag>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="Giới tính">
                {viewingUser.gender === "MALE"
                  ? "Nam"
                  : viewingUser.gender === "FEMALE"
                    ? "Nữ"
                    : viewingUser.gender === "OTHER"
                      ? "Khác"
                      : "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {viewingUser.birthday
                  ? dayjs(viewingUser.birthday).format("DD/MM/YYYY")
                  : "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={viewingUser.locked ? "red" : "green"}>
                  {viewingUser.locked ? "Đã khóa" : "Hoạt động"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(viewingUser.createdAt).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
            </Descriptions>

            <div className="mt-6">
              <h4 className="font-semibold mb-3">Thống kê</h4>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="Khóa học"
                      value={viewingUser._count?.userCourses || 0}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="Bài kiểm tra"
                      value={viewingUser._count?.testResults || 0}
                    />
                  </Card>
                </Col>
                {viewingUser.role === "ADMIN" && (
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title="Khóa học tạo"
                        value={viewingUser._count?.createdCourses || 0}
                      />
                    </Card>
                  </Col>
                )}
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="Thiết bị"
                      value={viewingUser._count?.devices || 0}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
