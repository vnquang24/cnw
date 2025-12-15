"use client";

import { useMemo } from "react";
import {
  Modal,
  Descriptions,
  Card,
  Tag,
  Space,
  Divider,
  Typography,
  Spin,
  Empty,
} from "antd";
import { CheckCircle2, XCircle, FileText } from "lucide-react";
import { useFindUniqueTestResult } from "@/generated/hooks";
import { StatusTag } from "@/components/ui/status-tag";

const { Title, Text } = Typography;

interface AnswerReviewModalProps {
  resultId: string | null;
  open: boolean;
  onClose: () => void;
}

interface Answer {
  id: string;
  content: string;
  correct: boolean;
}

interface Question {
  id: string;
  content: string;
  questionType: string;
  answers: Answer[];
}

export default function AnswerReviewModal({
  resultId,
  open,
  onClose,
}: AnswerReviewModalProps) {
  // Fetch test result with all related data
  const { data: testResult, isLoading } = useFindUniqueTestResult(
    {
      where: { id: resultId || "" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        component: {
          include: {
            test: {
              include: {
                questions: {
                  include: {
                    answers: true,
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
            lesson: {
              select: {
                title: true,
                course: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      enabled: !!resultId && open,
    },
  );

  // Parse user answers from JSON
  const userAnswersMap = useMemo(() => {
    if (!testResult?.userAnswers) return new Map();

    try {
      const answers = testResult.userAnswers as Record<
        string,
        string | string[]
      >;
      return new Map(Object.entries(answers));
    } catch (error) {
      console.error("Error parsing user answers:", error);
      return new Map();
    }
  }, [testResult?.userAnswers]);

  // Process questions with user answers
  const questionsWithAnswers = useMemo(() => {
    if (!testResult?.component?.test?.questions) return [];

    return testResult.component.test.questions.map(
      (question: Question, index: number) => {
        const userAnswer = userAnswersMap.get(question.id);
        // Handle undefined/null userAnswer properly
        const userAnswerIds = !userAnswer
          ? []
          : Array.isArray(userAnswer)
            ? userAnswer.filter((id) => id) // Remove any undefined/null from array
            : [userAnswer].filter((id) => id); // Wrap single value and filter

        const correctAnswers = question.answers.filter((a) => a.correct);
        const correctAnswerIds = correctAnswers.map((a) => a.id);

        // Check if answer is correct
        let isCorrect: boolean | null = false;
        if (question.questionType === "ESSAY") {
          // For essay questions, we can't determine correctness automatically
          isCorrect = null;
        } else if (question.questionType === "SINGLE_CHOICE") {
          isCorrect =
            userAnswerIds.length === 1 &&
            correctAnswerIds.includes(userAnswerIds[0]);
        } else {
          // MULTIPLE_CHOICE
          isCorrect =
            userAnswerIds.length === correctAnswerIds.length &&
            userAnswerIds.every((id) => correctAnswerIds.includes(id));
        }

        return {
          ...question,
          questionNumber: index + 1,
          userAnswerIds,
          correctAnswerIds,
          isCorrect,
        };
      },
    );
  }, [testResult, userAnswersMap]);

  const renderAnswerOption = (
    answer: Answer,
    isUserAnswer: boolean,
    isCorrectAnswer: boolean,
  ) => {
    let backgroundColor = "#fff";
    let borderColor = "#d9d9d9";
    let borderWidth = 1;
    let icon = null;
    let badge = null;

    if (isUserAnswer && isCorrectAnswer) {
      // User selected correct answer
      backgroundColor = "#f6ffed";
      borderColor = "#52c41a";
      borderWidth = 2;
      icon = <CheckCircle2 size={18} color="#52c41a" />;
      badge = (
        <StatusTag
          status="success"
          icon={<CheckCircle2 size={14} />}
          text="Đã chọn"
          minWidth={80}
        />
      );
    } else if (isUserAnswer && !isCorrectAnswer) {
      // User selected wrong answer
      backgroundColor = "#fff1f0";
      borderColor = "#ff4d4f";
      borderWidth = 2;
      icon = <XCircle size={18} color="#ff4d4f" />;
      badge = (
        <StatusTag
          status="error"
          icon={<XCircle size={14} />}
          text="Đã chọn"
          minWidth={80}
        />
      );
    } else if (!isUserAnswer && isCorrectAnswer) {
      // Correct answer not selected by user - ALWAYS show this
      backgroundColor = "#f0f9ff";
      borderColor = "#1890ff";
      borderWidth = 2;
      icon = <CheckCircle2 size={18} color="#1890ff" />;
      badge = (
        <StatusTag
          status="success"
          icon={<CheckCircle2 size={14} />}
          text="Đáp án đúng"
          minWidth={95}
        />
      );
    }

    return (
      <div
        key={answer.id}
        style={{
          padding: "10px 14px",
          marginBottom: 8,
          border: `${borderWidth}px solid ${borderColor}`,
          borderRadius: 6,
          backgroundColor,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {icon}
        <Text style={{ flex: 1, fontSize: 14 }}>{answer.content}</Text>
        {badge}
      </div>
    );
  };

  return (
    <Modal
      title="Chi tiết bài làm"
      open={open}
      onCancel={onClose}
      width="80%"
      footer={null}
      style={{ top: 20 }}
    >
      <Spin spinning={isLoading}>
        {testResult ? (
          <>
            {/* Student and Test Info */}
            <Card style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Học sinh">
                  <Space>
                    <FileText size={16} />
                    <Text strong>{testResult.user?.name || "N/A"}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Bài kiểm tra">
                  {testResult.component?.test?.name || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Khóa học - Bài học">
                  {testResult.component?.lesson?.course?.title} -{" "}
                  {testResult.component?.lesson?.title}
                </Descriptions.Item>
                <Descriptions.Item label="Lần làm">
                  <Tag color="blue">Lần {testResult.attemptNumber}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Điểm">
                  <Text
                    strong
                    style={{
                      color:
                        testResult.mark >= 8
                          ? "#52c41a"
                          : testResult.mark >= 6
                            ? "#fa8c16"
                            : "#ff4d4f",
                      fontSize: 18,
                    }}
                  >
                    {testResult.mark}/10
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <StatusTag
                    status={
                      testResult.status === "PASSED" ? "success" : "error"
                    }
                    icon={
                      testResult.status === "PASSED" ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )
                    }
                    text={testResult.status === "PASSED" ? "Đạt" : "Không đạt"}
                  />
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Compact Legend */}
            <div
              style={{
                marginBottom: 16,
                padding: "8px 12px",
                background: "#f0f5ff",
                borderRadius: 6,
                border: "1px solid #d6e4ff",
              }}
            >
              <Space size="large" wrap>
                <Space size="small">
                  <CheckCircle2 size={14} color="#52c41a" />
                  <Text style={{ fontSize: 13 }}>Đúng</Text>
                </Space>
                <Space size="small">
                  <XCircle size={14} color="#ff4d4f" />
                  <Text style={{ fontSize: 13 }}>Sai</Text>
                </Space>
                <Space size="small">
                  <CheckCircle2 size={14} color="#1890ff" />
                  <Text style={{ fontSize: 13 }}>Đáp án đúng</Text>
                </Space>
              </Space>
            </div>

            {/* Questions and Answers */}
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {questionsWithAnswers.length > 0 ? (
                questionsWithAnswers.map((question: any) => (
                  <Card
                    key={question.id}
                    style={{ marginBottom: 16 }}
                    title={
                      <Space>
                        <Text strong style={{ fontSize: 15 }}>
                          Câu {question.questionNumber}
                        </Text>
                        {question.questionType === "ESSAY" ? (
                          <StatusTag
                            status="info"
                            icon={<FileText size={14} />}
                            text="Tự luận"
                            minWidth={70}
                          />
                        ) : (
                          <StatusTag
                            status={question.isCorrect ? "success" : "error"}
                            icon={
                              question.isCorrect ? (
                                <CheckCircle2 size={14} />
                              ) : (
                                <XCircle size={14} />
                              )
                            }
                            text={question.isCorrect ? "Đúng" : "Sai"}
                            minWidth={70}
                          />
                        )}
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {question.questionType === "SINGLE_CHOICE"
                            ? "(Một đáp án)"
                            : question.questionType === "MULTIPLE_CHOICE"
                              ? "(Nhiều đáp án)"
                              : "(Tự luận)"}
                        </Text>
                      </Space>
                    }
                  >
                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ fontSize: 16 }}>
                        {question.content}
                      </Text>
                    </div>
                    <Divider style={{ margin: "12px 0" }} />
                    <div>
                      {question.questionType === "ESSAY" ? (
                        <div
                          style={{
                            padding: "16px",
                            backgroundColor: "#f0f9ff",
                            borderRadius: 8,
                            border: "1px solid #bae6fd",
                          }}
                        >
                          <Text
                            type="secondary"
                            style={{ display: "block", marginBottom: 8 }}
                          >
                            Bài làm của học sinh:
                          </Text>
                          <Text
                            style={{ whiteSpace: "pre-wrap", fontSize: 14 }}
                          >
                            {userAnswersMap.get(question.id) || (
                              <Text type="secondary" italic>
                                Không có câu trả lời
                              </Text>
                            )}
                          </Text>
                        </div>
                      ) : (
                        question.answers.map((answer: Answer) =>
                          renderAnswerOption(
                            answer,
                            question.userAnswerIds.includes(answer.id),
                            question.correctAnswerIds.includes(answer.id),
                          ),
                        )
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <Empty description="Không có câu hỏi nào" />
              )}
            </div>
          </>
        ) : (
          <Empty description="Không tìm thấy kết quả bài kiểm tra" />
        )}
      </Spin>
    </Modal>
  );
}
