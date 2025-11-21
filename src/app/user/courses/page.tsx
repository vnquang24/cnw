"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Input,
  List,
  Modal,
  Progress,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  BookOpen,
  GraduationCap,
  Clock,
  TrendingUp,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  AlertTriangle,
  Send,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
import {
  useFindManyUserCourse,
  useFindManyCourse,
  useCreateUserCourse,
  useUpdateUserCourse,
} from "@/generated/hooks";
import { getUserId } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { InfoBadge } from "@/components/ui/info-badge";

const { Title, Text } = Typography;

// Type definition for UserCourse with relations
type UserCourseWithRelations = Prisma.UserCourseGetPayload<{
  include: {
    course: {
      include: {
        lessons: true;
        creator: true;
      };
    };
  };
}>;

const statusColorMap: Record<string, string> = {
  PENDING: "blue",
  APPROVED: "geekblue",
  REJECTED: "red",
  IN_PROGRESS: "gold",
  COMPLETED: "green",
};

function UserCoursesContent() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("my-courses");
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  // Query for user's enrolled courses
  const myCoursesQueryArgs = useMemo(() => {
    if (!userId) return undefined;
    return {
      where: { userId },
      include: {
        course: {
          include: {
            lessons: true,
            creator: true,
          },
        },
      },
      orderBy: { createdAt: "desc" as const },
    };
  }, [userId]);

  const {
    data: enrolments,
    isLoading: isLoadingEnrolments,
    isFetching: isFetchingEnrolments,
    error: enrolmentsError,
  } = useFindManyUserCourse(myCoursesQueryArgs, {
    enabled: Boolean(userId),
  });

  // Query for all available courses
  const {
    data: allCourses,
    isLoading: isLoadingAllCourses,
    isFetching: isFetchingAllCourses,
    error: allCoursesError,
  } = useFindManyCourse(
    {
      include: {
        creator: true,
        lessons: true,
      },
      orderBy: { createdAt: "desc" as const },
    },
    {
      enabled: activeTab === "explore",
    },
  );

  // Create enrollment mutation
  const createEnrolment = useCreateUserCourse();

  // Update enrollment mutation
  const updateEnrolment = useUpdateUserCourse();

  // Filter courses that user has not enrolled in
  const availableCourses = useMemo(() => {
    if (!allCourses || !userId) return [];
    const enrolledCourseIds = new Set(enrolments?.map((e) => e.courseId) ?? []);
    let filtered = allCourses.filter(
      (course) => !enrolledCourseIds.has(course.id),
    );

    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(lowerSearch) ||
          course.description?.toLowerCase().includes(lowerSearch) ||
          course.creator?.name?.toLowerCase().includes(lowerSearch),
      );
    }

    return filtered;
  }, [allCourses, enrolments, userId, searchText]);

  const totals = useMemo(() => {
    const list = enrolments ?? [];
    const totalCourses = list.length;
    const completedCourses = list.filter(
      (course) => course.enrolmentStatus === "COMPLETED",
    ).length;
    const inProgress = list.filter((course) =>
      ["IN_PROGRESS", "APPROVED"].includes(course.enrolmentStatus),
    ).length;
    const pending = list.filter(
      (course) => course.enrolmentStatus === "PENDING",
    ).length;
    const rejected = list.filter(
      (course) => course.enrolmentStatus === "REJECTED",
    ).length;

    // Calculate average progress only for active courses (not pending or rejected)
    const activeCourses = list.filter((course) =>
      ["IN_PROGRESS", "APPROVED", "COMPLETED"].includes(course.enrolmentStatus),
    );
    const averageProgress = activeCourses.length
      ? Math.round(
          activeCourses.reduce((acc, item) => acc + (item.progress ?? 0), 0) /
            activeCourses.length,
        )
      : 0;

    return {
      totalCourses,
      completedCourses,
      inProgress,
      pending,
      rejected,
      averageProgress,
    };
  }, [enrolments]);

  // Handle course enrollment
  const handleEnrollCourse = (courseId: string, courseTitle: string) => {
    if (!userId) {
      message.error("Không tìm thấy thông tin người dùng");
      return;
    }

    modal.confirm({
      title: "Đăng ký khóa học",
      content: `Bạn có muốn đăng ký khóa học "${courseTitle}"?`,
      okText: "Đăng ký",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await createEnrolment.mutateAsync({
            data: {
              userId,
              courseId,
              enrolmentStatus: "PENDING",
              progress: 0,
            },
          });

          message.success(
            "Đăng ký khóa học thành công! Vui lòng chờ admin phê duyệt.",
          );
          queryClient.invalidateQueries({ queryKey: ["UserCourse"] });
          queryClient.invalidateQueries({ queryKey: ["Course"] });
        } catch (error) {
          console.error("Error enrolling course:", error);
          message.error("Đăng ký khóa học thất bại. Vui lòng thử lại.");
        }
      },
    });
  };

  // Handle complete course
  const handleCompleteCourse = (enrollmentId: string, courseTitle: string) => {
    modal.confirm({
      title: "Hoàn thành khóa học",
      content: `Bạn xác nhận đã hoàn thành khóa học "${courseTitle}"?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await updateEnrolment.mutateAsync({
            where: { id: enrollmentId },
            data: {
              enrolmentStatus: "COMPLETED",
            },
          });

          message.success("Chúc mừng bạn đã hoàn thành khóa học!");
          queryClient.invalidateQueries({ queryKey: ["UserCourse"] });
        } catch (error) {
          console.error("Error completing course:", error);
          message.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
        }
      },
    });
  };

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

  // Handle request extension
  const handleRequestExtension = (
    enrollmentId: string,
    courseTitle: string,
    alreadyRequested: boolean,
  ) => {
    if (alreadyRequested) {
      modal.info({
        title: "Đã gửi yêu cầu",
        content:
          "Bạn đã gửi yêu cầu gia hạn cho khóa học này. Admin sẽ xem xét và phản hồi sớm nhất.",
        okText: "Đã hiểu",
      });
      return;
    }

    modal.confirm({
      title: "Gửi yêu cầu gia hạn",
      content: `Bạn muốn gửi yêu cầu gia hạn cho khóa học "${courseTitle}"?`,
      okText: "Gửi yêu cầu",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await updateEnrolment.mutateAsync({
            where: { id: enrollmentId },
            data: {
              extensionRequest: true,
            },
          });

          message.success(
            "Đã gửi yêu cầu gia hạn! Admin sẽ xem xét và phản hồi sớm.",
          );
          queryClient.invalidateQueries({ queryKey: ["UserCourse"] });
        } catch (error) {
          console.error("Error requesting extension:", error);
          message.error("Không thể gửi yêu cầu. Vui lòng thử lại.");
        }
      },
    });
  };

  // Get status info (color, text, icon)
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          color: "blue" as const,
          badgeType: "warning" as const,
          text: "Chờ phê duyệt",
          icon: <Clock size={14} />,
        };
      case "APPROVED":
        return {
          color: "geekblue" as const,
          badgeType: "success" as const,
          text: "Đã phê duyệt",
          icon: <CheckCircle size={14} />,
        };
      case "REJECTED":
        return {
          color: "red" as const,
          badgeType: "danger" as const,
          text: "Bị từ chối",
          icon: <XCircle size={14} />,
        };
      case "IN_PROGRESS":
        return {
          color: "gold" as const,
          badgeType: "warning" as const,
          text: "Đang học",
          icon: <BookOpen size={14} />,
        };
      case "COMPLETED":
        return {
          color: "green" as const,
          badgeType: "success" as const,
          text: "Đã hoàn thành",
          icon: <CheckCircle size={14} />,
        };
      default:
        return {
          color: "default" as const,
          badgeType: "default" as const,
          text: status,
          icon: <AlertCircle size={14} />,
        };
    }
  };

  const isLoading =
    isLoadingEnrolments || (activeTab === "explore" && isLoadingAllCourses);
  const isFetching =
    isFetchingEnrolments || (activeTab === "explore" && isFetchingAllCourses);

  if (!userId || isLoading || isFetching) {
    return (
      <div className="flex justify-center items-center h-72">
        <Spin size="large" tip="Đang tải khóa học của bạn...">
          <div style={{ minHeight: 50, minWidth: 100 }} />
        </Spin>
      </div>
    );
  }

  if (enrolmentsError || allCoursesError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải khóa học"
        description="Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
      />
    );
  }

  // My Courses Tab Content
  const MyCoursesTab = () => {
    if (!enrolments?.length) {
      return (
        <Empty
          description="Bạn chưa đăng ký khóa học nào."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => setActiveTab("explore")}>
            Khám phá khóa học
          </Button>
        </Empty>
      );
    }

    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ flex: 1 }} />
          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as "grid" | "list")}
            options={[
              {
                label: (
                  <span style={{ padding: "0 8px" }}>
                    <LayoutGrid
                      size={16}
                      className="inline mr-1"
                      style={{ verticalAlign: "middle" }}
                    />
                    Lưới
                  </span>
                ),
                value: "grid",
              },
              {
                label: (
                  <span style={{ padding: "0 8px" }}>
                    <ListIcon
                      size={16}
                      className="inline mr-1"
                      style={{ verticalAlign: "middle" }}
                    />
                    Danh sách
                  </span>
                ),
                value: "list",
              },
            ]}
          />
        </div>

        <Row gutter={[12, 12]}>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" bodyStyle={{ padding: "12px" }}>
              <Statistic
                title="Tổng số"
                value={totals.totalCourses}
                prefix={<BookOpen size={16} className="text-blue-500" />}
                valueStyle={{ fontSize: "20px" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" bodyStyle={{ padding: "12px" }}>
              <Statistic
                title="Đang học"
                value={totals.inProgress}
                prefix={<Clock size={16} className="text-amber-500" />}
                valueStyle={{ fontSize: "20px" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" bodyStyle={{ padding: "12px" }}>
              <Statistic
                title="Hoàn thành"
                value={totals.completedCourses}
                prefix={
                  <GraduationCap size={16} className="text-emerald-500" />
                }
                valueStyle={{ fontSize: "20px" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" bodyStyle={{ padding: "12px" }}>
              <Statistic
                title="Tiến độ TB"
                value={totals.averageProgress}
                suffix="%"
                prefix={<TrendingUp size={16} className="text-purple-500" />}
                valueStyle={{ fontSize: "20px" }}
              />
            </Card>
          </Col>
          {totals.pending > 0 && (
            <Col xs={12} sm={8} lg={4}>
              <Card size="small" bodyStyle={{ padding: "12px" }}>
                <Statistic
                  title="Chờ duyệt"
                  value={totals.pending}
                  prefix={<Clock size={16} className="text-blue-500" />}
                  valueStyle={{ color: "#1677ff", fontSize: "20px" }}
                />
              </Card>
            </Col>
          )}
          {totals.rejected > 0 && (
            <Col xs={12} sm={8} lg={4}>
              <Card size="small" bodyStyle={{ padding: "12px" }}>
                <Statistic
                  title="Từ chối"
                  value={totals.rejected}
                  prefix={<XCircle size={16} className="text-red-500" />}
                  valueStyle={{ color: "#ff4d4f", fontSize: "20px" }}
                />
              </Card>
            </Col>
          )}
        </Row>

        {viewMode === "grid" ? (
          <List
            grid={{
              gutter: 12,
              xs: 1,
              sm: 2,
              md: 2,
              lg: 3,
              xl: 4,
              xxl: 4,
            }}
            dataSource={enrolments}
            renderItem={(item) => {
              const course = item.course;
              if (!course) return null;
              const lessonsCount = course.lessons?.length ?? 0;
              const progressValue = Math.min(item.progress ?? 0, 100);

              const canAccessCourse =
                ["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(
                  item.enrolmentStatus,
                ) && !isExpired(item.endDate);
              const showCompleteButton =
                progressValue >= 100 && item.enrolmentStatus === "IN_PROGRESS";
              const courseExpired = isExpired(item.endDate);
              const isExpiringSoonFlag = isExpiringSoon(item.endDate);

              const getPrimaryStatus = () => {
                if (
                  courseExpired &&
                  ["APPROVED", "IN_PROGRESS"].includes(item.enrolmentStatus)
                ) {
                  return {
                    color: "red" as const,
                    badgeType: "danger" as const,
                    icon: <AlertTriangle size={12} />,
                    text: "Đã hết hạn",
                    showExtensionButton: true,
                  };
                }
                if (item.enrolmentStatus === "REJECTED") {
                  return {
                    color: "red" as const,
                    badgeType: "danger" as const,
                    icon: <XCircle size={12} />,
                    text: "Bị từ chối",
                    showReason: true,
                  };
                }
                if (item.enrolmentStatus === "PENDING") {
                  return {
                    color: "blue" as const,
                    badgeType: "warning" as const,
                    icon: <Clock size={12} />,
                    text: "Chờ phê duyệt",
                  };
                }
                if (
                  isExpiringSoonFlag &&
                  ["APPROVED", "IN_PROGRESS"].includes(item.enrolmentStatus)
                ) {
                  return {
                    color: "orange" as const,
                    badgeType: "warning" as const,
                    icon: <Clock size={12} />,
                    text: dayjs(item.endDate).format("DD/MM/YY"),
                    showExtensionButton: true,
                  };
                }
                if (item.enrolmentStatus === "COMPLETED") {
                  return {
                    color: "green" as const,
                    badgeType: "success" as const,
                    icon: <CheckCircle size={12} />,
                    text: "Hoàn thành",
                  };
                }
                return {
                  color: "gold" as const,
                  badgeType: "warning" as const,
                  icon: <BookOpen size={12} />,
                  text: "Đang học",
                };
              };

              const primaryStatus = getPrimaryStatus();

              return (
                <List.Item>
                  <Card
                    hoverable
                    size="small"
                    bodyStyle={{ padding: "12px" }}
                    actions={[
                      <Link key="access" href={`/user/courses/${course.id}`}>
                        <Button
                          type="primary"
                          size="small"
                          style={{ width: "90%" }}
                          disabled={!canAccessCourse}
                        >
                          {item.enrolmentStatus === "COMPLETED"
                            ? "Xem lại"
                            : "Vào học"}
                        </Button>
                      </Link>,
                    ]}
                  >
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Avatar
                          shape="square"
                          size={40}
                          style={{ background: "#1677ff10", flexShrink: 0 }}
                        >
                          <BookOpen size={20} className="text-blue-600" />
                        </Avatar>
                        <Title
                          level={5}
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            lineHeight: 1.3,
                          }}
                        >
                          {course.title}
                        </Title>
                      </div>

                      <Space size={4} wrap>
                        <InfoBadge
                          icon={<BookOpen size={11} />}
                          text={`${lessonsCount} bài`}
                          size="small"
                        />
                        <InfoBadge
                          icon={<Clock size={11} />}
                          text={`${course.duration}'`}
                          size="small"
                        />
                      </Space>

                      <Space size={4} align="center">
                        <Avatar
                          size={20}
                          style={{
                            backgroundColor: "#52c41a",
                            fontSize: "10px",
                          }}
                        >
                          {course.creator?.name?.charAt(0) || "G"}
                        </Avatar>
                        <Text type="secondary" style={{ fontSize: "11px" }}>
                          {course.creator?.name || "N/A"}
                        </Text>
                      </Space>

                      <InfoBadge
                        icon={primaryStatus.icon}
                        text={primaryStatus.text}
                        type={primaryStatus.badgeType}
                        size="small"
                      />

                      {primaryStatus.showReason && item.reason && (
                        <Text type="danger" style={{ fontSize: "11px" }}>
                          {item.reason}
                        </Text>
                      )}

                      {canAccessCourse && (
                        <Progress
                          percent={progressValue}
                          size="small"
                          status={progressValue === 100 ? "success" : undefined}
                          style={{ margin: 0 }}
                        />
                      )}

                      {primaryStatus.showExtensionButton && (
                        <Button
                          block
                          size="small"
                          type={item.extensionRequest ? "default" : "dashed"}
                          icon={<Send size={12} />}
                          onClick={() =>
                            handleRequestExtension(
                              item.id,
                              course.title,
                              item.extensionRequest || false,
                            )
                          }
                          loading={updateEnrolment.isPending}
                          disabled={item.extensionRequest}
                        >
                          {item.extensionRequest ? "Đã gửi" : "Gia hạn"}
                        </Button>
                      )}

                      {showCompleteButton && (
                        <Button
                          block
                          size="small"
                          type="default"
                          icon={<CheckCircle size={12} />}
                          onClick={() =>
                            handleCompleteCourse(item.id, course.title)
                          }
                          loading={updateEnrolment.isPending}
                          style={{ borderColor: "#52c41a", color: "#52c41a" }}
                        >
                          Hoàn thành
                        </Button>
                      )}

                      {(item.startDate || item.endDate) && (
                        <Space size={4} wrap>
                          {item.startDate && (
                            <InfoBadge
                              icon={<Calendar size={10} />}
                              text={dayjs(item.startDate).format("DD/MM/YY")}
                              size="small"
                            />
                          )}
                          {item.endDate && (
                            <InfoBadge
                              icon={<Calendar size={10} />}
                              text={dayjs(item.endDate).format("DD/MM/YY")}
                              size="small"
                            />
                          )}
                        </Space>
                      )}
                    </Space>
                  </Card>
                </List.Item>
              );
            }}
          />
        ) : (
          <List
            dataSource={enrolments}
            renderItem={(item) => {
              const course = item.course;
              if (!course) return null;
              const lessonsCount = course.lessons?.length ?? 0;
              const progressValue = Math.min(item.progress ?? 0, 100);

              // Determine if user can access the course
              const canAccessCourse =
                ["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(
                  item.enrolmentStatus,
                ) && !isExpired(item.endDate);
              const showCompleteButton =
                progressValue >= 100 && item.enrolmentStatus === "IN_PROGRESS";
              const courseExpired = isExpired(item.endDate);
              const isExpiringSoonFlag = isExpiringSoon(item.endDate);

              // Priority-based status display (only show the most important one)
              const getPrimaryStatus = () => {
                // 1. Expired (highest priority if applicable)
                if (
                  courseExpired &&
                  ["APPROVED", "IN_PROGRESS"].includes(item.enrolmentStatus)
                ) {
                  return {
                    color: "red" as const,
                    badgeType: "danger" as const,
                    icon: <AlertTriangle size={14} />,
                    text: "Đã hết hạn",
                    showExtensionButton: true,
                  };
                }

                // 2. Rejected
                if (item.enrolmentStatus === "REJECTED") {
                  return {
                    color: "red" as const,
                    badgeType: "danger" as const,
                    icon: <XCircle size={14} />,
                    text: "Bị từ chối",
                    showReason: true,
                  };
                }

                // 3. Pending
                if (item.enrolmentStatus === "PENDING") {
                  return {
                    color: "blue" as const,
                    badgeType: "warning" as const,
                    icon: <Clock size={14} />,
                    text: "Chờ phê duyệt",
                  };
                }

                // 4. Expiring soon
                if (
                  isExpiringSoonFlag &&
                  ["APPROVED", "IN_PROGRESS"].includes(item.enrolmentStatus)
                ) {
                  return {
                    color: "orange" as const,
                    badgeType: "warning" as const,
                    icon: <Clock size={14} />,
                    text: `Hết hạn: ${dayjs(item.endDate).format("DD/MM/YYYY")}`,
                    showExtensionButton: true,
                  };
                }

                // 5. Completed
                if (item.enrolmentStatus === "COMPLETED") {
                  return {
                    color: "green" as const,
                    badgeType: "success" as const,
                    icon: <CheckCircle size={14} />,
                    text: "Đã hoàn thành",
                  };
                }

                // 6. In Progress (default for approved/in_progress)
                return {
                  color: "gold" as const,
                  badgeType: "warning" as const,
                  icon: <BookOpen size={14} />,
                  text: "Đang học",
                };
              };

              const primaryStatus = getPrimaryStatus();

              return (
                <List.Item style={{ padding: "8px 0" }}>
                  <Card
                    className="w-full"
                    hoverable
                    size="small"
                    bodyStyle={{ padding: "12px" }}
                  >
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <Avatar
                          shape="square"
                          size={48}
                          style={{ background: "#1677ff10", flexShrink: 0 }}
                        >
                          <BookOpen size={24} className="text-blue-600" />
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Title
                            level={5}
                            style={{ margin: 0, marginBottom: "4px" }}
                          >
                            {course.title}
                          </Title>
                          <Space size={6} wrap>
                            <InfoBadge
                              icon={<BookOpen size={12} />}
                              text={`${lessonsCount} bài`}
                              size="small"
                            />
                            <InfoBadge
                              icon={<Clock size={12} />}
                              text={`${course.duration}'`}
                              size="small"
                            />
                            <Space
                              size={4}
                              align="center"
                              style={{ fontSize: "12px" }}
                            >
                              <Avatar
                                size={16}
                                style={{
                                  backgroundColor: "#52c41a",
                                  fontSize: "10px",
                                }}
                              >
                                {course.creator?.name?.charAt(0) || "G"}
                              </Avatar>
                              <Text
                                type="secondary"
                                style={{ fontSize: "11px" }}
                              >
                                {course.creator?.name || "N/A"}
                              </Text>
                            </Space>
                          </Space>
                        </div>
                      </div>

                      <Space size={8} wrap>
                        <InfoBadge
                          icon={primaryStatus.icon}
                          text={primaryStatus.text}
                          type={primaryStatus.badgeType}
                          size="small"
                        />

                        {primaryStatus.showExtensionButton && (
                          <Button
                            size="small"
                            type={item.extensionRequest ? "default" : "link"}
                            icon={<Send size={12} />}
                            onClick={() =>
                              handleRequestExtension(
                                item.id,
                                course.title,
                                item.extensionRequest || false,
                              )
                            }
                            loading={updateEnrolment.isPending}
                            disabled={item.extensionRequest}
                            style={{ padding: "0 8px", height: "24px" }}
                          >
                            {item.extensionRequest ? "Đã gửi" : "Gia hạn"}
                          </Button>
                        )}

                        {primaryStatus.showReason && item.reason && (
                          <Text type="danger" style={{ fontSize: "12px" }}>
                            {item.reason}
                          </Text>
                        )}
                      </Space>

                      {/* {canAccessCourse && ( */}
                      <>
                        <Progress
                          percent={progressValue}
                          size="small"
                          status={progressValue === 100 ? "success" : undefined}
                          style={{ margin: 0 }}
                        />

                        <Space size={8}>
                          <Link href={`/user/courses/${course.id}`}>
                            <Button
                              type="primary"
                              size="small"
                              disabled={canAccessCourse ? undefined : true}
                            >
                              {item.enrolmentStatus === "COMPLETED"
                                ? "Xem lại"
                                : "Vào học"}
                            </Button>
                          </Link>

                          {showCompleteButton && (
                            <Button
                              size="small"
                              type="default"
                              icon={<CheckCircle size={14} />}
                              onClick={() =>
                                handleCompleteCourse(item.id, course.title)
                              }
                              loading={updateEnrolment.isPending}
                              style={{
                                borderColor: "#52c41a",
                                color: "#52c41a",
                              }}
                            >
                              Hoàn thành
                            </Button>
                          )}
                        </Space>
                      </>
                      {/* )} */}

                      {item.enrolmentStatus === "PENDING" && (
                        <Button
                          size="small"
                          disabled
                          icon={<Clock size={14} />}
                        >
                          Chờ phê duyệt
                        </Button>
                      )}

                      {(item.startDate || item.endDate) && (
                        <Space size={6} wrap>
                          {item.startDate && (
                            <InfoBadge
                              icon={<Calendar size={11} />}
                              text={`Bắt đầu: ${dayjs(item.startDate).format("DD/MM/YY")}`}
                              size="small"
                            />
                          )}
                          {item.endDate && (
                            <InfoBadge
                              icon={<Calendar size={11} />}
                              text={`Kết thúc: ${dayjs(item.endDate).format("DD/MM/YY")}`}
                              size="small"
                            />
                          )}
                        </Space>
                      )}
                    </Space>
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </Space>
    );
  };

  // Explore Courses Tab Content
  const ExploreCoursesTab = () => {
    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Input
          placeholder="Tìm kiếm khóa học..."
          prefix={<Search size={16} />}
          size="middle"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />

        {availableCourses.length === 0 ? (
          <Empty
            description={
              searchText
                ? "Không tìm thấy khóa học phù hợp"
                : "Bạn đã đăng ký tất cả các khóa học có sẵn"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            grid={{
              gutter: 12,
              xs: 1,
              sm: 2,
              md: 2,
              lg: 3,
              xl: 4,
              xxl: 4,
            }}
            dataSource={availableCourses}
            renderItem={(course) => {
              const lessonsCount = course.lessons?.length ?? 0;

              return (
                <List.Item>
                  <Card
                    hoverable
                    size="small"
                    actions={[
                      <Button
                        key="enroll"
                        type="primary"
                        size="small"
                        onClick={() =>
                          handleEnrollCourse(course.id, course.title)
                        }
                        loading={createEnrolment.isPending}
                        style={{ width: "80%" }}
                      >
                        Đăng ký
                      </Button>,
                    ]}
                  >
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Avatar
                          shape="square"
                          size={40}
                          style={{ background: "#1677ff10", flexShrink: 0 }}
                        >
                          <BookOpen size={20} className="text-blue-600" />
                        </Avatar>
                        <Title
                          level={5}
                          style={{ margin: 0, fontSize: "14px" }}
                        >
                          {course.title}
                        </Title>
                      </div>

                      <Text
                        type="secondary"
                        className="line-clamp-2"
                        style={{ fontSize: "12px", minHeight: "32px" }}
                      >
                        {course.description || "Chưa có mô tả"}
                      </Text>

                      <Space size={4} wrap>
                        <InfoBadge
                          icon={<BookOpen size={11} />}
                          text={`${lessonsCount} bài`}
                          size="small"
                        />
                        <InfoBadge
                          icon={<Clock size={11} />}
                          text={`${course.duration}'`}
                          size="small"
                        />
                      </Space>

                      <Space size={4} align="center">
                        <Avatar
                          size={20}
                          style={{
                            backgroundColor: "#52c41a",
                            fontSize: "10px",
                          }}
                        >
                          {course.creator?.name?.charAt(0) || "G"}
                        </Avatar>
                        <Text type="secondary" style={{ fontSize: "11px" }}>
                          {course.creator?.name || "N/A"}
                        </Text>
                      </Space>
                    </Space>
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </Space>
    );
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <div>
        <Title level={3} style={{ marginBottom: "4px" }}>
          Khóa học
        </Title>
        <Text type="secondary" style={{ fontSize: "13px" }}>
          Quản lý và khám phá các khóa học
        </Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "my-courses",
            label: (
              <span>
                <BookOpen size={16} className="inline mr-2" />
                Khóa học của tôi
              </span>
            ),
            children: <MyCoursesTab />,
          },
          {
            key: "explore",
            label: (
              <span>
                <Search size={16} className="inline mr-2" />
                Khám phá khóa học
              </span>
            ),
            children: <ExploreCoursesTab />,
          },
        ]}
      />
    </Space>
  );
}

export default function UserCoursesPage() {
  return (
    <App>
      <UserCoursesContent />
    </App>
  );
}
