"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Spin,
  Progress,
  Statistic,
  Tag,
  Typography,
  Divider,
} from "antd";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
  Home,
  Clock,
} from "lucide-react";
import { useFindUniqueTest, useFindFirstTestResult } from "@/generated/hooks";
import { getUserId } from "@/lib/auth";

const { Title, Text, Paragraph } = Typography;

interface UserAnswer {
  questionId: string;
  selectedAnswerIds: string[];
  essayAnswer?: string;
}

export default function TestResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = params?.testId as string | undefined;
  const componentId = searchParams?.get("componentId") || "";
  const attemptNumber = Number(searchParams?.get("attemptNumber")) || 1;
  const lessonId = searchParams?.get("lessonId") || "";
  const courseId = searchParams?.get("courseId") || "";

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  // Fetch test data
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

  // Fetch test result
  const resultArgs = useMemo(
    () => ({
      where: {
        userId: userId ?? "",
        componentId: componentId,
        attemptNumber: attemptNumber,
      },
      include: {
        component: true,
      },
    }),
    [userId, componentId, attemptNumber],
  );

  const {
    data: result,
    isLoading: resultLoading,
    error: resultError,
  } = useFindFirstTestResult(resultArgs, {
    enabled: Boolean(userId && componentId),
  });

  // Parse userAnswers correctly - it's stored as Record<string, string | string[]>
  const userAnswersMap = useMemo(() => {
    try {
      const answers =
        (result?.userAnswers as Record<string, string | string[]>) ?? {};
      return answers;
    } catch (error) {
      console.error("Error parsing user answers:", error);
      return {};
    }
  }, [result?.userAnswers]);

  const questions = test?.questions ?? [];
  const isPassed = result?.status === "PASSED";
  const isPending = result?.status === "PENDING";

  // Parse feedback
  const feedbackData = useMemo(() => {
    try {
      return result?.feedback ? JSON.parse(result.feedback) : {};
    } catch (e) {
      return { overall: result?.feedback };
    }
  }, [result?.feedback]);

  // Parse question scores (new format)
  const questionScores = useMemo(() => {
    try {
      return result?.questionScores ? (result.questionScores as any) : {};
    } catch (e) {
      return {};
    }
  }, [result?.questionScores]);

  const scorePercent = useMemo(() => {
    if (isPending) return 0;
    const max = Number(test?.maxScore || 10);
    const mark = Number(result?.mark || 0);
    return Math.round((mark / max) * 100);
  }, [isPending, result?.mark, test?.maxScore]);

  // Calculate statistics
  const correctCount = useMemo(() => {
    let count = 0;
    questions.forEach((question: any) => {
      if (question.questionType === "ESSAY") {
        // Skip essay questions for auto-calculation
        return;
      }

      const userAnswer = userAnswersMap[question.id];
      const selectedIds = Array.isArray(userAnswer)
        ? userAnswer
        : userAnswer
          ? [userAnswer]
          : [];
      const correctAnswers =
        question.answers?.filter((a: any) => a.correct) ?? [];
      const correctIds = correctAnswers.map((a: any) => a.id);

      const isCorrect =
        selectedIds.length === correctIds.length &&
        selectedIds.every((id) => correctIds.includes(id));

      if (isCorrect) count++;
    });
    return count;
  }, [questions, userAnswersMap]);

  const incorrectCount = questions.length - correctCount;

  if (testLoading || resultLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải kết quả...">
          <div style={{ minHeight: 50, minWidth: 100 }} />
        </Spin>
      </div>
    );
  }

  if (testError || resultError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải kết quả"
        description="Vui lòng thử lại sau."
      />
    );
  }

  if (!test || !result) {
    return <Empty description="Không tìm thấy kết quả bài kiểm tra." />;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header - Result Summary */}
        <Card>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={12}>
              <Space direction="vertical" size={12}>
                <Tag
                  color={isPending ? "blue" : isPassed ? "green" : "red"}
                  style={{ fontSize: 16, padding: "4px 12px" }}
                >
                  {isPending ? "ĐANG CHẤM" : isPassed ? "ĐẠT" : "CHƯA ĐẠT"}
                </Tag>
                <Title level={2} style={{ margin: 0 }}>
                  {test.name}
                </Title>
                <Space size={8} wrap>
                  <Tag color="blue">Lần thử {attemptNumber}</Tag>
                  <Tag color="purple">{questions.length} câu hỏi</Tag>
                </Space>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Card
                style={{
                  background: isPending
                    ? "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)"
                    : isPassed
                      ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                      : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                  border: "none",
                  textAlign: "center",
                  borderRadius: 12,
                  boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
                }}
              >
                <Space direction="vertical" size={8} align="center">
                  {isPending ? (
                    <Clock size={48} color="#0284c7" />
                  ) : isPassed ? (
                    <Trophy size={48} color="#10b981" />
                  ) : (
                    <RotateCcw size={48} color="#ef4444" />
                  )}
                  <Statistic
                    title="Điểm số"
                    value={isPending ? "?" : result.mark}
                    suffix={`/ ${test?.maxScore || 10}`}
                    valueStyle={{
                      color: isPending
                        ? "#0284c7"
                        : isPassed
                          ? "#10b981"
                          : "#ef4444",
                      fontSize: 48,
                      fontWeight: "bold",
                    }}
                  />
                  {!isPending && (
                    <div style={{ marginTop: 8 }}>
                      <Progress
                        type="circle"
                        percent={scorePercent}
                        width={72}
                        strokeWidth={10}
                        strokeColor={
                          isPassed
                            ? { "0%": "#a7f3d0", "100%": "#10b981" }
                            : { "0%": "#fee2e2", "100%": "#ef4444" }
                        }
                      />
                    </div>
                  )}
                  {isPending && (
                    <Text type="secondary">Đang chờ giáo viên chấm điểm</Text>
                  )}
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Statistics */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card
              style={{
                borderRadius: 10,
                boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
              }}
            >
              <Statistic
                title="Câu đúng"
                value={correctCount}
                suffix={`/ ${questions.length}`}
                prefix={<CheckCircle size={24} color="#10b981" />}
                valueStyle={{ color: "#10b981" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              style={{
                borderRadius: 10,
                boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
              }}
            >
              <Statistic
                title="Câu sai"
                value={incorrectCount}
                suffix={`/ ${questions.length}`}
                prefix={<XCircle size={24} color="#ef4444" />}
                valueStyle={{ color: "#ef4444" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              style={{
                borderRadius: 10,
                boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
              }}
            >
              <Statistic
                title="Tỷ lệ đúng"
                value={Math.round((correctCount / questions.length) * 100)}
                suffix="%"
                valueStyle={{ color: isPassed ? "#10b981" : "#ef4444" }}
              />
            </Card>
          </Col>
        </Row>

        {isPending && (
          <Alert
            type="info"
            showIcon
            message="Bài làm đang chờ chấm điểm"
            description="Bài kiểm tra của bạn có câu hỏi tự luận cần được giáo viên chấm điểm thủ công. Điểm số và kết quả cuối cùng sẽ được cập nhật sau khi giáo viên chấm xong."
          />
        )}

        {/* Detailed Answers */}
        <Card title="Chi tiết bài làm">
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            {/* Overall Feedback - Displayed at top */}
            {!isPending && feedbackData.overall && (
              <Card
                style={{
                  backgroundColor: "#f0f9ff",
                  border: "1px solid #bae6fd",
                }}
              >
                <Title level={5} style={{ color: "#0284c7" }}>
                  Nhận xét chung của giáo viên:
                </Title>
                <Paragraph>{feedbackData.overall}</Paragraph>
              </Card>
            )}

            {questions.map((question: any, qIdx: number) => {
              const userAnswer = userAnswersMap[question.id];
              let selectedIds: string[] = [];
              let essayAnswer = "";

              if (question.questionType === "ESSAY") {
                essayAnswer = typeof userAnswer === "string" ? userAnswer : "";
              } else {
                selectedIds = Array.isArray(userAnswer)
                  ? userAnswer
                  : userAnswer
                    ? [userAnswer]
                    : [];
              }

              const correctAnswers =
                question.answers?.filter((a: any) => a.correct) ?? [];
              const correctIds = correctAnswers.map((a: any) => a.id);

              const isCorrect =
                question.questionType === "ESSAY"
                  ? null
                  : selectedIds.length === correctIds.length &&
                    selectedIds.every((id) => correctIds.includes(id));

              return (
                <Card
                  key={question.id}
                  size="small"
                  style={{
                    backgroundColor:
                      question.questionType === "ESSAY"
                        ? "#fff"
                        : isCorrect
                          ? "#f6ffed"
                          : "#fff2e8",
                    border:
                      question.questionType === "ESSAY"
                        ? "1px solid #d9d9d9"
                        : isCorrect
                          ? "2px solid #b7eb8f"
                          : "2px solid #ffbb96",
                  }}
                >
                  <Space
                    direction="vertical"
                    size={12}
                    style={{ width: "100%" }}
                  >
                    {/* Question Header */}
                    <Space size={8} align="start">
                      {question.questionType === "ESSAY" ? (
                        <FileText size={20} color="#1890ff" />
                      ) : isCorrect ? (
                        <CheckCircle size={20} color="#52c41a" />
                      ) : (
                        <XCircle size={20} color="#fa8c16" />
                      )}
                      <div style={{ flex: 1 }}>
                        <Tag
                          color={
                            question.questionType === "ESSAY"
                              ? "blue"
                              : isCorrect
                                ? "success"
                                : "warning"
                          }
                          style={{ marginBottom: 8 }}
                        >
                          {question.questionType === "ESSAY"
                            ? "Tự luận"
                            : isCorrect
                              ? "Đúng"
                              : "Sai"}
                        </Tag>
                        <Title level={5} style={{ margin: 0 }}>
                          Câu {qIdx + 1}: {question.content}
                        </Title>
                        <Text type="secondary">
                          {question.questionType === "SINGLE_CHOICE"
                            ? "Chọn 1 đáp án"
                            : question.questionType === "MULTIPLE_CHOICE"
                              ? "Chọn nhiều đáp án"
                              : `Tự luận (${question.points || 1} điểm)`}
                        </Text>
                      </div>
                    </Space>

                    <Divider style={{ margin: "8px 0" }} />

                    {/* Answers */}
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%", paddingLeft: 28 }}
                    >
                      {question.answers?.map((answer: any, aIdx: number) => {
                        const isSelected = selectedIds.includes(answer.id);
                        const isCorrectAnswer = answer.correct;
                        const showAsCorrect = isCorrectAnswer;
                        const showAsWrong = isSelected && !isCorrectAnswer;

                        return (
                          <div
                            key={answer.id}
                            style={{
                              padding: "10px 14px",
                              borderRadius: 10,
                              backgroundColor: showAsCorrect
                                ? "#d1fae5"
                                : showAsWrong
                                  ? "#fee2e2"
                                  : "white",
                              border: showAsCorrect
                                ? "2px solid #10b981"
                                : showAsWrong
                                  ? "2px solid #ef4444"
                                  : "1px solid #e6e6e6",
                              boxShadow: "0 4px 14px rgba(2,6,23,0.04)",
                              transition:
                                "transform 0.12s ease, box-shadow 0.12s ease",
                            }}
                            onMouseEnter={(e: any) => {
                              e.currentTarget.style.transform =
                                "translateY(-4px)";
                              e.currentTarget.style.boxShadow =
                                "0 10px 30px rgba(2,6,23,0.08)";
                            }}
                            onMouseLeave={(e: any) => {
                              e.currentTarget.style.transform = "none";
                              e.currentTarget.style.boxShadow =
                                "0 4px 14px rgba(2,6,23,0.04)";
                            }}
                          >
                            <Space size={8}>
                              {showAsCorrect && (
                                <CheckCircle size={16} color="#10b981" />
                              )}
                              {showAsWrong && (
                                <XCircle size={16} color="#ef4444" />
                              )}
                              <Text
                                strong={isSelected || isCorrectAnswer}
                                style={{
                                  color: showAsCorrect
                                    ? "#10b981"
                                    : showAsWrong
                                      ? "#ef4444"
                                      : undefined,
                                }}
                              >
                                {String.fromCharCode(65 + aIdx)}.{" "}
                                {answer.content}
                              </Text>
                              {isSelected && !isCorrectAnswer && (
                                <Tag color="error" style={{ marginLeft: 8 }}>
                                  Bạn chọn
                                </Tag>
                              )}
                              {isCorrectAnswer && !isSelected && (
                                <Tag color="success" style={{ marginLeft: 8 }}>
                                  Đáp án đúng
                                </Tag>
                              )}
                              {isCorrectAnswer && isSelected && (
                                <Tag color="success" style={{ marginLeft: 8 }}>
                                  Bạn chọn đúng
                                </Tag>
                              )}
                            </Space>
                          </div>
                        );
                      })}
                    </Space>

                    {/* Essay Answer Display */}
                    {question.questionType === "ESSAY" && (
                      <div style={{ marginTop: 16 }}>
                        <Text strong>Câu trả lời của bạn:</Text>
                        <Card
                          style={{ marginTop: 8, backgroundColor: "#fafafa" }}
                          size="small"
                        >
                          <Paragraph
                            style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}
                          >
                            {essayAnswer || "Chưa trả lời"}
                          </Paragraph>
                        </Card>
                      </div>
                    )}

                    {/* Feedback and score for all question types */}
                    {!isPending &&
                      (questionScores[question.id] ||
                        feedbackData.questions?.[question.id]) && (
                        <div style={{ marginTop: 16 }}>
                          <Alert
                            message={`Nhận xét của giáo viên - Câu ${qIdx + 1}`}
                            description={
                              <Space
                                direction="vertical"
                                style={{ width: "100%" }}
                              >
                                {(questionScores[question.id]?.feedback ||
                                  feedbackData.questions?.[question.id]
                                    ?.feedback) && (
                                  <Text>
                                    {questionScores[question.id]?.feedback ||
                                      feedbackData.questions?.[question.id]
                                        ?.feedback}
                                  </Text>
                                )}
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text
                                    strong
                                    type={
                                      (questionScores[question.id]?.score ||
                                        feedbackData.questions?.[question.id]
                                          ?.score ||
                                        0) > 0
                                        ? "success"
                                        : "danger"
                                    }
                                  >
                                    Điểm:{" "}
                                    {questionScores[question.id]?.score ||
                                      feedbackData.questions?.[question.id]
                                        ?.score ||
                                      0}
                                    /
                                    {questionScores[question.id]?.maxScore ||
                                      question.points ||
                                      1}
                                  </Text>
                                  {question.questionType !== "ESSAY" && (
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 12 }}
                                    >
                                      (Điểm tự động dựa trên đáp án{" "}
                                      {isCorrect ? "đúng" : "sai"})
                                    </Text>
                                  )}
                                </div>
                              </Space>
                            }
                            type={
                              question.questionType === "ESSAY"
                                ? "info"
                                : isCorrect
                                  ? "success"
                                  : "error"
                            }
                            showIcon
                          />
                        </div>
                      )}

                    {/* Show auto score for multiple choice even without feedback */}
                    {!isPending &&
                      question.questionType !== "ESSAY" &&
                      !questionScores[question.id] &&
                      !feedbackData.questions?.[question.id] && (
                        <div style={{ marginTop: 16 }}>
                          <Alert
                            message={`Kết quả - Câu ${qIdx + 1}`}
                            description={
                              <Text
                                strong
                                type={isCorrect ? "success" : "danger"}
                              >
                                Điểm: {isCorrect ? question.points || 1 : 0}/
                                {question.points || 1}
                              </Text>
                            }
                            type={isCorrect ? "success" : "error"}
                            showIcon
                          />
                        </div>
                      )}
                  </Space>
                </Card>
              );
            })}
          </Space>
        </Card>

        {/* Actions */}
        <Card>
          <Row justify="space-between" align="middle">
            <Col>
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => {
                  if (lessonId && courseId) {
                    router.push(
                      `/user/courses/${courseId}/lessons/${lessonId}`,
                    );
                  } else {
                    router.back();
                  }
                }}
                size="large"
              >
                Quay lại bài học
              </Button>
            </Col>
            <Col>
              <Space size={12}>
                <Button
                  icon={<Home size={16} />}
                  onClick={() => router.push("/user/dashboard")}
                  size="large"
                >
                  Trang chủ
                </Button>
                {!isPassed && test.maxAttempts > attemptNumber && (
                  <Button
                    type="primary"
                    icon={<RotateCcw size={16} />}
                    onClick={() =>
                      router.push(
                        `/user/tests/${testId}/take?componentId=${componentId}&lessonId=${lessonId}&courseId=${courseId}`,
                      )
                    }
                    size="large"
                  >
                    Làm lại
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
}
