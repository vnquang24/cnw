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
  Modal,
  Form,
  InputNumber,
  message,
  Drawer,
  Descriptions,
  Spin,
} from "antd";
import {
  FileText,
  Clock,
  Users,
  CheckCircle,
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
} from "lucide-react";
import {
  useFindManyTest,
  useCreateTest,
  useUpdateTest,
  useDeleteTest,
} from "@/generated/hooks";
import { useFindManyQuestion } from "@/generated/hooks";
import { useFindManyTestResult } from "@/generated/hooks";
import type { Test } from "@prisma/client";
import ManageQuestions from "./components/ManageQuestions";

const { Title, Text } = Typography;
const { Option } = Select;

interface TestWithStats extends Test {
  questionsCount?: number;
  attemptsCount?: number;
  avgScore?: number;
}

export default function TestsPage() {
  const [selectedTest, setSelectedTest] = useState<TestWithStats | null>(null);
  const [modalState, setModalState] = useState<{
    type: "create" | "edit" | "view" | "results" | "questions" | null;
    open: boolean;
  }>({ type: null, open: false });
  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  // Fetch data
  const { data: tests, isLoading: testsLoading } = useFindManyTest({
    include: {
      questions: {
        select: { id: true },
      },
      components: {
        include: {
          testResults: {
            select: {
              mark: true,
            },
          },
        },
      },
    },
  });

  const createTest = useCreateTest();
  const updateTest = useUpdateTest();
  const deleteTest = useDeleteTest();

  // Transform data to include stats
  const testsWithStats: TestWithStats[] = useMemo(() => {
    if (!tests) return [];

    return tests.map((test: any) => {
      const questionsCount = test.questions?.length || 0;

      // Calculate attempts and avg score from test results
      const allResults =
        test.components?.flatMap((comp: any) => comp.testResults || []) || [];
      const attemptsCount = allResults.length;
      const avgScore =
        attemptsCount > 0
          ? allResults.reduce(
              (sum: number, result: any) => sum + (result.mark || 0),
              0,
            ) / attemptsCount
          : 0;

      return {
        ...test,
        questionsCount,
        attemptsCount,
        avgScore,
      };
    });
  }, [tests]);

  // Handle create test
  const handleCreateTest = async (values: any) => {
    try {
      await createTest.mutateAsync({
        data: {
          name: values.name,
          duration: values.duration,
          maxAttempts: values.maxAttempts,
        },
      });
      message.success("Tạo bài kiểm tra thành công!");
      setModalState({ type: null, open: false });
      createForm.resetFields();
    } catch (error) {
      message.error("Có lỗi xảy ra khi tạo bài kiểm tra!");
    }
  };

  // Handle edit test
  const handleEditTest = async (values: any) => {
    if (!selectedTest) return;

    try {
      await updateTest.mutateAsync({
        where: { id: selectedTest.id },
        data: {
          name: values.name,
          duration: values.duration,
          maxAttempts: values.maxAttempts,
        },
      });
      message.success("Cập nhật bài kiểm tra thành công!");
      setModalState({ type: null, open: false });
      setSelectedTest(null);
      editForm.resetFields();
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật bài kiểm tra!");
    }
  };

  // Handle delete test
  const handleDeleteTest = async (testId: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa bài kiểm tra này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      async onOk() {
        try {
          await deleteTest.mutateAsync({
            where: { id: testId },
          });
          message.success("Xóa bài kiểm tra thành công!");
        } catch (error) {
          message.error("Có lỗi xảy ra khi xóa bài kiểm tra!");
        }
      },
    });
  };

  // Handle view test details
  const handleViewTest = (test: TestWithStats) => {
    setSelectedTest(test);
    setModalState({ type: "view", open: true });
  };

  // Handle edit button click
  const handleEditClick = (test: TestWithStats) => {
    setSelectedTest(test);
    editForm.setFieldsValue({
      name: test.name,
      duration: test.duration,
      maxAttempts: test.maxAttempts,
    });
    setModalState({ type: "edit", open: true });
  };

  // Handle view results
  const handleViewResults = (test: TestWithStats) => {
    setSelectedTest(test);
    setModalState({ type: "results", open: true });
  };

  // Handle manage questions
  const handleManageQuestions = (test: TestWithStats) => {
    setSelectedTest(test);
    setModalState({ type: "questions", open: true });
  };

  const columns = [
    {
      title: "Bài kiểm tra",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <div>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>{text}</div>
        </div>
      ),
    },
    {
      title: "Câu hỏi",
      dataIndex: "questionsCount",
      key: "questionsCount",
      render: (count: number) => (
        <Space>
          <FileText size={14} />
          <span>{count || 0}</span>
        </Space>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number) => (
        <Space>
          <Clock size={14} />
          <span>{duration} phút</span>
        </Space>
      ),
    },
    {
      title: "Số lần làm tối đa",
      dataIndex: "maxAttempts",
      key: "maxAttempts",
      render: (maxAttempts: number) => <span>{maxAttempts}</span>,
    },
    {
      title: "Lượt làm",
      dataIndex: "attemptsCount",
      key: "attemptsCount",
      render: (count: number) => (
        <Space>
          <Users size={14} />
          <span>{count || 0}</span>
        </Space>
      ),
    },
    {
      title: "Điểm TB",
      dataIndex: "avgScore",
      key: "avgScore",
      render: (score: number) => {
        const displayScore = score ? score.toFixed(1) : "0.0";
        return (
          <span
            style={{
              color:
                score >= 8 ? "#52c41a" : score >= 6 ? "#fa8c16" : "#ff4d4f",
              fontWeight: "bold",
            }}
          >
            {displayScore}/10
          </span>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: TestWithStats) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<Eye size={14} />}
            size="small"
            onClick={() => handleViewTest(record)}
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<Edit size={14} />}
            size="small"
            onClick={() => handleEditClick(record)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            icon={<FileText size={14} />}
            size="small"
            onClick={() => handleManageQuestions(record)}
          >
            Câu hỏi
          </Button>
          <Button
            type="link"
            icon={<CheckCircle size={14} />}
            size="small"
            onClick={() => handleViewResults(record)}
          >
            Kết quả
          </Button>
          <Button
            type="link"
            danger
            icon={<Trash2 size={14} />}
            size="small"
            onClick={() => handleDeleteTest(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // Filter and sort tests
  const filteredAndSortedTests = useMemo(() => {
    // Filter by search text
    let filtered = testsWithStats.filter((test) => {
      const matchesSearch = test.name
        .toLowerCase()
        .includes(searchText.toLowerCase());
      return matchesSearch;
    });

    // Sort based on selected order
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
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "most-questions":
          return (b.questionsCount || 0) - (a.questionsCount || 0);
        case "highest-score":
          return (b.avgScore || 0) - (a.avgScore || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [testsWithStats, searchText, sortOrder]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Quản lý bài kiểm tra</Title>
        <Text type="secondary">
          Quản lý và theo dõi tất cả các bài kiểm tra
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng bài kiểm tra"
              value={testsWithStats?.length || 0}
              prefix={<FileText size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng câu hỏi"
              value={
                testsWithStats?.reduce(
                  (sum, test) => sum + (test.questionsCount || 0),
                  0,
                ) || 0
              }
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng lượt làm"
              value={
                testsWithStats?.reduce(
                  (sum, test) => sum + (test.attemptsCount || 0),
                  0,
                ) || 0
              }
              prefix={<Users size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Điểm trung bình"
              value={
                testsWithStats?.length > 0
                  ? testsWithStats.reduce(
                      (sum, test) => sum + (test.avgScore || 0),
                      0,
                    ) / testsWithStats.length
                  : 0
              }
              precision={1}
              suffix="/10"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space size="middle">
              <Input
                placeholder="Tìm kiếm theo tên bài kiểm tra..."
                prefix={<Search size={14} />}
                style={{ width: 300 }}
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Select
                style={{ width: 200 }}
                placeholder="Sắp xếp theo"
                value={sortOrder}
                onChange={(value) => setSortOrder(value)}
              >
                <Option value="newest">Mới nhất</Option>
                <Option value="oldest">Cũ nhất</Option>
                <Option value="name-asc">Tên A-Z</Option>
                <Option value="name-desc">Tên Z-A</Option>
                <Option value="most-questions">Nhiều câu hỏi nhất</Option>
                <Option value="highest-score">Điểm cao nhất</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => setModalState({ type: "create", open: true })}
            >
              Tạo bài kiểm tra mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tests Table */}
      <Card>
        <Spin spinning={testsLoading}>
          <Table
            columns={columns}
            dataSource={filteredAndSortedTests}
            rowKey="id"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} bài kiểm tra`,
            }}
          />
        </Spin>
      </Card>

      {/* Create Test Modal */}
      <Modal
        title="Tạo bài kiểm tra mới"
        open={modalState.type === "create" && modalState.open}
        onCancel={() => {
          setModalState({ type: null, open: false });
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        confirmLoading={createTest.isPending}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateTest}>
          <Form.Item
            name="name"
            label="Tên bài kiểm tra"
            rules={[
              { required: true, message: "Vui lòng nhập tên bài kiểm tra!" },
            ]}
          >
            <Input placeholder="Nhập tên bài kiểm tra" />
          </Form.Item>
          <Form.Item
            name="duration"
            label="Thời gian (phút)"
            rules={[{ required: true, message: "Vui lòng nhập thời gian!" }]}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="Nhập thời gian"
            />
          </Form.Item>
          <Form.Item
            name="maxAttempts"
            label="Số lần làm tối đa"
            rules={[
              { required: true, message: "Vui lòng nhập số lần làm tối đa!" },
            ]}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="Nhập số lần làm"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Test Modal */}
      <Modal
        title="Chỉnh sửa bài kiểm tra"
        open={modalState.type === "edit" && modalState.open}
        onCancel={() => {
          setModalState({ type: null, open: false });
          setSelectedTest(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        confirmLoading={updateTest.isPending}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditTest}>
          <Form.Item
            name="name"
            label="Tên bài kiểm tra"
            rules={[
              { required: true, message: "Vui lòng nhập tên bài kiểm tra!" },
            ]}
          >
            <Input placeholder="Nhập tên bài kiểm tra" />
          </Form.Item>
          <Form.Item
            name="duration"
            label="Thời gian (phút)"
            rules={[{ required: true, message: "Vui lòng nhập thời gian!" }]}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="Nhập thời gian"
            />
          </Form.Item>
          <Form.Item
            name="maxAttempts"
            label="Số lần làm tối đa"
            rules={[
              { required: true, message: "Vui lòng nhập số lần làm tối đa!" },
            ]}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="Nhập số lần làm"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Test Drawer */}
      <Drawer
        title="Chi tiết bài kiểm tra"
        placement="right"
        onClose={() => {
          setModalState({ type: null, open: false });
          setSelectedTest(null);
        }}
        open={modalState.type === "view" && modalState.open}
        width={600}
      >
        {selectedTest && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Tên bài kiểm tra">
              {selectedTest.name}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {selectedTest.duration} phút
            </Descriptions.Item>
            <Descriptions.Item label="Số lần làm tối đa">
              {selectedTest.maxAttempts}
            </Descriptions.Item>
            <Descriptions.Item label="Số câu hỏi">
              {selectedTest.questionsCount || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng lượt làm">
              {selectedTest.attemptsCount || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Điểm trung bình">
              {selectedTest.avgScore ? selectedTest.avgScore.toFixed(1) : "0.0"}
              /10
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {new Date(selectedTest.createdAt).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối">
              {new Date(selectedTest.updatedAt).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* Results Modal */}
      <Modal
        title="Kết quả bài kiểm tra"
        open={modalState.type === "results" && modalState.open}
        onCancel={() => {
          setModalState({ type: null, open: false });
          setSelectedTest(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => setModalState({ type: null, open: false })}
          >
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedTest && (
          <div>
            <Title level={4}>{selectedTest.name}</Title>
            <Descriptions column={2} bordered style={{ marginTop: 16 }}>
              <Descriptions.Item label="Tổng lượt làm">
                {selectedTest.attemptsCount || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Điểm trung bình">
                {selectedTest.avgScore
                  ? selectedTest.avgScore.toFixed(1)
                  : "0.0"}
                /10
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, color: "#666" }}>
              <Text type="secondary">
                Để xem chi tiết kết quả của từng học viên, vui lòng truy cập
                trang quản lý kết quả chi tiết.
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* Manage Questions Modal */}
      {selectedTest && (
        <ManageQuestions
          open={modalState.type === "questions" && modalState.open}
          testId={selectedTest.id}
          onCancel={() => {
            setModalState({ type: null, open: false });
            setSelectedTest(null);
          }}
        />
      )}
    </div>
  );
}
