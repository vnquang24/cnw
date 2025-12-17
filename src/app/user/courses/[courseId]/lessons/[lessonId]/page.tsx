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
  Modal,
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
  Sparkles,
  Trophy,
  XCircle,
  Eye,
  FileText,
  Target,
  Clock,
  BadgeCheck,
  History,
} from "lucide-react";
import {
  useFindUniqueLesson,
  useFindManyUserLesson,
  useFindManyComponent,
  useFindManyTestResult,
  useFindUniqueVideoContent,
  useFindManyVideoComment,
  useCreateVideoComment,
  useCreateUserLesson,
  useUpdateUserLesson,
} from "@/generated/hooks";
import { getUserId } from "@/lib/auth";
import EnhancedVideoPlayer from "@/components/video/EnhancedVideoPlayer";
import FlashcardLearning from "@/components/flashcard/FlashcardLearning";
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
  TODO: { label: "Chưa học", status: "error", icon: <BookOpen size={14} /> },
  DOING: { label: "Đang học", status: "default", icon: <BookOpen size={14} /> },
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

  const { data: userLesson, refetch: refetchUserLesson } =
    useFindManyUserLesson(userLessonArgs, {
      enabled: Boolean(userId && lessonId),
    });

  const createUserLesson = useCreateUserLesson();
  const updateUserLesson = useUpdateUserLesson();

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

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);

  const hasOtherComponents = otherComponents.length > 0;

  // Fetch test results for all test components in this lesson
  const testResultArgs = useMemo(
    () => ({
      where: {
        userId: userId ?? "",
        componentId: {
          in: testComponents.map((c) => c.id),
        },
      },
      orderBy: { attemptNumber: "desc" as const },
    }),
    [userId, testComponents],
  );

  const { data: allTestResults } = useFindManyTestResult(testResultArgs, {
    enabled: Boolean(userId && testComponents.length > 0),
  });

  // Function to check and update lesson status based on content
  const checkAndUpdateLessonStatus = async () => {
    if (!userId || !lessonId || !components) return;

    try {
      const currentUserLesson = userLesson?.[0];
      const currentStatus = (currentUserLesson?.status || "TODO") as
        | "TODO"
        | "DOING"
        | "PASS"
        | "FAIL";

      console.log("=== Checking lesson status ===");
      console.log("Current status:", currentStatus);
      console.log("Has test components:", testComponents.length > 0);
      console.log(
        "Test components:",
        testComponents.map((c) => ({ id: c.id, name: c.test?.name })),
      );

      // Nếu đã PASS rồi thì không làm gì
      if (currentStatus === "PASS") {
        console.log("Already PASS, no update needed");
        return;
      }

      // Xác định trạng thái mới dựa trên nội dung bài học
      let newStatus: "TODO" | "DOING" | "PASS" | "FAIL" = currentStatus;
      let shouldUpdate = false;

      // Nếu bài học có bài kiểm tra
      const hasTest = testComponents.length > 0;

      if (hasTest) {
        console.log("Lesson has tests, checking test results...");
        console.log("All test results:", allTestResults);

        // Group test results by componentId and get latest attempt
        const latestResultsByComponent = new Map();
        (allTestResults || []).forEach((result: any) => {
          if (
            !latestResultsByComponent.has(result.componentId) ||
            result.attemptNumber >
              latestResultsByComponent.get(result.componentId).attemptNumber
          ) {
            latestResultsByComponent.set(result.componentId, result);
          }
        });

        console.log(
          "Latest results by component:",
          Array.from(latestResultsByComponent.entries()).map(
            ([id, result]: [string, any]) => ({
              componentId: id,
              attemptNumber: result.attemptNumber,
              status: result.status,
              mark: result.mark,
            }),
          ),
        );

        // Check if all tests are passed
        const allTestsPassed = testComponents.every((component) => {
          const latestResult = latestResultsByComponent.get(component.id);
          const isPassed = latestResult && latestResult.status === "PASSED";
          console.log(
            `Test ${component.test?.name} (${component.id}): ${isPassed ? "PASSED" : "NOT PASSED"}`,
          );
          return isPassed;
        });

        console.log("All tests passed?", allTestsPassed);

        if (allTestsPassed) {
          // Tất cả test đã pass → đánh dấu PASS
          newStatus = "PASS";
          shouldUpdate = true;
          console.log("All tests passed! Will update to PASS");

          // Calculate average grade from all tests
          const grades = Array.from(latestResultsByComponent.values()).map(
            (r: any) => r.mark || 0,
          );
          const avgGrade =
            grades.reduce((sum, g) => sum + g, 0) / grades.length;
          console.log("Average grade:", avgGrade);
        } else if (currentStatus === "TODO") {
          // Có test nhưng chưa pass hết → chuyển sang DOING
          newStatus = "DOING";
          shouldUpdate = true;
          console.log("Has tests but not all passed, will update to DOING");
        }
      } else {
        console.log("No tests in lesson");
        // Nếu không có test, tự động đánh dấu PASS
        newStatus = "PASS";
        shouldUpdate = true;
        console.log("No tests, will auto-complete to PASS");
      }

      console.log("Determined new lesson status:", newStatus);
      console.log("Should update?", shouldUpdate);

      // Chỉ update khi có sự thay đổi trạng thái
      if (!shouldUpdate) {
        console.log("No update needed");
        return;
      }

      if (!currentUserLesson) {
        console.log("Creating new UserLesson with status:", newStatus);
        // Tạo mới UserLesson
        await createUserLesson.mutateAsync({
          data: {
            userId,
            lessonId,
            status: newStatus,
            grade: newStatus === "PASS" ? 100 : 0,
            completedAt:
              newStatus === "PASS" ? new Date().toISOString() : undefined,
          },
        });
        message.success(
          newStatus === "PASS"
            ? "Bài học đã được đánh dấu hoàn thành!"
            : "Đã bắt đầu học bài!",
        );
      } else {
        console.log(
          "Updating existing UserLesson from",
          currentStatus,
          "to",
          newStatus,
        );
        // Update UserLesson hiện có
        const updateData: any = { status: newStatus };

        if (newStatus === "PASS") {
          // Calculate average grade if has tests
          if (hasTest && allTestResults && allTestResults.length > 0) {
            const latestResultsByComponent = new Map();
            allTestResults.forEach((result: any) => {
              if (
                !latestResultsByComponent.has(result.componentId) ||
                result.attemptNumber >
                  latestResultsByComponent.get(result.componentId).attemptNumber
              ) {
                latestResultsByComponent.set(result.componentId, result);
              }
            });

            const grades = Array.from(latestResultsByComponent.values()).map(
              (r: any) => r.mark || 0,
            );
            const avgGrade =
              grades.reduce((sum, g) => sum + g, 0) / grades.length;
            updateData.grade = Math.round(avgGrade);
          } else {
            updateData.grade = 100;
          }
          updateData.completedAt = new Date().toISOString();
        }

        console.log("Update data:", updateData);

        await updateUserLesson.mutateAsync({
          where: { id: currentUserLesson.id },
          data: updateData,
        });

        if (newStatus === "PASS") {
          message.success("Bài học đã được đánh dấu hoàn thành!");
        }
      }

      console.log("Update successful!");
      refetchUserLesson();
    } catch (error) {
      console.error("Error updating lesson status:", error);
    }
  };

  // Auto check and update lesson status when page loads
  useEffect(() => {
    if (userId && lessonId && components && userLesson !== undefined) {
      // Wait a bit for test results to load
      const timer = setTimeout(() => {
        checkAndUpdateLessonStatus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userId, lessonId, components, userLesson, allTestResults]);

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
        </Row>
      </Card>

      {wordComponents.length > 0 && (
        <Card title="Từ vựng trong bài">
          <FlashcardLearning
            components={wordComponents}
            userId={userId}
            lessonId={lessonId}
            courseId={courseId}
          />
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
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/video/${video.id}/stream/playlist.m3u8`;

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
                      icon={<Clock />}
                      text="Video đang được xử lý để tối ưu streaming..."
                      type="warning"
                      size="small"
                    />
                  )}
                  {video.hlsPlaylistUrl && (
                    <InfoBadge
                      icon={<BadgeCheck />}
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
                        Ghi chú tại: {Math.floor(currentTime / 60)}:
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
                    <div className="flex justify-between items-center mt-2">
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

  const [historyModalOpen, setHistoryModalOpen] = useState(false);

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
            {mark}/{component.test?.maxScore || 10}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ flex: 1 }}>
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
            <Space size={8}>
              {testResults && testResults.length > 0 && (
                <Button
                  icon={<History size={16} />}
                  onClick={() => setHistoryModalOpen(true)}
                  size="large"
                >
                  Lịch sử
                </Button>
              )}
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
                Làm bài
              </Button>
            </Space>
          </div>

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

      <Modal
        title="Lịch sử làm bài"
        open={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        footer={null}
        width={800}
      >
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
      </Modal>
    </Space>
  );
}
