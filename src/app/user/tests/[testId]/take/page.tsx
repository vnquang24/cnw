"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Button,
  Card,
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
import {
  useFindUniqueTest,
  useFindManyTestResult,
  useCreateTestResult,
} from "@/generated/hooks";
import { getUserId } from "@/lib/auth";

const { Title, Text, Paragraph } = Typography;
const { Countdown } = Statistic;

interface UserAnswer {
  questionId: string;
  selectedAnswerIds: string[];
}

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
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  // Fetch test data with questions and answers
  const testArgs = useMemo(
    () => ({
      where: { id: testId ?? "" },
      include: {
        questions: {
          include: {
            answers: true,
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
        message.warning("Hết giờ! Bài làm sẽ được tự động nộp.");
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

  // Initialize user answers array
  useEffect(() => {
    if (test?.questions) {
      setUserAnswers(
        test.questions.map((q) => ({
          questionId: q.id,
          selectedAnswerIds: [],
        })),
      );
    }
  }, [test?.questions]);

  const questions = test?.questions ?? [];
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
      } else {
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

  // Get current question's selected answers
  const getCurrentAnswers = () => {
    const answer = userAnswers.find(
      (a) => a.questionId === currentQuestion?.id,
    );
    return answer?.selectedAnswerIds ?? [];
  };

  // Calculate score
  const calculateScore = () => {
    let correctCount = 0;

    questions.forEach((question) => {
      const userAnswer = userAnswers.find((a) => a.questionId === question.id);
      const selectedIds = userAnswer?.selectedAnswerIds ?? [];
      const correctAnswers = question.answers?.filter((a) => a.correct) ?? [];
      const correctIds = correctAnswers.map((a) => a.id);

      // Check if answer is correct
      const isCorrect =
        selectedIds.length === correctIds.length &&
        selectedIds.every((id) => correctIds.includes(id));

      if (isCorrect) correctCount++;
    });

    return Math.round((correctCount / totalQuestions) * 100);
  };

  // Submit test
  const handleSubmit = async () => {
    if (!userId || !componentId || !testId) {
      message.error("Thiếu thông tin để nộp bài!");
      return;
    }

    setIsSubmitting(true);

    try {
      const mark = calculateScore();
      const status = mark >= 50 ? "PASSED" : "FAILED";

      await createTestResult.mutateAsync({
        data: {
          userId,
          componentId,
          attemptNumber,
          userAnswers: userAnswers as any,
          mark,
          status,
        },
      });

      message.success("Nộp bài thành công!");

      // Navigate to results page
      router.push(
        `/user/tests/${testId}/result?componentId=${componentId}&attemptNumber=${attemptNumber}&lessonId=${lessonId}&courseId=${courseId}`,
      );
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Có lỗi xảy ra khi nộp bài!");
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
  const answeredCount = userAnswers.filter(
    (a) => a.selectedAnswerIds.length > 0,
  ).length;

  if (testLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải bài kiểm tra..." />
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
                  <Card size="small" bordered={false} className="bg-blue-50">
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
                    bordered={false}
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
                  : "Chọn các đáp án đúng"}
              </Tag>
              <Title level={4} style={{ marginBottom: 0 }}>
                Câu {currentQuestionIndex + 1}: {currentQuestion.content}
              </Title>
            </div>

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
                    {currentQuestion.answers?.map((answer, idx) => (
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
                          <Text strong>{String.fromCharCode(65 + idx)}. </Text>
                          {answer.content}
                        </Radio>
                      </Card>
                    ))}
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
                    {currentQuestion.answers?.map((answer, idx) => (
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
                          <Text strong>{String.fromCharCode(65 + idx)}. </Text>
                          {answer.content}
                        </Checkbox>
                      </Card>
                    ))}
                  </Space>
                </Checkbox.Group>
              )}
            </Space>
          </Space>
        </Card>

        {/* Navigation */}
        <Card>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Space size={8} wrap>
                {questions.map((_, idx) => {
                  const isAnswered =
                    userAnswers[idx]?.selectedAnswerIds.length > 0;
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
              <Row justify="space-between" align="middle">
                <Col>
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
                  >
                    Thoát
                  </Button>
                </Col>
                <Col>
                  <Space size={12}>
                    <Button
                      onClick={goPrev}
                      disabled={currentQuestionIndex === 0}
                      icon={<ArrowLeft size={16} />}
                    >
                      Câu trước
                    </Button>
                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <Button
                        type="primary"
                        onClick={goNext}
                        icon={<ArrowRight size={16} />}
                        iconPosition="end"
                      >
                        Câu tiếp
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        onClick={() => setShowSubmitConfirm(true)}
                        icon={<Send size={16} />}
                        style={{
                          background:
                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          border: "none",
                        }}
                      >
                        Nộp bài
                      </Button>
                    )}
                  </Space>
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
