"use client";

import { useState, useMemo } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Input,
  Select,
  Tag,
  Avatar,
  Space,
  Pagination,
  Empty,
  Checkbox,
  Badge,
  Spin,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useFindManyCourse } from "../../../../generated/hooks";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// Real data from database schema
const levelConfig = {
  BEGINNER: { label: "Cơ bản", color: "green" },
  INTERMEDIATE: { label: "Trung cấp", color: "blue" },
  ADVANCED: { label: "Nâng cao", color: "red" },
};

const statusConfig = {
  ACTIVE: { label: "Đang mở", color: "success" },
  INACTIVE: { label: "Đã đóng", color: "default" },
};

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "ACTIVE",
  ]); // Default show only active courses
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9; // Better for 3-column layout

  // Fetch courses from database - only active courses by default
  const {
    data: courses,
    isLoading,
    error,
  } = useFindManyCourse({
    where: {
      status: {
        in: selectedStatuses.length > 0 ? selectedStatuses : ["ACTIVE"],
      },
    },
    include: {
      userCourses: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      lessons: {
        include: {
          components: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter và sort logic
  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    let filtered = courses.filter((course) => {
      // Search filter
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description &&
          course.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (course.creator?.name &&
          course.creator.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Level filter
      const matchesLevel =
        selectedLevels.length === 0 || selectedLevels.includes(course.level);

      return matchesSearch && matchesLevel;
    });

    // Sort courses
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "duration-high":
          return b.duration - a.duration;
        case "duration-low":
          return a.duration - b.duration;
        case "popular":
        default:
          return (b.userCourses?.length || 0) - (a.userCourses?.length || 0);
      }
    });
  }, [courses, searchTerm, selectedLevels, sortBy]);

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const currentCourses = filteredCourses.slice(
    startIndex,
    startIndex + pageSize,
  );

  const handleLevelChange = (levels: string[]) => {
    setSelectedLevels(levels);
    setCurrentPage(1);
  };

  const handleStatusChange = (statuses: string[]) => {
    setSelectedStatuses(statuses);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedLevels([]);
    setSelectedStatuses(["ACTIVE"]);
    setSearchTerm("");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" tip="Đang tải khóa học...">
          <div style={{ minHeight: 50, minWidth: 100 }} />
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Title level={3} type="danger">
            Không thể tải khóa học
          </Title>
          <Paragraph>Vui lòng thử lại sau.</Paragraph>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white py-6 sm:py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Title level={1} className="text-2xl sm:text-3xl md:text-4xl">
            Tất cả khóa học
          </Title>
          <Paragraph type="secondary" className="text-base sm:text-lg">
            Khám phá {filteredCourses.length} khóa học chất lượng cao từ các
            chuyên gia
          </Paragraph>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Row gutter={24}>
          {/* Filters Sidebar */}
          <Col xs={0} lg={6}>
            <Card className="sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <Title level={4}>Bộ lọc</Title>
                <Button type="link" onClick={resetFilters} size="small">
                  Xóa tất cả
                </Button>
              </div>

              <Space direction="vertical" className="w-full" size="large">
                {/* Search */}
                <div>
                  <Text strong className="block mb-2">
                    Tìm kiếm
                  </Text>
                  <Search
                    placeholder="Tìm khóa học..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    allowClear
                  />
                </div>

                {/* Levels */}
                <div>
                  <Text strong className="block mb-2">
                    Cấp độ
                  </Text>
                  <Checkbox.Group
                    value={selectedLevels}
                    onChange={handleLevelChange}
                    className="flex flex-col space-y-2"
                  >
                    <Checkbox value="BEGINNER">
                      {levelConfig.BEGINNER.label}
                    </Checkbox>
                    <Checkbox value="INTERMEDIATE">
                      {levelConfig.INTERMEDIATE.label}
                    </Checkbox>
                    <Checkbox value="ADVANCED">
                      {levelConfig.ADVANCED.label}
                    </Checkbox>
                  </Checkbox.Group>
                </div>

                {/* Status */}
                <div>
                  <Text strong className="block mb-2">
                    Trạng thái
                  </Text>
                  <Checkbox.Group
                    value={selectedStatuses}
                    onChange={handleStatusChange}
                    className="flex flex-col space-y-2"
                  >
                    <Checkbox value="ACTIVE">
                      {statusConfig.ACTIVE.label}
                    </Checkbox>
                    <Checkbox value="INACTIVE">
                      {statusConfig.INACTIVE.label}
                    </Checkbox>
                  </Checkbox.Group>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Main Content */}
          <Col xs={24} lg={18}>
            {/* Sort and View Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg">
              <div className="flex items-center space-x-4">
                <Text>
                  Hiển thị {startIndex + 1}-
                  {Math.min(startIndex + pageSize, filteredCourses.length)}
                  trong {filteredCourses.length} kết quả
                </Text>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <Text>Sắp xếp:</Text>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  className="w-full sm:w-40"
                >
                  <Option value="popular">Phổ biến nhất</Option>
                  <Option value="newest">Mới nhất</Option>
                  <Option value="oldest">Cũ nhất</Option>
                  <Option value="duration-high">Thời lượng dài nhất</Option>
                  <Option value="duration-low">Thời lượng ngắn nhất</Option>
                </Select>

                <Button
                  icon={<FilterOutlined />}
                  className="lg:hidden w-full sm:w-auto"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Lọc
                </Button>
              </div>
            </div>

            {/* Courses Grid */}
            {currentCourses.length > 0 ? (
              <Row gutter={[24, 24]}>
                {currentCourses.map((course) => {
                  const levelInfo =
                    levelConfig[course.level as keyof typeof levelConfig];
                  const statusInfo =
                    statusConfig[course.status as keyof typeof statusConfig];
                  const totalComponents =
                    course.lessons?.reduce(
                      (sum, lesson) => sum + (lesson.components?.length || 0),
                      0,
                    ) || 0;

                  return (
                    <Col xs={24} sm={12} lg={8} key={course.id}>
                      <Card
                        hoverable
                        cover={
                          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 h-40 sm:h-48">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                                <BookOutlined className="text-blue-600 text-2xl" />
                              </div>
                            </div>
                            {course.status === "ACTIVE" && (
                              <Badge.Ribbon
                                text={statusInfo.label}
                                color="green"
                              >
                                <div />
                              </Badge.Ribbon>
                            )}
                          </div>
                        }
                        actions={[
                          <Button
                            type="primary"
                            block
                            key="enroll"
                            href={`/user/courses/${course.id}`}
                          >
                            Xem chi tiết
                          </Button>,
                        ]}
                        className="h-full"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <Title
                              level={5}
                              className="!mb-0 line-clamp-2 flex-1"
                            >
                              {course.title}
                            </Title>
                            <Tag color={levelInfo.color}>{levelInfo.label}</Tag>
                          </div>

                          {course.description && (
                            <Text
                              type="secondary"
                              className="text-sm line-clamp-2"
                            >
                              {course.description}
                            </Text>
                          )}

                          <div className="flex items-center space-x-2 text-sm">
                            <Avatar size="small" icon={<UserOutlined />} />
                            <Text type="secondary" className="truncate">
                              {course.creator?.name || "Chưa cập nhật"}
                            </Text>
                          </div>

                          <div className="flex items-center text-sm text-gray-600">
                            <ClockCircleOutlined className="mr-1" />
                            <Text type="secondary">
                              {Math.floor(course.duration / 60)} giờ{" "}
                              {course.duration % 60 > 0
                                ? `${course.duration % 60} phút`
                                : ""}
                            </Text>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <Space size={4}>
                              <BookOutlined className="text-gray-400" />
                              <Text type="secondary">
                                {course.lessons?.length || 0} bài học
                              </Text>
                            </Space>
                            <Space size={4}>
                              <UserOutlined className="text-gray-400" />
                              <Text type="secondary">
                                {course.userCourses?.length || 0} học viên
                              </Text>
                            </Space>
                          </div>

                          {totalComponents > 0 && (
                            <div className="flex items-center text-sm text-gray-600">
                              <TrophyOutlined className="mr-1" />
                              <Text type="secondary">
                                {totalComponents} nội dung học
                              </Text>
                            </div>
                          )}
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <Empty
                image={<BookOutlined className="text-6xl text-gray-400" />}
                description={
                  <div>
                    <Title level={3} type="secondary">
                      Không tìm thấy khóa học
                    </Title>
                    <Text type="secondary">
                      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                    </Text>
                  </div>
                }
              />
            )}

            {/* Pagination */}
            {filteredCourses.length > pageSize && (
              <div className="flex justify-center mt-8">
                <Pagination
                  current={currentPage}
                  total={filteredCourses.length}
                  pageSize={pageSize}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} của ${total} khóa học`
                  }
                />
              </div>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
}
