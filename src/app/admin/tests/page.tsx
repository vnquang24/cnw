"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  App,
  Drawer,
  Descriptions,
  Spin,
  TreeSelect,
  Checkbox,
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
import type { Prisma } from "@prisma/client";
import {
  useFindManyTest,
  useCreateTest,
  useUpdateTest,
  useDeleteTest,
  useFindManyCourse,
  useFindManyLesson,
  useFindManyComponent,
  useCreateComponent,
  useUpdateComponent,
  useDeleteComponent,
} from "@/generated/hooks";
import ManageQuestions from "./components/ManageQuestions";

const { Title, Text } = Typography;
const { Option } = Select;

interface TestWithStats {
  id: string;
  name: string;
  duration: number;
  maxAttempts: number;
  maxScore?: number;
  passScore?: number;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  createdAt: Date;
  updatedAt: Date;
  questionsCount?: number;
  attemptsCount?: number;
  avgScore?: number;
  questions?: any[];
  components?: any[];
}

export default function TestsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTest, setSelectedTest] = useState<TestWithStats | null>(null);
  const [modalState, setModalState] = useState<{
    type: "create" | "edit" | "view" | "results" | "questions" | null;
    open: boolean;
  }>({ type: null, open: false });
  const [filterTrigger, setFilterTrigger] = useState(0);
  const [highlightedTestId, setHighlightedTestId] = useState<string | null>(
    null,
  );
  const tableRef = useRef<any>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [filterForm] = Form.useForm();

  // Fetch courses and lessons
  const { data: courses } = useFindManyCourse({
    include: {
      lessons: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          courseId: true,
        },
      },
    },
  });

  // Fetch components for the selected test
  const { data: testComponents } = useFindManyComponent(
    {
      where: { testId: selectedTest?.id },
      select: {
        id: true,
        lessonId: true,
        indexInLesson: true,
      },
    },
    {
      enabled: !!selectedTest?.id && modalState.type === "edit",
    },
  );

  // Update form when editing
  useEffect(() => {
    if (modalState.type === "edit" && Array.isArray(testComponents)) {
      const lessonIds = testComponents
        .map((comp) => comp.lessonId)
        .filter((id): id is string => typeof id === "string");
      editForm.setFieldsValue({ lessons: lessonIds });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testComponents, modalState.type, editForm]);

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
  const createComponent = useCreateComponent();
  const deleteComponent = useDeleteComponent();

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
        maxScore: test.maxScore || 10,
      };
    });
  }, [tests]);

  // Handle URL params - Auto open edit modal if testId is present
  useEffect(() => {
    const testId = searchParams?.get("testId");
    if (testId && testsWithStats.length > 0) {
      const test = testsWithStats.find((t) => t.id === testId);
      if (test && !modalState.open) {
        // Highlight the test
        setHighlightedTestId(testId);

        // Auto-fill search to show the test
        filterForm.setFieldsValue({ searchText: test.name });
        setFilterTrigger((prev) => prev + 1);

        // Auto-open edit modal
        handleEditClick(test);

        // Clear URL params after opening
        setTimeout(() => {
          router.replace("/admin/tests", { scroll: false });
          // Clear highlight after 3 seconds
          setTimeout(() => setHighlightedTestId(null), 3000);
        }, 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, testsWithStats]);

  // Handle create test
  const handleCreateTest = async (values: any) => {
    try {
      const createdTest = await createTest.mutateAsync({
        data: {
          name: values.name,
          duration: values.duration,
          maxAttempts: values.maxAttempts,
          maxScore: values.maxScore,
          passScore: values.passScore ?? 5,
          shuffleQuestions: values.shuffleQuestions ?? false,
          shuffleAnswers: values.shuffleAnswers ?? false,
        },
      });

      // Create components for selected lessons
      if (createdTest && values.lessons && values.lessons.length > 0) {
        for (const lessonId of values.lessons) {
          await createComponent.mutateAsync({
            data: {
              lessonId: lessonId,
              componentType: "TEST",
              testId: createdTest.id,
              indexInLesson: 999, // Default position, can be adjusted later
            },
          });
        }
      }

      message.success("Tạo bài kiểm tra thành công!");
      setModalState({ type: null, open: false });
      createForm.resetFields();
    } catch (error) {
      message.error("Có lỗi xảy ra khi tạo bài kiểm tra!");
      console.error(error);
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
          maxScore: values.maxScore,
          passScore: values.passScore ?? 5,
          shuffleQuestions: values.shuffleQuestions ?? false,
          shuffleAnswers: values.shuffleAnswers ?? false,
        },
      });

      // Handle lesson changes
      const oldLessonIds = testComponents?.map((comp) => comp.lessonId) || [];
      const newLessonIds = values.lessons || [];

      // Remove components for unselected lessons
      const lessonsToRemove = oldLessonIds.filter(
        (id) => !newLessonIds.includes(id),
      );
      for (const lessonId of lessonsToRemove) {
        const componentToDelete = testComponents?.find(
          (comp) => comp.lessonId === lessonId,
        );
        if (componentToDelete) {
          await deleteComponent.mutateAsync({
            where: { id: componentToDelete.id },
          });
        }
      }

      // Add components for newly selected lessons
      const lessonsToAdd = newLessonIds.filter(
        (id: string) => !oldLessonIds.includes(id),
      );
      for (const lessonId of lessonsToAdd) {
        await createComponent.mutateAsync({
          data: {
            lessonId: lessonId,
            componentType: "TEST",
            testId: selectedTest.id,
            indexInLesson: 999, // Default position, can be adjusted later
          },
        });
      }

      message.success("Cập nhật bài kiểm tra thành công!");
      setModalState({ type: null, open: false });
      setSelectedTest(null);
      editForm.resetFields();
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật bài kiểm tra!");
      console.error(error);
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
      maxScore: test.maxScore,
      passScore: test.passScore ?? 5,
      shuffleQuestions: test.shuffleQuestions ?? false,
      shuffleAnswers: test.shuffleAnswers ?? false,
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

  // Build tree data for lesson selection
  const lessonTreeData = useMemo(() => {
    if (!courses) return [];

    return courses.map((course: any) => ({
      title: course.title,
      value: `course-${course.id}`,
      selectable: false,
      children: course.lessons?.map((lesson: any) => ({
        title: lesson.title,
        value: lesson.id,
      })),
    }));
  }, [courses]);

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
      key: "avgScore",
      render: (_: any, record: TestWithStats) => {
        const displayScore = record.avgScore
          ? record.avgScore.toFixed(1)
          : "0.0";
        const maxScore = record.maxScore || 10;
        const scorePercentage = record.avgScore
          ? (record.avgScore / maxScore) * 100
          : 0;
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
            }}
          >
            {displayScore}/{maxScore}
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
    const formValues = filterForm.getFieldsValue();
    const searchText = formValues.searchText || "";
    const sortOrder = formValues.sortOrder || "newest";

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
  }, [testsWithStats, filterTrigger]);

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
              title="Điểm trung bình (%)"
              value={
                testsWithStats?.length > 0
                  ? testsWithStats.reduce((sum, test) => {
                      const maxScore = test.maxScore || 10;
                      const percentage = test.avgScore
                        ? (test.avgScore / maxScore) * 100
                        : 0;
                      return sum + percentage;
                    }, 0) / testsWithStats.length
                  : 0
              }
              precision={1}
              suffix="%"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={filterForm}
          layout="inline"
          initialValues={{ searchText: "", sortOrder: "newest" }}
          onValuesChange={() => {
            // Trigger re-render when form values change
            setFilterTrigger((prev) => prev + 1);
          }}
          className="w-full"
        >
          <Row
            gutter={[16, 16]}
            align="middle"
            style={{ width: "100%" }}
            justify="space-between"
          >
            <Col xs={24} lg={18}>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Form.Item
                  name="searchText"
                  style={{ marginBottom: 0, flex: 1 }}
                >
                  <Input
                    placeholder="Tìm kiếm theo tên bài kiểm tra..."
                    prefix={<Search size={14} />}
                    className="w-full"
                    allowClear
                  />
                </Form.Item>
                <Form.Item name="sortOrder" style={{ marginBottom: 0 }}>
                  <Select
                    className="w-full sm:w-[200px]"
                    placeholder="Sắp xếp theo"
                  >
                    <Option value="newest">Mới nhất</Option>
                    <Option value="oldest">Cũ nhất</Option>
                    <Option value="name-asc">Tên A-Z</Option>
                    <Option value="name-desc">Tên Z-A</Option>
                    <Option value="most-questions">Nhiều câu hỏi nhất</Option>
                    <Option value="highest-score">Điểm cao nhất</Option>
                  </Select>
                </Form.Item>
              </div>
            </Col>
            <Col xs={24} lg={6} style={{ textAlign: "right" }}>
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={() => setModalState({ type: "create", open: true })}
                className="w-full sm:w-auto"
              >
                Tạo bài kiểm tra mới
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Tests Table */}
      <Card>
        <Spin spinning={testsLoading}>
          <Table
            ref={tableRef}
            columns={columns}
            dataSource={filteredAndSortedTests}
            rowKey="id"
            scroll={{ x: 1000 }}
            rowClassName={(record) =>
              record.id === highlightedTestId ? "ant-table-row-selected" : ""
            }
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} bài kiểm tra`,
              responsive: true,
            }}
          />
        </Spin>
      </Card>

      {/* Custom styles for highlighted row */}
      <style jsx global>{`
        .ant-table-row-selected {
          background-color: #e6f7ff !important;
          animation: highlightFade 3s ease-in-out;
        }
        
        @keyframes highlightFade {
          0% {
            background-color: #bae7ff;
          }
          100% {
            background-color: #e6f7ff;
          }
        }
      `}</style>

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
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateTest}
          initialValues={{ maxScore: 10, passScore: 5 }}
        >
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
          <Form.Item
            name="maxScore"
            label="Điểm tối đa của bài kiểm tra"
            rules={[{ required: true, message: "Vui lòng nhập điểm tối đa!" }]}
            tooltip="Điểm tối đa mà học viên có thể đạt được trong bài kiểm tra này"
          >
            <InputNumber
              min={1}
              max={100}
              style={{ width: "100%" }}
              placeholder="Nhập điểm tối đa (VD: 10)"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="shuffleQuestions"
                valuePropName="checked"
                initialValue={false}
              >
                <Checkbox>Trộn câu hỏi</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="shuffleAnswers"
                valuePropName="checked"
                initialValue={false}
              >
                <Checkbox>Trộn đáp án</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="lessons"
            label="Chọn bài học áp dụng"
            tooltip="Chọn các bài học mà bài kiểm tra này sẽ được áp dụng"
          >
            <TreeSelect
              treeData={lessonTreeData}
              placeholder="Chọn bài học..."
              multiple
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_CHILD}
              style={{ width: "100%" }}
              maxTagCount="responsive"
              treeDefaultExpandAll
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
        width={600}
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
          <Form.Item
            name="maxScore"
            label="Điểm tối đa của bài kiểm tra"
            rules={[{ required: true, message: "Vui lòng nhập điểm tối đa!" }]}
            tooltip="Điểm tối đa mà học viên có thể đạt được trong bài kiểm tra này"
          >
            <InputNumber
              min={1}
              max={100}
              style={{ width: "100%" }}
              placeholder="Nhập điểm tối đa (VD: 10)"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="shuffleQuestions" valuePropName="checked">
                <Checkbox>Trộn câu hỏi</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="shuffleAnswers" valuePropName="checked">
                <Checkbox>Trộn đáp án</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="lessons"
            label="Chọn bài học áp dụng"
            tooltip="Chọn các bài học mà bài kiểm tra này sẽ được áp dụng"
          >
            <TreeSelect
              treeData={lessonTreeData}
              placeholder="Chọn bài học..."
              multiple
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_CHILD}
              style={{ width: "100%" }}
              maxTagCount="responsive"
              treeDefaultExpandAll
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
            <Descriptions.Item label="Điểm tối đa">
              {selectedTest.maxScore || 10}
            </Descriptions.Item>
            <Descriptions.Item label="Điểm đạt">
              <Tag color="green">
                {selectedTest.passScore || 5}/{selectedTest.maxScore || 10}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Điểm trung bình">
              {selectedTest.avgScore ? selectedTest.avgScore.toFixed(1) : "0.0"}
              /{selectedTest.maxScore || 10}
            </Descriptions.Item>
            <Descriptions.Item label="Trộn câu hỏi">
              {selectedTest.shuffleQuestions ? (
                <Tag color="blue">Có</Tag>
              ) : (
                <Tag>Không</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Trộn đáp án">
              {selectedTest.shuffleAnswers ? (
                <Tag color="blue">Có</Tag>
              ) : (
                <Tag>Không</Tag>
              )}
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
                /{selectedTest.maxScore || 10}
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
          shuffleQuestions={selectedTest.shuffleQuestions}
          shuffleAnswers={selectedTest.shuffleAnswers}
        />
      )}
    </div>
  );
}
