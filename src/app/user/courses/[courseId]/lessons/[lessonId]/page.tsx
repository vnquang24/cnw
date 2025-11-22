"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  Table,
  Divider,
  Tabs,
  Input,
  message,
} from "antd";
import type { Prisma } from "@prisma/client";
import { StatusTag } from "@/components/ui/status-tag";
import { InfoBadge } from "@/components/ui/info-badge";
import { UserNote } from "@/components/ui/user-note";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  MessageCircle,
  MessageSquare,
  Shuffle,
  Sparkles,
  Trophy,
  XCircle,
  Eye,
  FileText,
  Target,
} from "lucide-react";
import {
  useFindUniqueLesson,
  useFindManyUserLesson,
  useFindManyComponent,
  useFindManyTestResult,
  useFindUniqueVideoContent,
  useFindManyVideoComment,
  useCreateVideoComment,
} from "@/generated/hooks";
import { getUserId } from "@/lib/auth";
import EnhancedVideoPlayer from "@/components/video/EnhancedVideoPlayer";
import { Video } from "lucide-react";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const lessonStatusConfig: Record<
  string,
  {
    label: string;
    status: "success" | "error" | "warning" | "info" | "default";
    icon: React.ReactNode;
  }
> = {
  TODO: { label: "Chưa học", status: "default", icon: <BookOpen size={14} /> },
  DOING: { label: "Đang học", status: "info", icon: <BookOpen size={14} /> },
  PASS: {
    label: "Hoàn thành",
    status: "success",
    icon: <BookOpen size={14} />,
  },
  FAIL: {
    label: "Cần ôn lại",
    status: "warning",
    icon: <BookOpen size={14} />,
  },
};

const componentLabel: Record<string, string> = {
  WORD: "Từ vựng",
  TEST: "Bài kiểm tra",
  PARAGRAPH: "Nội dung học",
  VIDEO: "Video bài giảng",
};

export default function LessonLearningPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string | undefined;
  const lessonId = params?.lessonId as string | undefined;
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  const lessonArgs = useMemo(
    () => ({
      where: { id: lessonId ?? "" },
      include: {
        course: true,
      },
    }),
    [lessonId],
  );

  const {
    data: lesson,
    isLoading: lessonLoading,
    isFetching: lessonFetching,
    error: lessonError,
  } = useFindUniqueLesson(lessonArgs, {
    enabled: Boolean(lessonId),
  });

  const userLessonArgs = useMemo(
    () => ({
      where: {
        userId: userId ?? "",
        lessonId: lessonId ?? "",
      },
      take: 1,
    }),
    [userId, lessonId],
  );

  const { data: userLesson } = useFindManyUserLesson(userLessonArgs, {
    enabled: Boolean(userId && lessonId),
  });

  const componentArgs = useMemo(
    () => ({
      where: {
        lessonId: lessonId ?? "",
      },
      include: {
        word: true,
        test: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
        video: true,
      },
      orderBy: { indexInLesson: "asc" as const },
    }),
    [lessonId],
  );

  const {
    data: components,
    isLoading: componentLoading,
    isFetching: componentFetching,
    error: componentError,
  } = useFindManyComponent(componentArgs, {
    enabled: Boolean(lessonId),
  });

  const wordComponents = useMemo(
    () =>
      (components ?? []).filter(
        (component) => component.componentType === "WORD" && component.word,
      ),
    [components],
  );

  const otherComponents = useMemo(
    () =>
      (components ?? []).filter(
        (component) => component.componentType !== "WORD",
      ),
    [components],
  );

  const paragraphComponents = useMemo(
    () =>
      (components ?? []).filter(
        (component) => component.componentType === "PARAGRAPH",
      ),
    [components],
  );

  const testComponents = useMemo(
    () =>
      (components ?? []).filter(
        (component) => component.componentType === "TEST",
      ),
    [components],
  );

  const videoComponents = useMemo(
    () =>
      (components ?? []).filter(
        (component) => component.componentType === "VIDEO" && component.video,
      ),
    [components],
  );

  const [wordViewMode, setWordViewMode] = useState<"list" | "flashcard">(
    "list",
  );
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);

  useEffect(() => {
    setFlashcardIndex(0);
    setShowMeaning(false);
  }, [wordViewMode, wordComponents.length]);

  const flashcardWord =
    wordComponents.length > 0
      ? (wordComponents[flashcardIndex % wordComponents.length]?.word ?? null)
      : null;
  const hasOtherComponents = otherComponents.length > 0;

  if (
    !lessonId ||
    lessonLoading ||
    lessonFetching ||
    componentLoading ||
    componentFetching
  ) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải nội dung bài học...">
          <div style={{ minHeight: 50, minWidth: 100 }} />
        </Spin>
      </div>
    );
  }

  if (lessonError || componentError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải bài học"
        description="Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
      />
    );
  }

  if (!lesson) {
    return <Empty description="Không tìm thấy bài học." />;
  }

  const currentStatusKey = userLesson?.[0]?.status ?? "TODO";
  const currentStatus =
    lessonStatusConfig[currentStatusKey] ?? lessonStatusConfig.TODO;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space size={12} align="center">
        <Button
          icon={<ArrowLeft size={16} />}
          onClick={() =>
            router.push(
              courseId ? `/user/courses/${courseId}` : "/user/courses",
            )
          }
        >
          Quay lại khóa học
        </Button>
        {courseId && (
          <Link href={`/user/courses/${courseId}`}>
            <Button type="link" icon={<BookOpen size={16} />}>
              Xem danh sách bài học
            </Button>
          </Link>
        )}
      </Space>

      <Card>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={18}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Title level={3} style={{ margin: 0 }}>
                {lesson.title}
              </Title>
              <InfoBadge
                icon={<BookOpen size={16} />}
                text={`Thuộc khóa học: ${lesson.course?.title || ""}`}
                type="secondary"
              />
              <Space size={8}>
                <StatusTag
                  status={currentStatus.status}
                  icon={currentStatus.icon}
                  text={currentStatus.label}
                  minWidth={100}
                />
                <InfoBadge
                  icon={<ClipboardList size={14} />}
                  text={`${components?.length || 0} nội dung`}
                  type="default"
                />
              </Space>
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Card variant="borderless" className="bg-gray-50">
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Statistic
                  title="Thứ tự trong khóa học"
                  value={lesson.position ?? 0}
                />
                {userLesson?.[0]?.completedAt && (
                  <Descriptions size="small" column={1} bordered>
                    <Descriptions.Item label="Hoàn thành">
                      {new Date(userLesson[0].completedAt).toLocaleString(
                        "vi-VN",
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {wordComponents.length > 0 && (
        <Card
          title="Từ vựng trong bài"
          extra={
            <Segmented
              options={[
                { label: "Danh sách", value: "list" },
                { label: "Flashcard", value: "flashcard" },
              ]}
              value={wordViewMode}
              onChange={(value) =>
                setWordViewMode(value as "list" | "flashcard")
              }
            />
          }
        >
          {wordViewMode === "list" ? (
            <Row gutter={[12, 12]}>
              {wordComponents.map((component) => {
                const word = component.word!;
                return (
                  <Col key={component.id} xs={24} md={12} lg={8}>
                    <Card size="small" className="h-full">
                      <Space
                        direction="vertical"
                        size={6}
                        style={{ width: "100%" }}
                      >
                        <Title level={4} style={{ margin: 0 }}>
                          {word.content}
                        </Title>
                        <Tag color="blue">{word.wordType}</Tag>
                        <Paragraph style={{ marginBottom: 0 }}>
                          {word.meaning}
                        </Paragraph>
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            flashcardWord && (
              <Space
                direction="vertical"
                size={16}
                style={{ width: "100%", alignItems: "center" }}
              >
                <Card
                  hoverable
                  className="w-full md:w-2/3 text-center"
                  onClick={() => setShowMeaning((prev) => !prev)}
                >
                  <Space
                    direction="vertical"
                    size={12}
                    style={{ width: "100%" }}
                  >
                    <StatusTag
                      status="info"
                      text={`Từ số ${flashcardIndex + 1}`}
                      minWidth={90}
                    />
                    <Title level={3} style={{ margin: 0 }}>
                      {flashcardWord.content}
                    </Title>
                    <Tag color="green">{flashcardWord.wordType}</Tag>
                    <Paragraph style={{ minHeight: 48 }}>
                      {showMeaning
                        ? flashcardWord.meaning
                        : "Nhấp vào thẻ để xem nghĩa"}
                    </Paragraph>
                  </Space>
                </Card>
                <Space size={12} wrap>
                  <Button
                    onClick={() => {
                      setFlashcardIndex((index) =>
                        index === 0 ? wordComponents.length - 1 : index - 1,
                      );
                      setShowMeaning(false);
                    }}
                  >
                    Trước
                  </Button>
                  <Button
                    icon={<Shuffle size={16} />}
                    onClick={() => {
                      if (wordComponents.length <= 1) return;
                      const randomIndex = Math.floor(
                        Math.random() * wordComponents.length,
                      );
                      setFlashcardIndex(randomIndex);
                      setShowMeaning(false);
                    }}
                  >
                    Ngẫu nhiên
                  </Button>
                  <Button
                    onClick={() => {
                      setFlashcardIndex((index) =>
                        index === wordComponents.length - 1 ? 0 : index + 1,
                      );
                      setShowMeaning(false);
                    }}
                  >
                    Tiếp
                  </Button>
                </Space>
                <Text type="secondary">
                  {flashcardIndex + 1}/{wordComponents.length} thẻ
                </Text>
              </Space>
            )
          )}
        </Card>
      )}

      {paragraphComponents.length > 0 ||
      testComponents.length > 0 ||
      videoComponents.length > 0 ? (
        <Card title="Nội dung bài học">
          <Tabs
            defaultActiveKey={videoComponents.length > 0 ? "videos" : "content"}
            items={[
              ...(videoComponents.length > 0
                ? [
                    {
                      key: "videos",
                      label: (
                        <Space size={8}>
                          <Video size={16} />
                          <span>Video bài giảng</span>
                          <Tag color="purple">{videoComponents.length}</Tag>
                        </Space>
                      ),
                      children: (
                        <Space
                          direction="vertical"
                          size={16}
                          style={{ width: "100%" }}
                        >
                          {videoComponents.map((component, index) => {
                            const order =
                              (component.indexInLesson ?? index) + 1;
                            return (
                              <Suspense
                                key={component.id}
                                fallback={
                                  <Card>
                                    <div className="flex justify-center py-8">
                                      <Spin
                                        size="large"
                                        tip="Đang tải video..."
                                      />
                                    </div>
                                  </Card>
                                }
                              >
                                <VideoComponentCard
                                  component={component}
                                  order={order}
                                  userId={userId}
                                />
                              </Suspense>
                            );
                          })}
                        </Space>
                      ),
                    },
                  ]
                : []),
              ...(paragraphComponents.length > 0
                ? [
                    {
                      key: "content",
                      label: (
                        <Space size={8}>
                          <FileText size={16} />
                          <span>Nội dung học</span>
                          <Tag color="blue">{paragraphComponents.length}</Tag>
                        </Space>
                      ),
                      children: (
                        <Space
                          direction="vertical"
                          size={16}
                          style={{ width: "100%" }}
                        >
                          {paragraphComponents.map((component, index) => {
                            const order =
                              (component.indexInLesson ?? index) + 1;
                            return (
                              <Card
                                key={component.id}
                                title={`${order}. ${componentLabel.PARAGRAPH}`}
                              >
                                <Space
                                  direction="vertical"
                                  size={12}
                                  style={{ width: "100%" }}
                                >
                                  <Paragraph style={{ marginBottom: 0 }}>
                                    {component.content ||
                                      "Nội dung đang cập nhật."}
                                  </Paragraph>
                                  <Space size={8}>
                                    <InfoBadge
                                      icon={<MessageCircle size={14} />}
                                      text="Hãy ghi chú lại những điểm quan trọng"
                                      type="default"
                                    />
                                    <Button
                                      type="link"
                                      icon={<MessageSquare size={14} />}
                                      onClick={() => {
                                        setSelectedComponent({
                                          id: component.id,
                                          type: component.componentType,
                                          title: `${order}. ${componentLabel.PARAGRAPH}`,
                                        });
                                        setNoteModalOpen(true);
                                      }}
                                    >
                                      Ghi chú
                                    </Button>
                                  </Space>
                                </Space>
                              </Card>
                            );
                          })}
                        </Space>
                      ),
                    },
                  ]
                : []),
              ...(testComponents.length > 0
                ? [
                    {
                      key: "tests",
                      label: (
                        <Space size={8}>
                          <Target size={16} />
                          <span>Bài kiểm tra</span>
                          <Tag color="orange">{testComponents.length}</Tag>
                        </Space>
                      ),
                      children: (
                        <Space
                          direction="vertical"
                          size={16}
                          style={{ width: "100%" }}
                        >
                          {testComponents.map((component, index) => {
                            const questions = component.test?.questions ?? [];
                            const order =
                              (component.indexInLesson ?? index) + 1;
                            return (
                              <TestComponentCard
                                key={component.id}
                                component={component}
                                order={order}
                                label={componentLabel.TEST}
                                questions={questions}
                                userId={userId}
                                courseId={courseId}
                                lessonId={lessonId}
                                router={router}
                                setSelectedComponent={setSelectedComponent}
                                setNoteModalOpen={setNoteModalOpen}
                              />
                            );
                          })}
                        </Space>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </Card>
      ) : wordComponents.length === 0 ? (
        <Empty description="Bài học chưa có nội dung." />
      ) : null}

      {selectedComponent && (
        <UserNote
          componentId={selectedComponent.id}
          userId={userId}
          componentType={selectedComponent.type}
          componentTitle={selectedComponent.title}
          open={noteModalOpen}
          onClose={() => {
            setNoteModalOpen(false);
            setSelectedComponent(null);
          }}
        />
      )}
    </Space>
  );
}

// Component to display video card with player and comments
interface VideoComponentCardProps {
  component: any;
  order: number;
  userId: string | null;
}

function VideoComponentCard({
  component,
  order,
  userId,
}: VideoComponentCardProps) {
  const video = component.video;
  const [noteText, setNoteText] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  // Fetch video comments
  const videoCommentsArgs = useMemo(
    () => ({
      where: {
        videoId: video?.id ?? "",
      },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { timestamp: "asc" as const },
    }),
    [video?.id],
  );

  const { data: comments, refetch: refetchComments } = useFindManyVideoComment(
    videoCommentsArgs,
    {
      enabled: Boolean(video?.id),
    },
  );

  // Create comment mutation
  const createCommentMutation = useCreateVideoComment({
    onSuccess: () => {
      message.success("Đã thêm ghi chú thành công!");
      setNoteText("");
      refetchComments();
    },
    onError: (error) => {
      message.error("Có lỗi khi thêm ghi chú: " + error.message);
    },
  });

  // Handle adding note
  const handleAddNote = () => {
    if (!noteText.trim() || !userId || !video?.id) {
      message.warning("Vui lòng nhập nội dung ghi chú!");
      return;
    }

    createCommentMutation.mutate({
      data: {
        content: noteText.trim(),
        timestamp: Math.floor(currentTime),
        userId: userId,
        videoId: video.id,
      },
    });
  };

  if (!video) {
    return (
      <Card>
        <Empty description="Video chưa được tải lên" />
      </Card>
    );
  }

  // Check if video has HLS playlist or fallback URL
  const videoSrc =
    video.hlsPlaylistUrl ||
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"}/api/video/${video.id}/stream/playlist.m3u8`;

  const hasValidVideo = video.hlsPlaylistUrl || video.originalUrl;

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card title={`${order}. ${componentLabel.VIDEO}`}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {hasValidVideo ? (
            <div className="video-player-container">
              <EnhancedVideoPlayer
                videoId={video.id}
                src={videoSrc}
                poster={video.thumbnailUrl || undefined}
                title={video.title}
                userId={userId || undefined}
                className="w-full rounded-lg"
                width="100%"
                height="auto"
                onTimeUpdate={(currentTime, duration) => {
                  setCurrentTime(currentTime);
                }}
              />

              {/* Video metadata */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Text strong>{video.title}</Text>
                  {video.duration && (
                    <InfoBadge
                      icon={<Video size={14} />}
                      text={`Thời lượng: ${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, "0")}`}
                      type="secondary"
                      size="small"
                    />
                  )}
                  {!video.hlsPlaylistUrl && (
                    <InfoBadge
                      icon="⏳"
                      text="Video đang được xử lý để tối ưu streaming..."
                      type="warning"
                      size="small"
                    />
                  )}
                  {video.hlsPlaylistUrl && (
                    <InfoBadge
                      icon="✅"
                      text="Video sẵn sàng streaming chất lượng cao"
                      type="success"
                      size="small"
                    />
                  )}
                </Space>
              </div>

              {/* Quick note section */}
              {userId && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ width: "100%" }}
                  >
                    <div className="flex items-center justify-between">
                      <Text strong className="text-blue-800 text-sm">
                        📝 Ghi chú tại: {Math.floor(currentTime / 60)}:
                        {String(Math.floor(currentTime % 60)).padStart(2, "0")}
                      </Text>
                    </div>
                    <TextArea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Nhập ghi chú của bạn tại thời điểm này trong video..."
                      rows={2}
                      maxLength={500}
                      showCount
                      size="small"
                    />
                    <div className="flex justify-between items-center">
                      <Text type="secondary" className="text-xs">
                        Lưu tại {Math.floor(currentTime)}s
                      </Text>
                      <Button
                        type="primary"
                        onClick={handleAddNote}
                        loading={createCommentMutation.isPending}
                        disabled={!noteText.trim()}
                        size="small"
                      >
                        Thêm
                      </Button>
                    </div>
                  </Space>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <Empty
                description="Video đang được xử lý, vui lòng quay lại sau"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}

          {/* Comments section with fixed height and scroll */}
          {comments && comments.length > 0 && (
            <Card
              size="small"
              type="inner"
              title={`Ghi chú (${comments.length})`}
            >
              <div className="max-h-64 overflow-y-auto">
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex items-start gap-2 p-2 bg-gray-50 rounded"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                        {comment.user?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium truncate">
                            {comment.user?.name || "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            {Math.floor(comment.timestamp / 60)}:
                            {String(
                              Math.floor(comment.timestamp % 60),
                            ).padStart(2, "0")}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 overflow-wrap-break-word">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </Space>
              </div>
            </Card>
          )}
          {video.description && (
            <Card size="small" type="inner">
              <Space direction="vertical" size={8}>
                <Text strong>Mô tả:</Text>
                <Paragraph style={{ marginBottom: 0 }}>
                  {video.description}
                </Paragraph>
              </Space>
            </Card>
          )}
        </Space>
      </Card>
    </Space>
  );
}

// Component to display test card with results history
interface TestComponentCardProps {
  component: any;
  order: number;
  label: string;
  questions: any[];
  userId: string | null;
  courseId: string | undefined;
  lessonId: string | undefined;
  router: any;
  setSelectedComponent: (component: any) => void;
  setNoteModalOpen: (open: boolean) => void;
}

function TestComponentCard({
  component,
  order,
  label,
  questions,
  userId,
  courseId,
  lessonId,
  router,
  setSelectedComponent,
  setNoteModalOpen,
}: TestComponentCardProps) {
  // Fetch test results for this component
  const testResultArgs = useMemo(
    () => ({
      where: {
        userId: userId ?? "",
        componentId: component.id,
      },
      orderBy: { attemptNumber: "desc" as const },
      take: 5, // Show last 5 attempts
    }),
    [userId, component.id],
  );

  const { data: testResults, isLoading: resultsLoading } =
    useFindManyTestResult(testResultArgs, {
      enabled: Boolean(userId && component.id),
    });

  const columns = [
    {
      title: "Lần thử",
      dataIndex: "attemptNumber",
      key: "attemptNumber",
      width: 80,
      render: (num: number) => <Tag color="blue">#{num}</Tag>,
    },
    {
      title: "Điểm",
      dataIndex: "mark",
      key: "mark",
      width: 100,
      render: (mark: number, record: any) => (
        <Space size={4}>
          {record.status === "PASSED" ? (
            <Trophy size={16} color="#10b981" />
          ) : (
            <XCircle size={16} color="#ef4444" />
          )}
          <Text
            strong
            style={{
              color: record.status === "PASSED" ? "#10b981" : "#ef4444",
            }}
          >
            {mark}/100
          </Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => (
        <Tag color={status === "PASSED" ? "success" : "error"}>
          {status === "PASSED" ? "Đạt" : "Chưa đạt"}
        </Tag>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      render: (record: any) => (
        <Button
          type="link"
          size="small"
          icon={<Eye size={14} />}
          onClick={() =>
            router.push(
              `/user/tests/${component.test?.id}/result?componentId=${component.id}&attemptNumber=${record.attemptNumber}&lessonId=${lessonId}&courseId=${courseId}`,
            )
          }
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card
        title={`${order}. ${label}`}
        extra={
          <InfoBadge
            icon={<ClipboardList size={14} />}
            text={`${questions.length} câu hỏi`}
            type="default"
            size="small"
          />
        }
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
              {component.test.name}
            </Title>
            <Space size={16} wrap>
              <InfoBadge
                icon={<BookOpen size={14} />}
                text={`${component.test.duration} phút`}
                type="secondary"
                size="small"
              />
              <InfoBadge
                icon={<Trophy size={14} />}
                text={`Tối đa ${component.test.maxAttempts} lần làm`}
                type="secondary"
                size="small"
              />
              <InfoBadge
                icon={<Trophy size={14} />}
                text={`Điểm đạt: ${component.test.passScore || 5}/${component.test.maxScore || 10}`}
                type="warning"
                size="small"
              />
            </Space>
          </div>

          <Button
            type="primary"
            icon={<Sparkles size={16} />}
            onClick={() =>
              router.push(
                `/user/tests/${component.test?.id}/take?componentId=${component.id}&lessonId=${lessonId}&courseId=${courseId}`,
              )
            }
            size="large"
          >
            Bắt đầu làm bài
          </Button>

          {testResults && testResults.length > 0 && (
            <>
              <Divider style={{ margin: "8px 0" }} />
              <div>
                <Title level={5} style={{ marginBottom: 12 }}>
                  📊 Lịch sử làm bài
                </Title>
                <Table
                  columns={columns}
                  dataSource={testResults}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  loading={resultsLoading}
                  locale={{
                    emptyText: "Chưa có lần làm bài nào",
                  }}
                />
              </div>
            </>
          )}

          <Button
            type="link"
            icon={<MessageSquare size={14} />}
            onClick={() => {
              setSelectedComponent({
                id: component.id,
                type: component.componentType,
                title: `${order}. ${label}`,
              });
              setNoteModalOpen(true);
            }}
          >
            Ghi chú cho bài kiểm tra này
          </Button>
        </Space>
      </Card>
    </Space>
  );
}
