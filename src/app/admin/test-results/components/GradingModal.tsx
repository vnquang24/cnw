"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Input,
  Button,
  Space,
  Typography,
  Divider,
  Tag,
  message,
  Card,
  Spin,
  Alert,
  Row,
  Col,
} from "antd";
import { CheckCircle, XCircle, AlertCircle, Save } from "lucide-react";
import {
  useFindUniqueTestResult,
  useUpdateTestResult,
} from "@/generated/hooks";
import { getUserId } from "@/lib/auth";
import {
  calculateAutoScore,
  updateQuestionScores,
  QuestionScore,
  QuestionScores,
} from "../utils/scoreCalculator";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface GradingModalProps {
  resultId: string | null;
  open: boolean;
  onClose: () => void;
}

interface QuestionFeedback {
  score: number;
  feedback: string;
}

interface FeedbackData {
  overall: string;
  questions: Record<string, QuestionFeedback>;
}

export default function GradingModal({
  resultId,
  open,
  onClose,
}: GradingModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    setAdminId(getUserId());
  }, []);

  const { data: result, isLoading } = useFindUniqueTestResult(
    {
      where: { id: resultId ?? "" },
      include: {
        user: true,
        component: {
          include: {
            test: {
              include: {
                questions: {
                  include: {
                    answers: true,
                  },
                  orderBy: { createdAt: "asc" as const },
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

  const updateTestResult = useUpdateTestResult();

  // Initialize form with existing feedback and questionScores
  useEffect(() => {
    const formValues: Record<string, any> = {};

    // Handle overall feedback
    if (result?.feedback) {
      try {
        const feedbackData = JSON.parse(result.feedback);
        formValues.overallFeedback = feedbackData.overall;

        // Legacy: load from feedback.questions if questionScores not available
        if (!result.questionScores && feedbackData.questions) {
          Object.keys(feedbackData.questions).forEach((qId) => {
            formValues[`score_${qId}`] = feedbackData.questions[qId].score;
            formValues[`feedback_${qId}`] =
              feedbackData.questions[qId].feedback;
          });
        }
      } catch (e) {
        // If feedback is not JSON (legacy), just set overall
        formValues.overallFeedback = result.feedback;
      }
    }

    // Handle individual question scores (new format)
    if (result?.questionScores) {
      try {
        const questionScores =
          result.questionScores as unknown as QuestionScores;
        Object.keys(questionScores).forEach((qId) => {
          formValues[`score_${qId}`] = questionScores[qId].score;
          formValues[`feedback_${qId}`] = questionScores[qId].feedback;
        });
      } catch (e) {
        console.error("Error parsing questionScores:", e);
      }
    }

    if (Object.keys(formValues).length > 0) {
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
    }
  }, [result, form, open]);

  const questions = result?.component?.test?.questions ?? [];
  const userAnswers = useMemo(() => {
    if (!result?.userAnswers) return new Map();
    try {
      const answers = result.userAnswers as Record<string, string | string[]>;
      return new Map(Object.entries(answers));
    } catch (error) {
      console.error("Error parsing user answers:", error);
      return new Map();
    }
  }, [result?.userAnswers]);
  const testMaxScore = result?.component?.test?.maxScore || 10;

  // Calculate auto-graded score
  const autoGradedStats = useMemo(() => {
    let earnedPoints = 0;
    let totalPoints = 0;

    questions.forEach((q) => {
      const points = q.points || 1;
      totalPoints += points;

      if (q.questionType !== "ESSAY") {
        const userAnswer = userAnswers.get(q.id);
        const userAnswerIds = !userAnswer
          ? []
          : Array.isArray(userAnswer)
            ? userAnswer.filter((id) => id)
            : [userAnswer].filter((id) => id);

        const correctAnswers = q.answers.filter((a) => a.correct);
        const correctIds = correctAnswers.map((a) => a.id);

        const isCorrect =
          q.questionType === "SINGLE_CHOICE"
            ? userAnswerIds.length === 1 &&
              correctIds.includes(userAnswerIds[0])
            : userAnswerIds.length === correctIds.length &&
              userAnswerIds.every((id) => correctIds.includes(id));

        if (isCorrect) {
          earnedPoints += points;
        }
      }
    });

    return { earnedPoints, totalPoints };
  }, [questions, userAnswers]);

  const handleFinish = async (values: any) => {
    if (!result) return;

    setSubmitting(true);
    try {
      const feedbackData: FeedbackData = {
        overall: values.overallFeedback || "",
        questions: {},
      };

      const questionScores: QuestionScores = {};
      let essayEarnedPoints = 0;

      // Process all questions for scores and feedback
      questions.forEach((q) => {
        const maxScore = q.points || 1;
        const feedback = values[`feedback_${q.id}`] || "";
        let score = 0;

        if (q.questionType === "ESSAY") {
          // Essay questions: use manually entered score
          score = values[`score_${q.id}`] || 0;
          essayEarnedPoints += score;

          // Legacy: Save essay scores to feedback for backward compatibility
          feedbackData.questions[q.id] = {
            score,
            feedback,
          };
        } else {
          // Multiple choice questions: calculate score automatically
          score = calculateAutoScore(q, userAnswers.get(q.id));
        }

        // Save to new questionScores structure
        questionScores[q.id] = {
          score,
          maxScore,
          feedback,
        };
      });

      const totalEarnedPoints =
        autoGradedStats.earnedPoints + essayEarnedPoints;
      const totalPossiblePoints = autoGradedStats.totalPoints;

      // Calculate final mark scaled to testMaxScore
      const finalMark =
        totalPossiblePoints > 0
          ? (totalEarnedPoints / totalPossiblePoints) * testMaxScore
          : 0;

      const roundedMark = Math.round(finalMark * 10) / 10;
      const status = roundedMark >= testMaxScore / 2 ? "PASSED" : "FAILED";

      await updateTestResult.mutateAsync({
        where: { id: result.id },
        data: {
          mark: roundedMark,
          status,
          feedback: JSON.stringify(feedbackData),
          questionScores: questionScores as any,
          gradedBy: adminId,
          gradedAt: new Date(),
        },
      });

      message.success("Đã lưu kết quả chấm điểm!");
      onClose();
    } catch (error) {
      console.error("Error saving grade:", error);
      message.error("Có lỗi xảy ra khi lưu kết quả!");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      title={`Chấm điểm: ${result?.user?.name} - ${result?.component?.test?.name}`}
      open={open}
      onCancel={onClose}
      width={"80%"}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<Save size={16} />}
          loading={submitting}
          onClick={form.submit}
        >
          Lưu kết quả
        </Button>,
      ]}
    >
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spin size="large" />
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <div
            style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}
          >
            <Alert
              message="Thông tin điểm số"
              description={
                <Space direction="vertical">
                  <Text>
                    Điểm trắc nghiệm (tự động): {autoGradedStats.earnedPoints}{" "}
                    điểm
                  </Text>
                  <Text>
                    Tổng điểm tối đa của bài thi: {autoGradedStats.totalPoints}{" "}
                    điểm
                  </Text>
                  <Text type="secondary">
                    Điểm số cuối cùng sẽ được quy đổi về thang điểm{" "}
                    {testMaxScore}
                  </Text>
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {questions.map((q, index) => {
                const userAnswer = userAnswers.get(q.id);

                if (q.questionType !== "ESSAY") {
                  // Auto-graded question display (read-only)
                  const selectedIds = !userAnswer
                    ? []
                    : Array.isArray(userAnswer)
                      ? userAnswer.filter((id) => id)
                      : [userAnswer].filter((id) => id);
                  const correctAnswers = q.answers.filter((a) => a.correct);
                  const correctIds = correctAnswers.map((a) => a.id);
                  const isCorrect =
                    selectedIds.length === correctIds.length &&
                    selectedIds.every((id) => correctIds.includes(id));

                  return (
                    <Card
                      key={q.id}
                      size="small"
                      title={
                        <Space>
                          {isCorrect ? (
                            <CheckCircle size={16} color="green" />
                          ) : (
                            <XCircle size={16} color="red" />
                          )}
                          <Text>
                            Câu {index + 1} ({q.points || 1} điểm)
                          </Text>
                          <Tag>
                            {q.questionType === "SINGLE_CHOICE"
                              ? "Trắc nghiệm 1 đáp án"
                              : "Trắc nghiệm nhiều đáp án"}
                          </Tag>
                        </Space>
                      }
                      style={{ backgroundColor: "#f9fafb" }}
                    >
                      <Paragraph>{q.content}</Paragraph>
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {q.answers.map((a) => {
                          const isSelected = selectedIds.includes(a.id);
                          const isCorrectAns = a.correct;
                          return (
                            <div
                              key={a.id}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 4,
                                backgroundColor: isCorrectAns
                                  ? "#d1fae5"
                                  : isSelected
                                    ? "#fee2e2"
                                    : "transparent",
                                border: isCorrectAns
                                  ? "1px solid #34d399"
                                  : isSelected
                                    ? "1px solid #f87171"
                                    : "1px solid #e5e7eb",
                              }}
                            >
                              <Space>
                                <Text strong={isSelected}>{a.content}</Text>
                                {isSelected && (
                                  <Tag color="blue">Học viên chọn</Tag>
                                )}
                                {isCorrectAns && (
                                  <Tag color="success">Đáp án đúng</Tag>
                                )}
                              </Space>
                            </div>
                          );
                        })}
                      </Space>
                    </Card>
                  );
                } else {
                  // Essay question (Grading interface)
                  return (
                    <Card
                      key={q.id}
                      title={
                        <Space>
                          <AlertCircle size={16} color="#0284c7" />
                          <Text>
                            Câu {index + 1} (Tự luận - {q.points || 1} điểm)
                          </Text>
                        </Space>
                      }
                      style={{ border: "1px solid #bae6fd" }}
                    >
                      <Paragraph strong>{q.content}</Paragraph>

                      <div
                        style={{
                          marginBottom: 16,
                          padding: 12,
                          backgroundColor: "#f0f9ff",
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          type="secondary"
                          style={{ display: "block", marginBottom: 4 }}
                        >
                          Bài làm của học viên:
                        </Text>
                        <Paragraph
                          style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}
                        >
                          {userAnswer || (
                            <Text type="secondary" italic>
                              Không có câu trả lời
                            </Text>
                          )}
                        </Paragraph>
                      </div>

                      <Row gutter={16}>
                        <Col span={6}>
                          <Form.Item
                            name={`score_${q.id}`}
                            label="Điểm số"
                            rules={[
                              { required: true, message: "Vui lòng nhập điểm" },
                              {
                                type: "number",
                                min: 0,
                                max: q.points || 1,
                                message: `Điểm từ 0 đến ${q.points || 1}`,
                              },
                            ]}
                          >
                            <InputNumber
                              style={{ width: "100%" }}
                              min={0}
                              max={q.points || 1}
                              step={0.5}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={18}>
                          <Form.Item
                            name={`feedback_${q.id}`}
                            label="Nhận xét chi tiết"
                          >
                            <TextArea
                              rows={2}
                              placeholder="Nhập nhận xét cho câu hỏi này..."
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  );
                }
              })}

              {/* Add feedback section for multiple choice questions */}
              {questions
                .filter((q) => q.questionType !== "ESSAY")
                .map((q) => {
                  const userAnswer = userAnswers.get(q.id);
                  const selectedIds = !userAnswer
                    ? []
                    : Array.isArray(userAnswer)
                      ? userAnswer.filter((id) => id)
                      : [userAnswer].filter((id) => id);

                  const correctAnswers = q.answers.filter((a) => a.correct);
                  const correctIds = correctAnswers.map((a) => a.id);
                  const isCorrect =
                    q.questionType === "SINGLE_CHOICE"
                      ? selectedIds.length === 1 &&
                        correctIds.includes(selectedIds[0])
                      : selectedIds.length === correctIds.length &&
                        selectedIds.every((id) => correctIds.includes(id));

                  const autoScore = isCorrect ? q.points || 1 : 0;

                  return (
                    <Card
                      key={`feedback_${q.id}`}
                      title={
                        <Space>
                          {isCorrect ? (
                            <CheckCircle size={16} color="green" />
                          ) : (
                            <XCircle size={16} color="red" />
                          )}
                          <Text>
                            Câu {questions.indexOf(q) + 1} - Nhận xét (Điểm:{" "}
                            {autoScore}/{q.points || 1})
                          </Text>
                          <Tag color={isCorrect ? "success" : "error"}>
                            {q.questionType === "SINGLE_CHOICE"
                              ? "Trắc nghiệm 1 đáp án"
                              : "Trắc nghiệm nhiều đáp án"}
                          </Tag>
                        </Space>
                      }
                      style={{
                        border: `1px solid ${isCorrect ? "#52c41a" : "#ff4d4f"}`,
                        backgroundColor: isCorrect ? "#f6ffed" : "#fff2f0",
                      }}
                    >
                      <Form.Item
                        name={`feedback_${q.id}`}
                        label="Nhận xét chi tiết (tùy chọn)"
                      >
                        <TextArea
                          rows={2}
                          placeholder={`Nhận xét cho câu ${questions.indexOf(q) + 1} (${isCorrect ? "Đúng" : "Sai"})...`}
                        />
                      </Form.Item>
                    </Card>
                  );
                })}

              <Divider />

              <Form.Item name="overallFeedback" label="Nhận xét chung">
                <TextArea
                  rows={4}
                  placeholder="Nhập nhận xét chung cho toàn bộ bài kiểm tra..."
                />
              </Form.Item>
            </Space>
          </div>
        </Form>
      )}
    </Modal>
  );
}
