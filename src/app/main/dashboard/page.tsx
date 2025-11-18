"use client";

import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  List,
  Avatar,
  Tag,
  Spin,
  Alert,
} from "antd";
import {
  BookOpen,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Clock,
} from "lucide-react";
import {
  useFindManyCourse,
  useFindManyUser,
  useFindManyTest,
  useFindManyUserCourse,
  useFindManyTestResult,
} from "@/generated/hooks";

const { Title, Text } = Typography;

export default function DashboardPage() {
  const {
    data: courses,
    isLoading: coursesLoading,
    error: coursesError,
  } = useFindManyCourse({
    include: {
      userCourses: true,
      lessons: true,
      creator: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const { data: users, isLoading: usersLoading } = useFindManyUser({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const { data: tests, isLoading: testsLoading } = useFindManyTest({
    include: {
      questions: true,
      components: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const { data: userCourses, isLoading: userCoursesLoading } =
    useFindManyUserCourse({
      include: {
        user: true,
        course: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

  const { data: testResults, isLoading: testResultsLoading } =
    useFindManyTestResult({
      include: {
        user: true,
        component: {
          include: {
            test: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

  // Tính toán thống kê
  const totalCourses = courses?.length || 0;
  const totalUsers = users?.length || 0;
  const totalTests = tests?.length || 0;

  // Tính tỷ lệ hoàn thành từ userCourses
  const completedCourses =
    userCourses?.filter((uc) => uc.enrolmentStatus === "COMPLETED").length || 0;
  const completionRate = userCourses?.length
    ? Math.round((completedCourses / userCourses.length) * 100)
    : 0;

  // Loading state
  if (coursesLoading || usersLoading || testsLoading || userCoursesLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500">Đang tải dữ liệu dashboard...</span>
      </div>
    );
  }

  // Error state
  if (coursesError) {
    return (
      <Alert
        message="Lỗi tải dữ liệu"
        description="Không thể tải dữ liệu dashboard. Vui lòng thử lại sau."
        type="error"
        showIcon
      />
    );
  }

  // Tạo stats với dữ liệu thật
  const stats = [
    {
      title: "Tổng khóa học",
      value: totalCourses,
      icon: <BookOpen size={24} />,
      color: "#1890ff",
    },
    {
      title: "Học viên",
      value: totalUsers,
      icon: <Users size={24} />,
      color: "#52c41a",
    },
    {
      title: "Bài kiểm tra",
      value: totalTests,
      icon: <FileText size={24} />,
      color: "#722ed1",
    },
    {
      title: "Tỷ lệ hoàn thành",
      value: completionRate,
      suffix: "%",
      icon: <TrendingUp size={24} />,
      color: "#fa8c16",
    },
  ];

  // Tạo recent activities từ dữ liệu thật
  const recentActivities = [
    ...(userCourses?.slice(0, 3).map((uc, index) => ({
      id: `uc-${index}`,
      action: "Học viên đăng ký khóa học",
      user: uc.user?.name || "Người dùng",
      time: new Date(uc.createdAt).toLocaleString("vi-VN"),
      type: "course" as const,
      details: uc.course?.title,
    })) || []),
    ...(testResults?.slice(0, 2).map((tr, index) => ({
      id: `tr-${index}`,
      action: "Hoàn thành bài kiểm tra",
      user: tr.user?.name || "Người dùng",
      time: new Date(tr.createdAt).toLocaleString("vi-VN"),
      type: "test" as const,
      details: tr.component?.test?.name,
    })) || []),
  ];

  // Top courses với dữ liệu thật
  const topCourses =
    courses?.slice(0, 4).map((course) => ({
      name: course.title,
      students: course.userCourses?.length || 0,
      progress: Math.floor(Math.random() * 30) + 70, // Tạm thời dùng random, sẽ tính thật sau
      id: course.id,
      duration: course.duration,
      lessons: course.lessons?.length || 0,
    })) || [];

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Text type="secondary">Tổng quan về hệ thống học tập</Text>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                prefix={
                  <div style={{ color: stat.color, marginRight: 8 }}>
                    {stat.icon}
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* Recent Activities */}
        <Col xs={24} lg={12}>
          <Card title="Hoạt động gần đây">
            {recentActivities.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={recentActivities}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: "#1890ff" }}>
                          {item.user.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={
                        <div>
                          <Text>{item.action}</Text>
                          {item.details && (
                            <Text
                              type="secondary"
                              style={{ marginLeft: 8, fontSize: "12px" }}
                            >
                              - {item.details}
                            </Text>
                          )}
                        </div>
                      }
                      description={
                        <div>
                          <Text strong>{item.user}</Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            <Clock size={12} style={{ marginRight: 4 }} />
                            {item.time}
                          </Text>
                        </div>
                      }
                    />
                    <Tag
                      color={
                        item.type === "course"
                          ? "blue"
                          : item.type === "test"
                            ? "green"
                            : "orange"
                      }
                    >
                      {item.type}
                    </Tag>
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center py-8">
                <Text type="secondary">Chưa có hoạt động nào</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Top Courses */}
        <Col xs={24} lg={12}>
          <Card title="Khóa học phổ biến">
            {topCourses.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={topCourses}
                renderItem={(course) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          shape="square"
                          size={48}
                          style={{ backgroundColor: "#f56a00" }}
                        >
                          <BookOpen size={20} />
                        </Avatar>
                      }
                      title={
                        <div>
                          <Text strong>{course.name}</Text>
                          <Text
                            type="secondary"
                            style={{ marginLeft: 8, fontSize: "12px" }}
                          >
                            {course.lessons} bài học • {course.duration} phút
                          </Text>
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary">
                            <Users size={14} style={{ marginRight: 4 }} />
                            {course.students} học viên
                          </Text>
                          <div style={{ marginTop: 8 }}>
                            <Progress
                              percent={course.progress}
                              size="small"
                              status="active"
                              strokeColor="#52c41a"
                            />
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div className="text-center py-8">
                <Text type="secondary">Chưa có khóa học nào</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Learning Progress Overview */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Tiến độ học tập tổng quan">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Khóa học đã hoàn thành"
                    value={completedCourses}
                    suffix={`/ ${totalCourses}`}
                  />
                  <Progress
                    percent={
                      totalCourses
                        ? Math.round((completedCourses / totalCourses) * 100)
                        : 0
                    }
                    strokeColor="#52c41a"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Tổng số bài kiểm tra"
                    value={totalTests}
                    suffix="bài"
                  />
                  <Progress
                    percent={
                      totalTests ? Math.min((totalTests / 50) * 100, 100) : 0
                    }
                    strokeColor="#1890ff"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="Tỷ lệ tham gia"
                    value={completionRate}
                    suffix="%"
                  />
                  <Progress percent={completionRate} strokeColor="#fa8c16" />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
