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
  App,
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
  const { message } = App.useApp();
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
      title="Quản lý câu hỏi"
      open={open}
      onCancel={onCancel}
      width={920}
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>,
        <Button
          key="save-all"
          type="primary"
          onClick={saveAllChanges}
          disabled={!hasChanges}
        >
          Lưu tất cả
        </Button>,
      ]}
      style={{ top: 20 }}
    >
      <Spin spinning={questionsLoading}>
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 10 }}>
          {editingQuestions.length === 0 ? (
            <Empty
              description="Chưa có câu hỏi nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={addQuestion}
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
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#ffffff",
                  }}
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
                          backgroundColor: "#f3f4f6",
                          color: "#1f2937",
                          borderRadius: 8,
                          width: 32,
                          height: 32,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "600",
                          fontSize: 14,
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
                          flex: 1,
                        }}
                      />
                      {!question.isNew && !question.isEditing && (
                        <Button
                          icon={<Edit className="w-4 h-4" />}
                          onClick={() => toggleEditMode(question.id)}
                        >
                          Sửa
                        </Button>
                      )}
                      {(question.isEditing || question.isNew) && (
                        <>
                          <Button
                            type="primary"
                            icon={<Save className="w-4 h-4" />}
                            onClick={() => saveQuestion(question.id)}
                          >
                            Lưu
                          </Button>
                          {!question.isNew && (
                            <Button
                              icon={<X className="w-4 h-4" />}
                              onClick={() => toggleEditMode(question.id)}
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
                          width: 200,
                        }}
                      >
                        <Option value="SINGLE_CHOICE">
                          Trắc nghiệm 1 đáp án
                        </Option>
                        <Option value="MULTIPLE_CHOICE">
                          Trắc nghiệm nhiều đáp án
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
                            ? "#f0fdf4"
                            : "#f9fafb",
                          padding: "12px 16px",
                          borderRadius: 8,
                          border: answer.correct
                            ? "1px solid #86efac"
                            : "1px solid #e5e7eb",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: answer.correct
                              ? "#22c55e"
                              : "#d1d5db",
                            color: "#ffffff",
                            borderRadius: 6,
                            minWidth: 24,
                            height: 24,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "600",
                            fontSize: 12,
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
                          />
                        ) : (
                          <Checkbox
                            checked={answer.correct}
                            onChange={() =>
                              toggleMultipleAnswer(question.id, answer.id)
                            }
                            disabled={!question.isEditing && !question.isNew}
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
                            flex: 1,
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
                              icon={<Trash2 className="w-4 h-4" />}
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
                        icon={<Plus className="w-4 h-4" />}
                        style={{
                          width: "100%",
                        }}
                      >
                        Thêm đáp án mới
                      </Button>
                    )}
                  </Space>

                  {/* Delete Question Button */}
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid #e5e7eb",
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
                      <Button danger icon={<Trash2 className="w-4 h-4" />}>
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
              <Divider />
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={addQuestion}
                block
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
