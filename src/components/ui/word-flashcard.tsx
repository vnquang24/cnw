"use client";

import { useState } from "react";
import { Card, Typography, Tag, Space, Button } from "antd";
import { BookOpen, GraduationCap, RefreshCw } from "lucide-react";

const { Title, Paragraph, Text } = Typography;

export interface WordFlashcardData {
  id: string;
  word: string;
  meaning: string;
  description?: string | null;
  wordTypeLabel: string;
  wordTypeColor: string;
  courseTitle?: string;
  lessonTitle?: string;
}

interface WordFlashcardProps {
  data: WordFlashcardData;
}

const WordFlashcard: React.FC<WordFlashcardProps> = ({ data }) => {
  const [flipped, setFlipped] = useState(false);

  const handleToggle = () => setFlipped((prev) => !prev);

  return (
    <Card
      hoverable
      onClick={handleToggle}
      style={{ height: "100%" }}
      bodyStyle={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 220,
      }}
    >
      <Space direction="vertical" size={12} style={{ flex: 1 }}>
        {flipped ? (
          <>
            <Title level={4} style={{ margin: 0 }}>
              Nghĩa
            </Title>
            <Paragraph style={{ margin: 0 }}>{data.meaning}</Paragraph>
            {data.description && (
              <Paragraph type="secondary" style={{ margin: 0 }}>
                {data.description}
              </Paragraph>
            )}
          </>
        ) : (
          <>
            <Space align="center" size={12}>
              <Title level={3} style={{ margin: 0 }}>
                {data.word}
              </Title>
              <Tag color={data.wordTypeColor}>{data.wordTypeLabel}</Tag>
            </Space>
            {data.description ? (
              <Paragraph type="secondary" style={{ margin: 0 }}>
                {data.description}
              </Paragraph>
            ) : (
              <Paragraph type="secondary" style={{ margin: 0 }}>
                Nhấn để xem nghĩa của từ này
              </Paragraph>
            )}
          </>
        )}
      </Space>

      <Space direction="vertical" size={4} style={{ color: "#666" }}>
        <Space size={6}>
          <BookOpen size={16} />
          <Text type="secondary">{data.courseTitle || "Khóa học"}</Text>
        </Space>
        <Space size={6}>
          <GraduationCap size={16} />
          <Text type="secondary">{data.lessonTitle || "Bài học"}</Text>
        </Space>
      </Space>

      <Button
        type="link"
        icon={<RefreshCw size={14} />}
        onClick={(event) => {
          event.stopPropagation();
          handleToggle();
        }}
        style={{ alignSelf: "flex-start", paddingInline: 0 }}
      >
        {flipped ? "Xem từ" : "Xem nghĩa"}
      </Button>
    </Card>
  );
};

export default WordFlashcard;
