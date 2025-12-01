"use client";

import {
  Row,
  Col,
  Card,
  Avatar,
  Typography,
  Rate,
  Button,
  Tag,
  Space,
  Statistic,
  Spin,
  Alert,
  Empty,
} from "antd";
import {
  User,
  Star,
  BookOpen,
  Users,
  Play,
  Award,
  Clock,
  MapPin,
} from "lucide-react";
import { useUsersControllerFindAll } from "@/generated/api/cnwComponents";

const { Title, Text, Paragraph } = Typography;

export default function InstructorsPage() {
  // Fetch danh sách users (instructors)
  const { data: users, isLoading, error } = useUsersControllerFindAll({});

  console.log("Users data:", users); // Debug log

  // Filter để chỉ lấy những user có thể là instructor
  const instructors = ((users as unknown as any[]) || []).filter(
    (user: any) => user.role && user.role !== "USER",
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50  flex items-center justify-center">
        <Alert
          message="Lỗi khi tải dữ liệu"
          description="Không thể tải danh sách giảng viên. Vui lòng thử lại sau."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Header */}
      <section className="bg-white py-8 sm:py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <Title level={1} className="text-2xl sm:text-3xl md:text-4xl">
            Đội ngũ giảng viên
          </Title>
          <Paragraph
            type="secondary"
            className="text-base sm:text-lg max-w-2xl mx-auto"
          >
            Học từ những chuyên gia hàng đầu trong ngành, với kinh nghiệm thực
            tế phong phú và đam mê chia sẻ kiến thức
          </Paragraph>

          <Row gutter={16} className="mt-8 max-w-md mx-auto">
            <Col span={8}>
              <Statistic
                title="Giảng viên"
                value={instructors.length}
                valueStyle={{ color: "#1890ff" }}
                prefix={<Users className="w-4 h-4" />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Năm kinh nghiệm"
                value={8}
                suffix="+"
                valueStyle={{ color: "#52c41a" }}
                prefix={<Award className="w-4 h-4" />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Học viên"
                value={50000}
                suffix="+"
                valueStyle={{ color: "#f5222d" }}
                prefix={<BookOpen className="w-4 h-4" />}
              />
            </Col>
          </Row>
        </div>
      </section>

      {/* Instructors Grid */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
            </div>
          ) : instructors.length === 0 ? (
            <Empty
              description={
                <div>
                  <Title level={3} type="secondary">
                    Chưa có giảng viên
                  </Title>
                  <Text type="secondary">
                    Danh sách giảng viên sẽ được cập nhật sớm
                  </Text>
                </div>
              }
            />
          ) : (
            <Row gutter={[24, 24]}>
              {instructors.map((instructor: any) => (
                <Col xs={24} md={12} lg={8} key={instructor.id}>
                  <Card
                    hoverable
                    className="h-full"
                    actions={[
                      <Button
                        type="primary"
                        icon={<Play className="w-4 h-4" />}
                        key="courses"
                      >
                        Xem khóa học
                      </Button>,
                      <Button type="default" key="profile">
                        Hồ sơ chi tiết
                      </Button>,
                    ]}
                  >
                    <div className="text-center space-y-4">
                      {/* Avatar */}
                      <Avatar
                        size={100}
                        src={instructor.avatar || undefined}
                        className="mx-auto bg-blue-500"
                      >
                        {instructor.name ? (
                          instructor.name.charAt(0).toUpperCase()
                        ) : (
                          <User className="w-8 h-8" />
                        )}
                      </Avatar>

                      {/* Name & Title */}
                      <div>
                        <Title level={4} className="!mb-1">
                          {instructor.name || "Giảng viên"}
                        </Title>
                        <Text type="secondary" className="text-base">
                          {instructor.role === "ADMIN"
                            ? "Quản trị viên"
                            : "Giảng viên"}
                        </Text>
                      </div>

                      {/* Stats */}
                      <div className="flex justify-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <Text strong>4.8</Text>
                          </div>
                          <Text type="secondary">Đánh giá</Text>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Users className="w-4 h-4 text-blue-500" />
                            <Text strong>1,250</Text>
                          </div>
                          <Text type="secondary">Học viên</Text>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <BookOpen className="w-4 h-4 text-green-500" />
                            <Text strong>8</Text>
                          </div>
                          <Text type="secondary">Khóa học</Text>
                        </div>
                      </div>

                      {/* Bio */}
                      <Paragraph
                        type="secondary"
                        className="text-sm line-clamp-3 text-left"
                      >
                        Chuyên gia với nhiều năm kinh nghiệm trong lĩnh vực giáo
                        dục và công nghệ. Đam mê chia sẻ kiến thức và giúp đỡ
                        học viên phát triển kỹ năng.
                      </Paragraph>

                      {/* Experience */}
                      <div className="text-left">
                        <Text strong className="flex items-center mb-2">
                          <Clock className="w-4 h-4 mr-2" />
                          Kinh nghiệm: 5+ năm
                        </Text>
                      </div>

                      {/* Email */}
                      {instructor.email && (
                        <div className="text-left">
                          <Text type="secondary" className="text-sm break-all">
                            {instructor.email}
                          </Text>
                        </div>
                      )}

                      {/* Join Date */}
                      <div className="text-left">
                        <Text strong className="flex items-center mb-2">
                          <MapPin className="w-4 h-4 mr-2" />
                          Tham gia:{" "}
                          {new Date(instructor.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </Text>
                      </div>

                      {/* Role Tag */}
                      <div className="text-left">
                        <Tag
                          color={instructor.role === "ADMIN" ? "red" : "blue"}
                          className="text-xs"
                        >
                          {instructor.role === "ADMIN"
                            ? "Quản trị viên"
                            : "Giảng viên"}
                        </Tag>
                        {instructor.locked && (
                          <Tag color="orange" className="text-xs ml-2">
                            Tạm khóa
                          </Tag>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="text-left">
                        <Text strong className="block mb-2">
                          Đánh giá:
                        </Text>
                        <Rate disabled defaultValue={4.8} />
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <Title level={2} className="!text-white !mb-4 text-2xl sm:text-3xl">
            Bạn muốn trở thành giảng viên?
          </Title>
          <Paragraph className="text-base sm:text-lg md:text-xl text-blue-100 mb-8">
            Chia sẻ kiến thức và kinh nghiệm của bạn với hàng nghìn học viên
            trên toàn quốc
          </Paragraph>
          <Button
            type="primary"
            size="large"
            className="bg-white text-blue-600 border-0 hover:bg-blue-50"
            icon={<Award className="w-4 h-4" />}
          >
            Đăng ký làm giảng viên
          </Button>
        </div>
      </section>
    </div>
  );
}
