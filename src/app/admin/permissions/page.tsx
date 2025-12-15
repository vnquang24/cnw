"use client";

import { useState, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Checkbox,
  Row,
  Col,
  Typography,
  Popconfirm,
  message,
  Tabs,
  Spin,
  Empty,
  Alert,
  Switch,
  Descriptions,
  Select,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  TeamOutlined,
  UnlockOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  useFindManyUserGroup,
  useCreateUserGroup,
  useUpdateUserGroup,
  useDeleteUserGroup,
} from "@/generated/hooks/user-group";
import {
  useFindManyPermission,
  useCreatePermission,
  useDeletePermission,
} from "@/generated/hooks/permission";

const { Title, Text } = Typography;

export default function PermissionsPage() {
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [isPermissionModalVisible, setIsPermissionModalVisible] =
    useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("groups");
  const [form] = Form.useForm();
  const [permForm] = Form.useForm();

  // Fetch data
  const {
    data: userGroups,
    isLoading: groupsLoading,
    refetch: refetchGroups,
  } = useFindManyUserGroup({
    include: {
      permission: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const {
    data: allPermissions,
    isLoading: permsLoading,
    refetch: refetchPermissions,
  } = useFindManyPermission({});

  // Mutations
  const createGroup = useCreateUserGroup();
  const updateGroup = useUpdateUserGroup();
  const deleteGroup = useDeleteUserGroup();
  const createPermission = useCreatePermission();
  const deletePermission = useDeletePermission();

  // Get permissions for selected group
  const selectedGroup = useMemo(
    () => userGroups?.find((g) => g.id === selectedGroupId),
    [userGroups, selectedGroupId],
  );

  // Extract unique permission names and types from DB
  const permissionNames = useMemo(() => {
    if (!allPermissions) return [];
    const uniqueNames = Array.from(
      new Set(allPermissions.map((p) => p.name)),
    ).sort();
    return uniqueNames;
  }, [allPermissions]);

  const permissionTypes = useMemo(() => {
    if (!allPermissions) return [];
    const uniqueTypes = Array.from(
      new Set(allPermissions.map((p) => p.permissionType)),
    ).sort();
    return uniqueTypes.map((type) => ({
      value: type,
      label: getTypeLabel(type),
      color: getTypeColor(type),
    }));
  }, [allPermissions]);

  // Helper functions for permission type display
  function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      CREATE: "Tạo mới",
      READ: "Xem",
      UPDATE: "Cập nhật",
      DELETE: "Xóa",
    };
    return labels[type] || type;
  }

  function getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      CREATE: "green",
      READ: "blue",
      UPDATE: "orange",
      DELETE: "red",
    };
    return colors[type] || "default";
  }

  // Permission matrix: group permissions by name and type
  const permissionMatrix = useMemo(() => {
    if (!allPermissions) return {};
    const matrix: Record<string, Record<string, any>> = {};

    allPermissions.forEach((perm) => {
      if (!matrix[perm.name]) {
        matrix[perm.name] = {};
      }
      matrix[perm.name][perm.permissionType] = perm;
    });

    return matrix;
  }, [allPermissions]);

  // Handle create/update group
  const handleSaveGroup = async () => {
    try {
      const values = await form.validateFields();
      if (editingGroup) {
        await updateGroup.mutateAsync({
          where: { id: editingGroup.id },
          data: {
            name: { set: values.name },
            description: { set: values.description || "" },
          },
        });
        message.success("Cập nhật nhóm thành công!");
      } else {
        await createGroup.mutateAsync({
          data: {
            name: values.name,
            description: values.description || "",
          },
        });
        message.success("Tạo nhóm thành công!");
      }
      setIsGroupModalVisible(false);
      setEditingGroup(null);
      form.resetFields();
    } catch (error: any) {
      message.error(error?.message || "Có lỗi xảy ra!");
    }
  };

  // Handle delete group
  const handleDeleteGroup = async (id: string) => {
    try {
      await deleteGroup.mutateAsync({ where: { id } });
      message.success("Xóa nhóm thành công!");
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
    } catch (error: any) {
      message.error(error?.message || "Có lỗi xảy ra!");
    }
  };

  // Handle assign/remove permission
  const handleTogglePermission = async (
    groupId: string,
    permissionId: string,
    isAssigned: boolean,
  ) => {
    try {
      const group = userGroups?.find((g) => g.id === groupId);
      if (!group) return;

      const currentPermIds = group.permission?.map((p) => p.id) || [];
      const newPermIds = isAssigned
        ? currentPermIds.filter((id) => id !== permissionId)
        : [...currentPermIds, permissionId];

      await updateGroup.mutateAsync({
        where: { id: groupId },
        data: {
          permission: {
            set: newPermIds.map((id) => ({ id })),
          },
        },
      });

      message.success(
        isAssigned ? "Đã gỡ quyền thành công!" : "Đã gán quyền thành công!",
      );
    } catch (error: any) {
      message.error(error?.message || "Có lỗi xảy ra!");
    }
  };

  // Handle create new permission
  const handleCreatePermission = async () => {
    try {
      const values = await permForm.validateFields();
      await createPermission.mutateAsync({
        data: {
          name: values.name,
          permissionType: values.permissionType,
        },
      });
      message.success("Tạo quyền thành công!");
      setIsPermissionModalVisible(false);
      permForm.resetFields();
      refetchPermissions();
    } catch (error: any) {
      message.error(error?.message || "Có lỗi xảy ra!");
    }
  };

  // Handle delete permission
  const handleDeletePermission = async (id: string) => {
    try {
      await deletePermission.mutateAsync({ where: { id } });
      message.success("Xóa quyền thành công!");
      refetchPermissions();
    } catch (error: any) {
      message.error(error?.message || "Có lỗi xảy ra!");
    }
  };

  // User groups table columns
  const groupColumns = [
    {
      title: "Tên nhóm",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <Space>
          <TeamOutlined className="text-blue-500" />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string) => text || <Text type="secondary">-</Text>,
    },
    {
      title: "Thành viên",
      key: "users",
      responsive: ["md"] as any,
      render: (_: any, record: any) => (
        <Tag color="blue">{record.user?.length || 0}</Tag>
      ),
    },
    {
      title: "Quyền",
      key: "permissions",
      responsive: ["lg"] as any,
      render: (_: any, record: any) => (
        <Tag color="green">{record.permission?.length || 0}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right" as any,
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<UnlockOutlined />}
            onClick={() => {
              setSelectedGroupId(record.id);
              setActiveTab("permissions");
            }}
          />
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingGroup(record);
              form.setFieldsValue(record);
              setIsGroupModalVisible(true);
            }}
          />
          <Popconfirm
            title="Xóa nhóm?"
            description="Thành viên sẽ mất quyền từ nhóm này"
            onConfirm={() => handleDeleteGroup(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Loading state
  if (groupsLoading || permsLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card bordered={false} className="mb-4 sm:mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} lg={18}>
            <Space direction="vertical" size={0}>
              <Title level={2} className="!mb-1">
                <SafetyOutlined className="mr-2 sm:mr-3" />
                Quản lý phân quyền
              </Title>
              <Text type="secondary" className="text-xs sm:text-sm">
                Quản lý nhóm người dùng và phân quyền CRUD cho các bảng
              </Text>
            </Space>
          </Col>
          <Col xs={24} lg={6} className="text-left lg:text-right">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                refetchGroups();
                refetchPermissions();
              }}
            >
              Tải lại
            </Button>
          </Col>
        </Row>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "groups",
            label: (
              <span>
                <TeamOutlined /> Nhóm người dùng
              </span>
            ),
            children: (
              <Card>
                <Row gutter={[16, 16]} className="mb-4">
                  <Col xs={12} sm={8}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingGroup(null);
                        form.resetFields();
                        setIsGroupModalVisible(true);
                      }}
                      block
                    >
                      Tạo nhóm
                    </Button>
                  </Col>
                </Row>
                {userGroups && userGroups.length === 0 ? (
                  <Empty description="Chưa có nhóm nào" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table
                      columns={groupColumns}
                      dataSource={userGroups || []}
                      loading={groupsLoading}
                      rowKey="id"
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                      scroll={{ x: 800 }}
                    />
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: "permissions",
            label: (
              <span>
                <UnlockOutlined /> Ma trận phân quyền
              </span>
            ),
            children: (
              <Card>
                {selectedGroupId ? (
                  <>
                    <Space className="mb-4">
                      <Button
                        type="default"
                        onClick={() => {
                          setSelectedGroupId(null);
                          setActiveTab("groups");
                        }}
                      >
                        ← Quay lại danh sách
                      </Button>
                      <Divider type="vertical" />
                      <Select
                        value={selectedGroupId}
                        onChange={(value) => setSelectedGroupId(value)}
                        style={{ width: 200 }}
                        placeholder="Chọn nhóm khác"
                      >
                        {userGroups?.map((group) => (
                          <Select.Option key={group.id} value={group.id}>
                            <Space>
                              <TeamOutlined />
                              {group.name}
                            </Space>
                          </Select.Option>
                        ))}
                      </Select>
                    </Space>

                    {permissionNames.length === 0 ? (
                      <Empty description="Không có quyền nào trong hệ thống" />
                    ) : (
                      <Table
                        dataSource={permissionNames.map((name) => ({
                          key: name,
                          tableName: name,
                        }))}
                        pagination={false}
                        size="small"
                        scroll={{ x: 600 }}
                        bordered
                      >
                        <Table.Column
                          title="Bảng"
                          dataIndex="tableName"
                          key="tableName"
                          fixed="left"
                          width={150}
                          render={(name: string) => (
                            <Text strong className="text-xs sm:text-sm">
                              {name}
                            </Text>
                          )}
                        />
                        {permissionTypes.map((type) => (
                          <Table.Column
                            key={type.value}
                            title={
                              <Tag color={type.color} className="m-0">
                                {type.label}
                              </Tag>
                            }
                            align="center"
                            width={100}
                            render={(_: any, record: any) => {
                              const permission =
                                permissionMatrix[record.tableName]?.[
                                  type.value
                                ];
                              const isAssigned =
                                selectedGroup?.permission?.some(
                                  (p) => p.id === permission?.id,
                                );

                              return permission ? (
                                <Switch
                                  size="small"
                                  checked={isAssigned}
                                  onChange={(checked) =>
                                    handleTogglePermission(
                                      selectedGroupId,
                                      permission.id,
                                      !checked,
                                    )
                                  }
                                  checkedChildren="✓"
                                  unCheckedChildren="✗"
                                />
                              ) : (
                                <Text type="secondary">-</Text>
                              );
                            }}
                          />
                        ))}
                      </Table>
                    )}
                  </>
                ) : (
                  <Empty
                    description={
                      <Space direction="vertical">
                        <Text>Vui lòng chọn một nhóm để phân quyền</Text>
                        <Select
                          placeholder="Chọn nhóm"
                          style={{ width: 250 }}
                          onChange={(value) => {
                            setSelectedGroupId(value);
                          }}
                          showSearch
                          optionFilterProp="children"
                        >
                          {userGroups?.map((group) => (
                            <Select.Option key={group.id} value={group.id}>
                              <Space>
                                <TeamOutlined />
                                {group.name}
                              </Space>
                            </Select.Option>
                          ))}
                        </Select>
                      </Space>
                    }
                    className="py-12"
                  />
                )}
              </Card>
            ),
          },
          {
            key: "manage-permissions",
            label: (
              <span>
                <SafetyOutlined /> Quản lý quyền
              </span>
            ),
            children: (
              <Card>
                <Row gutter={[16, 16]} className="mb-4">
                  <Col xs={12} sm={8}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        permForm.resetFields();
                        setIsPermissionModalVisible(true);
                      }}
                      block
                    >
                      Tạo quyền
                    </Button>
                  </Col>
                </Row>
                {allPermissions && allPermissions.length === 0 ? (
                  <Empty description="Chưa có quyền nào" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table
                      columns={[
                        {
                          title: "Tên bảng",
                          dataIndex: "name",
                          key: "name",
                          sorter: (a, b) => a.name.localeCompare(b.name),
                        },
                        {
                          title: "Loại quyền",
                          dataIndex: "permissionType",
                          key: "permissionType",
                          render: (type: string) => (
                            <Tag color={getTypeColor(type)}>
                              {getTypeLabel(type)}
                            </Tag>
                          ),
                          filters: permissionTypes.map((t) => ({
                            text: t.label,
                            value: t.value,
                          })),
                          onFilter: (value, record) =>
                            record.permissionType === value,
                        },
                        {
                          title: "Số nhóm sử dụng",
                          key: "groups",
                          responsive: ["md"] as any,
                          render: (_: any, record: any) => {
                            const count =
                              userGroups?.filter((g) =>
                                g.permission?.some((p) => p.id === record.id),
                              ).length || 0;
                            return <Tag color="blue">{count}</Tag>;
                          },
                        },
                        {
                          title: "Thao tác",
                          key: "action",
                          fixed: "right" as any,
                          width: 100,
                          render: (_: any, record: any) => {
                            const isUsed = userGroups?.some((g) =>
                              g.permission?.some((p) => p.id === record.id),
                            );
                            return (
                              <Popconfirm
                                title="Xóa quyền?"
                                description={
                                  isUsed
                                    ? "Quyền này đang được sử dụng, vẫn xóa?"
                                    : "Bạn có chắc muốn xóa quyền này?"
                                }
                                onConfirm={() =>
                                  handleDeletePermission(record.id)
                                }
                                okText="Xóa"
                                cancelText="Hủy"
                              >
                                <Button
                                  type="link"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                />
                              </Popconfirm>
                            );
                          },
                        },
                      ]}
                      dataSource={allPermissions || []}
                      loading={permsLoading}
                      rowKey="id"
                      pagination={{ pageSize: 20, showSizeChanger: true }}
                      scroll={{ x: 600 }}
                    />
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />

      {/* Modal tạo/sửa nhóm */}
      <Modal
        title={
          <Space>
            <TeamOutlined />
            {editingGroup ? "Sửa nhóm" : "Tạo nhóm mới"}
          </Space>
        }
        open={isGroupModalVisible}
        onOk={handleSaveGroup}
        onCancel={() => {
          setIsGroupModalVisible(false);
          setEditingGroup(null);
          form.resetFields();
        }}
        confirmLoading={createGroup.isPending || updateGroup.isPending}
        okText={editingGroup ? "Cập nhật" : "Tạo"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label="Tên nhóm"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên nhóm!" }]}
          >
            <Input placeholder="VD: Giáo viên, Quản trị viên..." />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Mô tả về nhóm người dùng này..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal tạo quyền mới */}
      <Modal
        title={
          <Space>
            <SafetyOutlined />
            Tạo quyền mới
          </Space>
        }
        open={isPermissionModalVisible}
        onOk={handleCreatePermission}
        onCancel={() => {
          setIsPermissionModalVisible(false);
          permForm.resetFields();
        }}
        confirmLoading={createPermission.isPending}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Form form={permForm} layout="vertical" className="mt-4">
          <Form.Item
            label="Tên bảng"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên bảng!" }]}
          >
            <Input placeholder="VD: User, Course, Lesson..." />
          </Form.Item>
          <Form.Item
            label="Loại quyền"
            name="permissionType"
            rules={[{ required: true, message: "Vui lòng chọn loại quyền!" }]}
          >
            <Select placeholder="Chọn loại quyền">
              {["CREATE", "READ", "UPDATE", "DELETE"].map((type) => (
                <Select.Option key={type} value={type}>
                  <Tag color={getTypeColor(type)}>{getTypeLabel(type)}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
