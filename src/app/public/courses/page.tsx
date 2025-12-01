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
  Rate,
  Avatar,
  Space,
  Pagination,
  Empty,
  Slider,
  Checkbox,
  Collapse,
  Badge,
  Spin,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  GiftOutlined,
  BookOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useFindManyCourse } from "../../../../generated/hooks";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const categories = [
  "Frontend",
  "Backend",
  "Data Science",
  "Design",
  "DevOps",
  "Mobile",
  "Web Development",
];

const levels = ["Cơ bản", "Trung cấp", "Nâng cao"];

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1500000]);
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 8;

  // Fetch courses from database
  const {
    data: courses,
    isLoading,
    error,
  } = useFindManyCourse({
    include: {
      userCourses: true,
      creator: true,
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
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description &&
          course.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (course.creator?.name &&
          course.creator.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // For now, skip category and level filters since they don't exist in our schema
      // Can be added later when we extend the Course model

      return matchesSearch;
    });

    // Sort courses
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "popular":
        default:
          return (b.userCourses?.length || 0) - (a.userCourses?.length || 0);
      }
    });
  }, [courses, searchTerm, sortBy]);

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const currentCourses = filteredCourses.slice(
    startIndex,
    startIndex + pageSize,
  );

  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
    setCurrentPage(1);
  };

  const handleLevelChange = (levels: string[]) => {
    setSelectedLevels(levels);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
    setPriceRange([0, 1500000]);
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
    <div className="min-h-screen bg-gray-50 ">
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

                {/* Categories */}
                <div>
                  <Text strong className="block mb-2">
                    Danh mục
                  </Text>
                  <Checkbox.Group
                    options={categories}
                    value={selectedCategories}
                    onChange={handleCategoryChange}
                    className="flex flex-col space-y-2"
                  />
                </div>

                {/* Levels */}
                <div>
                  <Text strong className="block mb-2">
                    Cấp độ
                  </Text>
                  <Checkbox.Group
                    options={levels}
                    value={selectedLevels}
                    onChange={handleLevelChange}
                    className="flex flex-col space-y-2"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <Text strong className="block mb-2">
                    Giá (VNĐ)
                  </Text>
                  <Slider
                    range
                    min={0}
                    max={1500000}
                    step={50000}
                    value={priceRange}
                    onChange={(value) =>
                      setPriceRange(value as [number, number])
                    }
                    tooltip={{
                      formatter: (value) =>
                        `${value?.toLocaleString("vi-VN")}đ`,
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>{priceRange[0].toLocaleString("vi-VN")}đ</span>
                    <span>{priceRange[1].toLocaleString("vi-VN")}đ</span>
                  </div>
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
                  <Option value="rating">Đánh giá cao nhất</Option>
                  <Option value="newest">Mới nhất</Option>
                  <Option value="price-low">Giá thấp đến cao</Option>
                  <Option value="price-high">Giá cao đến thấp</Option>
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
                {currentCourses.map((course) => (
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
                          <Badge.Ribbon text="Mới" color="blue">
                            <div />
                          </Badge.Ribbon>
                          <Button
                            type="primary"
                            shape="circle"
                            icon={<PlayCircleOutlined />}
                            size="large"
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity"
                          />
                        </div>
                      }
                      actions={[
                        <Button type="primary" block key="enroll">
                          Xem chi tiết
                        </Button>,
                      ]}
                      className="h-full"
                    >
                      <div className="space-y-3">
                        <Title level={5} className="!mb-2 line-clamp-2">
                          {course.title}
                        </Title>

                        <div className="flex items-center space-x-2 text-sm">
                          <Avatar size="small" icon={<UserOutlined />} />
                          <Text type="secondary">
                            {course.creator?.name || "Giảng viên"}
                          </Text>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <Space>
                            <Rate disabled defaultValue={4.5} />
                            <Text type="secondary">
                              ({course.userCourses?.length || 0})
                            </Text>
                          </Space>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <ClockCircleOutlined className="mr-1" />
                          <Text type="secondary">
                            {Math.round(course.duration / 60)} giờ •{" "}
                            {course.lessons?.length || 0} bài học
                          </Text>
                        </div>

                        <div className="flex items-center justify-between">
                          <Text strong className="text-lg text-green-600">
                            Miễn phí
                          </Text>
                          <Tag color="green" icon={<GiftOutlined />}>
                            Free
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
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
