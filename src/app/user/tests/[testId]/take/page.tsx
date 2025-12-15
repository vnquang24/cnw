"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Input,
  Checkbox,
  Col,
  Empty,
  Modal,
  Progress,
  Radio,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  Image,
  message,
} from "antd";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
import {
  useFindUniqueTest,
  useFindManyTestResult,
  useCreateTestResult,
} from "@/generated/hooks";
import { getUserId } from "@/lib/auth";
import { shuffleTestContent } from "@/utils/shuffleUtils";

const { Title, Text, Paragraph } = Typography;
const { Countdown } = Statistic;

interface UserAnswer {
  questionId: string;
  selectedAnswerIds: string[];
  essayAnswer?: string;
}

// Type definition for Test with all fields including shuffle options
type TestWithQuestions = Prisma.TestGetPayload<{
  include: {
    questions: {
      include: {
        answers: true;
        mediaFiles: true;
      };
    };
  };
}>;

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = params?.testId as string | undefined;
  const componentId = searchParams?.get("componentId") || "";
  const lessonId = searchParams?.get("lessonId") || "";
  const courseId = searchParams?.get("courseId") || "";

  const [userId, setUserId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [displayQuestions, setDisplayQuestions] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  // Reset displayQuestions on unmount to ensure fresh shuffle on next mount
  useEffect(() => {
    return () => {
      setDisplayQuestions([]);
    };
  }, []);

  // Fetch test data with questions and answers
  const testArgs = useMemo(
    () => ({
      where: { id: testId ?? "" },
      include: {
        questions: {
          include: {
            answers: true,
            mediaFiles: true,
          },
          orderBy: { createdAt: "asc" as const },
        },
      },
    }),
    [testId],
  );

  const {
    data: test,
    isLoading: testLoading,
    error: testError,
  } = useFindUniqueTest(testArgs, {
    enabled: Boolean(testId),
  });

  // Fetch previous attempts
  const testResultArgs = useMemo(
    () => ({
      where: {
        userId: userId ?? "",
        componentId: componentId,
      },
      orderBy: { attemptNumber: "desc" as const },
    }),
    [userId, componentId],
  );

  const { data: previousResults } = useFindManyTestResult(testResultArgs, {
    enabled: Boolean(userId && componentId),
  });

  const createTestResult = useCreateTestResult();

  // Initialize timer when test loads
  useEffect(() => {
    if (test?.duration) {
      setTimeLeft(test.duration * 60); // convert minutes to seconds
    }
  }, [test?.duration]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!isTimeUp && timeLeft === 0) {
        setIsTimeUp(true);
        handleSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isTimeUp]);

  // Initialize user answers array and shuffle questions/answers
  // This runs ONLY ONCE when component mounts with test data
  useEffect(() => {
    if (
      test?.questions &&
      test.questions.length > 0 &&
      displayQuestions.length === 0
    ) {
      console.log(
        "🔄 Initializing shuffle - Component mounted at:",
        new Date().toISOString(),
      );
      console.log("📝 Original questions count:", test.questions.length);
      console.log(
        "📋 Original order:",
        test.questions.map((q: any) => q.id.slice(0, 8)),
      );

      // Force shuffle with timestamp seed to ensure different order each time
      const timestamp = Date.now();
      console.log("⏰ Using timestamp seed:", timestamp);

      const questionsToDisplay = shuffleTestContent(
        test.questions,
        test.shuffleQuestions ?? false,
        test.shuffleAnswers ?? false,
      );

      console.log("✅ Shuffle complete!");
      console.log("🔀 Shuffle settings:", {
        shuffleQuestions: test.shuffleQuestions,
        shuffleAnswers: test.shuffleAnswers,
      });
      console.log(
        "📋 New order:",
        questionsToDisplay.map((q: any) => q.id.slice(0, 8)),
      );
      console.log(
        "🎲 Order changed:",
        JSON.stringify(test.questions.map((q: any) => q.id)) !==
          JSON.stringify(questionsToDisplay.map((q: any) => q.id)),
      );

      setDisplayQuestions(questionsToDisplay);

      // Initialize user answers based on shuffled questions
      setUserAnswers(
        questionsToDisplay.map((q) => ({
          questionId: q.id,
          selectedAnswerIds: [],
          essayAnswer: "",
        })),
      );
    }
  }, [test, displayQuestions.length]);

  const questions = displayQuestions.length > 0 ? displayQuestions : [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const attemptNumber = (previousResults?.[0]?.attemptNumber ?? 0) + 1;

  // Check if max attempts reached
  const maxAttemptsReached =
    test?.maxAttempts &&
    previousResults &&
    previousResults.length >= test.maxAttempts;

  // Handle answer selection
  const handleAnswerChange = (answerId: string, checked: boolean) => {
    if (!currentQuestion) return;

    setUserAnswers((prev) => {
      const updated = [...prev];
      const answerIndex = updated.findIndex(
        (a) => a.questionId === currentQuestion.id,
      );

      if (answerIndex === -1) return prev;

      if (currentQuestion.questionType === "SINGLE_CHOICE") {
        // Single choice - replace with new selection
        updated[answerIndex] = {
          ...updated[answerIndex],
          selectedAnswerIds: checked ? [answerId] : [],
        };
      } else if (currentQuestion.questionType === "MULTIPLE_CHOICE") {
        // Multiple choice - toggle selection
        const currentIds = updated[answerIndex].selectedAnswerIds;
        updated[answerIndex] = {
          ...updated[answerIndex],
          selectedAnswerIds: checked
            ? [...currentIds, answerId]
            : currentIds.filter((id) => id !== answerId),
        };
      }

      return updated;
    });
  };

  const handleEssayChange = (value: string) => {
    if (!currentQuestion) return;

    setUserAnswers((prev) => {
      const updated = [...prev];
      const answerIndex = updated.findIndex(
        (a) => a.questionId === currentQuestion.id,
      );

      if (answerIndex === -1) return prev;

      updated[answerIndex] = {
        ...updated[answerIndex],
        essayAnswer: value,
      };

      return updated;
    });
  };

  // Get current question's selected answers
  const getCurrentAnswers = () => {
    const answer = userAnswers.find(
      (a) => a.questionId === currentQuestion?.id,
    );
    return answer?.selectedAnswerIds ?? [];
  };

  const getCurrentEssayAnswer = () => {
    const answer = userAnswers.find(
      (a) => a.questionId === currentQuestion?.id,
    );
    return answer?.essayAnswer ?? "";
  };

  // Calculate score
  const calculateScore = () => {
    // If there are essay questions, we can't calculate score immediately
    const hasEssay = questions.some((q) => q.questionType === "ESSAY");
    if (hasEssay) return null;

    let correctCount = 0;

    questions.forEach((question: any) => {
      const userAnswer = userAnswers.find((a) => a.questionId === question.id);
      const selectedIds = userAnswer?.selectedAnswerIds ?? [];
      const correctAnswers =
        question.answers?.filter((a: any) => a.correct) ?? [];
      const correctIds = correctAnswers.map((a: any) => a.id);

      // Check if answer is correct
      const isCorrect =
        selectedIds.length === correctIds.length &&
        selectedIds.every((id) => correctIds.includes(id));

      if (isCorrect) correctCount++;
    });

    // Use test's maxScore (default 10)
    const maxScore = test?.maxScore || 10;
    const score = (correctCount / totalQuestions) * maxScore;

    // Round to 1 decimal place
    return Math.round(score * 10) / 10;
  };

  // Submit test
  const handleSubmit = async () => {
    // Validation first - before any processing
    if (!userId) {
      return;
    }
    if (!componentId) {
      message.error("Không tìm thấy thông tin bài kiểm tra!");
      return;
    }
    if (!testId) {
      message.error("Không tìm thấy ID bài kiểm tra!");
      return;
    }
    if (!test) {
      message.error("Dữ liệu bài kiểm tra không hợp lệ!");
      return;
    }
    if (questions.length === 0) {
      message.error("Bài kiểm tra không có câu hỏi!");
      return;
    }

    setIsSubmitting(true);

    try {
      const mark = calculateScore();
      const maxScore = test?.maxScore || 10;
      const passScore = test?.passScore || maxScore / 2;

      let status: "PASSED" | "FAILED" | "PENDING" = "PENDING";

      if (mark !== null) {
        status = mark >= passScore ? "PASSED" : "FAILED";
      }

      // Convert userAnswers to proper format for database
      console.log("Processing user answers:", { userAnswers, questions });

      const formattedAnswers: Record<string, string | string[]> = {};
      userAnswers.forEach((answer) => {
        if (!answer.questionId) {
          console.warn("Answer missing questionId:", answer);
          return;
        }

        const question = questions.find((q) => q.id === answer.questionId);
        if (!question) {
          console.warn("Question not found for answer:", answer.questionId);
          return;
        }

        if (question.questionType === "ESSAY") {
          // For essay questions, save the essay answer text
          formattedAnswers[answer.questionId] = answer.essayAnswer || "";
        } else {
          // For multiple choice questions, save selected answer IDs
          formattedAnswers[answer.questionId] = answer.selectedAnswerIds || [];
        }
      });

      console.log("Formatted answers:", formattedAnswers);

      // Ensure all required fields are present and valid
      if (!userId || !componentId || attemptNumber < 1) {
        throw new Error(
          "Missing required fields: userId, componentId, or invalid attemptNumber",
        );
      }

      const finalMark = mark ?? 0;
      const submitData = {
        userId,
        componentId,
        attemptNumber,
        userAnswers: formattedAnswers,
        mark: Math.max(0, Math.round(finalMark)), // Ensure non-negative integer
        status,
      };

      console.log("Submitting test result:", submitData);

      // Validate the data structure before submission
      if (Object.keys(formattedAnswers).length === 0) {
        console.warn("No answers to submit, but proceeding anyway");
      }

      await createTestResult.mutateAsync({
        data: submitData,
      });

      message.success("Nộp bài thành công!");

      // Navigate to results page
      router.push(
        `/user/tests/${testId}/result?componentId=${componentId}&attemptNumber=${attemptNumber}&lessonId=${lessonId}&courseId=${courseId}`,
      );
    } catch (error) {
      console.error("Submit error:", error);

      // More specific error messages
      if (error && typeof error === "object" && "message" in error) {
        const errorMessage = (error as any).message;
        if (errorMessage.includes("required")) {
          message.error("Thiếu thông tin bắt buộc. Vui lòng kiểm tra lại!");
        } else if (errorMessage.includes("validation")) {
          message.error("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại!");
        } else {
          message.error(`Lỗi nộp bài: ${errorMessage}`);
        }
      } else {
        message.error("Có lỗi xảy ra khi nộp bài! Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  // Navigation handlers
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  };

  const goNext = () => goToQuestion(currentQuestionIndex + 1);
  const goPrev = () => goToQuestion(currentQuestionIndex - 1);

  // Count answered questions
  const answeredCount = userAnswers.filter((a) => {
    const question = questions.find((q) => q.id === a.questionId);
    if (question?.questionType === "ESSAY") {
      return a.essayAnswer && a.essayAnswer.trim().length > 0;
    } else {
      return a.selectedAnswerIds.length > 0;
    }
  }).length;

  if (testLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải bài kiểm tra...">
          <div style={{ minHeight: 50, minWidth: 100 }} />
        </Spin>
      </div>
    );
  }

  if (testError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải bài kiểm tra"
        description="Vui lòng thử lại sau."
      />
    );
  }

  if (!test) {
    return <Empty description="Không tìm thấy bài kiểm tra." />;
  }

  if (maxAttemptsReached) {
    return (
      <Card>
        <Alert
          type="warning"
          showIcon
          icon={<AlertCircle size={20} />}
          message="Đã hết lượt làm bài"
          description={`Bạn đã sử dụng hết ${test.maxAttempts} lần làm bài cho bài kiểm tra này.`}
          action={
            <Button type="primary" onClick={() => router.back()}>
              Quay lại
            </Button>
          }
        />
      </Card>
    );
  }

  if (questions.length === 0) {
    return <Empty description="Bài kiểm tra chưa có câu hỏi." />;
  }

  const selectedAnswers = getCurrentAnswers();
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header */}
        <Card>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Space direction="vertical" size={4}>
                <Title level={3} style={{ margin: 0 }}>
                  {test.name}
                </Title>
                <Space size={8} wrap>
                  <Tag color="blue">Lần thử {attemptNumber}</Tag>
                  <Tag color="purple">
                    Câu {currentQuestionIndex + 1}/{totalQuestions}
                  </Tag>
                </Space>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Row gutter={16}>
                <Col span={12}>
                  <Card
                    size="small"
                    variant="borderless"
                    className="bg-blue-50"
                  >
                    <Statistic
                      title="Đã trả lời"
                      value={answeredCount}
                      suffix={`/ ${totalQuestions}`}
                    />
                    <Progress
                      percent={progress}
                      size="small"
                      status="active"
                      style={{ marginTop: 8 }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    size="small"
                    variant="borderless"
                    className={timeLeft < 60 ? "bg-red-50" : "bg-green-50"}
                  >
                    <Statistic
                      title="Thời gian còn lại"
                      value={timeLeft}
                      prefix={<Clock size={20} />}
                      formatter={(value) => {
                        const mins = Math.floor(Number(value) / 60);
                        const secs = Number(value) % 60;
                        return `${mins}:${secs.toString().padStart(2, "0")}`;
                      }}
                      valueStyle={{
                        color: timeLeft < 60 ? "#cf1322" : "#3f8600",
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Question */}
        <Card>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <div>
              <Tag color="geekblue" style={{ marginBottom: 12 }}>
                {currentQuestion.questionType === "SINGLE_CHOICE"
                  ? "Chọn 1 đáp án đúng"
                  : currentQuestion.questionType === "MULTIPLE_CHOICE"
                    ? "Chọn các đáp án đúng"
                    : `Tự luận (Tối đa ${
                        currentQuestion.maxLength || 1000
                      } ký tự)`}
              </Tag>
              <Title level={4} style={{ marginBottom: 0 }}>
                Câu {currentQuestionIndex + 1}: {currentQuestion.content}
              </Title>
            </div>

            {/* Media Display - Enhanced with Ant Design Components */}
            {currentQuestion.mediaFiles &&
              currentQuestion.mediaFiles.length > 0 && (
                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        currentQuestion.mediaFiles.length === 1
                          ? "1fr"
                          : "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {currentQuestion.mediaFiles.map(
                      (media: any, index: number) => (
                        <Card
                          key={index}
                          size="small"
                          variant="outlined"
                          style={{ overflow: "hidden" }}
                          styles={{ body: { padding: 0 } }}
                        >
                          {media.fileType.startsWith("image/") && (
                            <Image
                              src={media.fileUrl}
                              alt={media.fileName}
                              style={{
                                width: "100%",
                                height: "auto",
                                maxHeight: 300,
                                objectFit: "contain",
                              }}
                              preview={{
                                mask: "Xem ảnh",
                                maskClassName: "custom-mask",
                              }}
                              placeholder={
                                <div
                                  style={{
                                    width: "100%",
                                    height: 200,
                                    backgroundColor: "#f5f5f5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Spin />
                                </div>
                              }
                            />
                          )}
                          {media.fileType.startsWith("video/") && (
                            <div style={{ position: "relative" }}>
                              <video
                                src={media.fileUrl}
                                controls
                                controlsList="nodownload"
                                preload="metadata"
                                style={{
                                  width: "100%",
                                  height: "auto",
                                  maxHeight: 300,
                                  display: "block",
                                }}
                                onContextMenu={(e) => e.preventDefault()}
                              >
                                <source src={media.fileUrl} />
                                Trình duyệt không hỗ trợ video.
                              </video>
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 8,
                                  right: 8,
                                  background: "rgba(0,0,0,0.6)",
                                  color: "white",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  fontSize: 12,
                                }}
                              >
                                Video
                              </div>
                            </div>
                          )}
                          {media.fileType.startsWith("audio/") && (
                            <div style={{ padding: 16, textAlign: "center" }}>
                              <div style={{ marginBottom: 12 }}>
                                <Tag color="green">Audio</Tag>
                              </div>
                              <audio
                                src={media.fileUrl}
                                controls
                                controlsList="nodownload"
                                preload="metadata"
                                style={{ width: "100%", maxWidth: 300 }}
                                onContextMenu={(e) => e.preventDefault()}
                              >
                                <source src={media.fileUrl} />
                                Trình duyệt không hỗ trợ audio.
                              </audio>
                              <div
                                style={{
                                  marginTop: 8,
                                  fontSize: 12,
                                  color: "#666",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {media.fileName}
                              </div>
                            </div>
                          )}
                        </Card>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* Answers */}
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {currentQuestion.questionType === "SINGLE_CHOICE" ? (
                <Radio.Group
                  value={selectedAnswers[0] || null}
                  onChange={(e) => handleAnswerChange(e.target.value, true)}
                  style={{ width: "100%" }}
                >
                  <Space
                    direction="vertical"
                    size={12}
                    style={{ width: "100%" }}
                  >
                    {currentQuestion.answers?.map(
                      (answer: any, idx: number) => (
                        <Card
                          key={answer.id}
                          size="small"
                          hoverable
                          style={{
                            backgroundColor: selectedAnswers.includes(answer.id)
                              ? "#e6f4ff"
                              : "white",
                            border: selectedAnswers.includes(answer.id)
                              ? "2px solid #1890ff"
                              : "1px solid #d9d9d9",
                            cursor: "pointer",
                          }}
                          onClick={() => handleAnswerChange(answer.id, true)}
                        >
                          <Radio value={answer.id}>
                            <Text strong>
                              {String.fromCharCode(65 + idx)}.{" "}
                            </Text>
                            {answer.content}
                          </Radio>
                        </Card>
                      ),
                    )}
                  </Space>
                </Radio.Group>
              ) : (
                <Checkbox.Group
                  value={selectedAnswers}
                  style={{ width: "100%" }}
                >
                  <Space
                    direction="vertical"
                    size={12}
                    style={{ width: "100%" }}
                  >
                    {currentQuestion.answers?.map(
                      (answer: any, idx: number) => (
                        <Card
                          key={answer.id}
                          size="small"
                          hoverable
                          style={{
                            backgroundColor: selectedAnswers.includes(answer.id)
                              ? "#e6f4ff"
                              : "white",
                            border: selectedAnswers.includes(answer.id)
                              ? "2px solid #1890ff"
                              : "1px solid #d9d9d9",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            handleAnswerChange(
                              answer.id,
                              !selectedAnswers.includes(answer.id),
                            )
                          }
                        >
                          <Checkbox value={answer.id}>
                            <Text strong>
                              {String.fromCharCode(65 + idx)}.{" "}
                            </Text>
                            {answer.content}
                          </Checkbox>
                        </Card>
                      ),
                    )}
                  </Space>
                </Checkbox.Group>
              )}

              {currentQuestion.questionType === "ESSAY" && (
                <Input.TextArea
                  rows={8}
                  maxLength={currentQuestion.maxLength || 1000}
                  showCount
                  placeholder="Nhập câu trả lời của bạn..."
                  value={getCurrentEssayAnswer()}
                  onChange={(e) => handleEssayChange(e.target.value)}
                  style={{ fontSize: 16 }}
                />
              )}
            </Space>
          </Space>
        </Card>

        {/* Navigation */}
        <Card>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Space size={8} wrap>
                {questions.map((question, idx) => {
                  const userAnswer = userAnswers[idx];
                  const isAnswered =
                    question.questionType === "ESSAY"
                      ? userAnswer?.essayAnswer &&
                        userAnswer.essayAnswer.trim().length > 0
                      : userAnswer?.selectedAnswerIds.length > 0;
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <Button
                      key={idx}
                      type={
                        isCurrent
                          ? "primary"
                          : isAnswered
                            ? "default"
                            : "dashed"
                      }
                      onClick={() => goToQuestion(idx)}
                      icon={
                        isAnswered && !isCurrent ? (
                          <CheckCircle size={14} />
                        ) : null
                      }
                      style={{
                        minWidth: 44,
                        backgroundColor:
                          isAnswered && !isCurrent ? "#f6ffed" : undefined,
                        borderColor:
                          isAnswered && !isCurrent ? "#b7eb8f" : undefined,
                      }}
                    >
                      {idx + 1}
                    </Button>
                  );
                })}
              </Space>
            </Col>
            <Col span={24}>
              <Row justify="space-between" align="middle" gutter={[16, 16]}>
                <Col xs={24} sm="auto">
                  <Button
                    onClick={() => {
                      if (lessonId && courseId) {
                        router.push(
                          `/user/courses/${courseId}/lessons/${lessonId}`,
                        );
                      } else {
                        router.back();
                      }
                    }}
                    icon={<ArrowLeft size={16} />}
                    block={true}
                    className="w-full sm:w-auto"
                  >
                    Thoát
                  </Button>
                </Col>
                <Col xs={24} sm="auto">
                  <div className="flex justify-between sm:justify-end gap-3">
                    <Button
                      onClick={goPrev}
                      disabled={currentQuestionIndex === 0}
                      icon={<ArrowLeft size={16} />}
                      className="flex-1 sm:flex-none"
                    >
                      Câu trước
                    </Button>
                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <Button
                        type="primary"
                        onClick={goNext}
                        icon={<ArrowRight size={16} />}
                        iconPosition="end"
                        className="flex-1 sm:flex-none"
                      >
                        Câu tiếp
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        onClick={() => {
                          console.log("Submit button clicked", {
                            userId,
                            componentId,
                            testId,
                            userAnswers: userAnswers.length,
                          });
                          setShowSubmitConfirm(true);
                        }}
                        icon={<Send size={16} />}
                        disabled={!userId || !componentId || !testId}
                        style={{
                          background:
                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          border: "none",
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        Nộp bài
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </Space>

      {/* Submit Confirmation Modal */}
      <Modal
        title="Xác nhận nộp bài"
        open={showSubmitConfirm}
        onOk={handleSubmit}
        onCancel={() => setShowSubmitConfirm(false)}
        okText="Nộp bài"
        cancelText="Kiểm tra lại"
        confirmLoading={isSubmitting}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            message={
              <div>
                <div>
                  Bạn đã trả lời <strong>{answeredCount}</strong> /{" "}
                  {totalQuestions} câu hỏi
                </div>
                {answeredCount < totalQuestions && (
                  <div style={{ color: "#faad14", marginTop: 8 }}>
                    Còn <strong>{totalQuestions - answeredCount}</strong> câu
                    chưa trả lời!
                  </div>
                )}
              </div>
            }
          />
          <Paragraph>
            Sau khi nộp bài, bạn sẽ không thể chỉnh sửa câu trả lời. Bạn có chắc
            chắn muốn nộp bài không?
          </Paragraph>
        </Space>
      </Modal>
    </div>
  );
}
