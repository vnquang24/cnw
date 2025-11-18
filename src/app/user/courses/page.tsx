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
} from "lucide-react";
import {
  useFindManyUserCourse,
  useFindManyCourse,
  useCreateUserCourse,
  useUpdateUserCourse,
} from "@/generated/hooks";
import { getUserId } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

const { Title, Text } = Typography;

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
          color: "blue",
          text: "Chờ phê duyệt",
          icon: <Clock size={16} className="inline mr-1" />,
          description: "Yêu cầu đăng ký của bạn đang chờ admin phê duyệt.",
        };
      case "APPROVED":
        return {
          color: "geekblue",
          text: "Đã phê duyệt",
          icon: <CheckCircle size={16} className="inline mr-1" />,
          description: "Khóa học đã được phê duyệt. Bạn có thể bắt đầu học.",
        };
      case "REJECTED":
        return {
          color: "red",
          text: "Bị từ chối",
          icon: <XCircle size={16} className="inline mr-1" />,
          description: "Yêu cầu đăng ký của bạn đã bị từ chối.",
        };
      case "IN_PROGRESS":
        return {
          color: "gold",
          text: "Đang học",
          icon: <BookOpen size={16} className="inline mr-1" />,
          description: "Bạn đang trong quá trình học khóa học này.",
        };
      case "COMPLETED":
        return {
          color: "green",
          text: "Đã hoàn thành",
          icon: <CheckCircle size={16} className="inline mr-1" />,
          description: "Bạn đã hoàn thành khóa học này.",
        };
      default:
        return {
          color: "default",
          text: status,
          icon: <AlertCircle size={16} className="inline mr-1" />,
          description: "",
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
        <Spin size="large" tip="Đang tải khóa học của bạn..." />
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
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng số khóa học"
                value={totals.totalCourses}
                prefix={<BookOpen size={18} className="text-blue-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đang học"
                value={totals.inProgress}
                prefix={<Clock size={18} className="text-amber-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đã hoàn thành"
                value={totals.completedCourses}
                prefix={
                  <GraduationCap size={18} className="text-emerald-500" />
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tiến độ trung bình"
                value={totals.averageProgress}
                suffix="%"
                prefix={<TrendingUp size={18} className="text-purple-500" />}
              />
            </Card>
          </Col>
          {totals.pending > 0 && (
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Chờ phê duyệt"
                  value={totals.pending}
                  prefix={<Clock size={18} className="text-blue-500" />}
                  valueStyle={{ color: "#1677ff" }}
                />
              </Card>
            </Col>
          )}
          {totals.rejected > 0 && (
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Bị từ chối"
                  value={totals.rejected}
                  prefix={<XCircle size={18} className="text-red-500" />}
                  valueStyle={{ color: "#ff4d4f" }}
                />
              </Card>
            </Col>
          )}
        </Row>

        <List
          dataSource={enrolments}
          renderItem={(item) => {
            const course = item.course;
            if (!course) return null;
            const lessonsCount = course.lessons?.length ?? 0;
            const progressValue = Math.min(item.progress ?? 0, 100);
            const statusInfo = getStatusInfo(item.enrolmentStatus);

            // Determine if user can access the course
            const canAccessCourse =
              ["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(
                item.enrolmentStatus,
              ) && !isExpired(item.endDate);
            const showCompleteButton =
              progressValue >= 100 && item.enrolmentStatus === "IN_PROGRESS";
            const showExpiryWarning =
              isExpiringSoon(item.endDate) || isExpired(item.endDate);
            const courseExpired = isExpired(item.endDate);

            return (
              <List.Item>
                <Card className="w-full" hoverable>
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={18}>
                      <Space
                        direction="vertical"
                        size={8}
                        style={{ width: "100%" }}
                      >
                        <Space align="center" size={12}>
                          <Avatar
                            shape="square"
                            size={56}
                            style={{ background: "#1677ff10" }}
                          >
                            <BookOpen size={24} className="text-blue-600" />
                          </Avatar>
                          <div>
                            <Title level={4} style={{ margin: 0 }}>
                              {course.title}
                            </Title>
                            <Text type="secondary">
                              {lessonsCount} bài học · {course.duration} phút
                            </Text>
                          </div>
                        </Space>

                        <Alert
                          message={
                            <span>
                              {statusInfo.icon}
                              {statusInfo.text}
                            </span>
                          }
                          description={statusInfo.description}
                          type={
                            item.enrolmentStatus === "REJECTED"
                              ? "error"
                              : item.enrolmentStatus === "PENDING"
                                ? "info"
                                : item.enrolmentStatus === "COMPLETED"
                                  ? "success"
                                  : "info"
                          }
                          showIcon={false}
                          style={{ fontSize: "12px" }}
                        />

                        {/* Expiry warning */}
                        {showExpiryWarning && (
                          <Alert
                            message={
                              courseExpired ? (
                                <span>
                                  <AlertTriangle
                                    size={14}
                                    className="inline mr-1"
                                  />
                                  Khóa học đã hết hạn
                                </span>
                              ) : (
                                <span>
                                  <Clock size={14} className="inline mr-1" />
                                  Sắp hết hạn:{" "}
                                  {dayjs(item.endDate).format("DD/MM/YYYY")}
                                </span>
                              )
                            }
                            description={
                              <div style={{ fontSize: "12px" }}>
                                {courseExpired
                                  ? "Khóa học đã hết hạn. Vui lòng gửi yêu cầu gia hạn để tiếp tục học."
                                  : "Khóa học sắp hết hạn. Bạn có thể gửi yêu cầu gia hạn."}
                                <div className="mt-2">
                                  <Button
                                    size="small"
                                    type={
                                      item.extensionRequest
                                        ? "default"
                                        : "primary"
                                    }
                                    icon={<Send size={14} />}
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
                                    {item.extensionRequest
                                      ? "Đã gửi yêu cầu"
                                      : "Gửi yêu cầu gia hạn"}
                                  </Button>
                                </div>
                              </div>
                            }
                            type={courseExpired ? "error" : "warning"}
                            showIcon
                            style={{ fontSize: "12px" }}
                          />
                        )}

                        {item.enrolmentStatus === "REJECTED" && item.reason && (
                          <Alert
                            message="Lý do từ chối"
                            description={item.reason}
                            type="error"
                            showIcon
                            style={{ fontSize: "12px" }}
                          />
                        )}

                        {canAccessCourse && (
                          <>
                            <div>
                              <Text type="secondary">Tiến độ khóa học</Text>
                              <Progress
                                percent={progressValue}
                                status={
                                  progressValue === 100 ? "success" : undefined
                                }
                              />
                            </div>

                            <Space>
                              <Link href={`/user/courses/${course.id}`}>
                                <Button type="primary">
                                  {item.enrolmentStatus === "COMPLETED"
                                    ? "Xem lại"
                                    : "Vào học"}
                                </Button>
                              </Link>

                              {showCompleteButton && (
                                <Button
                                  type="default"
                                  icon={<CheckCircle size={16} />}
                                  onClick={() =>
                                    handleCompleteCourse(item.id, course.title)
                                  }
                                  loading={updateEnrolment.isPending}
                                  style={{
                                    borderColor: "#52c41a",
                                    color: "#52c41a",
                                  }}
                                >
                                  Hoàn thành khóa học
                                </Button>
                              )}
                            </Space>
                          </>
                        )}

                        {courseExpired && (
                          <Alert
                            message="Không thể truy cập"
                            description="Khóa học đã hết hạn. Vui lòng gửi yêu cầu gia hạn để tiếp tục học."
                            type="error"
                            showIcon
                            style={{ fontSize: "12px" }}
                          />
                        )}

                        {item.enrolmentStatus === "PENDING" && (
                          <Button disabled>
                            <Clock size={16} className="inline mr-2" />
                            Chờ phê duyệt
                          </Button>
                        )}
                      </Space>
                    </Col>
                    <Col xs={24} md={6}>
                      <Card bordered={false} className="bg-gray-50">
                        <Space direction="vertical" size={6}>
                          <Text type="secondary">Giảng viên</Text>
                          <Space align="center">
                            <Avatar
                              size={32}
                              style={{ backgroundColor: "#52c41a" }}
                            >
                              {course.creator?.name?.charAt(0) || "G"}
                            </Avatar>
                            <Text>
                              {course.creator?.name || "Chưa cập nhật"}
                            </Text>
                          </Space>
                          <Text type="secondary">Ngày đăng ký</Text>
                          <Text>
                            {new Date(item.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </Text>
                          {item.startDate && (
                            <>
                              <Text type="secondary">Ngày bắt đầu</Text>
                              <Text>
                                {new Date(item.startDate).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </Text>
                            </>
                          )}
                          {item.endDate && (
                            <>
                              <Text type="secondary">Ngày kết thúc</Text>
                              <Text>
                                {new Date(item.endDate).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </Text>
                            </>
                          )}
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </List.Item>
            );
          }}
        />
      </Space>
    );
  };

  // Explore Courses Tab Content
  const ExploreCoursesTab = () => {
    return (
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Input
          placeholder="Tìm kiếm khóa học theo tên, mô tả hoặc giảng viên..."
          prefix={<Search size={18} />}
          size="large"
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
              gutter: 16,
              xs: 1,
              sm: 1,
              md: 2,
              lg: 2,
              xl: 3,
              xxl: 3,
            }}
            dataSource={availableCourses}
            renderItem={(course) => {
              const lessonsCount = course.lessons?.length ?? 0;

              return (
                <List.Item>
                  <Card
                    hoverable
                    actions={[
                      <Button
                        key="enroll"
                        type="primary"
                        icon={<Plus size={16} />}
                        onClick={() =>
                          handleEnrollCourse(course.id, course.title)
                        }
                        loading={createEnrolment.isPending}
                      >
                        Đăng ký học
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      avatar={
                        <Avatar
                          shape="square"
                          size={64}
                          style={{ background: "#1677ff10" }}
                        >
                          <BookOpen size={32} className="text-blue-600" />
                        </Avatar>
                      }
                      title={
                        <Title level={5} style={{ margin: 0 }}>
                          {course.title}
                        </Title>
                      }
                      description={
                        <Space
                          direction="vertical"
                          size={8}
                          style={{ width: "100%" }}
                        >
                          <Text type="secondary" className="line-clamp-2">
                            {course.description || "Chưa có mô tả"}
                          </Text>
                          <Space split="|" size={4}>
                            <Text type="secondary">
                              <BookOpen size={14} className="inline mr-1" />
                              {lessonsCount} bài học
                            </Text>
                            <Text type="secondary">
                              <Clock size={14} className="inline mr-1" />
                              {course.duration} phút
                            </Text>
                          </Space>
                          <Space align="center">
                            <Avatar
                              size={24}
                              style={{ backgroundColor: "#52c41a" }}
                            >
                              {course.creator?.name?.charAt(0) || "G"}
                            </Avatar>
                            <Text type="secondary">
                              {course.creator?.name || "Chưa cập nhật"}
                            </Text>
                          </Space>
                        </Space>
                      }
                    />
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
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={3}>Khóa học</Title>
        <Text type="secondary">Quản lý và khám phá các khóa học.</Text>
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
