"use client";

import { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Input,
  InputNumber,
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
  Form,
  Alert,
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
import { useCreateMediaFile, useDeleteMediaFile } from "@/generated/hooks";
import MediaUpload from "@/components/MediaUpload";

const { Option } = Select;

interface Answer {
  id: string;
  content: string;
  correct: boolean;
  isNew?: boolean;
}

interface MediaFileItem {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}

interface Question {
  id: string;
  content: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY";
  points?: number;
  maxLength?: number;
  mediaFiles?: MediaFileItem[];
  answers: Answer[];
  isNew?: boolean;
  isEditing?: boolean;
}

interface ManageQuestionsProps {
  open: boolean;
  testId: string;
  onCancel: () => void;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
}

export default function ManageQuestions({
  open,
  testId,
  onCancel,
  shuffleQuestions = false,
  shuffleAnswers = false,
}: ManageQuestionsProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [editingQuestions, setEditingQuestions] = useState<Question[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const isMountedRef = useRef(true);

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
        mediaFiles: true,
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
  const createMediaFile = useCreateMediaFile();
  const deleteMediaFile = useDeleteMediaFile();

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setEditingQuestions([]);
      setHasChanges(false);
      form.resetFields();
    }
  }, [open, form]);

  // Initialize editing questions when data is loaded
  useEffect(() => {
    if (questionsData && open) {
      const questions = questionsData.map((q: any) => ({
        id: q.id,
        content: q.content,
        questionType: q.questionType,
        points: q.points || 1,
        maxLength: q.maxLength || 1000,
        mediaFiles: q.mediaFiles || [],
        answers: q.answers || [],
        isNew: false,
        isEditing: false,
      }));
      setEditingQuestions(questions);

      // Set form values
      const formValues: any = {};
      questions.forEach((q: any) => {
        formValues[`question_${q.id}_content`] = q.content;
        formValues[`question_${q.id}_type`] = q.questionType;
        formValues[`question_${q.id}_points`] = q.points;
        formValues[`question_${q.id}_maxLength`] = q.maxLength;
        formValues[`question_${q.id}_mediaFiles`] = q.mediaFiles;

        q.answers.forEach((a: Answer) => {
          formValues[`answer_${a.id}_content`] = a.content;
          formValues[`answer_${a.id}_correct`] = a.correct;
        });
      });
      form.setFieldsValue(formValues);
    }
  }, [questionsData, open, form]);

  // Add new question
  const addQuestion = () => {
    const questionId = `new-${Date.now()}`;
    const newQuestion: Question = {
      id: questionId,
      content: "",
      questionType: "SINGLE_CHOICE",
      points: 1,
      maxLength: 1000,
      mediaFiles: [],
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

    // Set form values for new question
    form.setFieldsValue({
      [`question_${questionId}_content`]: "",
      [`question_${questionId}_type`]: "SINGLE_CHOICE",
      [`question_${questionId}_points`]: 1,
      [`question_${questionId}_maxLength`]: 1000,
      [`question_${questionId}_mediaFiles`]: [],
    });

    setEditingQuestions([...editingQuestions, newQuestion]);
    setHasChanges(true);
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    const question = editingQuestions.find((q) => q.id === questionId);

    if (question?.isNew) {
      // Just remove from local state
      if (isMountedRef.current) {
        setEditingQuestions(
          editingQuestions.filter((q) => q.id !== questionId),
        );
        setHasChanges(true);
      }
    } else {
      try {
        await deleteQuestion.mutateAsync({ where: { id: questionId } });
        if (isMountedRef.current) {
          message.success("Xóa câu hỏi thành công!");
          refetch();
          setEditingQuestions(
            editingQuestions.filter((q) => q.id !== questionId),
          );
        }
      } catch (error) {
        if (isMountedRef.current) {
          message.error("Có lỗi xảy ra khi xóa câu hỏi!");
        }
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

  // Update question points
  const updateQuestionPoints = (questionId: string, points: number) => {
    form.setFieldValue(`question_${questionId}_points`, points);
    setEditingQuestions(
      editingQuestions.map((q) => (q.id === questionId ? { ...q, points } : q)),
    );
    setHasChanges(true);
  };

  // Update question max length
  const updateQuestionMaxLength = (questionId: string, maxLength: number) => {
    setEditingQuestions(
      editingQuestions.map((q) =>
        q.id === questionId ? { ...q, maxLength } : q,
      ),
    );
    setHasChanges(true);
  };

  // Update question media files
  const updateQuestionMediaFiles = (
    questionId: string,
    mediaFiles: MediaFileItem[],
  ) => {
    setEditingQuestions(
      editingQuestions.map((q) =>
        q.id === questionId ? { ...q, mediaFiles } : q,
      ),
    );
    setHasChanges(true);
  };

  // Update question type
  const updateQuestionType = (
    questionId: string,
    questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY",
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
      if (isMountedRef.current) {
        message.warning("Phải có ít nhất 2 đáp án!");
      }
      return;
    }

    const answer = question.answers.find((a) => a.id === answerId);

    if (answer?.isNew) {
      if (isMountedRef.current) {
        setEditingQuestions(
          editingQuestions.map((q) =>
            q.id === questionId
              ? { ...q, answers: q.answers.filter((a) => a.id !== answerId) }
              : q,
          ),
        );
        setHasChanges(true);
      }
    } else {
      try {
        await deleteAnswer.mutateAsync({ where: { id: answerId } });
        if (isMountedRef.current) {
          message.success("Xóa đáp án thành công!");
          refetch();
          setEditingQuestions(
            editingQuestions.map((q) =>
              q.id === questionId
                ? { ...q, answers: q.answers.filter((a) => a.id !== answerId) }
                : q,
            ),
          );
          setHasChanges(true);
        }
      } catch (error) {
        if (isMountedRef.current) {
          message.error("Có lỗi xảy ra khi xóa đáp án!");
        }
      }
    }
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

    // Get values from form
    const formValues = form.getFieldsValue();
    const questionContent =
      formValues[`question_${questionId}_content`] || question.content;
    const questionPoints =
      formValues[`question_${questionId}_points`] || question.points || 1;
    const questionMaxLength =
      formValues[`question_${questionId}_maxLength`] ||
      question.maxLength ||
      1000;
    const questionMediaFiles =
      formValues[`question_${questionId}_mediaFiles`] ||
      question.mediaFiles ||
      [];

    // Validate
    if (!questionContent.trim()) {
      if (isMountedRef.current) {
        message.error("Vui lòng nhập nội dung câu hỏi!");
      }
      return;
    }

    if (question.questionType !== "ESSAY") {
      for (const answer of question.answers) {
        if (!answer.content.trim()) {
          if (isMountedRef.current) {
            message.error("Vui lòng nhập nội dung cho tất cả đáp án!");
          }
          return;
        }
      }

      const hasCorrectAnswer = question.answers.some((a) => a.correct);
      if (!hasCorrectAnswer) {
        if (isMountedRef.current) {
          message.error("Phải có ít nhất 1 đáp án đúng!");
        }
        return;
      }
    }

    try {
      if (question.isNew) {
        // Create new question first
        const createdQuestion = await createQuestion.mutateAsync({
          data: {
            testId,
            content: questionContent,
            questionType: question.questionType,
            points: questionPoints,
            maxLength: questionMaxLength,
          },
        });

        // Create media files separately and connect to question
        if (createdQuestion && questionMediaFiles.length > 0) {
          for (const file of questionMediaFiles) {
            await createMediaFile.mutateAsync({
              data: {
                fileName: file.fileName,
                fileUrl: file.fileUrl,
                fileType: file.fileType,
                fileSize: file.fileSize,
                questionId: createdQuestion.id,
              },
            });
          }
        }

        if (createdQuestion && question.questionType !== "ESSAY") {
          // Create answers only if not ESSAY
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

        if (isMountedRef.current) {
          message.success("Tạo câu hỏi thành công!");
        }
      } else {
        // Update existing question
        await updateQuestion.mutateAsync({
          where: { id: questionId },
          data: {
            content: questionContent,
            questionType: question.questionType,
            points: questionPoints,
            maxLength: questionMaxLength,
          },
        });

        // Handle media files separately
        // First, delete all existing media files for this question
        const existingQuestion = editingQuestions.find(
          (q) => q.id === questionId,
        );
        if (existingQuestion?.mediaFiles) {
          for (const mediaFile of existingQuestion.mediaFiles) {
            if (mediaFile.id) {
              await deleteMediaFile.mutateAsync({
                where: { id: mediaFile.id },
              });
            }
          }
        }

        // Then create new media files
        if (questionMediaFiles.length > 0) {
          for (const file of questionMediaFiles) {
            await createMediaFile.mutateAsync({
              data: {
                fileName: file.fileName,
                fileUrl: file.fileUrl,
                fileType: file.fileType,
                fileSize: file.fileSize,
                questionId: questionId,
              },
            });
          }
        }

        // Update/create/delete answers only if not ESSAY
        if (question.questionType !== "ESSAY") {
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
        }

        if (isMountedRef.current) {
          message.success("Cập nhật câu hỏi thành công!");
        }
      }

      if (isMountedRef.current) {
        await refetch();
        toggleEditMode(questionId);
        setHasChanges(false);
      }
    } catch (error) {
      if (isMountedRef.current) {
        message.error("Có lỗi xảy ra!");
        console.error(error);
      }
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
      width={"80%"}
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
      <Form form={form}>
        <Spin spinning={questionsLoading}>
          <div
            style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 10 }}
          >
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
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="large"
              >
                {/* Questions Summary */}
                <Card
                  size="small"
                  style={{
                    backgroundColor: "#f0f9ff",
                    border: "1px solid #bae6fd",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: "#0284c7" }}>
                        Tổng quan bài kiểm tra
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 24 }}>
                      <span>
                        <strong>Số câu hỏi:</strong> {editingQuestions.length}
                      </span>
                      <span>
                        <strong>Tổng điểm:</strong>{" "}
                        {editingQuestions.reduce((sum, q) => {
                          const formValues = form.getFieldsValue();
                          const points =
                            formValues[`question_${q.id}_points`] ||
                            q.points ||
                            1;
                          return sum + points;
                        }, 0)}
                      </span>
                    </div>
                  </div>
                </Card>

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
                    <div style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "stretch",
                          marginBottom: 12,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "#1f2937",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          Câu {qIndex + 1}
                        </span>
                        <Input
                          placeholder={`Nhập nội dung câu hỏi`}
                          value={question.content}
                          onChange={(e) =>
                            updateQuestionContent(question.id, e.target.value)
                          }
                          disabled={!question.isEditing && !question.isNew}
                          style={{
                            flex: 1,
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "stretch",
                          }}
                        >
                          {!question.isNew && !question.isEditing && (
                            <Button
                              type="primary"
                              size="large"
                              icon={<Edit className="w-4 h-4" />}
                              onClick={() => toggleEditMode(question.id)}
                              style={{
                                height: "auto",
                                padding: "4px 12px",
                              }}
                            >
                              Sửa
                            </Button>
                          )}
                          {(question.isEditing || question.isNew) && (
                            <>
                              <Button
                                type="primary"
                                size="large"
                                icon={<Save className="w-4 h-4" />}
                                onClick={() => saveQuestion(question.id)}
                                style={{
                                  height: "auto",
                                  padding: "4px 12px",
                                }}
                              >
                                Lưu
                              </Button>
                              {!question.isNew && (
                                <Button
                                  size="large"
                                  icon={<X className="w-4 h-4" />}
                                  onClick={() => toggleEditMode(question.id)}
                                  style={{
                                    height: "auto",
                                    padding: "4px 12px",
                                  }}
                                >
                                  Hủy
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Media Upload - Luôn hiển thị */}
                      <div style={{ marginBottom: 16 }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: 8,
                            fontWeight: 500,
                          }}
                        >
                          Media (Hình ảnh/Video/Âm thanh - Không giới hạn)
                        </label>
                        <Form.Item
                          name={`question_${question.id}_mediaFiles`}
                          style={{ marginBottom: 0 }}
                        >
                          <MediaUpload
                            value={
                              form.getFieldValue(
                                `question_${question.id}_mediaFiles`,
                              ) ||
                              question.mediaFiles ||
                              []
                            }
                            onChange={(files) => {
                              // Cập nhật form value
                              form.setFieldValue(
                                `question_${question.id}_mediaFiles`,
                                files,
                              );
                              // Cập nhật state
                              updateQuestionMediaFiles(question.id, files);
                            }}
                            disabled={!question.isEditing && !question.isNew}
                          />
                        </Form.Item>
                      </div>

                      {/* Question Settings - Points and Type on same row */}
                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          alignItems: "center",
                        }}
                      >
                        <Form.Item
                          label="Loại câu hỏi"
                          name={`question_${question.id}_type`}
                          style={{ marginBottom: 0, minWidth: 180 }}
                        >
                          <Select
                            value={question.questionType}
                            onChange={(value) =>
                              updateQuestionType(question.id, value)
                            }
                            disabled={!question.isEditing && !question.isNew}
                            size="small"
                          >
                            <Option value="SINGLE_CHOICE">
                              Trắc nghiệm 1 đáp án
                            </Option>
                            <Option value="MULTIPLE_CHOICE">
                              Trắc nghiệm nhiều đáp án
                            </Option>
                            <Option value="ESSAY">Tự luận</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item
                          label="Điểm"
                          name={`question_${question.id}_points`}
                          style={{ marginBottom: 0, minWidth: 120 }}
                          initialValue={question.points || 1}
                        >
                          <InputNumber
                            min={1}
                            max={100}
                            size="small"
                            onChange={(value) =>
                              updateQuestionPoints(question.id, value || 1)
                            }
                            disabled={!question.isEditing && !question.isNew}
                          />
                        </Form.Item>

                        {/* Essay-specific settings */}
                        {question.questionType === "ESSAY" && (
                          <Form.Item
                            label="Độ dài tối đa"
                            name={`question_${question.id}_maxLength`}
                            style={{ marginBottom: 0, flex: 1 }}
                            initialValue={question.maxLength || 1000}
                          >
                            <InputNumber
                              min={50}
                              max={5000}
                              step={50}
                              size="small"
                              onChange={(value) =>
                                updateQuestionMaxLength(
                                  question.id,
                                  value || 1000,
                                )
                              }
                              disabled={!question.isEditing && !question.isNew}
                              placeholder="Ký tự"
                            />
                          </Form.Item>
                        )}
                      </div>
                    </div>

                    {/* Answers - Only for choice questions */}
                    {question.questionType !== "ESSAY" && (
                      <div style={{ marginTop: 16, marginBottom: 16 }}>
                        {question.answers.map((answer, aIndex) => (
                          <div
                            key={answer.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "8px 12px",
                              borderBottom: "1px solid #f0f0f0",
                              border: "1px solid #d9d9d9",
                              borderRadius: 4,
                              marginBottom: 8,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                minWidth: 24,
                                textAlign: "center",
                              }}
                            >
                              {String.fromCharCode(65 + aIndex)}
                            </span>
                            {question.questionType === "SINGLE_CHOICE" ? (
                              <Radio
                                checked={answer.correct}
                                onChange={() =>
                                  toggleSingleAnswer(question.id, answer.id)
                                }
                                disabled={
                                  !question.isEditing && !question.isNew
                                }
                              />
                            ) : (
                              <Checkbox
                                checked={answer.correct}
                                onChange={() =>
                                  toggleMultipleAnswer(question.id, answer.id)
                                }
                                disabled={
                                  !question.isEditing && !question.isNew
                                }
                              />
                            )}
                            <Input
                              placeholder={`Đáp án ${String.fromCharCode(65 + aIndex)}`}
                              value={answer.content}
                              onChange={(e) =>
                                updateAnswerContent(
                                  question.id,
                                  answer.id,
                                  e.target.value,
                                )
                              }
                              disabled={!question.isEditing && !question.isNew}
                              size="small"
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
                                  size="small"
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
                            size="small"
                            onClick={() => addAnswer(question.id)}
                            icon={<Plus className="w-4 h-4" />}
                            style={{
                              width: "100%",
                              marginTop: 8,
                            }}
                          >
                            Thêm đáp án
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Delete Question Button */}
                    {(question.isEditing || question.isNew) && (
                      <div style={{ marginTop: 12 }}>
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
                            size="small"
                            icon={<Trash2 className="w-4 h-4" />}
                          >
                            Xóa câu hỏi
                          </Button>
                        </Popconfirm>
                      </div>
                    )}
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
      </Form>
    </Modal>
  );
}
