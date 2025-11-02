"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Input,
  Select,
  Radio,
  Checkbox,
  Space,
  Card,
  message,
  Spin,
  Empty,
  Popconfirm,
  Divider,
} from "antd";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import {
  useFindManyQuestion,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from "@/generated/hooks";
import {
  useFindManyAnswer,
  useCreateAnswer,
  useUpdateAnswer,
  useDeleteAnswer,
} from "@/generated/hooks";

const { Option } = Select;

interface Answer {
  id: string;
  content: string;
  correct: boolean;
  isNew?: boolean;
}

interface Question {
  id: string;
  content: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  answers: Answer[];
  isNew?: boolean;
  isEditing?: boolean;
}

interface ManageQuestionsProps {
  open: boolean;
  testId: string;
  onCancel: () => void;
}

export default function ManageQuestions({
  open,
  testId,
  onCancel,
}: ManageQuestionsProps) {
  const [editingQuestions, setEditingQuestions] = useState<Question[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch questions
  const {
    data: questionsData,
    isLoading: questionsLoading,
    refetch,
  } = useFindManyQuestion(
    {
      where: { testId },
      include: {
        answers: true,
      },
    },
    { enabled: open },
  );

  // Mutations
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const createAnswer = useCreateAnswer();
  const updateAnswer = useUpdateAnswer();
  const deleteAnswer = useDeleteAnswer();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setEditingQuestions([]);
      setHasChanges(false);
    }
  }, [open]);

  // Initialize editing questions when data is loaded
  useEffect(() => {
    if (questionsData && open) {
      setEditingQuestions(
        questionsData.map((q: any) => ({
          id: q.id,
          content: q.content,
          questionType: q.questionType,
          answers: q.answers || [],
          isNew: false,
          isEditing: false,
        })),
      );
    }
  }, [questionsData, open]);

  // Add new question
  const addQuestion = () => {
    const newQuestion: Question = {
      id: `new-${Date.now()}`,
      content: "",
      questionType: "SINGLE_CHOICE",
      answers: [
        {
          id: `new-ans-${Date.now()}-1`,
          content: "",
          correct: true,
          isNew: true,
        },
        {
          id: `new-ans-${Date.now()}-2`,
          content: "",
          correct: false,
          isNew: true,
        },
      ],
      isNew: true,
      isEditing: true,
    };
    setEditingQuestions([...editingQuestions, newQuestion]);
    setHasChanges(true);
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    const question = editingQuestions.find((q) => q.id === questionId);

    if (question?.isNew) {
      // Just remove from local state
      setEditingQuestions(editingQuestions.filter((q) => q.id !== questionId));
      setHasChanges(true);
    } else {
      try {
        await deleteQuestion.mutateAsync({ where: { id: questionId } });
        message.success("Xóa câu hỏi thành công!");
        refetch();
        setEditingQuestions(
          editingQuestions.filter((q) => q.id !== questionId),
        );
      } catch (error) {
        message.error("Có lỗi xảy ra khi xóa câu hỏi!");
      }
    }
  };

  // Update question content
  const updateQuestionContent = (questionId: string, content: string) => {
    setEditingQuestions(
      editingQuestions.map((q) =>
        q.id === questionId ? { ...q, content } : q,
      ),
    );
    setHasChanges(true);
  };

  // Update question type
  const updateQuestionType = (
    questionId: string,
    questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE",
  ) => {
    setEditingQuestions(
      editingQuestions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              questionType,
              answers: q.answers.map((a, index) => ({
                ...a,
                correct: index === 0 && questionType === "SINGLE_CHOICE",
              })),
            }
          : q,
      ),
    );
    setHasChanges(true);
  };

  // Add answer
  const addAnswer = (questionId: string) => {
    setEditingQuestions(
      editingQuestions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: [
              ...q.answers,
              {
                id: `new-ans-${Date.now()}`,
                content: "",
                correct: false,
                isNew: true,
              },
            ],
          };
        }
        return q;
      }),
    );
    setHasChanges(true);
  };

  // Delete answer
  const handleDeleteAnswer = async (questionId: string, answerId: string) => {
    const question = editingQuestions.find((q) => q.id === questionId);
    if (!question || question.answers.length <= 2) {
      message.warning("Phải có ít nhất 2 đáp án!");
      return;
    }

    const answer = question.answers.find((a) => a.id === answerId);

    if (answer?.isNew) {
      setEditingQuestions(
        editingQuestions.map((q) =>
          q.id === questionId
            ? { ...q, answers: q.answers.filter((a) => a.id !== answerId) }
            : q,
        ),
      );
    } else {
      try {
        await deleteAnswer.mutateAsync({ where: { id: answerId } });
        message.success("Xóa đáp án thành công!");
        refetch();
        setEditingQuestions(
          editingQuestions.map((q) =>
            q.id === questionId
              ? { ...q, answers: q.answers.filter((a) => a.id !== answerId) }
              : q,
          ),
        );
      } catch (error) {
        message.error("Có lỗi xảy ra khi xóa đáp án!");
      }
    }
    setHasChanges(true);
  };

  // Update answer content
  const updateAnswerContent = (
    questionId: string,
    answerId: string,
    content: string,
  ) => {
    setEditingQuestions(
      editingQuestions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === answerId ? { ...a, content } : a,
              ),
            }
          : q,
      ),
    );
    setHasChanges(true);
  };

  // Toggle answer correct
  const toggleSingleAnswer = (questionId: string, answerId: string) => {
    setEditingQuestions(
      editingQuestions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) => ({
                ...a,
                correct: a.id === answerId,
              })),
            }
          : q,
      ),
    );
    setHasChanges(true);
  };

  const toggleMultipleAnswer = (questionId: string, answerId: string) => {
    setEditingQuestions(
      editingQuestions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === answerId ? { ...a, correct: !a.correct } : a,
              ),
            }
          : q,
      ),
    );
    setHasChanges(true);
  };

  // Toggle edit mode
  const toggleEditMode = (questionId: string) => {
    setEditingQuestions(
      editingQuestions.map((q) =>
        q.id === questionId ? { ...q, isEditing: !q.isEditing } : q,
      ),
    );
  };

  // Save a single question
  const saveQuestion = async (questionId: string) => {
    const question = editingQuestions.find((q) => q.id === questionId);
    if (!question) return;

    // Validate
    if (!question.content.trim()) {
      message.error("Vui lòng nhập nội dung câu hỏi!");
      return;
    }

    for (const answer of question.answers) {
      if (!answer.content.trim()) {
        message.error("Vui lòng nhập nội dung cho tất cả đáp án!");
        return;
      }
    }

    const hasCorrectAnswer = question.answers.some((a) => a.correct);
    if (!hasCorrectAnswer) {
      message.error("Phải có ít nhất 1 đáp án đúng!");
      return;
    }

    try {
      if (question.isNew) {
        // Create new question
        const createdQuestion = await createQuestion.mutateAsync({
          data: {
            testId,
            content: question.content,
            questionType: question.questionType,
          },
        });

        if (createdQuestion) {
          // Create answers
          for (const answer of question.answers) {
            await createAnswer.mutateAsync({
              data: {
                questionId: createdQuestion.id,
                content: answer.content,
                correct: answer.correct,
              },
            });
          }
        }
        message.success("Tạo câu hỏi thành công!");
      } else {
        // Update existing question
        await updateQuestion.mutateAsync({
          where: { id: questionId },
          data: {
            content: question.content,
            questionType: question.questionType,
          },
        });

        // Update/create/delete answers
        for (const answer of question.answers) {
          if (answer.isNew) {
            await createAnswer.mutateAsync({
              data: {
                questionId: questionId,
                content: answer.content,
                correct: answer.correct,
              },
            });
          } else {
            await updateAnswer.mutateAsync({
              where: { id: answer.id },
              data: {
                content: answer.content,
                correct: answer.correct,
              },
            });
          }
        }
        message.success("Cập nhật câu hỏi thành công!");
      }

      await refetch();
      toggleEditMode(questionId);
      setHasChanges(false);
    } catch (error) {
      message.error("Có lỗi xảy ra!");
      console.error(error);
    }
  };

  // Save all changes
  const saveAllChanges = async () => {
    for (const question of editingQuestions) {
      if (question.isNew || question.isEditing) {
        await saveQuestion(question.id);
      }
    }
  };

  return (
    <Modal
      title={
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          📚 Quản lý câu hỏi
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={920}
      footer={[
        <Button
          key="close"
          onClick={onCancel}
          size="large"
          style={{
            borderRadius: 10,
            fontWeight: 500,
            height: 44,
            paddingLeft: 24,
            paddingRight: 24,
          }}
        >
          Đóng
        </Button>,
        <Button
          key="save-all"
          type="primary"
          onClick={saveAllChanges}
          disabled={!hasChanges}
          size="large"
          style={{
            background: hasChanges
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : undefined,
            border: "none",
            borderRadius: 10,
            fontWeight: 600,
            height: 44,
            paddingLeft: 24,
            paddingRight: 24,
            boxShadow: hasChanges
              ? "0 4px 16px rgba(16, 185, 129, 0.3)"
              : undefined,
          }}
        >
          💾 Lưu tất cả
        </Button>,
      ]}
      style={{ top: 20 }}
      styles={{
        header: {
          borderBottom: "2px solid #e5e7eb",
          paddingBottom: 16,
        },
        body: {
          paddingTop: 24,
        },
      }}
    >
      <Spin spinning={questionsLoading}>
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 10 }}>
          {editingQuestions.length === 0 ? (
            <Empty
              description={
                <span
                  style={{ color: "#6b7280", fontSize: 16, fontWeight: 500 }}
                >
                  Chưa có câu hỏi nào
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<Plus size={18} />}
                onClick={addQuestion}
                size="large"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: 12,
                  height: 48,
                  paddingLeft: 32,
                  paddingRight: 32,
                  fontWeight: 600,
                  boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
                }}
              >
                Thêm câu hỏi đầu tiên
              </Button>
            </Empty>
          ) : (
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              {editingQuestions.map((question, qIndex) => (
                <Card
                  key={question.id}
                  style={{
                    background:
                      question.isEditing || question.isNew
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                    borderRadius: 16,
                    position: "relative",
                    border:
                      question.isEditing || question.isNew
                        ? "2px solid #667eea"
                        : "1px solid #e0e0e0",
                    boxShadow:
                      question.isEditing || question.isNew
                        ? "0 8px 24px rgba(102, 126, 234, 0.3)"
                        : "0 4px 12px rgba(0, 0, 0, 0.08)",
                    transition: "all 0.3s ease",
                  }}
                  bodyStyle={{ padding: 24 }}
                >
                  {/* Question Header */}
                  <Space
                    direction="vertical"
                    style={{ width: "100%", marginBottom: 16 }}
                  >
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      <div
                        style={{
                          backgroundColor:
                            question.isEditing || question.isNew
                              ? "#ffffff"
                              : "#667eea",
                          color:
                            question.isEditing || question.isNew
                              ? "#667eea"
                              : "#ffffff",
                          borderRadius: "50%",
                          width: 36,
                          height: 36,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: 16,
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                          flexShrink: 0,
                        }}
                      >
                        {qIndex + 1}
                      </div>
                      <Input
                        placeholder={`Nhập nội dung câu hỏi ${qIndex + 1}`}
                        value={question.content}
                        onChange={(e) =>
                          updateQuestionContent(question.id, e.target.value)
                        }
                        disabled={!question.isEditing && !question.isNew}
                        style={{
                          backgroundColor: "white",
                          borderRadius: 12,
                          fontSize: 16,
                          flex: 1,
                          border: "2px solid #e0e0e0",
                          fontWeight: 500,
                        }}
                        size="large"
                      />
                      {!question.isNew && !question.isEditing && (
                        <Button
                          icon={<Edit size={16} />}
                          onClick={() => toggleEditMode(question.id)}
                          style={{
                            backgroundColor: "#667eea",
                            color: "white",
                            borderRadius: 10,
                            border: "none",
                            fontWeight: 500,
                            boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                          }}
                        >
                          Sửa
                        </Button>
                      )}
                      {(question.isEditing || question.isNew) && (
                        <>
                          <Button
                            type="primary"
                            icon={<Save size={16} />}
                            onClick={() => saveQuestion(question.id)}
                            style={{
                              backgroundColor: "#10b981",
                              borderRadius: 10,
                              border: "none",
                              fontWeight: 500,
                              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                            }}
                          >
                            Lưu
                          </Button>
                          {!question.isNew && (
                            <Button
                              icon={<X size={16} />}
                              onClick={() => toggleEditMode(question.id)}
                              style={{
                                backgroundColor: "#ef4444",
                                color: "white",
                                borderRadius: 10,
                                border: "none",
                                fontWeight: 500,
                                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                              }}
                            >
                              Hủy
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Question Type Selector */}
                    <div
                      style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      <Select
                        value={question.questionType}
                        onChange={(value) =>
                          updateQuestionType(question.id, value)
                        }
                        disabled={!question.isEditing && !question.isNew}
                        style={{
                          width: 240,
                          borderRadius: 10,
                        }}
                        size="large"
                      >
                        <Option value="SINGLE_CHOICE">
                          <span style={{ fontWeight: 500 }}>
                            📝 Trắc nghiệm 1 đáp án
                          </span>
                        </Option>
                        <Option value="MULTIPLE_CHOICE">
                          <span style={{ fontWeight: 500 }}>
                            ✅ Trắc nghiệm nhiều đáp án
                          </span>
                        </Option>
                      </Select>
                    </div>
                  </Space>

                  {/* Answers */}
                  <Space
                    direction="vertical"
                    style={{ width: "100%", marginTop: 16 }}
                    size="middle"
                  >
                    {question.answers.map((answer, aIndex) => (
                      <div
                        key={answer.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          backgroundColor: answer.correct
                            ? "#d1fae5"
                            : "#ffffff",
                          padding: "12px 16px",
                          borderRadius: 12,
                          border: answer.correct
                            ? "2px solid #10b981"
                            : "2px solid #e5e7eb",
                          transition: "all 0.2s ease",
                          boxShadow: answer.correct
                            ? "0 2px 8px rgba(16, 185, 129, 0.2)"
                            : "0 1px 3px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: answer.correct
                              ? "#10b981"
                              : "#f3f4f6",
                            color: answer.correct ? "#ffffff" : "#6b7280",
                            borderRadius: "50%",
                            minWidth: 28,
                            height: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: 13,
                          }}
                        >
                          {String.fromCharCode(65 + aIndex)}
                        </div>
                        {question.questionType === "SINGLE_CHOICE" ? (
                          <Radio
                            checked={answer.correct}
                            onChange={() =>
                              toggleSingleAnswer(question.id, answer.id)
                            }
                            disabled={!question.isEditing && !question.isNew}
                            style={{ marginLeft: 4 }}
                          />
                        ) : (
                          <Checkbox
                            checked={answer.correct}
                            onChange={() =>
                              toggleMultipleAnswer(question.id, answer.id)
                            }
                            disabled={!question.isEditing && !question.isNew}
                            style={{ marginLeft: 4 }}
                          />
                        )}
                        <Input
                          placeholder={`Nhập nội dung đáp án ${String.fromCharCode(65 + aIndex)}`}
                          value={answer.content}
                          onChange={(e) =>
                            updateAnswerContent(
                              question.id,
                              answer.id,
                              e.target.value,
                            )
                          }
                          disabled={!question.isEditing && !question.isNew}
                          style={{
                            backgroundColor: "transparent",
                            border: "none",
                            borderRadius: 8,
                            flex: 1,
                            fontSize: 15,
                            fontWeight: answer.correct ? 500 : 400,
                          }}
                        />
                        {(question.isEditing || question.isNew) && (
                          <Popconfirm
                            title="Xóa đáp án này?"
                            onConfirm={() =>
                              handleDeleteAnswer(question.id, answer.id)
                            }
                            okText="Xóa"
                            cancelText="Hủy"
                          >
                            <Button
                              type="text"
                              danger
                              icon={<Trash2 size={16} />}
                              style={{
                                backgroundColor: "#fee2e2",
                                borderRadius: 8,
                                border: "1px solid #fecaca",
                                color: "#dc2626",
                              }}
                            />
                          </Popconfirm>
                        )}
                      </div>
                    ))}

                    {/* Add Answer Button */}
                    {(question.isEditing || question.isNew) && (
                      <Button
                        type="dashed"
                        onClick={() => addAnswer(question.id)}
                        icon={<Plus size={16} />}
                        style={{
                          backgroundColor: "#f0fdf4",
                          borderRadius: 12,
                          border: "2px dashed #86efac",
                          color: "#16a34a",
                          fontWeight: 500,
                          height: 48,
                          width: "100%",
                        }}
                        size="large"
                      >
                        Thêm đáp án mới
                      </Button>
                    )}
                  </Space>

                  {/* Delete Question Button */}
                  <div
                    style={{
                      marginTop: 24,
                      paddingTop: 16,
                      borderTop: "2px dashed #e5e7eb",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Popconfirm
                      title="Xóa câu hỏi này?"
                      description="Hành động này không thể hoàn tác!"
                      onConfirm={() => handleDeleteQuestion(question.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        danger
                        icon={<Trash2 size={16} />}
                        style={{
                          backgroundColor: "#fef2f2",
                          borderRadius: 10,
                          border: "2px solid #fecaca",
                          color: "#dc2626",
                          fontWeight: 500,
                          boxShadow: "0 2px 8px rgba(220, 38, 38, 0.15)",
                        }}
                        size="large"
                      >
                        Xóa câu hỏi
                      </Button>
                    </Popconfirm>
                  </div>
                </Card>
              ))}
            </Space>
          )}

          {editingQuestions.length > 0 && (
            <>
              <Divider style={{ borderColor: "#e5e7eb", margin: "24px 0" }} />
              <Button
                type="primary"
                icon={<Plus size={18} />}
                onClick={addQuestion}
                block
                size="large"
                style={{
                  marginTop: 16,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: 12,
                  height: 56,
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
                }}
              >
                Thêm câu hỏi mới
              </Button>
            </>
          )}
        </div>
      </Spin>
    </Modal>
  );
}
