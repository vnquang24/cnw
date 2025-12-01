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
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const stats = [
  { title: "Học viên", value: 50000, suffix: "+", color: "#1890ff" },
  { title: "Khóa học", value: 500, suffix: "+", color: "#52c41a" },
  { title: "Giảng viên", value: 100, suffix: "+", color: "#f5222d" },
  { title: "Quốc gia", value: 20, suffix: "+", color: "#fa8c16" },
];

const features = [
  {
    icon: <BookOutlined className="text-3xl text-blue-500" />,
    title: "Khóa học chất lượng",
    description:
      "Nội dung được thiết kế bởi các chuyên gia có kinh nghiệm thực tế phong phú trong ngành.",
  },
  {
    icon: <TeamOutlined className="text-3xl text-green-500" />,
    title: "Cộng đồng học tập",
    description:
      "Tham gia cộng đồng học viên năng động, hỗ trợ lẫn nhau trong quá trình học tập.",
  },
  {
    icon: <TrophyOutlined className="text-3xl text-yellow-500" />,
    title: "Chứng chỉ uy tín",
    description:
      "Nhận chứng chỉ hoàn thành khóa học được công nhận bởi các doanh nghiệp hàng đầu.",
  },
  {
    icon: <GlobalOutlined className="text-3xl text-purple-500" />,
    title: "Học mọi lúc, mọi nơi",
    description:
      "Nền tảng học trực tuyến cho phép bạn học tập linh hoạt theo thời gian biểu của mình.",
  },
];

const team = [
  {
    name: "Nguyễn Văn A",
    role: "CEO & Founder",
    avatar: "https://via.placeholder.com/80x80/1890ff/ffffff?text=CEO",
    description: "Hơn 15 năm kinh nghiệm trong lĩnh vực giáo dục và công nghệ.",
  },
  {
    name: "Trần Thị B",
    role: "CTO",
    avatar: "https://via.placeholder.com/80x80/52c41a/ffffff?text=CTO",
    description:
      "Chuyên gia công nghệ với kinh nghiệm phát triển sản phẩm EdTech.",
  },
  {
    name: "Lê Văn C",
    role: "Head of Education",
    avatar: "https://via.placeholder.com/80x80/f5222d/ffffff?text=EDU",
    description:
      "Giám đốc giáo dục với nhiều năm kinh nghiệm trong thiết kế chương trình.",
  },
  {
    name: "Hoàng Thị D",
    role: "Head of Marketing",
    avatar: "https://via.placeholder.com/80x80/fa8c16/ffffff?text=MKT",
    description:
      "Chuyên gia marketing với kinh nghiệm xây dựng thương hiệu giáo dục.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Title
            level={1}
            className="!text-white !mb-6 text-2xl sm:text-3xl md:text-4xl"
          >
            Về EduSystem
          </Title>
          <Paragraph className="text-base sm:text-lg md:text-xl text-blue-100 leading-relaxed">
            Chúng tôi tin rằng giáo dục là chìa khóa mở ra tương lai. EduSystem
            được thành lập với sứ mệnh democratize education - mang giáo dục
            chất lượng cao đến với mọi người, ở mọi nơi, vào mọi lúc.
          </Paragraph>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
                  Trở thành nền tảng giáo dục trực tuyến hàng đầu Việt Nam, nơi
                  mọi người có thể tiếp cận kiến thức chất lượng cao và phát
                  triển kỹ năng cần thiết cho thế kỷ 21.
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
                  Chúng tôi cam kết mang đến trải nghiệm học tập tuyệt vời thông
                  qua:
                </Paragraph>
                <ul className="list-none space-y-2 mt-4">
                  <li className="flex items-start">
                    <CheckCircleOutlined className="text-green-500 mr-2 mt-1" />
                    <span>
                      Nội dung học tập chất lượng cao và cập nhật liên tục
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleOutlined className="text-green-500 mr-2 mt-1" />
                    <span>Phương pháp giảng dạy hiện đại và tương tác</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleOutlined className="text-green-500 mr-2 mt-1" />
                    <span>Hỗ trợ học viên 24/7 trong suốt quá trình học</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleOutlined className="text-green-500 mr-2 mt-1" />
                    <span>Kết nối học viên với cơ hội việc làm thực tế</span>
                  </li>
                </ul>
              </div>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="h-full bg-gradient-to-br from-blue-50 to-purple-50">
                <Title level={3}>Hành trình phát triển</Title>
                <Timeline
                  items={[
                    {
                      dot: <RocketOutlined className="text-blue-500" />,
                      children: (
                        <div>
                          <Text strong>2020 - Khởi đầu</Text>
                          <br />
                          <Text type="secondary">
                            EduSystem ra đời với 10 khóa học đầu tiên
                          </Text>
                        </div>
                      ),
                    },
                    {
                      dot: <TrophyOutlined className="text-yellow-500" />,
                      children: (
                        <div>
                          <Text strong>2021 - Phát triển</Text>
                          <br />
                          <Text type="secondary">
                            Đạt mốc 10,000 học viên và 100 khóa học
                          </Text>
                        </div>
                      ),
                    },
                    {
                      dot: <StarOutlined className="text-green-500" />,
                      children: (
                        <div>
                          <Text strong>2022 - Mở rộng</Text>
                          <br />
                          <Text type="secondary">
                            Ra mắt ứng dụng mobile và hệ thống chứng chỉ
                          </Text>
                        </div>
                      ),
                    },
                    {
                      dot: <GlobalOutlined className="text-purple-500" />,
                      children: (
                        <div>
                          <Text strong>2023 - Quốc tế hóa</Text>
                          <br />
                          <Text type="secondary">
                            Mở rộng ra các quốc gia trong khu vực
                          </Text>
                        </div>
                      ),
                    },
                    {
                      dot: <HeartOutlined className="text-red-500" />,
                      children: (
                        <div>
                          <Text strong>2024 - Hiện tại</Text>
                          <br />
                          <Text type="secondary">
                            50,000+ học viên và 500+ khóa học chất lượng cao
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
              Tại sao chọn EduSystem?
            </Title>
            <Paragraph
              type="secondary"
              className="text-base sm:text-lg max-w-2xl mx-auto"
            >
              Chúng tôi không chỉ cung cấp khóa học, mà còn tạo ra một hệ sinh
              thái học tập toàn diện cho sự phát triển của bạn
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} md={12} key={index}>
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

      {/* Team */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Title level={2} className="text-2xl sm:text-3xl">
              Đội ngũ lãnh đạo
            </Title>
            <Paragraph type="secondary" className="text-base sm:text-lg">
              Những con người đam mê và tâm huyết đằng sau EduSystem
            </Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {team.map((member, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card className="text-center h-full">
                  <Avatar size={80} src={member.avatar} className="mb-4" />
                  <Title level={4} className="!mb-2">
                    {member.name}
                  </Title>
                  <Text strong className="text-blue-500 block mb-3">
                    {member.role}
                  </Text>
                  <Paragraph type="secondary" className="text-sm">
                    {member.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <Title level={2} className="!text-white !mb-4 text-2xl sm:text-3xl">
            Sẵn sàng bắt đầu hành trình học tập?
          </Title>
          <Paragraph className="text-base sm:text-lg md:text-xl text-blue-100 mb-8">
            Tham gia cùng hàng nghìn học viên đang phát triển kỹ năng và xây
            dựng sự nghiệp
          </Paragraph>
          <Space size="large" className="flex-wrap justify-center">
            <Button
              type="primary"
              size="large"
              className="bg-white text-blue-600 border-0 hover:bg-blue-50"
            >
              Khám phá khóa học
            </Button>
            <Button
              size="large"
              className="border-white text-white hover:bg-white hover:text-blue-600"
            >
              Liên hệ chúng tôi
            </Button>
          </Space>
        </div>
      </section>
    </div>
  );
}
