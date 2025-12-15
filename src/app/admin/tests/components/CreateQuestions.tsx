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
  Form,
  message,
  InputNumber,
  Popconfirm,
} from "antd";
import { Plus, Trash2 } from "lucide-react";
import { useCreateQuestion } from "@/generated/hooks";
import { useCreateAnswer } from "@/generated/hooks";
import MediaUpload from "@/components/MediaUpload";

const { Option } = Select;

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
  const [form] = Form.useForm();
  const [questionCount, setQuestionCount] = useState(1);

  const createQuestion = useCreateQuestion();
  const createAnswer = useCreateAnswer();

  // Initialize form with one question when modal opens
  useEffect(() => {
    if (open) {
      const initialValues: any = {};
      for (let i = 0; i < questionCount; i++) {
        initialValues[`question_${i}_content`] = "";
        initialValues[`question_${i}_type`] = "SINGLE_CHOICE";
        initialValues[`question_${i}_points`] = 1;
        initialValues[`question_${i}_maxLength`] = 1000;
        initialValues[`question_${i}_answerCount`] = 2;

        // Initialize 2 answers per question
        for (let j = 0; j < 2; j++) {
          initialValues[`question_${i}_answer_${j}_content`] = "";
          initialValues[`question_${i}_answer_${j}_correct`] = j === 0;
        }
      }
      form.setFieldsValue(initialValues);
    }
  }, [open, form, questionCount]);

  const handleAddQuestion = () => {
    setQuestionCount(questionCount + 1);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questionCount === 1) {
      message.warning("Phải có ít nhất 1 câu hỏi!");
      return;
    }

    // Remove all fields related to this question
    const formValues = form.getFieldsValue();
    const newValues: any = {};

    Object.keys(formValues).forEach((key) => {
      if (!key.startsWith(`question_${index}_`)) {
        newValues[key] = formValues[key];
      }
    });

    form.setFieldsValue(newValues);
    setQuestionCount(questionCount - 1);
  };

  const handleAddAnswer = (questionIndex: number) => {
    const formValues = form.getFieldsValue();
    const answerKey = `question_${questionIndex}_answerCount`;
    const currentCount = formValues[answerKey] || 2;

    const newValues: any = {
      ...formValues,
      [answerKey]: currentCount + 1,
      [`question_${questionIndex}_answer_${currentCount}_content`]: "",
      [`question_${questionIndex}_answer_${currentCount}_correct`]: false,
    };

    form.setFieldsValue(newValues);
  };

  const handleRemoveAnswer = (questionIndex: number, answerIndex: number) => {
    const formValues = form.getFieldsValue();
    const answerKey = `question_${questionIndex}_answerCount`;
    const currentCount = formValues[answerKey] || 2;

    if (currentCount <= 2) {
      message.warning("Phải có ít nhất 2 đáp án!");
      return;
    }

    // Remove the answer
    const newValues: any = { ...formValues };
    delete newValues[`question_${questionIndex}_answer_${answerIndex}_content`];
    delete newValues[`question_${questionIndex}_answer_${answerIndex}_correct`];

    form.setFieldsValue(newValues);
  };

  const handleQuestionTypeChange = (questionIndex: number, type: string) => {
    if (type === "SINGLE_CHOICE") {
      // Reset correct answers - only first should be true
      const formValues = form.getFieldsValue();
      const answerKey = `question_${questionIndex}_answerCount`;
      const answerCount = formValues[answerKey] || 2;

      const newValues: any = { ...formValues };
      for (let i = 0; i < answerCount; i++) {
        newValues[`question_${questionIndex}_answer_${i}_correct`] = i === 0;
      }
      form.setFieldsValue(newValues);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Validate questions
      for (let i = 0; i < questionCount; i++) {
        const content = values[`question_${i}_content`];
        if (!content || !content.trim()) {
          message.error(`Vui lòng nhập nội dung cho câu hỏi ${i + 1}!`);
          return;
        }

        const type = values[`question_${i}_type`];
        const answerKey = `question_${i}_answerCount`;
        const answerCount = values[answerKey] || 2;

        // Validate answers
        let hasCorrectAnswer = false;
        for (let j = 0; j < answerCount; j++) {
          const answerContent = values[`question_${i}_answer_${j}_content`];
          if (!answerContent || !answerContent.trim()) {
            message.error(
              `Vui lòng nhập nội dung cho tất cả đáp án của câu ${i + 1}!`,
            );
            return;
          }

          if (values[`question_${i}_answer_${j}_correct`]) {
            hasCorrectAnswer = true;
          }
        }

        if (!hasCorrectAnswer) {
          message.error(`Câu hỏi ${i + 1} phải có ít nhất 1 đáp án đúng!`);
          return;
        }
      }

      // Create all questions and answers
      for (let i = 0; i < questionCount; i++) {
        const content = values[`question_${i}_content`];
        const type = values[`question_${i}_type`];
        const points = values[`question_${i}_points`] || 1;
        const maxLength = values[`question_${i}_maxLength`] || 1000;
        const mediaFiles = values[`question_${i}_mediaFiles`] || [];
        const answerKey = `question_${i}_answerCount`;
        const answerCount = values[answerKey] || 2;

        const createdQuestion = await createQuestion.mutateAsync({
          data: {
            testId,
            content,
            questionType: type,
            points,
            maxLength: type === "ESSAY" ? maxLength : undefined,
            mediaFiles: {
              create: mediaFiles.map((file: any) => ({
                fileName: file.fileName,
                fileUrl: file.fileUrl,
                fileType: file.fileType,
                fileSize: file.fileSize,
              })),
            },
          },
        });

        if (createdQuestion && type !== "ESSAY") {
          // Create answers only for choice questions
          for (let j = 0; j < answerCount; j++) {
            const answerContent = values[`question_${i}_answer_${j}_content`];
            const isCorrect =
              values[`question_${i}_answer_${j}_correct`] || false;

            await createAnswer.mutateAsync({
              data: {
                questionId: createdQuestion.id,
                content: answerContent,
                correct: isCorrect,
              },
            });
          }
        }
      }

      message.success("Tạo câu hỏi thành công!");
      onSuccess();
      setQuestionCount(1);
      form.resetFields();
    } catch (error) {
      message.error("Có lỗi xảy ra khi tạo câu hỏi!");
      console.error(error);
    }
  };

  return (
    <Modal
      title="Tạo câu hỏi"
      open={open}
      onCancel={() => {
        onCancel();
        setQuestionCount(1);
        form.resetFields();
      }}
      width={900}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            onCancel();
            setQuestionCount(1);
            form.resetFields();
          }}
        >
          Hủy
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={() => form.submit()}
          loading={createQuestion.isPending}
        >
          Xác nhận
        </Button>,
      ]}
      style={{ top: 20 }}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 10 }}>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {Array.from({ length: questionCount }).map((_, qIndex) => {
              const formValues = form.getFieldsValue();
              const answerCountKey = `question_${qIndex}_answerCount`;
              const answerCount = formValues[answerCountKey] || 2;
              const questionType =
                formValues[`question_${qIndex}_type`] || "SINGLE_CHOICE";

              return (
                <Card
                  key={qIndex}
                  style={{
                    backgroundColor: "#fadadd",
                    borderRadius: 16,
                    position: "relative",
                  }}
                  bodyStyle={{ padding: 20 }}
                >
                  {/* Question Content */}
                  <Form.Item
                    label={`Câu hỏi ${qIndex + 1}`}
                    name={`question_${qIndex}_content`}
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập nội dung câu hỏi!",
                      },
                    ]}
                    style={{ marginBottom: 16 }}
                  >
                    <Input
                      placeholder="Nhập nội dung câu hỏi"
                      style={{
                        backgroundColor: "white",
                        borderRadius: 8,
                        fontSize: 16,
                      }}
                      size="large"
                    />
                  </Form.Item>

                  {/* Media Upload */}
                  <Form.Item
                    label="Media (Hình ảnh/Video/Âm thanh - Không giới hạn)"
                    name={`question_${qIndex}_mediaFiles`}
                    style={{ marginBottom: 16 }}
                  >
                    <MediaUpload />
                  </Form.Item>

                  {/* Question Type and Points */}
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      marginBottom: 16,
                      alignItems: "flex-start",
                    }}
                  >
                    <Form.Item
                      label="Loại câu hỏi"
                      name={`question_${qIndex}_type`}
                      style={{ marginBottom: 0, flex: 1 }}
                      initialValue="SINGLE_CHOICE"
                    >
                      <Select
                        style={{ width: "100%" }}
                        onChange={(value) =>
                          handleQuestionTypeChange(qIndex, value)
                        }
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
                      name={`question_${qIndex}_points`}
                      style={{ marginBottom: 0, width: 120 }}
                      initialValue={1}
                    >
                      <InputNumber min={1} max={100} />
                    </Form.Item>

                    {questionType === "ESSAY" && (
                      <Form.Item
                        label="Độ dài tối đa"
                        name={`question_${qIndex}_maxLength`}
                        style={{ marginBottom: 0, width: 150 }}
                        initialValue={1000}
                      >
                        <InputNumber
                          min={50}
                          max={5000}
                          step={50}
                          placeholder="Ký tự"
                        />
                      </Form.Item>
                    )}
                  </div>

                  {/* Answers - Only for choice questions */}
                  {questionType !== "ESSAY" && (
                    <div style={{ marginBottom: 16 }}>
                      <label
                        style={{
                          display: "block",
                          marginBottom: 12,
                          fontWeight: 500,
                        }}
                      >
                        Đáp án
                      </label>
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {Array.from({ length: answerCount }).map(
                          (_, aIndex) => (
                            <div
                              key={aIndex}
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  minWidth: 24,
                                  textAlign: "center",
                                }}
                              >
                                {String.fromCharCode(65 + aIndex)}.
                              </span>

                              {questionType === "SINGLE_CHOICE" ? (
                                <Form.Item
                                  name={`question_${qIndex}_answer_${aIndex}_correct`}
                                  valuePropName="checked"
                                  style={{ marginBottom: 0 }}
                                >
                                  <Radio />
                                </Form.Item>
                              ) : (
                                <Form.Item
                                  name={`question_${qIndex}_answer_${aIndex}_correct`}
                                  valuePropName="checked"
                                  style={{ marginBottom: 0 }}
                                >
                                  <Checkbox />
                                </Form.Item>
                              )}

                              <Form.Item
                                name={`question_${qIndex}_answer_${aIndex}_content`}
                                rules={[
                                  {
                                    required: true,
                                    message: "Vui lòng nhập nội dung đáp án!",
                                  },
                                ]}
                                style={{ marginBottom: 0, flex: 1 }}
                              >
                                <Input
                                  placeholder={`Đáp án ${String.fromCharCode(65 + aIndex)}`}
                                  style={{
                                    backgroundColor: "white",
                                    borderRadius: 8,
                                  }}
                                />
                              </Form.Item>

                              {answerCount > 2 && (
                                <Button
                                  type="text"
                                  danger
                                  icon={<Trash2 size={16} />}
                                  onClick={() =>
                                    handleRemoveAnswer(qIndex, aIndex)
                                  }
                                  size="small"
                                />
                              )}
                            </div>
                          ),
                        )}
                      </Space>

                      <Button
                        type="dashed"
                        size="small"
                        onClick={() => handleAddAnswer(qIndex)}
                        icon={<Plus size={14} />}
                        style={{
                          width: "100%",
                          marginTop: 12,
                        }}
                      >
                        Thêm đáp án
                      </Button>
                    </div>
                  )}

                  {/* Delete Question Button */}
                  {questionCount > 1 && (
                    <Popconfirm
                      title="Xóa câu hỏi này?"
                      description="Hành động này không thể hoàn tác!"
                      onConfirm={() => handleRemoveQuestion(qIndex)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<Trash2 size={16} />}
                        style={{
                          position: "absolute",
                          bottom: 16,
                          right: 16,
                        }}
                      >
                        Xóa câu hỏi
                      </Button>
                    </Popconfirm>
                  )}
                </Card>
              );
            })}

            {/* Add Question Button */}
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={handleAddQuestion}
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
      </Form>
    </Modal>
  );
}
