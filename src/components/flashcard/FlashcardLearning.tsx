"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Progress,
  Statistic,
  Row,
  Col,
  Modal,
  Radio,
  Checkbox,
  message,
  Badge,
  Alert,
  Input,
  InputNumber,
  Form,
} from "antd";
import {
  Shuffle,
  RotateCw,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Target,
  Volume2,
  Plus,
  FileText,
} from "lucide-react";
import {
  useCreateUserWord,
  useFindManyUserWord,
  useDeleteUserWord,
} from "@/generated/hooks";
import { useTestControllerCreateFlashcardTest } from "@/generated/api/cnwComponents";

const { Title, Text, Paragraph } = Typography;

interface Word {
  id: string;
  content: string;
  meaning: string;
  wordType: string;
  phonetic?: string;
}

interface Component {
  id: string;
  word?: Word | null;
}

interface FlashcardLearningProps {
  components: Component[];
  userId: string | null;
  lessonId?: string;
  courseId?: string;
}

export default function FlashcardLearning({
  components,
  userId,
  lessonId,
  courseId,
}: FlashcardLearningProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizType, setQuizType] = useState<"all" | "mastered">("all");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [form] = Form.useForm();

  // Fetch saved words (bookmarked/mastered)
  const userWordsArgs = useMemo(
    () => ({
      where: {
        userId: userId ?? "",
        componentId: { in: components.map((c) => c.id) },
      },
    }),
    [userId, components],
  );

  const { data: savedWords, refetch: refetchSavedWords } = useFindManyUserWord(
    userWordsArgs,
    {
      enabled: Boolean(userId && components.length > 0),
    },
  );

  const createUserWord = useCreateUserWord();
  const deleteUserWord = useDeleteUserWord();

  // Use generated hook for batch create test API
  const createFlashcardTest = useTestControllerCreateFlashcardTest();

  const savedWordIds = useMemo(
    () => new Set((savedWords ?? []).map((sw) => sw.componentId)),
    [savedWords],
  );

  const savedWordsMap = useMemo(
    () => new Map((savedWords ?? []).map((sw) => [sw.componentId, sw])),
    [savedWords],
  );

  const currentCard = components[currentIndex];
  const currentWord = currentCard?.word;
  const isMastered = currentCard ? savedWordIds.has(currentCard.id) : false;

  const handleFlip = () => {
    setShowAnswer(!showAnswer);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= components.length - 1 ? 0 : prev + 1));
    setShowAnswer(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? components.length - 1 : prev - 1));
    setShowAnswer(false);
  };

  const handleShuffle = () => {
    if (components.length <= 1) return;
    const randomIndex = Math.floor(Math.random() * components.length);
    setCurrentIndex(randomIndex);
    setShowAnswer(false);
  };

  const handleToggleMastered = async () => {
    if (!userId || !currentCard) return;

    try {
      if (isMastered) {
        const userWord = savedWordsMap.get(currentCard.id);
        if (userWord) {
          await deleteUserWord.mutateAsync({
            where: { id: userWord.id },
          });
          message.success("Đã bỏ đánh dấu từ này!");
          refetchSavedWords();
        }
      } else {
        await createUserWord.mutateAsync({
          data: {
            userId,
            componentId: currentCard.id,
          },
        });
        message.success("Đã đánh dấu từ này là đã thuộc!");
        refetchSavedWords();
        // Auto move to next card
        setTimeout(() => {
          handleNext();
        }, 500);
      }
    } catch (error) {
      message.error("Không thể cập nhật từ vựng");
    }
  };

  const speakWord = () => {
    if (!currentWord) return;

    // Kiểm tra browser support
    if (!window.speechSynthesis) {
      message.warning("Trình duyệt không hỗ trợ chức năng đọc");
      return;
    }

    // Cancel bất kỳ speech nào đang chạy
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentWord.content);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Thêm error handling
    utterance.onerror = (event) => {
      console.error("Speech error:", event);
      message.error("Không thể phát âm từ này");
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStartQuiz = () => {
    setQuizType("all");
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShowQuizModal(true);
  };

  const handleStartMasteredQuiz = () => {
    if (masteredCount === 0) {
      message.warning("Bạn chưa đánh dấu từ nào là đã thuộc!");
      return;
    }
    setQuizType("mastered");
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShowQuizModal(true);
  };

  const handleQuizAnswerChange = (componentId: string, answer: string) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [componentId]: answer,
    }));
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
  };

  const handleCreateTest = async (values: any) => {
    if (!lessonId) {
      message.error("Không tìm thấy thông tin bài học!");
      return;
    }

    if (!userId) {
      message.error("Không tìm thấy thông tin người dùng!");
      return;
    }

    if (components.length === 0) {
      message.error("Không có từ vựng nào để tạo bài kiểm tra!");
      return;
    }

    setCreatingTest(true);
    try {
      // Gọi batch API với generated hook - chỉ 1 request duy nhất!
      await createFlashcardTest.mutateAsync({
        body: {
          lessonId,
          testName: values.testName,
          duration: values.duration,
          maxAttempts: values.maxAttempts,
          passScore: values.passScore,
          shuffleQuestions: values.shuffleQuestions ?? true,
          shuffleAnswers: values.shuffleAnswers ?? true,
          wordSelection: values.wordSelection || "all",
          userId,
        },
      });

      message.success("Đã tạo thành công bài kiểm tra!", 5);

      setShowCreateTestModal(false);
      form.resetFields();

      // Hiển thị modal thông báo
      Modal.info({
        title: "Tạo bài kiểm tra thành công!",
        content: (
          <div>
            <p>Bài kiểm tra đã được tạo và thêm vào bài học.</p>
            <p>
              <strong>
                Vui lòng tải lại trang (F5) để xem bài kiểm tra mới.
              </strong>
            </p>
          </div>
        ),
        okText: "Đã hiểu",
      });
    } catch (error: any) {
      console.error("Error creating test:", error);
      message.error(
        `Lỗi khi tạo bài kiểm tra: ${error?.payload?.message || error?.message || "Unknown error"}`,
      );
    } finally {
      setCreatingTest(false);
    }
  };

  const getQuizScore = () => {
    const quizCards =
      quizType === "mastered"
        ? components.filter((c) => savedWordIds.has(c.id))
        : components;

    let correct = 0;
    quizCards.forEach((card) => {
      if (card.word && quizAnswers[card.id] === card.word.meaning) {
        correct++;
      }
    });
    return correct;
  };

  const masteredCount = savedWords?.length || 0;
  const overallProgress =
    components.length > 0 ? (masteredCount / components.length) * 100 : 0;

  if (!currentCard || !currentWord) {
    return (
      <Card>
        <Text>Không có thẻ từ vựng nào</Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* Header Controls */}
      <Card>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Space wrap>
              <Button icon={<Target size={16} />} onClick={handleStartQuiz}>
                Kiểm tra tất cả
              </Button>
              {masteredCount > 0 && (
                <Button
                  icon={<BookMarked size={16} />}
                  onClick={handleStartMasteredQuiz}
                  type="primary"
                >
                  Kiểm tra từ đã thuộc ({masteredCount})
                </Button>
              )}
              {lessonId && (
                <Button
                  icon={<Plus size={16} />}
                  onClick={() => setShowCreateTestModal(true)}
                  type="dashed"
                >
                  Tạo bài kiểm tra
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Flashcard */}
      <Card className="flashcard-container">
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          {/* Card Header */}
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Badge
                  count={currentIndex + 1}
                  style={{ backgroundColor: "#1890ff" }}
                />
                <Text type="secondary">/ {components.length} thẻ</Text>
                {isMastered && (
                  <Tag color="success">
                    <Space size={4}>
                      <CheckCircle size={12} />
                      <span>Đã thuộc</span>
                    </Space>
                  </Tag>
                )}
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<Volume2 size={16} />}
                  onClick={speakWord}
                  size="small"
                  type="text"
                >
                  Phát âm
                </Button>
                <Button
                  icon={
                    isMastered ? (
                      <CheckCircle size={16} />
                    ) : (
                      <BookMarked size={16} />
                    )
                  }
                  onClick={handleToggleMastered}
                  type={isMastered ? "primary" : "default"}
                  size="small"
                >
                  {isMastered ? "Đã thuộc" : "Đánh dấu"}
                </Button>
              </Space>
            </Col>
          </Row>

          {/* Flashcard Display */}
          <Card
            hoverable
            onClick={handleFlip}
            style={{
              minHeight: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              background: showAnswer
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              border: "none",
              transition: "all 0.3s ease",
            }}
            bodyStyle={{
              width: "100%",
              padding: "48px 24px",
            }}
          >
            <Space
              direction="vertical"
              size={24}
              style={{
                width: "100%",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {!showAnswer ? (
                <>
                  <Title
                    level={1}
                    style={{ margin: 0, color: "#fff", fontSize: "3rem" }}
                  >
                    {currentWord.content}
                  </Title>
                  <Tag
                    color="white"
                    style={{ color: "#f5576c", fontSize: "1rem" }}
                  >
                    {currentWord.wordType}
                  </Tag>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: "1.1rem",
                    }}
                  >
                    Nhấp để xem nghĩa
                  </Text>
                </>
              ) : (
                <>
                  <Title level={2} style={{ margin: 0, color: "#fff" }}>
                    {currentWord.content}
                  </Title>
                  <Paragraph
                    style={{
                      color: "#fff",
                      fontSize: "1.5rem",
                      margin: 0,
                      lineHeight: 1.8,
                    }}
                  >
                    {currentWord.meaning}
                  </Paragraph>
                  <Tag
                    color="white"
                    style={{ color: "#764ba2", fontSize: "1rem" }}
                  >
                    {currentWord.wordType}
                  </Tag>
                </>
              )}
            </Space>
          </Card>

          {/* Navigation Controls */}
          <Row gutter={[8, 8]} justify="center">
            <Col>
              <Button
                icon={<ChevronLeft size={16} />}
                onClick={handlePrevious}
                size="large"
              >
                Trước
              </Button>
            </Col>
            <Col>
              <Button
                icon={<Shuffle size={16} />}
                onClick={handleShuffle}
                size="large"
              >
                Ngẫu nhiên
              </Button>
            </Col>
            <Col>
              <Button
                icon={<RotateCw size={16} />}
                onClick={handleFlip}
                size="large"
                type="primary"
              >
                Lật thẻ
              </Button>
            </Col>
            <Col>
              <Button
                icon={<ChevronRight size={16} />}
                onClick={handleNext}
                size="large"
              >
                Tiếp
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Quiz Modal - Full Screen */}
      <Modal
        title={
          <Space>
            <Target size={20} />
            <span>
              {quizType === "mastered"
                ? `Kiểm tra từ đã thuộc (${masteredCount} từ)`
                : `Bài kiểm tra từ vựng (${components.length} từ)`}
            </span>
          </Space>
        }
        open={showQuizModal}
        onCancel={() => setShowQuizModal(false)}
        footer={
          !quizSubmitted ? (
            <Button type="primary" onClick={handleSubmitQuiz} size="large">
              Nộp bài
            </Button>
          ) : (
            <Button onClick={() => setShowQuizModal(false)} size="large">
              Đóng
            </Button>
          )
        }
        width="95vw"
        style={{ top: 20, maxWidth: 1400 }}
        bodyStyle={{
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          padding: "24px",
        }}
      >
        {quizSubmitted ? (
          <Alert
            message={`Kết quả: ${getQuizScore()}/${quizType === "mastered" ? masteredCount : components.length} câu đúng`}
            type={
              getQuizScore() >=
              (quizType === "mastered" ? masteredCount : components.length) *
                0.7
                ? "success"
                : "warning"
            }
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : null}

        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          {(quizType === "mastered"
            ? components.filter((c) => savedWordIds.has(c.id))
            : components
          ).map((card, idx) => {
            if (!card.word) return null;

            const isCorrect =
              quizSubmitted && quizAnswers[card.id] === card.word.meaning;
            const isWrong =
              quizSubmitted &&
              quizAnswers[card.id] &&
              quizAnswers[card.id] !== card.word.meaning;

            // Lấy tất cả các meanings từ danh sách quiz hiện tại
            const quizCards =
              quizType === "mastered"
                ? components.filter((c) => savedWordIds.has(c.id))
                : components;

            const allMeanings = quizCards
              .map((c) => c.word?.meaning)
              .filter((m): m is string => Boolean(m));

            // Hash function deterministic để đáp án không nhảy
            const simpleHash = (str: string, seed: string) => {
              let hash = 0;
              const combined = str + seed;
              for (let i = 0; i < combined.length; i++) {
                const char = combined.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash = hash & hash; // Convert to 32bit integer
              }
              return hash;
            };

            // Lấy 3 đáp án sai ngẫu nhiên nhưng cố định cho mỗi câu
            const wrongMeanings = allMeanings
              .filter((m) => m !== card.word?.meaning)
              .sort((a, b) => simpleHash(a, card.id) - simpleHash(b, card.id))
              .slice(0, 3);

            // Kết hợp đáp án đúng và sai, sau đó shuffle với hash cố định
            const shuffledMeanings = [card.word.meaning, ...wrongMeanings].sort(
              (a, b) =>
                simpleHash(a, card.id + "options") -
                simpleHash(b, card.id + "options"),
            );

            return (
              <Card
                key={card.id}
                style={{
                  border: isCorrect
                    ? "2px solid #52c41a"
                    : isWrong
                      ? "2px solid #ff4d4f"
                      : undefined,
                }}
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Title level={5} style={{ margin: 0 }}>
                    Câu {idx + 1}: {card.word.content}
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {card.word.wordType}
                    </Tag>
                    {quizSubmitted &&
                      (isCorrect ? (
                        <Tag color="success">
                          <Space size={4}>
                            <CheckCircle size={12} />
                            <span>Đúng</span>
                          </Space>
                        </Tag>
                      ) : isWrong ? (
                        <Tag color="error">
                          <Space size={4}>
                            <X size={12} />
                            <span>Sai</span>
                          </Space>
                        </Tag>
                      ) : null)}
                  </Title>

                  <Radio.Group
                    value={quizAnswers[card.id]}
                    onChange={(e) =>
                      handleQuizAnswerChange(card.id, e.target.value)
                    }
                    disabled={quizSubmitted}
                    style={{ width: "100%" }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {shuffledMeanings.map((meaning, optionIdx) => {
                        const isThisCorrect = meaning === card.word?.meaning;
                        const isSelected = quizAnswers[card.id] === meaning;

                        let radioStyle: React.CSSProperties = {};
                        if (quizSubmitted) {
                          if (isThisCorrect) {
                            radioStyle = {
                              color: "#52c41a",
                              fontWeight: "bold",
                            };
                          } else if (isSelected && !isThisCorrect) {
                            radioStyle = { color: "#ff4d4f" };
                          }
                        }

                        return (
                          <Radio
                            key={`${card.id}-${optionIdx}`}
                            value={meaning}
                            style={radioStyle}
                          >
                            {meaning}
                            {quizSubmitted && isThisCorrect && (
                              <CheckCircle
                                size={14}
                                style={{ marginLeft: 8, color: "#52c41a" }}
                              />
                            )}
                          </Radio>
                        );
                      })}
                    </Space>
                  </Radio.Group>

                  {quizSubmitted && isWrong && (
                    <Alert
                      message={`Đáp án đúng: ${card.word.meaning}`}
                      type="info"
                      showIcon
                      style={{ marginTop: 8 }}
                    />
                  )}
                </Space>
              </Card>
            );
          })}
        </Space>
      </Modal>

      {/* Create Test Modal */}
      <Modal
        title={
          <Space>
            <FileText size={20} />
            <span>Tạo bài kiểm tra từ vựng</span>
          </Space>
        }
        open={showCreateTestModal}
        onCancel={() => {
          setShowCreateTestModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Tạo bài kiểm tra"
        cancelText="Hủy"
        confirmLoading={creatingTest}
        width={600}
      >
        <Alert
          message="Bài kiểm tra sẽ được tạo và thêm vào bài học này"
          description={`Hệ thống sẽ tự động tạo ${components.length} câu hỏi trắc nghiệm từ các từ vựng trong bài.`}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTest}
          initialValues={{
            testName: `Kiểm tra từ vựng - ${new Date().toLocaleDateString("vi-VN")}`,
            duration: 30,
            maxAttempts: 3,
            passScore: 7,
            shuffleQuestions: true,
            shuffleAnswers: true,
            wordSelection: "all",
          }}
        >
          <Form.Item
            label="Tên bài kiểm tra"
            name="testName"
            rules={[
              { required: true, message: "Vui lòng nhập tên bài kiểm tra" },
            ]}
          >
            <Input placeholder="Nhập tên bài kiểm tra" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Thời gian (phút)"
                name="duration"
                rules={[{ required: true, message: "Vui lòng nhập thời gian" }]}
              >
                <InputNumber min={5} max={180} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Số lần làm tối đa"
                name="maxAttempts"
                rules={[{ required: true, message: "Vui lòng nhập số lần" }]}
              >
                <InputNumber min={1} max={10} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Điểm đạt (trên 10)"
            name="passScore"
            rules={[{ required: true, message: "Vui lòng nhập điểm đạt" }]}
          >
            <InputNumber min={1} max={10} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Chọn từ vựng để tạo câu hỏi"
            name="wordSelection"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="all">Tất cả ({components.length} từ)</Radio>
                <Radio value="mastered" disabled={masteredCount === 0}>
                  Chỉ từ đã thuộc ({masteredCount} từ)
                </Radio>
                <Radio
                  value="unmastered"
                  disabled={components.length - masteredCount === 0}
                >
                  Chỉ từ chưa thuộc ({components.length - masteredCount} từ)
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="shuffleQuestions" valuePropName="checked">
            <Checkbox>Xáo trộn thứ tự câu hỏi</Checkbox>
          </Form.Item>

          <Form.Item name="shuffleAnswers" valuePropName="checked">
            <Checkbox>Xáo trộn thứ tự đáp án</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .flashcard-container .ant-card {
          transition: transform 0.3s ease;
        }
        .flashcard-container .ant-card:hover {
          transform: scale(1.02);
        }
      `}</style>
    </Space>
  );
}
