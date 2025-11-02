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
  Statistic,
  Tag,
  Typography,
  Divider,
} from "antd";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Trophy,
  RotateCcw,
  Home,
} from "lucide-react";
import { useFindUniqueTest, useFindFirstTestResult } from "@/generated/hooks";
import { getUserId } from "@/lib/auth";

const { Title, Text, Paragraph } = Typography;

interface UserAnswer {
  questionId: string;
  selectedAnswerIds: string[];
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

  const userAnswers = (result?.userAnswers as unknown as UserAnswer[]) ?? [];
  const questions = test?.questions ?? [];
  const isPassed = result?.status === "PASSED";

  // Calculate statistics
  const correctCount = useMemo(() => {
    let count = 0;
    questions.forEach((question) => {
      const userAnswer = userAnswers.find((a) => a.questionId === question.id);
      const selectedIds = userAnswer?.selectedAnswerIds ?? [];
      const correctAnswers = question.answers?.filter((a) => a.correct) ?? [];
      const correctIds = correctAnswers.map((a) => a.id);

      const isCorrect =
        selectedIds.length === correctIds.length &&
        selectedIds.every((id) => correctIds.includes(id));

      if (isCorrect) count++;
    });
    return count;
  }, [questions, userAnswers]);

  const incorrectCount = questions.length - correctCount;

  if (testLoading || resultLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải kết quả..." />
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
                  color={isPassed ? "green" : "red"}
                  style={{ fontSize: 16, padding: "4px 12px" }}
                >
                  {isPassed ? "ĐẠT" : "CHƯA ĐẠT"}
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
                  background: isPassed
                    ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                    : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                  border: "none",
                  textAlign: "center",
                }}
              >
                <Space direction="vertical" size={8} align="center">
                  {isPassed ? (
                    <Trophy size={48} color="#10b981" />
                  ) : (
                    <RotateCcw size={48} color="#ef4444" />
                  )}
                  <Statistic
                    title="Điểm số"
                    value={result.mark}
                    suffix="/ 100"
                    valueStyle={{
                      color: isPassed ? "#10b981" : "#ef4444",
                      fontSize: 48,
                      fontWeight: "bold",
                    }}
                  />
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Statistics */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card>
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
            <Card>
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
            <Card>
              <Statistic
                title="Tỷ lệ đúng"
                value={Math.round((correctCount / questions.length) * 100)}
                suffix="%"
                valueStyle={{ color: isPassed ? "#10b981" : "#ef4444" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Detailed Answers */}
        <Card title="Chi tiết bài làm">
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            {questions.map((question, qIdx) => {
              const userAnswer = userAnswers.find(
                (a) => a.questionId === question.id,
              );
              const selectedIds = userAnswer?.selectedAnswerIds ?? [];
              const correctAnswers =
                question.answers?.filter((a) => a.correct) ?? [];
              const correctIds = correctAnswers.map((a) => a.id);

              const isCorrect =
                selectedIds.length === correctIds.length &&
                selectedIds.every((id) => correctIds.includes(id));

              return (
                <Card
                  key={question.id}
                  size="small"
                  style={{
                    backgroundColor: isCorrect ? "#f6ffed" : "#fff2e8",
                    border: isCorrect
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
                      {isCorrect ? (
                        <CheckCircle size={20} color="#52c41a" />
                      ) : (
                        <XCircle size={20} color="#fa8c16" />
                      )}
                      <div style={{ flex: 1 }}>
                        <Tag
                          color={isCorrect ? "success" : "warning"}
                          style={{ marginBottom: 8 }}
                        >
                          {isCorrect ? "Đúng" : "Sai"}
                        </Tag>
                        <Title level={5} style={{ margin: 0 }}>
                          Câu {qIdx + 1}: {question.content}
                        </Title>
                        <Text type="secondary">
                          {question.questionType === "SINGLE_CHOICE"
                            ? "Chọn 1 đáp án"
                            : "Chọn nhiều đáp án"}
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
                      {question.answers?.map((answer, aIdx) => {
                        const isSelected = selectedIds.includes(answer.id);
                        const isCorrectAnswer = answer.correct;
                        const showAsCorrect = isCorrectAnswer;
                        const showAsWrong = isSelected && !isCorrectAnswer;

                        return (
                          <div
                            key={answer.id}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 8,
                              backgroundColor: showAsCorrect
                                ? "#d1fae5"
                                : showAsWrong
                                  ? "#fee2e2"
                                  : "white",
                              border: showAsCorrect
                                ? "2px solid #10b981"
                                : showAsWrong
                                  ? "2px solid #ef4444"
                                  : "1px solid #d9d9d9",
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
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                    }}
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
