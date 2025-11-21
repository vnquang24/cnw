"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Button,
  Typography,
  Tag,
  Spin,
  Alert,
  Tabs,
  Table,
  Empty,
  Space,
  Modal,
  App,
} from "antd";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  FileText,
  Brain,
  TestTube,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import type { Prisma, WordType } from "@prisma/client";
import {
  useFindUniqueLesson,
  useFindManyComponent,
  useCreateComponent,
  useUpdateComponent,
  useDeleteComponent,
  useCreateWord,
  useUpdateWord,
} from "@/generated/hooks";
import { useQueryClient } from "@tanstack/react-query";
import ContentModal from "@/components/modal/ContentModal";
import WordModal from "@/components/modal/WordModal";

const { Title, Text } = Typography;

interface ComponentData {
  id: string;
  componentType: string;
  content?: string | null;
  indexInLesson: number;
  wordId?: string | null;
  testId?: string | null;
  word?: {
    id: string;
    content: string;
    meaning: string;
    wordType: string;
  } | null;
  test?: {
    id: string;
    name: string;
    duration: number;
  } | null;
}

interface ContentFormData {
  content: string;
  indexInLesson: number;
}

interface WordFormData {
  content: string;
  meaning: string;
  wordType: string;
  indexInLesson: number;
}

export default function LessonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const lessonId = params?.lessonId as string;
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const [activeTab, setActiveTab] = useState("content");

  // Modal states
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [wordModalOpen, setWordModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<{
    content: string;
    indexInLesson: number;
    id: string;
  } | null>(null);
  const [editingWord, setEditingWord] = useState<{
    content: string;
    meaning: string;
    wordType: string;
    indexInLesson: number;
    wordId: string;
    componentId: string;
  } | null>(null);

  // Fetch lesson data
  const {
    data: lesson,
    isLoading: lessonLoading,
    error: lessonError,
  } = useFindUniqueLesson(
    {
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    },
    {
      enabled: !!lessonId,
    },
  );

  // Fetch components by type
  const { data: contentComponents, isLoading: contentLoading } =
    useFindManyComponent(
      {
        where: {
          lessonId,
          componentType: "PARAGRAPH",
        },
        orderBy: { indexInLesson: "asc" },
      },
      {
        enabled: !!lessonId,
      },
    );

  const { data: wordComponents, isLoading: wordLoading } = useFindManyComponent(
    {
      where: {
        lessonId,
        componentType: "WORD",
      },
      include: {
        word: {
          select: {
            id: true,
            content: true,
            meaning: true,
            wordType: true,
          },
        },
      },
      orderBy: { indexInLesson: "asc" },
    },
    {
      enabled: !!lessonId,
    },
  );

  const { data: testComponents, isLoading: testLoading } = useFindManyComponent(
    {
      where: {
        lessonId,
        componentType: "TEST",
      },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
      orderBy: { indexInLesson: "asc" },
    },
    {
      enabled: !!lessonId,
    },
  );

  // Mutations
  const createComponentMutation = useCreateComponent();
  const updateComponentMutation = useUpdateComponent();
  const deleteComponentMutation = useDeleteComponent();
  const createWordMutation = useCreateWord();
  const updateWordMutation = useUpdateWord();

  // Loading state
  if (lessonLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  // Error state
  if (lessonError || !lesson) {
    return (
      <Alert
        message="Lỗi"
        description="Không thể tải thông tin bài học. Vui lòng thử lại sau."
        type="error"
        className="m-4"
      />
    );
  }

  // Content handlers
  const handleAddContent = () => {
    setEditingContent(null);
    setContentModalOpen(true);
  };

  const handleEditContent = (component: ComponentData) => {
    setEditingContent({
      content: component.content || "",
      indexInLesson: component.indexInLesson,
      id: component.id,
    });
    setContentModalOpen(true);
  };

  const handleSubmitContent = async (values: ContentFormData) => {
    try {
      if (editingContent) {
        // Update existing content
        await updateComponentMutation.mutateAsync({
          where: { id: editingContent.id },
          data: {
            content: values.content,
            indexInLesson: values.indexInLesson,
          },
        });
      } else {
        // Create new content
        await createComponentMutation.mutateAsync({
          data: {
            lessonId,
            componentType: "PARAGRAPH",
            content: values.content,
            indexInLesson: values.indexInLesson,
          },
        });
      }

      // Refetch content components
      queryClient.invalidateQueries({
        queryKey: [
          "findManyComponent",
          { where: { lessonId, componentType: "PARAGRAPH" } },
        ],
      });
    } catch (error) {
      console.error("Error with content:", error);
      throw error;
    }
  };

  // Word handlers
  const handleAddWord = () => {
    setEditingWord(null);
    setWordModalOpen(true);
  };

  const handleEditWord = (component: ComponentData) => {
    if (component.word) {
      setEditingWord({
        content: component.word.content,
        meaning: component.word.meaning,
        wordType: component.word.wordType,
        indexInLesson: component.indexInLesson,
        wordId: component.word.id,
        componentId: component.id,
      });
      setWordModalOpen(true);
    }
  };

  const handleSubmitWord = async (values: WordFormData) => {
    try {
      if (editingWord) {
        // Update existing word
        await updateWordMutation.mutateAsync({
          where: { id: editingWord.wordId },
          data: {
            content: values.content,
            meaning: values.meaning,
            wordType: values.wordType as WordType,
          },
        });

        await updateComponentMutation.mutateAsync({
          where: { id: editingWord.componentId },
          data: {
            indexInLesson: values.indexInLesson,
          },
        });
      } else {
        // Create new word and component
        const newWord = await createWordMutation.mutateAsync({
          data: {
            content: values.content,
            meaning: values.meaning,
            wordType: values.wordType as WordType,
          },
        });

        if (!newWord?.id) {
          throw new Error("Failed to create word");
        }

        await createComponentMutation.mutateAsync({
          data: {
            lessonId,
            componentType: "WORD",
            wordId: newWord.id,
            indexInLesson: values.indexInLesson,
          },
        });
      }

      // Refetch word components
      queryClient.invalidateQueries({
        queryKey: [
          "findManyComponent",
          { where: { lessonId, componentType: "WORD" } },
        ],
      });
    } catch (error) {
      console.error("Error with word:", error);
      throw error;
    }
  };

  // Delete handlers
  const handleDeleteComponent = async (componentId: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa thành phần này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteComponentMutation.mutateAsync({
            where: { id: componentId },
          });

          // Refetch all components
          queryClient.invalidateQueries({
            queryKey: ["findManyComponent"],
          });
          message.success("Xóa thành phần thành công!");
        } catch (error) {
          console.error("Error deleting component:", error);
          message.error("Có lỗi xảy ra khi xóa thành phần!");
        }
      },
    });
  };

  const getWordTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      NOUN: "Danh từ",
      VERB: "Động từ",
      ADJECTIVE: "Tính từ",
      ADVERB: "Trạng từ",
      PREPOSITION: "Giới từ",
      CONJUNCTION: "Liên từ",
      INTERJECTION: "Thán từ",
      PRONOUN: "Đại từ",
      ARTICLE: "Mạo từ",
      DETERMINER: "Từ hạn định",
      NUMERAL: "Số từ",
      OTHER: "Khác",
    };
    return typeMap[type] || type;
  };

  // Tab items
  const tabItems = [
    {
      key: "content",
      label: (
        <span className="flex items-center gap-2 px-3">
          <FileText className="w-4 h-4" />
          Nội dung ({contentComponents?.length || 0})
        </span>
      ),
      children: (
        <ContentTab
          components={(contentComponents || []) as ComponentData[]}
          loading={contentLoading}
          onAdd={handleAddContent}
          onEdit={handleEditContent}
          onDelete={handleDeleteComponent}
        />
      ),
    },
    {
      key: "word",
      label: (
        <span className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Từ vựng ({wordComponents?.length || 0})
        </span>
      ),
      children: (
        <WordTab
          components={(wordComponents || []) as ComponentData[]}
          loading={wordLoading}
          onAdd={handleAddWord}
          onEdit={handleEditWord}
          onDelete={handleDeleteComponent}
          getWordTypeLabel={getWordTypeLabel}
        />
      ),
    },
    {
      key: "test",
      label: (
        <span className="flex items-center gap-2">
          <TestTube className="w-4 h-4" />
          Bài kiểm tra ({testComponents?.length || 0})
        </span>
      ),
      children: (
        <TestTab
          components={(testComponents || []) as ComponentData[]}
          loading={testLoading}
          onAdd={() =>
            router.push(
              `/admin/tests?courseId=${courseId}&lessonId=${lessonId}`,
            )
          }
          onEdit={(component) => {
            if (component.test?.id) {
              router.push(`/admin/tests?testId=${component.test.id}`);
            }
          }}
          onDelete={handleDeleteComponent}
        />
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className=" text-black shadow">
        <div className="container px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-blue-100 mb-3">
            <Link
              href="/admin/courses"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Khóa học
            </Link>
            <span>/</span>
            <Link
              href={`/admin/courses/${courseId}`}
              className="hover:text-white transition-colors"
            >
              {lesson.course?.title}
            </Link>
            <span>/</span>
            <Link
              href={`/admin/courses/${courseId}/lessons`}
              className="hover:text-white transition-colors"
            >
              Bài học
            </Link>
            <span>/</span>
            <span className="text-white font-medium">{lesson.title}</span>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <Title level={2} className=" text-black!">
                {lesson.title}
              </Title>
              <Text className="text-blue-100">
                Quản lý các thành phần của bài học
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-3">
        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />
        </div>

        {/* Modals */}
        <ContentModal
          open={contentModalOpen}
          onCancel={() => setContentModalOpen(false)}
          onSubmit={handleSubmitContent}
          editingData={editingContent}
          title={editingContent ? "Sửa nội dung" : "Thêm nội dung"}
          nextIndex={(contentComponents?.length || 0) + 1}
        />

        <WordModal
          open={wordModalOpen}
          onCancel={() => setWordModalOpen(false)}
          onSubmit={handleSubmitWord}
          editingData={editingWord}
          title={editingWord ? "Sửa từ vựng" : "Thêm từ vựng"}
          nextIndex={(wordComponents?.length || 0) + 1}
        />
      </div>
    </div>
  );
}

// Tab Components
interface TabProps {
  components: ComponentData[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (component: ComponentData) => void;
  onDelete: (componentId: string) => void;
}

interface WordTabProps extends TabProps {
  getWordTypeLabel: (type: string) => string;
}

function ContentTab({
  components,
  loading,
  onAdd,
  onEdit,
  onDelete,
}: TabProps) {
  const columns = [
    {
      title: "Vị trí",
      dataIndex: "indexInLesson",
      key: "index",
      width: 80,
      align: "center" as const,
      render: (index: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-semibold">
          {index}
        </span>
      ),
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      key: "content",
      render: (content: string) => (
        <div className="text-gray-700 line-clamp-2">
          {content || "Không có nội dung"}
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      align: "center" as const,
      render: (_: unknown, record: ComponentData) => (
        <Space>
          <Button
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => onEdit(record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => onDelete(record.id)}
            danger
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <Text className="font-semibold text-gray-900">
              Nội dung bài học
            </Text>
            <Text type="secondary" className="text-sm block">
              Quản lý các đoạn văn và nội dung giảng dạy
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={onAdd}
        >
          Thêm nội dung
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={components}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} nội dung`,
        }}
        locale={{
          emptyText: (
            <Empty description="Chưa có nội dung nào">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={onAdd}
              >
                Thêm nội dung đầu tiên
              </Button>
            </Empty>
          ),
        }}
      />
    </div>
  );
}

function WordTab({
  components,
  loading,
  onAdd,
  onEdit,
  onDelete,
  getWordTypeLabel,
}: WordTabProps) {
  const columns = [
    {
      title: "Vị trí",
      dataIndex: "indexInLesson",
      key: "index",
      width: 80,
      align: "center" as const,
      render: (index: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700 font-semibold">
          {index}
        </span>
      ),
    },
    {
      title: "Từ vựng",
      key: "word",
      render: (_: unknown, record: ComponentData) => (
        <div>
          <div className="font-semibold text-gray-900 mb-1">
            {record.word?.content}
          </div>
          <div className="text-sm text-gray-600">{record.word?.meaning}</div>
        </div>
      ),
    },
    {
      title: "Loại từ",
      key: "wordType",
      width: 120,
      align: "center" as const,
      render: (_: unknown, record: ComponentData) => (
        <Tag color="green">
          {record.word?.wordType
            ? getWordTypeLabel(record.word.wordType)
            : "N/A"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      align: "center" as const,
      render: (_: unknown, record: ComponentData) => (
        <Space>
          <Button
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => onEdit(record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => onDelete(record.id)}
            danger
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <Text className="font-semibold text-gray-900">Từ vựng</Text>
            <Text type="secondary" className="text-sm block">
              Quản lý kho từ vựng trong bài học
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={onAdd}
          className="bg-green-600 hover:bg-green-700!"
        >
          Thêm từ vựng
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={components}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} từ vựng`,
        }}
        locale={{
          emptyText: (
            <Empty description="Chưa có từ vựng nào">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={onAdd}
                className="bg-green-600 hover:bg-green-700!"
              >
                Thêm từ vựng đầu tiên
              </Button>
            </Empty>
          ),
        }}
      />
    </div>
  );
}

function TestTab({ components, loading, onAdd, onEdit, onDelete }: TabProps) {
  const columns = [
    {
      title: "Vị trí",
      dataIndex: "indexInLesson",
      key: "index",
      width: 80,
      align: "center" as const,
      render: (index: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-semibold">
          {index}
        </span>
      ),
    },
    {
      title: "Bài kiểm tra",
      key: "test",
      render: (_: unknown, record: ComponentData) => (
        <div>
          <div className="font-semibold text-gray-900 mb-1">
            {record.test?.name}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{record.test?.duration} phút</span>
          </div>
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      align: "center" as const,
      render: (_: unknown, record: ComponentData) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => onEdit(record)}
            className="bg-orange-500 hover:bg-orange-600!"
          >
            Sửa test
          </Button>
          <Button
            size="small"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => onDelete(record.id)}
            danger
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
            <TestTube className="w-5 h-5 text-white" />
          </div>
          <div>
            <Text className="font-semibold text-gray-900">Bài kiểm tra</Text>
            <Text type="secondary" className="text-sm block">
              Quản lý các bài kiểm tra trong bài học
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={onAdd}
          className="bg-orange-600 hover:bg-orange-700!"
        >
          Tạo bài kiểm tra
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={components}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} bài kiểm tra`,
        }}
        locale={{
          emptyText: (
            <Empty description="Chưa có bài kiểm tra nào">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={onAdd}
                className="bg-orange-600 hover:bg-orange-700!"
              >
                Tạo bài kiểm tra đầu tiên
              </Button>
            </Empty>
          ),
        }}
      />
    </div>
  );
}
