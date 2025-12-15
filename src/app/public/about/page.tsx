"use client";

import {
  Row,
  Col,
  Typography,
  Timeline,
  Card,
  Statistic,
  Button,
  Space,
  Avatar,
} from "antd";
import {
  RocketOutlined,
  TrophyOutlined,
  TeamOutlined,
  BookOutlined,
  StarOutlined,
  GlobalOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  CommentOutlined,
  SafetyOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const stats = [
  { title: "Khóa học", value: 100, suffix: "+", color: "#1890ff" },
  { title: "Bài học", value: 500, suffix: "+", color: "#52c41a" },
  { title: "Video bài giảng", value: 300, suffix: "+", color: "#f5222d" },
  { title: "Bài kiểm tra", value: 200, suffix: "+", color: "#fa8c16" },
];

const features = [
  {
    icon: <PlayCircleOutlined className="text-3xl text-blue-500" />,
    title: "Học qua video tương tác",
    description:
      "Video bài giảng chất lượng cao với khả năng bình luận theo dòng thời gian, giúp tương tác trực tiếp tại từng phần kiến thức.",
  },
  {
    icon: <BookOutlined className="text-3xl text-green-500" />,
    title: "Từ vựng & Nội dung đa dạng",
    description:
      "Hệ thống từ vựng phân loại theo loại từ, kết hợp đoạn văn bản và video để học toàn diện.",
  },
  {
    icon: <FileTextOutlined className="text-3xl text-purple-500" />,
    title: "Kiểm tra & Đánh giá tự động",
    description:
      "Hệ thống bài kiểm tra đa dạng (trắc nghiệm, tự luận), tự động chấm điểm và theo dõi số lần làm bài.",
  },
  {
    icon: <CommentOutlined className="text-3xl text-orange-500" />,
    title: "Ghi chú cá nhân",
    description:
      "Tạo ghi chú riêng cho từng bài học, tag và tổ chức kiến thức theo cách của bạn.",
  },
  {
    icon: <TrophyOutlined className="text-3xl text-yellow-500" />,
    title: "Theo dõi tiến độ",
    description:
      "Hệ thống theo dõi chi tiết tiến độ học tập, điểm số, và trạng thái hoàn thành từng bài học.",
  },
  {
    icon: <SafetyOutlined className="text-3xl text-red-500" />,
    title: "Quản lý thiết bị an toàn",
    description:
      "Quản lý các thiết bị đăng nhập, bảo mật tài khoản với refresh token và giới hạn thiết bị truy cập.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Title
            level={1}
            className="!text-white !mb-6 text-2xl sm:text-3xl md:text-4xl"
          >
            Về LearnHub
          </Title>
          <Paragraph className="text-base sm:text-lg md:text-xl text-blue-100 leading-relaxed">
            Nền tảng học trực tuyến hiện đại, tích hợp video tương tác, bài kiểm
            tra tự động và hệ thống quản lý học tập toàn diện. Học mọi lúc, mọi
            nơi với công nghệ tiên tiến.
          </Paragraph>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <Title level={2} className="text-2xl sm:text-3xl !mb-2">
              Hệ thống của chúng tôi
            </Title>
            <Paragraph type="secondary" className="text-base sm:text-lg">
              Dữ liệu nội dung học tập phong phú và đa dạng
            </Paragraph>
          </div>
          <Row gutter={[32, 32]}>
            {stats.map((stat, index) => (
              <Col xs={12} md={6} key={index}>
                <div className="text-center">
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    suffix={stat.suffix}
                    valueStyle={{
                      color: stat.color,
                      fontSize: "2.5rem",
                      fontWeight: "bold",
                    }}
                  />
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <div>
                <Title
                  level={2}
                  className="flex items-center text-xl sm:text-2xl"
                >
                  <RocketOutlined className="mr-3 text-blue-500" />
                  Tầm nhìn
                </Title>
                <Paragraph className="text-base sm:text-lg leading-relaxed">
                  Xây dựng nền tảng học tập thông minh với công nghệ hiện đại,
                  giúp người học tiếp thu kiến thức hiệu quả thông qua video
                  tương tác, bài kiểm tra tự động và hệ thống theo dõi tiến độ
                  chi tiết.
                </Paragraph>
              </div>

              <div className="mt-8">
                <Title
                  level={2}
                  className="flex items-center text-xl sm:text-2xl"
                >
                  <HeartOutlined className="mr-3 text-red-500" />
                  Sứ mệnh
                </Title>
                <Paragraph className="text-base sm:text-lg leading-relaxed">
                  Cung cấp trải nghiệm học tập toàn diện với:
                </Paragraph>
                <ul className="list-none space-y-2 mt-4">
                  <li className="flex items-start">
                    <CheckCircleOutlined className="text-green-500 mr-2 mt-1" />
                    <span>
                      Video bài giảng chất lượng cao với tính năng bình luận
                      theo timeline
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleOutlined className="text-green-500 mr-2 mt-1" />
                    <span>
                      Hệ thống bài kiểm tra đa dạng với chấm điểm tự động
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleOutlined className="text-green-500 mr-2 mt-1" />
                    <span>
                      Theo dõi tiến độ học tập chi tiết cho từng bài học
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleOutlined className="text-green-500 mr-2 mt-1" />
                    <span>
                      Bảo mật tài khoản với quản lý thiết bị thông minh
                    </span>
                  </li>
                </ul>
              </div>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="h-full bg-gradient-to-br from-blue-50 to-indigo-50">
                <Title level={3}>Tính năng nổi bật</Title>
                <Timeline
                  items={[
                    {
                      dot: <PlayCircleOutlined className="text-blue-500" />,
                      children: (
                        <div>
                          <Text strong>Video Streaming</Text>
                          <br />
                          <Text type="secondary">
                            Hệ thống video HLS chất lượng cao với thumbnail và
                            độ phân giải tối ưu
                          </Text>
                        </div>
                      ),
                    },
                    {
                      dot: <FileTextOutlined className="text-green-500" />,
                      children: (
                        <div>
                          <Text strong>Bài kiểm tra thông minh</Text>
                          <br />
                          <Text type="secondary">
                            Hỗ trợ trắc nghiệm, tự luận, xáo trộn câu hỏi/đáp án
                            và giới hạn số lần làm
                          </Text>
                        </div>
                      ),
                    },
                    {
                      dot: <CommentOutlined className="text-orange-500" />,
                      children: (
                        <div>
                          <Text strong>Ghi chú & Bình luận</Text>
                          <br />
                          <Text type="secondary">
                            Ghi chú cá nhân theo bài học và bình luận video theo
                            dòng thời gian
                          </Text>
                        </div>
                      ),
                    },
                    {
                      dot: <TrophyOutlined className="text-purple-500" />,
                      children: (
                        <div>
                          <Text strong>Theo dõi tiến độ</Text>
                          <br />
                          <Text type="secondary">
                            Quản lý trạng thái học tập (TODO, DOING, PASS, FAIL)
                            và điểm số chi tiết
                          </Text>
                        </div>
                      ),
                    },
                    {
                      dot: <SafetyOutlined className="text-red-500" />,
                      children: (
                        <div>
                          <Text strong>Bảo mật nâng cao</Text>
                          <br />
                          <Text type="secondary">
                            Quản lý thiết bị đăng nhập, refresh token và phát
                            hiện đăng nhập bất thường
                          </Text>
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Title level={2} className="text-2xl sm:text-3xl">
              Tính năng hệ thống
            </Title>
            <Paragraph
              type="secondary"
              className="text-base sm:text-lg max-w-2xl mx-auto"
            >
              Nền tảng học trực tuyến toàn diện với công nghệ hiện đại
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} md={12} lg={8} key={index}>
                <Card className="h-full text-center hover:shadow-lg transition-shadow">
                  <div className="mb-4">{feature.icon}</div>
                  <Title level={4}>{feature.title}</Title>
                  <Paragraph type="secondary">{feature.description}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* User Roles */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Title level={2} className="text-2xl sm:text-3xl">
              Dành cho ai?
            </Title>
            <Paragraph type="secondary" className="text-base sm:text-lg">
              Hệ thống phù hợp cho cả người học và quản trị viên
            </Paragraph>
          </div>

          <Row gutter={[48, 48]}>
            <Col xs={24} lg={12}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <Space direction="vertical" size="large" className="w-full">
                  <div className="flex items-center gap-4">
                    <Avatar
                      size={64}
                      style={{ backgroundColor: "#1890ff" }}
                      icon={<TeamOutlined />}
                    />
                    <div>
                      <Title level={3} className="!mb-1">
                        Học viên
                      </Title>
                      <Text type="secondary">Trải nghiệm học tập hiện đại</Text>
                    </div>
                  </div>
                  <ul className="list-none space-y-3 ml-0 pl-0">
                    <li className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <span>Đăng ký và học các khóa học đa dạng</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <span>Xem video bài giảng và bình luận tương tác</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <span>Làm bài kiểm tra và nhận kết quả tự động</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <span>Theo dõi tiến độ học tập chi tiết</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <span>Tạo ghi chú cá nhân cho mỗi bài học</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <span>Quản lý hồ sơ và thiết bị đăng nhập</span>
                    </li>
                  </ul>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <Space direction="vertical" size="large" className="w-full">
                  <div className="flex items-center gap-4">
                    <Avatar
                      size={64}
                      style={{ backgroundColor: "#52c41a" }}
                      icon={<StarOutlined />}
                    />
                    <div>
                      <Title level={3} className="!mb-1">
                        Quản trị viên
                      </Title>
                      <Text type="secondary">Quản lý hệ thống toàn diện</Text>
                    </div>
                  </div>
                  <ul className="list-none space-y-3 ml-0 pl-0">
                    <li className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <span>Tạo và quản lý khóa học, bài học</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <span>Phê duyệt đăng ký khóa học của học viên</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <span>Tạo bài kiểm tra và câu hỏi đa dạng</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <span>Chấm điểm bài tự luận và cung cấp phản hồi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <span>Quản lý người dùng và phân quyền</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <span>Theo dõi kết quả và tiến độ học viên</span>
                    </li>
                  </ul>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Title level={2} className="text-2xl sm:text-3xl">
              Công nghệ sử dụng
            </Title>
            <Paragraph type="secondary" className="text-base sm:text-lg">
              Xây dựng trên nền tảng công nghệ hiện đại
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card>
                <Title level={4}>
                  <GlobalOutlined className="mr-2 text-blue-500" />
                  Frontend
                </Title>
                <div className="space-y-2">
                  <div>• Next.js 15 với App Router</div>
                  <div>• React 19 với TypeScript</div>
                  <div>• Ant Design UI Components</div>
                  <div>• TailwindCSS cho styling</div>
                  <div>• TanStack Query cho data fetching</div>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card>
                <Title level={4}>
                  <RocketOutlined className="mr-2 text-green-500" />
                  Backend
                </Title>
                <div className="space-y-2">
                  <div>• NestJS framework</div>
                  <div>• Prisma ORM với PostgreSQL</div>
                  <div>• JWT Authentication</div>
                  <div>• MinIO cho lưu trữ file</div>
                  <div>• Redis cho caching</div>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card>
                <Title level={4}>
                  <PlayCircleOutlined className="mr-2 text-purple-500" />
                  Video Streaming
                </Title>
                <div className="space-y-2">
                  <div>• HLS (HTTP Live Streaming)</div>
                  <div>• Adaptive bitrate streaming</div>
                  <div>• Video thumbnail generation</div>
                  <div>• Bình luận theo timeline</div>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card>
                <Title level={4}>
                  <SafetyOutlined className="mr-2 text-red-500" />
                  Bảo mật
                </Title>
                <div className="space-y-2">
                  <div>• JWT + Refresh Token</div>
                  <div>• Quản lý thiết bị đăng nhập</div>
                  <div>• Rate limiting</div>
                  <div>• Role-based access control</div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <Title level={2} className="!text-white !mb-4 text-2xl sm:text-3xl">
            Bắt đầu hành trình học tập ngay hôm nay
          </Title>
          <Paragraph className="text-base sm:text-lg md:text-xl text-blue-100 mb-8">
            Trải nghiệm nền tảng học trực tuyến hiện đại với video tương tác,
            bài kiểm tra thông minh và theo dõi tiến độ chi tiết
          </Paragraph>
          <Space size="large" className="flex-wrap justify-center">
            <Button
              type="primary"
              size="large"
              href="/public/courses"
              className="bg-white text-blue-600 border-0 hover:bg-blue-50"
              icon={<BookOutlined />}
            >
              Khám phá khóa học
            </Button>
            <Button
              size="large"
              href="/register"
              className="border-white text-white hover:bg-white hover:text-blue-600"
              icon={<RocketOutlined />}
            >
              Đăng ký ngay
            </Button>
          </Space>
        </div>
      </section>
    </div>
  );
}
