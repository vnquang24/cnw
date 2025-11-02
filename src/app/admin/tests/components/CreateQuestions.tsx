"use client";

import { useState } from "react";
import {
  Modal,
  Button,
  Input,
  Select,
  Radio,
  Checkbox,
  Space,
  Card,
  Form,
  message,
} from "antd";
import { Plus, Trash2 } from "lucide-react";
import { useCreateQuestion } from "@/generated/hooks";
import { useCreateAnswer } from "@/generated/hooks";

const { TextArea } = Input;
const { Option } = Select;

interface Answer {
  id: string;
  content: string;
  correct: boolean;
}

interface Question {
  id: string;
  content: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  answers: Answer[];
}

interface CreateQuestionsProps {
  open: boolean;
  testId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CreateQuestions({
  open,
  testId,
  onCancel,
  onSuccess,
}: CreateQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      content: "",
      questionType: "SINGLE_CHOICE",
      answers: [
        { id: "1-1", content: "", correct: false },
        { id: "1-2", content: "", correct: false },
      ],
    },
  ]);

  const createQuestion = useCreateQuestion();
  const createAnswer = useCreateAnswer();

  // Add new question
  const addQuestion = () => {
    const newId = String(questions.length + 1);
    setQuestions([
      ...questions,
      {
        id: newId,
        content: "",
        questionType: "SINGLE_CHOICE",
        answers: [
          { id: `${newId}-1`, content: "", correct: false },
          { id: `${newId}-2`, content: "", correct: false },
        ],
      },
    ]);
  };

  // Remove question
  const removeQuestion = (questionId: string) => {
    if (questions.length === 1) {
      message.warning("Phải có ít nhất 1 câu hỏi!");
      return;
    }
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  // Update question content
  const updateQuestionContent = (questionId: string, content: string) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, content } : q)),
    );
  };

  // Update question type
  const updateQuestionType = (
    questionId: string,
    questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE",
  ) => {
    setQuestions(
      questions.map((q) =>
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
  };

  // Add answer to question
  const addAnswer = (questionId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const newAnswerId = `${questionId}-${q.answers.length + 1}`;
          return {
            ...q,
            answers: [
              ...q.answers,
              { id: newAnswerId, content: "", correct: false },
            ],
          };
        }
        return q;
      }),
    );
  };

  // Remove answer
  const removeAnswer = (questionId: string, answerId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          if (q.answers.length <= 2) {
            message.warning("Phải có ít nhất 2 đáp án!");
            return q;
          }
          return {
            ...q,
            answers: q.answers.filter((a) => a.id !== answerId),
          };
        }
        return q;
      }),
    );
  };

  // Update answer content
  const updateAnswerContent = (
    questionId: string,
    answerId: string,
    content: string,
  ) => {
    setQuestions(
      questions.map((q) =>
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
  };

  // Toggle answer correct (for single choice)
  const toggleSingleAnswer = (questionId: string, answerId: string) => {
    setQuestions(
      questions.map((q) =>
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
  };

  // Toggle answer correct (for multiple choice)
  const toggleMultipleAnswer = (questionId: string, answerId: string) => {
    setQuestions(
      questions.map((q) =>
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
  };

  // Validate and submit
  const handleConfirm = async () => {
    // Validate
    for (const question of questions) {
      if (!question.content.trim()) {
        message.error("Vui lòng nhập nội dung cho tất cả câu hỏi!");
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
        message.error("Mỗi câu hỏi phải có ít nhất 1 đáp án đúng!");
        return;
      }
    }

    try {
      // Create questions and answers
      for (const question of questions) {
        const createdQuestion = await createQuestion.mutateAsync({
          data: {
            testId,
            content: question.content,
            questionType: question.questionType,
          },
        });

        if (createdQuestion) {
          // Create answers for this question
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
      }

      message.success("Tạo câu hỏi thành công!");
      onSuccess();
      // Reset form
      setQuestions([
        {
          id: "1",
          content: "",
          questionType: "SINGLE_CHOICE",
          answers: [
            { id: "1-1", content: "", correct: false },
            { id: "1-2", content: "", correct: false },
          ],
        },
      ]);
    } catch (error) {
      message.error("Có lỗi xảy ra khi tạo câu hỏi!");
      console.error(error);
    }
  };

  return (
    <Modal
      title="Tạo câu hỏi"
      open={open}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          loading={createQuestion.isPending}
        >
          Xác nhận
        </Button>,
      ]}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 10 }}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {questions.map((question, qIndex) => (
            <Card
              key={question.id}
              style={{
                backgroundColor: "#fadadd",
                borderRadius: 16,
                position: "relative",
              }}
              bodyStyle={{ padding: 20 }}
            >
              {/* Question Header */}
              <Space
                direction="vertical"
                style={{ width: "100%", marginBottom: 16 }}
              >
                <Input
                  placeholder={`Câu hỏi ${qIndex + 1}`}
                  value={question.content}
                  onChange={(e) =>
                    updateQuestionContent(question.id, e.target.value)
                  }
                  style={{
                    backgroundColor: "white",
                    borderRadius: 8,
                    fontSize: 16,
                  }}
                  size="large"
                />

                {/* Question Type Selector */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Select
                    value={question.questionType}
                    onChange={(value) => updateQuestionType(question.id, value)}
                    style={{ width: 200 }}
                    dropdownStyle={{
                      backgroundColor: "#f0f0f0",
                      borderRadius: 8,
                    }}
                  >
                    <Option value="SINGLE_CHOICE">Trắc nghiệm 1 đáp án</Option>
                    <Option value="MULTIPLE_CHOICE">
                      Trắc nghiệm nhiều đáp án
                    </Option>
                  </Select>
                </div>
              </Space>

              {/* Answers */}
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="small"
              >
                {question.answers.map((answer) => (
                  <div
                    key={answer.id}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {question.questionType === "SINGLE_CHOICE" ? (
                      <Radio
                        checked={answer.correct}
                        onChange={() =>
                          toggleSingleAnswer(question.id, answer.id)
                        }
                      />
                    ) : (
                      <Checkbox
                        checked={answer.correct}
                        onChange={() =>
                          toggleMultipleAnswer(question.id, answer.id)
                        }
                      />
                    )}
                    <Input
                      placeholder={`Đáp án ${question.answers.indexOf(answer) + 1}`}
                      value={answer.content}
                      onChange={(e) =>
                        updateAnswerContent(
                          question.id,
                          answer.id,
                          e.target.value,
                        )
                      }
                      style={{
                        backgroundColor: "white",
                        borderRadius: 8,
                        flex: 1,
                      }}
                    />
                  </div>
                ))}

                {/* Add Answer Button */}
                <Button
                  type="text"
                  onClick={() => addAnswer(question.id)}
                  style={{
                    backgroundColor: "#e0e0e0",
                    borderRadius: 8,
                    width: "fit-content",
                  }}
                >
                  Thêm đáp án
                </Button>
              </Space>

              {/* Delete Question Button */}
              <Button
                type="text"
                danger
                icon={<Trash2 size={16} />}
                onClick={() => removeQuestion(question.id)}
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                }}
              />
            </Card>
          ))}

          {/* Add Question Button */}
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={addQuestion}
            shape="circle"
            size="large"
            style={{
              backgroundColor: "#fadadd",
              color: "#000",
              border: "none",
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          />
        </Space>
      </div>
    </Modal>
  );
}
