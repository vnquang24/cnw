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
  Statistic,
  Input,
  Select,
  DatePicker,
  Spin,
} from "antd";
import {
  FileText,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Calendar,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import {
  useFindManyTestResult,
  useFindManyTest,
  useFindManyCourse,
} from "@/generated/hooks";
import AnswerReviewModal from "./components/AnswerReviewModal";
import GradingModal from "./components/GradingModal";
import { StatusTag } from "@/components/ui/status-tag";
import { getUserId, getUserInfo } from "@/lib/auth";
import type { Dayjs } from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface TestResultWithDetails {
  id: string;
  userId: string;
  componentId: string;
  attemptNumber: number;
  userAnswers: any;
  mark: number;
  status: string;
  createdAt: Date;
  user?: any;
  component?: any;
}

export default function TestResultsPage() {
  const userId = getUserId(); // Lấy ID giáo viên hiện tại
  const userInfo = getUserInfo();
  const isSuperAdmin = userInfo?.sub === "superadmin@gmail.com"; // Kiểm tra superadmin
  const [searchText, setSearchText] = useState("");
  const [filterTest, setFilterTest] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCourse, setFilterCourse] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const [groupBy, setGroupBy] = useState<
    "none" | "student" | "test" | "course"
  >("none");
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedGradingResultId, setSelectedGradingResultId] = useState<
    string | null
  >(null);

  // Fetch all test results with related data - CHỈ của courses mà giáo viên tạo (trừ superadmin)
  const { data: testResults = [], isLoading } = useFindManyTestResult({
    where: isSuperAdmin
      ? {} // Superadmin xem tất cả
      : {
          component: {
            lesson: {
              course: {
                createdBy: userId, // Chỉ lấy test results của courses do giáo viên này tạo
              },
            },
          },
        },
    include: {
      user: true,
      component: {
        include: {
          test: {
            include: {
              questions: true,
            },
          },
          lesson: {
            include: {
              course: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch all tests for filter dropdown - CHỈ tests trong courses do giáo viên tạo (trừ superadmin)
  const { data: tests = [] } = useFindManyTest({
    where: isSuperAdmin
      ? {} // Superadmin xem tất cả
      : {
          components: {
            some: {
              lesson: {
                course: {
                  createdBy: userId,
                },
              },
            },
          },
        },
    select: {
      id: true,
      name: true,
    },
  });

  // Fetch all courses for filter dropdown - CHỈ courses do giáo viên tạo (trừ superadmin)
  const { data: courses = [] } = useFindManyCourse({
    where: isSuperAdmin
      ? {} // Superadmin xem tất cả
      : {
          createdBy: userId, // Chỉ lấy courses do giáo viên này tạo
        },
    select: {
      id: true,
      title: true,
    },
  });

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = testResults.length;
    const passed = testResults.filter((r) => r.status === "PASSED").length;

    // Calculate average percentage instead of raw score
    const avgPercentage =
      total > 0
        ? testResults.reduce((sum, r) => {
            const maxScore = r.component?.test?.maxScore || 10;
            return sum + (r.mark / maxScore) * 100;
          }, 0) / total
        : 0;

    const uniqueStudents = new Set(testResults.map((r) => r.userId)).size;

    return {
      total,
      passed,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : "0.0",
      avgPercentage: avgPercentage.toFixed(1),
      uniqueStudents,
    };
  }, [testResults]);

  // Filter and sort test results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = testResults.filter((result) => {
      // Search filter
      const matchesSearch =
        searchText === "" ||
        result.user?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        result.component?.test?.name
          ?.toLowerCase()
          .includes(searchText.toLowerCase());

      // Test filter
      const matchesTest =
        filterTest === "ALL" || result.component?.test?.id === filterTest;

      // Status filter
      const matchesStatus =
        filterStatus === "ALL" || result.status === filterStatus;

      // Course filter
      const matchesCourse =
        filterCourse === "ALL" ||
        result.component?.lesson?.course?.id === filterCourse;

      // Date range filter
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const resultDate = new Date(result.createdAt);
        matchesDate =
          resultDate >= dateRange[0].toDate() &&
          resultDate <= dateRange[1].toDate();
      }

      return (
        matchesSearch &&
        matchesTest &&
        matchesStatus &&
        matchesCourse &&
        matchesDate
      );
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "score-high":
          return b.mark - a.mark;
        case "score-low":
          return a.mark - b.mark;
        case "student-asc":
          return (a.user?.name || "").localeCompare(b.user?.name || "");
        case "student-desc":
          return (b.user?.name || "").localeCompare(a.user?.name || "");
        default:
          return 0;
      }
    });

    return sorted;
  }, [
    testResults,
    searchText,
    filterTest,
    filterStatus,
    filterCourse,
    dateRange,
    sortOrder,
  ]);

  // Group results based on groupBy selection
  const groupedResults = useMemo(() => {
    if (groupBy === "none") {
      return null;
    }

    const groups = new Map<string, TestResultWithDetails[]>();

    filteredAndSortedResults.forEach((result) => {
      let key = "";
      let label = "";

      switch (groupBy) {
        case "student":
          key = result.userId;
          label = result.user?.name || "N/A";
          break;
        case "test":
          key = result.component?.test?.id || "unknown";
          label = result.component?.test?.name || "N/A";
          break;
        case "course":
          key = result.component?.lesson?.course?.id || "unknown";
          label = result.component?.lesson?.course?.title || "N/A";
          break;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(result);
    });

    return Array.from(groups.entries()).map(([key, results]) => {
      const firstResult = results[0];
      let label = "";
      let subtitle = "";

      switch (groupBy) {
        case "student":
          label = firstResult.user?.name || "N/A";
          subtitle = `${results.length} bài làm`;
          break;
        case "test":
          label = firstResult.component?.test?.name || "N/A";
          subtitle = `${results.length} lượt làm`;
          break;
        case "course":
          label = firstResult.component?.lesson?.course?.title || "N/A";
          subtitle = `${results.length} kết quả`;
          break;
      }

      const avgPercentage =
        results.reduce((sum, r) => {
          const maxScore = r.component?.test?.maxScore || 10;
          return sum + (r.mark / maxScore) * 100;
        }, 0) / results.length;
      const passedCount = results.filter((r) => r.status === "PASSED").length;

      return {
        key,
        label,
        subtitle,
        results,
        avgPercentage: avgPercentage.toFixed(1),
        passedCount,
        totalCount: results.length,
        passRate: ((passedCount / results.length) * 100).toFixed(1),
      };
    });
  }, [filteredAndSortedResults, groupBy]);

  const handleViewDetails = (resultId: string) => {
    setSelectedResultId(resultId);
    setModalOpen(true);
  };

  const columns = [
    {
      title: "Học sinh",
      dataIndex: ["user", "name"],
      key: "student",
      render: (name: string) => (
        <Space>
          <Users size={14} />
          <span style={{ fontWeight: 500 }}>{name || "N/A"}</span>
        </Space>
      ),
    },
    {
      title: "Bài kiểm tra",
      key: "test",
      render: (_: any, record: TestResultWithDetails) => (
        <div>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>
            {record.component?.test?.name || "N/A"}
          </div>
          <div style={{ color: "#666", fontSize: "12px" }}>
            {record.component?.lesson?.course?.title} -{" "}
            {record.component?.lesson?.title}
          </div>
        </div>
      ),
    },
    {
      title: "Điểm",
      key: "mark",
      render: (_: any, record: TestResultWithDetails) => {
        const maxScore = record.component?.test?.maxScore || 10;
        const scorePercentage = (record.mark / maxScore) * 100;
        return (
          <span
            style={{
              color:
                scorePercentage >= 80
                  ? "#52c41a"
                  : scorePercentage >= 60
                    ? "#fa8c16"
                    : "#ff4d4f",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {record.mark}/{maxScore}
          </span>
        );
      },
    },
    {
      title: "Lần làm",
      dataIndex: "attemptNumber",
      key: "attemptNumber",
      render: (attempt: number) => <Tag color="blue">Lần {attempt}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusConfig = {
          PASSED: {
            status: "success" as const,
            text: "Đạt",
            icon: <CheckCircle2 size={14} />,
          },
          FAILED: {
            status: "error" as const,
            text: "Không đạt",
            icon: <XCircle size={14} />,
          },
          PENDING: {
            status: "warning" as const,
            text: "Đang chấm",
            icon: <BookOpen size={14} />,
          },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || {
          status: "default" as const,
          text: status,
          icon: null,
        };
        return (
          <StatusTag
            status={config.status}
            icon={config.icon}
            text={config.text}
          />
        );
      },
    },
    {
      title: "Ngày làm",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: Date) => (
        <Space>
          <Calendar size={14} />
          <span>{new Date(date).toLocaleDateString("vi-VN")}</span>
        </Space>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: TestResultWithDetails) => {
        const hasEssayQuestions = record.component?.test?.questions?.some(
          (q: any) => q.questionType === "ESSAY",
        );

        return (
          <Space size="small">
            <Button
              type="link"
              icon={<Eye size={14} />}
              size="small"
              onClick={() => handleViewDetails(record.id)}
            >
              Xem chi tiết
            </Button>
            {hasEssayQuestions && (
              <Button
                type="link"
                icon={<GraduationCap size={14} />}
                size="small"
                onClick={() => {
                  setSelectedGradingResultId(record.id);
                  setGradingModalOpen(true);
                }}
              >
                Chấm điểm
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Quản lý kết quả bài kiểm tra</Title>
        <Text type="secondary">
          Xem và theo dõi kết quả bài kiểm tra của học sinh
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng bài làm"
              value={statistics.total}
              prefix={<FileText size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Điểm trung bình"
              value={statistics.avgPercentage}
              suffix="%"
              valueStyle={{ color: "#52c41a" }}
              prefix={<TrendingUp size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tỷ lệ đạt"
              value={statistics.passRate}
              suffix="%"
              valueStyle={{ color: "#1890ff" }}
              prefix={<CheckCircle2 size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng học sinh"
              value={statistics.uniqueStudents}
              prefix={<Users size={20} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <Input
              placeholder="Tìm kiếm học sinh hoặc bài test..."
              prefix={<Search size={14} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="w-full"
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              className="w-full"
              placeholder="Lọc theo bài test"
              value={filterTest}
              onChange={setFilterTest}
            >
              <Option value="ALL">Tất cả bài test</Option>
              {tests.map((test: any) => (
                <Option key={test.id} value={test.id}>
                  {test.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Select
              className="w-full"
              placeholder="Lọc theo khóa học"
              value={filterCourse}
              onChange={setFilterCourse}
            >
              <Option value="ALL">Tất cả khóa học</Option>
              {courses.map((course: any) => (
                <Option key={course.id} value={course.id}>
                  {course.title}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={3}>
            <Select
              className="w-full"
              placeholder="Trạng thái"
              value={filterStatus}
              onChange={setFilterStatus}
            >
              <Option value="ALL">Tất cả trạng thái</Option>
              <Option value="PASSED">Đạt</Option>
              <Option value="FAILED">Không đạt</Option>
              <Option value="PENDING">Đang chấm</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <RangePicker
              className="w-full"
              placeholder={["Từ ngày", "Đến ngày"]}
              format="DD/MM/YYYY"
              onChange={(dates) =>
                setDateRange(dates as [Dayjs | null, Dayjs | null] | null)
              }
            />
          </Col>
          <Col xs={24} md={3}>
            <Select
              className="w-full"
              placeholder="Sắp xếp"
              value={sortOrder}
              onChange={setSortOrder}
            >
              <Option value="newest">Mới nhất</Option>
              <Option value="oldest">Cũ nhất</Option>
              <Option value="score-high">Điểm cao nhất</Option>
              <Option value="score-low">Điểm thấp nhất</Option>
              <Option value="student-asc">Học sinh A-Z</Option>
              <Option value="student-desc">Học sinh Z-A</Option>
            </Select>
          </Col>
        </Row>
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Text strong className="whitespace-nowrap">
            Nhóm theo:
          </Text>
          <div className="flex flex-wrap gap-2">
            <Button
              type={groupBy === "none" ? "primary" : "default"}
              size="small"
              onClick={() => setGroupBy("none")}
            >
              Không nhóm
            </Button>
            <Button
              type={groupBy === "student" ? "primary" : "default"}
              size="small"
              icon={<Users size={14} />}
              onClick={() => setGroupBy("student")}
            >
              Học sinh
            </Button>
            <Button
              type={groupBy === "test" ? "primary" : "default"}
              size="small"
              icon={<FileText size={14} />}
              onClick={() => setGroupBy("test")}
            >
              Bài kiểm tra
            </Button>
            <Button
              type={groupBy === "course" ? "primary" : "default"}
              size="small"
              icon={<BookOpen size={14} />}
              onClick={() => setGroupBy("course")}
            >
              Khóa học
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Table or Grouped View */}
      {groupBy === "none" ? (
        <Card>
          <Spin spinning={isLoading}>
            <Table
              columns={columns}
              dataSource={filteredAndSortedResults}
              rowKey="id"
              scroll={{ x: 1000 }}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} kết quả`,
                responsive: true,
              }}
            />
          </Spin>
        </Card>
      ) : (
        <div>
          {groupedResults?.map((group) => (
            <Card
              key={group.key}
              style={{ marginBottom: 16 }}
              title={
                <Space>
                  {groupBy === "student" && <Users size={18} />}
                  {groupBy === "test" && <FileText size={18} />}
                  {groupBy === "course" && <BookOpen size={18} />}
                  <span style={{ fontSize: 16, fontWeight: 600 }}>
                    {group.label}
                  </span>
                  <Tag color="blue">{group.subtitle}</Tag>
                </Space>
              }
              extra={
                <Space size="large">
                  <Statistic
                    title="Điểm TB"
                    value={group.avgPercentage}
                    suffix="%"
                    valueStyle={{
                      fontSize: 16,
                      color:
                        Number(group.avgPercentage) >= 80
                          ? "#52c41a"
                          : Number(group.avgPercentage) >= 60
                            ? "#fa8c16"
                            : "#ff4d4f",
                    }}
                  />
                  <Statistic
                    title="Tỷ lệ đạt"
                    value={group.passRate}
                    suffix="%"
                    valueStyle={{ fontSize: 16, color: "#1890ff" }}
                  />
                  <Statistic
                    title="Đạt/Tổng"
                    value={`${group.passedCount}/${group.totalCount}`}
                    valueStyle={{ fontSize: 16 }}
                  />
                </Space>
              }
            >
              <Table
                columns={columns}
                dataSource={group.results}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 1000 }}
              />
            </Card>
          ))}
        </div>
      )}

      {/* Answer Review Modal */}
      <AnswerReviewModal
        resultId={selectedResultId}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedResultId(null);
        }}
      />

      <GradingModal
        resultId={selectedGradingResultId}
        open={gradingModalOpen}
        onClose={() => {
          setGradingModalOpen(false);
          setSelectedGradingResultId(null);
        }}
      />
    </div>
  );
}
