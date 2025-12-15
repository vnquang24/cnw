"use client";

import { useMemo, useState } from "react";
import type { ColumnsType } from "antd/es/table";
import type { SegmentedProps } from "antd";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Statistic,
  Divider,
} from "antd";
import {
  LayoutList,
  GalleryVertical,
  Search,
  BookOpen,
  Award,
  TrendingUp,
} from "lucide-react";
import type { Prisma } from "@prisma/client";

import { useFindManyComponent } from "@/generated/hooks";
import WordFlashcard from "@/components/ui/word-flashcard";
import type { WordFlashcardData } from "@/components/ui/word-flashcard";
import { getUserId } from "@/lib/auth";

const { Title, Text } = Typography;
const { Option } = Select;

type ViewMode = "list" | "flashcard";

interface WordItem extends WordFlashcardData {
  key: string;
  wordType: string;
  lessonId?: string;
  courseId?: string;
  updatedAt: string | Date;
}

const WORD_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  NOUN: { label: "Danh từ", color: "blue" },
  PRONOUN: { label: "Đại từ", color: "cyan" },
  VERB: { label: "Động từ", color: "green" },
  ADJECTIVE: { label: "Tính từ", color: "gold" },
  ADVERB: { label: "Trạng từ", color: "purple" },
  PREPOSITION: { label: "Giới từ", color: "magenta" },
  CONJUNCTION: { label: "Liên từ", color: "volcano" },
  INTERJECTION: { label: "Thán từ", color: "red" },
};

const VIEW_OPTIONS: Exclude<SegmentedProps["options"], undefined> = [
  {
    label: "Danh sách",
    value: "list",
    icon: <LayoutList size={16} />,
  },
  {
    label: "Flashcard",
    value: "flashcard",
    icon: <GalleryVertical size={16} />,
  },
];

export default function WordPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedWordType, setSelectedWordType] = useState<string>("all");
  const [userId] = useState(() => getUserId());

  const componentQueryArgs = useMemo<
    Prisma.ComponentFindManyArgs | undefined
  >(() => {
    if (!userId) {
      return undefined;
    }

    return {
      where: {
        componentType: "WORD",
        word: {
          isNot: null,
        },
        lesson: {
          course: {
            userCourses: {
              some: {
                userId,
              },
            },
          },
        },
      },
      include: {
        word: true,
        lesson: {
          include: {
            course: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    } satisfies Prisma.ComponentFindManyArgs;
  }, [userId]);

  const {
    data: componentData,
    isLoading,
    isFetching,
    error,
  } = useFindManyComponent(componentQueryArgs, {
    enabled: Boolean(componentQueryArgs),
    refetchOnWindowFocus: false,
  });

  const words = useMemo<WordItem[]>(() => {
    if (!componentData || !Array.isArray(componentData)) {
      return [];
    }

    type ComponentWithRelations = Prisma.ComponentGetPayload<{
      include: {
        word: true;
        lesson: {
          include: { course: true };
        };
      };
    }>;

    return (componentData as ComponentWithRelations[]).flatMap((component) => {
      const { word, lesson, id, updatedAt } = component;
      if (!word) {
        return [];
      }

      const meta = WORD_TYPE_LABELS[word.wordType] ?? {
        label: word.wordType,
        color: "default",
      };

      const item: WordItem = {
        key: id,
        id: word.id,
        word: word.content,
        meaning: word.meaning,
        description: word.description,
        wordType: word.wordType,
        wordTypeLabel: meta.label,
        wordTypeColor: meta.color,
        courseTitle: lesson?.course?.title ?? undefined,
        courseId: lesson?.course?.id ?? undefined,
        lessonTitle: lesson?.title ?? undefined,
        lessonId: lesson?.id ?? undefined,
        updatedAt,
      };

      return [item];
    });
  }, [componentData]);

  const courseOptions = useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();
    words.forEach((word) => {
      if (word.courseId && !map.has(word.courseId)) {
        map.set(word.courseId, {
          value: word.courseId,
          label: word.courseTitle || "Khóa học chưa đặt tên",
        });
      }
    });
    return Array.from(map.values());
  }, [words]);

  const filteredWords = useMemo(() => {
    let result = words;

    // Filter by course
    if (selectedCourse !== "all") {
      result = result.filter((word) => word.courseId === selectedCourse);
    }

    // Filter by word type
    if (selectedWordType !== "all") {
      result = result.filter((word) => word.wordType === selectedWordType);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(
        (word) =>
          word.word.toLowerCase().includes(searchLower) ||
          word.meaning.toLowerCase().includes(searchLower) ||
          (word.description &&
            word.description.toLowerCase().includes(searchLower)),
      );
    }

    return result;
  }, [selectedCourse, selectedWordType, searchTerm, words]);

  // Statistics
  const stats = useMemo(() => {
    const totalWords = words.length;
    const uniqueWordTypes = new Set(words.map((word) => word.wordType)).size;
    const uniqueCourses = new Set(
      words.map((word) => word.courseId).filter(Boolean),
    ).size;

    return {
      totalWords,
      uniqueWordTypes,
      uniqueCourses,
      filteredCount: filteredWords.length,
    };
  }, [words, filteredWords]);

  // Word type options for filter
  const wordTypeOptions = useMemo(() => {
    const types = new Set(words.map((word) => word.wordType));
    return Array.from(types).map((type) => ({
      value: type,
      label: WORD_TYPE_LABELS[type]?.label || type,
      color: WORD_TYPE_LABELS[type]?.color || "default",
    }));
  }, [words]);

  const columns = useMemo<ColumnsType<WordItem>>(
    () => [
      {
        title: "Từ vựng",
        dataIndex: "word",
        key: "word",
        width: 200,
        render: (_: string, record: WordItem) => (
          <Space direction="vertical" size={4}>
            <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
              {record.word}
            </Text>
            {record.description && (
              <Text
                type="secondary"
                style={{ fontSize: 12, fontStyle: "italic" }}
              >
                {record.description}
              </Text>
            )}
          </Space>
        ),
      },
      {
        title: "Nghĩa",
        dataIndex: "meaning",
        key: "meaning",
        render: (meaning: string) => (
          <Text style={{ fontSize: 14 }}>{meaning}</Text>
        ),
      },
      {
        title: "Loại từ",
        dataIndex: "wordType",
        key: "wordType",
        width: 120,
        render: (_: string, record: WordItem) => (
          <Tag
            color={record.wordTypeColor}
            style={{
              borderRadius: 8,
              fontWeight: 500,
              border: "none",
            }}
          >
            {record.wordTypeLabel}
          </Tag>
        ),
      },
      {
        title: "Khóa học",
        dataIndex: "courseTitle",
        key: "course",
        width: 250,
        render: (_: string, record: WordItem) => (
          <Space direction="vertical" size={2}>
            <Text style={{ fontWeight: 500 }}>
              {record.courseTitle || "Khóa học chưa xác định"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <BookOpen size={12} style={{ marginRight: 4 }} />
              {record.lessonTitle || "Bài học chưa xác định"}
            </Text>
          </Space>
        ),
      },
    ],
    [],
  );

  if (!userId) {
    return (
      <Alert
        message="Không tìm thấy thông tin người dùng"
        description="Không thể xác định người dùng hiện tại. Vui lòng đăng nhập lại để xem từ vựng."
        type="warning"
        showIcon
      />
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi tải dữ liệu từ vựng"
        description="Không thể lấy danh sách từ vựng. Vui lòng thử lại sau."
        type="error"
        showIcon
      />
    );
  }

  const loading = isLoading || isFetching;
  const hasNoData = !loading && filteredWords.length === 0;
  const hasNoSearchResults =
    !loading && words.length > 0 && filteredWords.length === 0;

  return (
    <div style={{ padding: "24px" }}>
      {/* Header Section */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ marginBottom: 8, color: "#1890ff" }}>
          <BookOpen
            size={28}
            style={{ marginRight: 12, verticalAlign: "middle" }}
          />
          Từ vựng khóa học của bạn
        </Title>
        <Text type="secondary" style={{ fontSize: 16, lineHeight: 1.6 }}>
          Xem lại các từ vựng từ những bài học mà bạn đã tham gia. Bạn có thể
          chuyển đổi giữa chế độ danh sách và flashcard để ôn tập linh hoạt.
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8} lg={6}>
          <Card>
            <Statistic
              title="Tổng số từ vựng"
              value={stats.totalWords}
              prefix={<BookOpen size={20} style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={6}>
          <Card>
            <Statistic
              title="Loại từ"
              value={stats.uniqueWordTypes}
              prefix={<Award size={20} style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={6}>
          <Card>
            <Statistic
              title="Khóa học"
              value={stats.uniqueCourses}
              prefix={<TrendingUp size={20} style={{ color: "#fa8c16" }} />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={6}>
          <Card>
            <Statistic
              title="Đang hiển thị"
              value={stats.filteredCount}
              suffix={`/ ${stats.totalWords}`}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter and View Controls */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} lg={8}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Text type="secondary">Chế độ hiển thị</Text>
              <Segmented
                options={VIEW_OPTIONS}
                value={viewMode}
                onChange={(value) => setViewMode(value as ViewMode)}
                style={{ width: "100%" }}
              />
            </Space>
          </Col>
          <Col xs={24} lg={16}>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12} lg={8}>
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Text type="secondary">Tìm kiếm</Text>
                  <Input
                    placeholder="Tìm từ vựng, nghĩa..."
                    prefix={<Search size={16} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    allowClear
                  />
                </Space>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Text type="secondary">Khóa học</Text>
                  <Select
                    value={selectedCourse}
                    onChange={setSelectedCourse}
                    style={{ width: "100%" }}
                    placeholder="Lọc theo khóa học"
                  >
                    <Option value="all">
                      <Badge
                        count={stats.totalWords}
                        size="small"
                        offset={[10, 0]}
                      >
                        Tất cả khóa học
                      </Badge>
                    </Option>
                    {courseOptions.map((course) => (
                      <Option key={course.value} value={course.value}>
                        {course.label}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Text type="secondary">Loại từ</Text>
                  <Select
                    value={selectedWordType}
                    onChange={setSelectedWordType}
                    style={{ width: "100%" }}
                    placeholder="Lọc theo loại từ"
                  >
                    <Option value="all">Tất cả loại từ</Option>
                    {wordTypeOptions.map((type) => (
                      <Option key={type.value} value={type.value}>
                        <Tag
                          color={type.color}
                          style={{ marginRight: 8, border: "none" }}
                        >
                          {type.label}
                        </Tag>
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Content Section */}
      <Card style={{ minHeight: 400 }}>
        <Spin spinning={loading} tip="Đang tải từ vựng..." size="large">
          {hasNoData && !words.length ? (
            <Empty
              description="Chưa có từ vựng nào trong các khóa học của bạn"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: "60px 0" }}
            />
          ) : hasNoSearchResults ? (
            <Empty
              description={
                <Space direction="vertical" size={8}>
                  <Text>Không tìm thấy từ vựng phù hợp với bộ lọc</Text>
                  <Button
                    type="link"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCourse("all");
                      setSelectedWordType("all");
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </Space>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: "60px 0" }}
            />
          ) : viewMode === "list" ? (
            <Table
              columns={columns}
              dataSource={filteredWords}
              rowKey={(record) => record.key}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} từ vựng`,
                pageSizeOptions: ["10", "20", "50"],
                responsive: true,
              }}
              locale={{ emptyText: "Không có từ vựng phù hợp" }}
              scroll={{ x: 800 }}
              rowClassName={(_, index) =>
                index % 2 === 0 ? "table-row-light" : "table-row-dark"
              }
            />
          ) : (
            <div>
              <Divider orientation="left">
                <Text strong>Flashcards ({filteredWords.length} từ)</Text>
              </Divider>
              <Row gutter={[16, 16]}>
                {filteredWords.map((word) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={word.key}>
                    <WordFlashcard data={word} />
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Spin>
      </Card>

      {/* Custom Styles */}
      <style jsx>{`
        .table-row-light {
          background-color: #fafafa;
        }
        .table-row-dark {
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
}
