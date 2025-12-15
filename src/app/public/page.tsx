"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Skeleton,
  Badge,
  Rate,
  Avatar,
  Divider,
} from "antd";
import {
  BookOpen,
  Clock,
  Users,
  Star,
  ArrowRight,
  Play,
  Award,
  TrendingUp,
  Target,
  CheckCircle,
} from "lucide-react";
import { useFindManyCourse } from "../../../generated/hooks/course";
import { useFindManyUser } from "../../../generated/hooks/user";
import { useFindManyUserCourse } from "../../../generated/hooks/user-course";

const { Title, Text, Paragraph } = Typography;

// Hero Section Component
const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <Row align="middle" gutter={[48, 32]}>
          <Col lg={12} md={24} sm={24}>
            <div className="space-y-6">
              <Title
                level={1}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4"
              >
                Học tập không giới hạn với{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  LearnHub
                </span>
              </Title>
              <Paragraph className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed">
                Khám phá hàng nghìn khóa học chất lượng cao từ các chuyên gia
                hàng đầu. Nâng cao kỹ năng và phát triển sự nghiệp của bạn ngay
                hôm nay.
              </Paragraph>
              <Space size="large" className="mt-6 sm:mt-8 flex-wrap">
                <Button
                  type="primary"
                  size="large"
                  className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 border-none hover:from-blue-700 hover:to-indigo-700"
                  icon={<BookOpen size={20} />}
                >
                  Khám phá khóa học
                </Button>
                <Button
                  size="large"
                  className="h-12 px-8 hover:text-blue-600 hover:border-blue-600"
                  icon={<Play size={20} />}
                >
                  Xem demo
                </Button>
              </Space>
            </div>
          </Col>
          <Col lg={12} md={24} sm={24}>
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transform rotate-0 sm:rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Award className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <Text strong className="text-lg">
                        Chứng chỉ hoàn thành
                      </Text>
                      <br />
                      <Text className="text-gray-500">
                        Được công nhận toàn cầu
                      </Text>
                    </div>
                  </div>
                  <Divider />
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="text-green-600" size={24} />
                    </div>
                    <div>
                      <Text strong className="text-lg">
                        Cộng đồng học tập
                      </Text>
                      <br />
                      <Text className="text-gray-500">
                        Kết nối với 10,000+ học viên
                      </Text>
                    </div>
                  </div>
                  <Divider />
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <Text strong className="text-lg">
                        Học theo lộ trình
                      </Text>
                      <br />
                      <Text className="text-gray-500">
                        Được thiết kế bởi chuyên gia
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};

// Stats Section Component
const StatsSection = () => {
  // Fetch real data
  const { data: courses } = useFindManyCourse({
    include: {
      userCourses: true,
    },
  });
  const { data: users } = useFindManyUser({});
  const { data: userCourses } = useFindManyUserCourse({
    where: {
      enrolmentStatus: "COMPLETED",
    },
  });

  // Calculate real stats
  const stats = useMemo(() => {
    const totalCourses = courses?.length || 0;
    const totalUsers = users?.length || 0;
    const completedEnrollments = userCourses?.length || 0;
    const totalEnrollments =
      courses?.reduce(
        (acc, course) => acc + (course.userCourses?.length || 0),
        0,
      ) || 1;
    const completionRate =
      Math.round((completedEnrollments / totalEnrollments) * 100) || 0;

    return [
      {
        icon: <BookOpen className="text-blue-600" size={32} />,
        number: `${totalCourses}+`,
        label: "Khóa học",
      },
      {
        icon: <Users className="text-green-600" size={32} />,
        number: `${totalUsers.toLocaleString()}+`,
        label: "Học viên",
      },
      {
        icon: <Award className="text-purple-600" size={32} />,
        number: `${completionRate}%`,
        label: "Tỷ lệ hoàn thành",
      },
      {
        icon: <Star className="text-yellow-600" size={32} />,
        number: "4.8/5",
        label: "Đánh giá trung bình",
      },
    ];
  }, [courses, users, userCourses]);
  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <Row gutter={[32, 32]} justify="center">
          {stats.map((stat, index) => (
            <Col key={index} lg={6} md={12} sm={24}>
              <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="space-y-3">
                  <div className="flex justify-center">{stat.icon}</div>
                  <Title
                    level={2}
                    className="text-2xl sm:text-3xl font-bold text-gray-900 mb-0"
                  >
                    {stat.number}
                  </Title>
                  <Text className="text-gray-600 text-lg">{stat.label}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
};

// Course Card Component
const CourseCard = ({ course }: { course: any }) => {
  return (
    <Card
      hoverable
      className="h-full shadow-md hover:shadow-xl transition-all duration-300 border-0"
      cover={
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
              <BookOpen className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <Badge.Ribbon text="Mới" color="blue" />
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <Title
          level={4}
          className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2"
        >
          {course.title}
        </Title>

        <div className="flex items-center space-x-4 text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock size={16} />
            <Text className="text-sm">{course.duration} phút</Text>
          </div>
          <div className="flex items-center space-x-1">
            <Users size={16} />
            <Text className="text-sm">
              {course.userCourses?.length || 0} học viên
            </Text>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Rate disabled defaultValue={5} className="text-xs" />
            <Text className="text-sm text-gray-500">(5.0)</Text>
          </div>
          <Text className="text-lg font-bold text-blue-600">Miễn phí</Text>
        </div>

        <Button
          type="primary"
          block
          className="mt-4 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 border-none hover:from-blue-700 hover:to-indigo-700"
          icon={<ArrowRight size={16} />}
        >
          Tham gia ngay
        </Button>
      </div>
    </Card>
  );
};

// Featured Courses Section
const FeaturedCoursesSection = () => {
  const {
    data: courses,
    isLoading,
    error,
  } = useFindManyCourse({
    include: {
      userCourses: true,
      creator: true,
      lessons: true,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Title level={2} className="text-3xl font-bold text-gray-900 mb-4">
              Khóa học nổi bật
            </Title>
            <Paragraph className="text-lg text-gray-600">
              Những khóa học được yêu thích nhất từ cộng đồng học viên
            </Paragraph>
          </div>
          <Row gutter={[24, 24]}>
            {[...Array(6)].map((_, index) => (
              <Col key={index} lg={8} md={12} sm={24}>
                <Card>
                  <Skeleton active />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <Title level={3} className="text-red-600">
            Không thể tải khóa học
          </Title>
          <Paragraph>Vui lòng thử lại sau.</Paragraph>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Title
            level={2}
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4"
          >
            Khóa học nổi bật
          </Title>
          <Paragraph className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Những khóa học được yêu thích nhất từ cộng đồng học viên. Được thiết
            kế bởi các chuyên gia hàng đầu trong ngành.
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {courses?.map((course) => (
            <Col key={course.id} lg={8} md={12} sm={24}>
              <CourseCard course={course} />
            </Col>
          ))}
        </Row>

        <div className="text-center mt-12">
          <Button
            type="primary"
            size="large"
            className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 border-none hover:from-blue-700 hover:to-indigo-700"
            icon={<ArrowRight size={20} />}
          >
            Xem tất cả khóa học
          </Button>
        </div>
      </div>
    </section>
  );
};

// Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: <BookOpen className="text-blue-600" size={32} />,
      title: "Nội dung chất lượng cao",
      description:
        "Được tạo bởi các chuyên gia và cập nhật liên tục với xu hướng mới nhất",
    },
    {
      icon: <Target className="text-green-600" size={32} />,
      title: "Học theo lộ trình",
      description:
        "Các khóa học được sắp xếp theo trình độ từ cơ bản đến nâng cao",
    },
    {
      icon: <CheckCircle className="text-purple-600" size={32} />,
      title: "Chứng chỉ hoàn thành",
      description: "Nhận chứng chỉ được công nhận khi hoàn thành khóa học",
    },
    {
      icon: <TrendingUp className="text-orange-600" size={32} />,
      title: "Theo dõi tiến độ",
      description:
        "Theo dõi tiến độ học tập và thống kê chi tiết về quá trình học",
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Title
            level={2}
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4"
          >
            Tại sao chọn LearnHub?
          </Title>
          <Paragraph className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Chúng tôi cung cấp trải nghiệm học tập tốt nhất với những tính năng
            ưu việt
          </Paragraph>
        </div>

        <Row gutter={[32, 32]}>
          {features.map((feature, index) => (
            <Col key={index} lg={6} md={12} sm={24}>
              <div className="text-center space-y-4 p-6 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                <div className="flex justify-center">{feature.icon}</div>
                <Title
                  level={4}
                  className="text-lg font-semibold text-gray-900"
                >
                  {feature.title}
                </Title>
                <Paragraph className="text-gray-600">
                  {feature.description}
                </Paragraph>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
};

// CTA Section
const CTASection = () => {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <Title
            level={2}
            className="text-2xl sm:text-3xl font-bold text-white mb-4"
          >
            Sẵn sàng bắt đầu hành trình học tập?
          </Title>
          <Paragraph className="text-base sm:text-lg md:text-xl text-blue-100">
            Tham gia cùng hàng nghìn học viên đã tin tưởng và lựa chọn LearnHub
            để phát triển kỹ năng và sự nghiệp của họ.
          </Paragraph>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:space-x-4 pt-4 justify-center items-center">
            <Button
              type="primary"
              size="large"
              className="h-12 px-8 bg-white text-blue-600 border-white hover:bg-gray-50"
            >
              Đăng ký miễn phí
            </Button>
            <Button
              size="large"
              className="h-12 px-8 text-white border-white hover:bg-white hover:text-blue-600"
            >
              Liên hệ tư vấn
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main Homepage Component
export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <StatsSection />
      <FeaturedCoursesSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}
