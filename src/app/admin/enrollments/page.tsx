"use client";

import { useState, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Grid,
  Statistic,
  Input,
  Select,
  Avatar,
  Spin,
  Modal,
  Form,
  App,
  Descriptions,
  Badge,
  DatePicker,
  Alert,
} from "antd";
import {
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  Filter,
  Calendar,
  AlertTriangle,
  Send,
} from "lucide-react";
import { useFindManyUserCourse, useUpdateUserCourse } from "@/generated/hooks";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { InfoBadge } from "@/components/ui/info-badge";
import { Can } from "@/components/permissions/Can";
import { getUserId, getUserInfo } from "@/lib/auth";
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

type UserCourse = {
  id: string;
  userId: string;
  courseId: string;
  enrolmentStatus: string;
  progress: number;
  reason?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  extensionRequest?: boolean;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  course?: {
    id: string;
    title: string;
    level?: string;
    duration?: number;
  };
};

export default function EnrollmentsPage() {
  return (
    <App>
      <EnrollmentsPageContent />
    </App>
  );
}

function EnrollmentsPageContent() {
  const userId = getUserId();
  const userInfo = getUserInfo();
  const isSuperAdmin = userInfo?.sub === "superadmin@gmail.com";
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<UserCourse | null>(null);

  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();

  // Check if enrollment is expiring soon (within 7 days)
  const isExpiringSoon = (endDate: Date | null | undefined) => {
    if (!endDate) return false;
    const daysUntilExpiry = dayjs(endDate).diff(dayjs(), "day");
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  };

  // Check if enrollment is expired
  const isExpired = (endDate: Date | null | undefined) => {
    if (!endDate) return false;
    return dayjs(endDate).isBefore(dayjs(), "day");
  };

  // Get Vietnamese text for course level
  const getLevelText = (level: string | undefined) => {
    const levelMap: Record<string, string> = {
      BEGINNER: "Sơ cấp",
      INTERMEDIATE: "Trung cấp",
      ADVANCED: "Nâng cao",
    };
    return level ? levelMap[level] || level : "";
  };

  // Fetch enrollments from database - CHỈ của courses mà giáo viên tạo (trừ superadmin)
  const { data: enrollments, isLoading } = useFindManyUserCourse({
    where: isSuperAdmin
      ? {} // SuperAdmin xem tất cả
      : {
          course: {
            createdBy: userId, // Chỉ lấy enrollments của courses do giáo viên này tạo
          },
        },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          level: true,
          duration: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Update mutation
  const updateEnrollmentMutation = useUpdateUserCourse({
    onSuccess: () => {
      message.success("Cập nhật trạng thái thành công!");
      queryClient.invalidateQueries({ queryKey: ["UserCourse"] });
      setApproveModalOpen(false);
      setRejectModalOpen(false);
      setSelectedEnrollment(null);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.message || "Có lỗi xảy ra khi cập nhật!");
    },
  });

  // Handlers
  const handleApprove = (enrollment: UserCourse) => {
    setSelectedEnrollment(enrollment);
    form.setFieldsValue({
      startDate: dayjs(),
      endDate: enrollment.course?.duration
        ? dayjs().add(enrollment.course.duration, "day")
        : undefined,
    });
    setApproveModalOpen(true);
  };

  const handleReject = (enrollment: UserCourse) => {
    setSelectedEnrollment(enrollment);
    form.resetFields();
    setRejectModalOpen(true);
  };

  const handleExtend = (enrollment: UserCourse) => {
    setSelectedEnrollment(enrollment);
    form.setFieldsValue({
      newEndDate: enrollment.endDate
        ? dayjs(enrollment.endDate).add(30, "day")
        : dayjs().add(30, "day"),
    });
    setExtendModalOpen(true);
  };

  const handleCancel = (enrollment: UserCourse) => {
    modal.confirm({
      title: "Hủy đăng ký khóa học",
      content: `Bạn có chắc chắn muốn hủy đăng ký của "${enrollment.user?.name}" cho khóa học "${enrollment.course?.title}"?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => {
        updateEnrollmentMutation.mutate({
          where: { id: enrollment.id },
          data: {
            enrolmentStatus: "REJECTED",
            reason: "Admin đã hủy đăng ký khóa học",
          },
        });
      },
    });
  };

  const handleApproveSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedEnrollment) return;

      updateEnrollmentMutation.mutate({
        where: { id: selectedEnrollment.id },
        data: {
          enrolmentStatus: "APPROVED",
          startDate: values.startDate
            ? values.startDate.toISOString()
            : undefined,
          endDate: values.endDate ? values.endDate.toISOString() : undefined,
        },
      });
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleRejectSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedEnrollment) return;

      updateEnrollmentMutation.mutate({
        where: { id: selectedEnrollment.id },
        data: {
          enrolmentStatus: "REJECTED",
          reason: values.reason,
        },
      });
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleExtendSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedEnrollment) return;

      updateEnrollmentMutation.mutate({
        where: { id: selectedEnrollment.id },
        data: {
          endDate: values.newEndDate
            ? values.newEndDate.toISOString()
            : undefined,
          extensionRequest: false, // Reset extension request after extending
        },
      });
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  // Filter enrollments
  const filteredEnrollments = useMemo(() => {
    if (!enrollments) return [];

    return enrollments.filter((enrollment) => {
      const matchesSearch =
        enrollment.user?.name
          ?.toLowerCase()
          .includes(searchText.toLowerCase()) ||
        enrollment.user?.email
          ?.toLowerCase()
          .includes(searchText.toLowerCase()) ||
        enrollment.course?.title
          ?.toLowerCase()
          .includes(searchText.toLowerCase());

      const matchesFilter =
        filterStatus === "all" || enrollment.enrolmentStatus === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [enrollments, searchText, filterStatus]);

  // Statistics
  const statistics = useMemo(() => {
    if (!enrollments)
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        extensionRequests: 0,
      };

    return {
      total: enrollments.length,
      pending: enrollments.filter((e) => e.enrolmentStatus === "PENDING")
        .length,
      approved: enrollments.filter((e) => e.enrolmentStatus === "APPROVED")
        .length,
      rejected: enrollments.filter((e) => e.enrolmentStatus === "REJECTED")
        .length,
      extensionRequests: enrollments.filter((e) => e.extensionRequest === true)
        .length,
    };
  }, [enrollments]);

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "gold",
      APPROVED: "green",
      REJECTED: "red",
      IN_PROGRESS: "blue",
      COMPLETED: "purple",
    };
    return statusMap[status] || "default";
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "Chờ duyệt",
      APPROVED: "Đã duyệt",
      REJECTED: "Từ chối",
      IN_PROGRESS: "Đang học",
      COMPLETED: "Hoàn thành",
    };
    return statusMap[status] || status;
  };

  const columns = [
    {
      title: "Học viên",
      key: "user",
      width: 250,
      render: (_: any, record: UserCourse) => (
        <Space>
          <Avatar size={40} src={record.user?.avatarUrl || undefined}>
            {record.user?.name?.charAt(0) || "U"}
          </Avatar>
          <div>
            <div style={{ fontWeight: "bold" }}>
              {record.user?.name || "N/A"}
            </div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.user?.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Khóa học",
      key: "course",
      width: 300,
      render: (_: any, record: UserCourse) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.course?.title}</div>
          <Space size={4} className="mt-1">
            {record.course?.level && (
              <Tag color="blue" style={{ fontSize: "11px" }}>
                {getLevelText(record.course.level)}
              </Tag>
            )}
            {record.course?.duration && (
              <Tag style={{ fontSize: "11px" }}>
                {record.course.duration} ngày
              </Tag>
            )}
          </Space>
          {/* Extension request badge */}
          {record.extensionRequest && (
            <div className="mt-1">
              <InfoBadge
                icon={<AlertTriangle size={12} />}
                text="Yêu cầu gia hạn"
                type="warning"
                size="small"
              />
            </div>
          )}
          {/* Expiring warning */}
          {(record.enrolmentStatus === "APPROVED" ||
            record.enrolmentStatus === "IN_PROGRESS") && (
            <>
              {isExpired(record.endDate) && (
                <div className="mt-1">
                  <InfoBadge
                    icon={<AlertTriangle size={12} />}
                    text="Đã hết hạn"
                    type="danger"
                    size="small"
                  />
                </div>
              )}
              {!isExpired(record.endDate) && isExpiringSoon(record.endDate) && (
                <div className="mt-1">
                  <InfoBadge
                    icon={<Clock size={12} />}
                    text="Sắp hết hạn"
                    type="warning"
                    size="small"
                  />
                </div>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "enrolmentStatus",
      key: "status",
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Thời gian",
      key: "dates",
      width: 180,
      render: (_: any, record: UserCourse) => (
        <div>
          {record.startDate && (
            <div>
              <Text type="secondary" style={{ fontSize: "11px" }}>
                Bắt đầu:{" "}
              </Text>
              <Text style={{ fontSize: "12px" }}>
                {dayjs(record.startDate).format("DD/MM/YYYY")}
              </Text>
            </div>
          )}
          {record.endDate && (
            <div>
              <Text type="secondary" style={{ fontSize: "11px" }}>
                Kết thúc:{" "}
              </Text>
              <Text style={{ fontSize: "12px" }}>
                {dayjs(record.endDate).format("DD/MM/YYYY")}
              </Text>
            </div>
          )}
          {!record.startDate && !record.endDate && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              -
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      fixed: screens.md ? ("right" as const) : undefined,
      align: "center" as const,
      render: (_: any, record: UserCourse) => {
        if (record.enrolmentStatus === "PENDING") {
          return (
            <Space
              size="small"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <Can do="UPDATE" on="UserCourse">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckCircle size={18} style={{ color: "#52c41a" }} />}
                  onClick={() => handleApprove(record)}
                  title="Duyệt"
                />
              </Can>
              <Can do="UPDATE" on="UserCourse">
                <Button
                  type="text"
                  size="small"
                  icon={<XCircle size={18} style={{ color: "#ff4d4f" }} />}
                  onClick={() => handleReject(record)}
                  title="Từ chối"
                />
              </Can>
            </Space>
          );
        }

        if (
          record.enrolmentStatus === "APPROVED" ||
          record.enrolmentStatus === "IN_PROGRESS" ||
          record.enrolmentStatus === "COMPLETED"
        ) {
          return (
            <Space
              size="small"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <Can do="UPDATE" on="UserCourse">
                <Button
                  type="text"
                  size="small"
                  icon={<Calendar size={18} style={{ color: "#1677ff" }} />}
                  onClick={() => handleExtend(record)}
                  title="Gia hạn"
                />
              </Can>
              <Can do="UPDATE" on="UserCourse">
                <Button
                  type="text"
                  size="small"
                  icon={<XCircle size={18} style={{ color: "#ff4d4f" }} />}
                  onClick={() => handleCancel(record)}
                  title="Hủy"
                />
              </Can>
            </Space>
          );
        }

        return <Text type="secondary">-</Text>;
      },
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
        <Title level={2}>Quản lý đăng ký khóa học</Title>
        <Text type="secondary">
          Phê duyệt và quản lý các yêu cầu đăng ký khóa học của học viên
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Tổng đăng ký"
              value={statistics.total}
              prefix={<BookOpen size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card
            style={{ cursor: "pointer", transition: "all 0.3s" }}
            onClick={() => setFilterStatus("PENDING")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(0, 0, 0, 0.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
          >
            <Badge count={statistics.pending} offset={[10, 0]}>
              <Statistic
                title="Chờ duyệt"
                value={statistics.pending}
                valueStyle={{ color: "#faad14" }}
                prefix={<Clock size={20} />}
              />
            </Badge>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card
            style={{ cursor: "pointer", transition: "all 0.3s" }}
            onClick={() => setFilterStatus("APPROVED")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(0, 0, 0, 0.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
          >
            <Statistic
              title="Đã duyệt"
              value={statistics.approved}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircle size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Statistic
              title="Từ chối"
              value={statistics.rejected}
              valueStyle={{ color: "#ff4d4f" }}
              prefix={<XCircle size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4}>
          <Card>
            <Badge count={statistics.extensionRequests} offset={[10, 0]}>
              <Statistic
                title="Yêu cầu gia hạn"
                value={statistics.extensionRequests}
                valueStyle={{ color: "#722ed1" }}
                prefix={<Send size={20} />}
              />
            </Badge>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} lg={18}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Tìm kiếm học viên, khóa học..."
                prefix={<Search size={14} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full sm:w-[300px]"
                allowClear
              />
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                className="w-full sm:w-[200px]"
                suffixIcon={<Filter size={14} />}
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="PENDING">
                  <Badge status="warning" text="Chờ duyệt" />
                </Option>
                <Option value="APPROVED">
                  <Badge status="success" text="Đã duyệt" />
                </Option>
                <Option value="REJECTED">
                  <Badge status="error" text="Từ chối" />
                </Option>
                <Option value="IN_PROGRESS">
                  <Badge status="processing" text="Đang học" />
                </Option>
                <Option value="COMPLETED">
                  <Badge status="default" text="Hoàn thành" />
                </Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} lg={6} style={{ textAlign: "right" }}>
            <Text type="secondary">
              Hiển thị {filteredEnrollments.length} / {statistics.total} đăng ký
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredEnrollments}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} đăng ký`,
            responsive: true,
          }}
        />
      </Card>

      {/* Approve Modal */}
      <Modal
        title={
          <Space>
            <CheckCircle size={20} style={{ color: "#52c41a" }} />
            <span>Phê duyệt đăng ký</span>
          </Space>
        }
        open={approveModalOpen}
        onOk={handleApproveSubmit}
        onCancel={() => {
          setApproveModalOpen(false);
          setSelectedEnrollment(null);
          form.resetFields();
        }}
        okText="Phê duyệt"
        cancelText="Hủy"
        confirmLoading={updateEnrollmentMutation.isPending}
        width={600}
      >
        {selectedEnrollment && (
          <div className="py-4">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Học viên">
                {selectedEnrollment.user?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedEnrollment.user?.email}
              </Descriptions.Item>
              <Descriptions.Item label="Khóa học">
                {selectedEnrollment.course?.title}
              </Descriptions.Item>
              <Descriptions.Item label="Thời lượng">
                {selectedEnrollment.course?.duration} ngày
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" className="mt-4">
              <Form.Item
                name="startDate"
                label="Ngày bắt đầu"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày bắt đầu" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày bắt đầu"
                  disabledDate={(current) => {
                    return current && current < dayjs().startOf("day");
                  }}
                />
              </Form.Item>

              <Form.Item name="endDate" label="Ngày kết thúc (dự kiến)">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày kết thúc"
                  disabledDate={(current) => {
                    const startDate = form.getFieldValue("startDate");
                    return (
                      current &&
                      (current < dayjs().startOf("day") ||
                        (startDate && current < startDate.startOf("day")))
                    );
                  }}
                />
              </Form.Item>
            </Form>

            <Alert
              message="Sau khi phê duyệt, học viên sẽ có thể truy cập khóa học"
              type="success"
              showIcon
              style={{ fontSize: "12px" }}
            />
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={
          <Space>
            <XCircle size={20} style={{ color: "#ff4d4f" }} />
            <span>Từ chối đăng ký</span>
          </Space>
        }
        open={rejectModalOpen}
        onOk={handleRejectSubmit}
        onCancel={() => {
          setRejectModalOpen(false);
          setSelectedEnrollment(null);
          form.resetFields();
        }}
        okText="Từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        confirmLoading={updateEnrollmentMutation.isPending}
        width={600}
      >
        {selectedEnrollment && (
          <div className="py-4">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Học viên">
                {selectedEnrollment.user?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedEnrollment.user?.email}
              </Descriptions.Item>
              <Descriptions.Item label="Khóa học">
                {selectedEnrollment.course?.title}
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" className="mt-4">
              <Form.Item
                name="reason"
                label="Lý do từ chối"
                rules={[
                  { required: true, message: "Vui lòng nhập lý do từ chối" },
                  {
                    min: 10,
                    message: "Lý do phải có ít nhất 10 ký tự",
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Nhập lý do từ chối đăng ký này..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Form>

            <Alert
              message="Học viên sẽ nhận được thông báo về lý do từ chối"
              type="warning"
              showIcon
              style={{ fontSize: "12px" }}
            />
          </div>
        )}
      </Modal>

      {/* Extend Modal */}
      <Modal
        title={
          <Space>
            <Calendar size={20} style={{ color: "#1677ff" }} />
            <span>Gia hạn thời gian học</span>
          </Space>
        }
        open={extendModalOpen}
        onOk={handleExtendSubmit}
        onCancel={() => {
          setExtendModalOpen(false);
          setSelectedEnrollment(null);
          form.resetFields();
        }}
        okText="Gia hạn"
        cancelText="Hủy"
        confirmLoading={updateEnrollmentMutation.isPending}
        width={600}
      >
        {selectedEnrollment && (
          <div className="py-4 ">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Học viên">
                {selectedEnrollment.user?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Khóa học">
                {selectedEnrollment.course?.title}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">
                {selectedEnrollment.startDate
                  ? dayjs(selectedEnrollment.startDate).format("DD/MM/YYYY")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc hiện tại">
                {selectedEnrollment.endDate
                  ? dayjs(selectedEnrollment.endDate).format("DD/MM/YYYY")
                  : "-"}
              </Descriptions.Item>
            </Descriptions>

            {isExpired(selectedEnrollment.endDate) && (
              <Alert message="Khóa học đã hết hạn" />
            )}

            <Form form={form} layout="vertical" className="mt-4">
              <Form.Item
                name="newEndDate"
                label="Ngày kết thúc mới"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn ngày kết thúc mới",
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày kết thúc mới"
                  disabledDate={(current) => {
                    // Must be after today
                    return current && current < dayjs().startOf("day");
                  }}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
