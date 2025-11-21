"use client";

import { Modal, Typography, Tag, Space, Divider, Card } from "antd";
import { Clock, BookOpen, User } from "lucide-react";
import { useFindUniqueLesson } from "@/generated/hooks";
import { useLessonModal } from "./LessonModalContext";

const { Title, Text } = Typography;

interface ComponentData {
  id: string;
  componentType: string;
  content?: string | null;
  indexInLesson: number;
  test?: {
    id: string;
    name: string;
  } | null;
  word?: {
    id: string;
    content: string;
    meaning: string;
    wordType: string;
  } | null;
}

const LessonViewModal = () => {
  const { selectedLessonId, isViewModalOpen, closeViewModal } =
    useLessonModal();

  const { data: lesson, isLoading } = useFindUniqueLesson(
    {
      where: { id: selectedLessonId || "" },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        components: {
          orderBy: { indexInLesson: "asc" },
          select: {
            id: true,
            componentType: true,
            content: true,
            indexInLesson: true,
            test: {
              select: {
                id: true,
                name: true,
              },
            },
            word: {
              select: {
                id: true,
                content: true,
                meaning: true,
                wordType: true,
              },
            },
          },
        },
        _count: {
          select: {
            components: true,
          },
        },
      },
    },
    {
      enabled: !!selectedLessonId && isViewModalOpen,
    },
  );

  const getComponentTypeLabel = (type: string) => {
    const typeMap: Record<string, { label: string; color: string }> = {
      PARAGRAPH: { label: "Nội dung", color: "blue" },
      WORD: { label: "Từ vựng", color: "green" },
      TEST: { label: "Bài kiểm tra", color: "orange" },
    };
    return typeMap[type] || { label: type, color: "default" };
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
    };
    return typeMap[type] || type;
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          <span>Chi tiết bài học</span>
        </div>
      }
      open={isViewModalOpen}
      onCancel={closeViewModal}
      width={800}
      footer={null}
      className="lesson-view-modal"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <Text type="secondary">Đang tải...</Text>
          </div>
        </div>
      ) : lesson ? (
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <Title level={4} className="mb-3">
              {lesson.title}
            </Title>
            <Space wrap>
              <Tag color="blue">Vị trí: {lesson.position}</Tag>
              <Tag color="green">
                {lesson._count?.components || 0} thành phần
              </Tag>
            </Space>
          </div>

          {/* Course Info */}
          <div>
            <Text strong>Thuộc khóa học: </Text>
            <Text>{lesson.course?.title}</Text>
          </div>

          {/* Creator Info */}
          {lesson.creator && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <Text type="secondary">Được tạo bởi: </Text>
              <Text>{lesson.creator.name}</Text>
            </div>
          )}

          <Divider />

          {/* Components */}
          <div>
            <Title level={5} className="mb-4">
              Thành phần bài học ({lesson.components?.length || 0})
            </Title>

            {lesson.components && lesson.components.length > 0 ? (
              <div className="space-y-3">
                {lesson.components.map((component: ComponentData) => {
                  const typeInfo = getComponentTypeLabel(
                    component.componentType,
                  );

                  return (
                    <Card
                      key={component.id}
                      size="small"
                      className="border border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {component.indexInLesson}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                          </div>

                          {component.componentType === "PARAGRAPH" &&
                            component.content && (
                              <div>
                                <Text type="secondary" className="text-xs">
                                  Nội dung:
                                </Text>
                                <div className="text-sm mt-1 p-2 bg-gray-50 rounded">
                                  {component.content}
                                </div>
                              </div>
                            )}

                          {component.componentType === "WORD" &&
                            component.word && (
                              <div className="space-y-2">
                                <div>
                                  <Text strong className="text-sm">
                                    {component.word.content}
                                  </Text>
                                  <Tag className="ml-2">
                                    {getWordTypeLabel(component.word.wordType)}
                                  </Tag>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <Text type="secondary">Nghĩa: </Text>
                                  {component.word.meaning}
                                </div>
                              </div>
                            )}

                          {component.componentType === "TEST" &&
                            component.test && (
                              <div>
                                <Text strong className="text-sm">
                                  {component.test.name}
                                </Text>
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {component.test.id}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <Text type="secondary">
                  Chưa có thành phần nào trong bài học này
                </Text>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <Divider />
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                Tạo: {new Date(lesson.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                Cập nhật: {new Date(lesson.updatedAt).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Text type="secondary">Không tìm thấy thông tin bài học</Text>
        </div>
      )}
    </Modal>
  );
};

export default LessonViewModal;
