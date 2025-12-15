"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Card,
  Col,
  Empty,
  List,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { Award, ClipboardCheck, Clock, FileText } from "lucide-react";
import { useFindManyTestResult } from "@/generated/hooks";
import { getUserId } from "@/lib/auth";

const { Title, Text } = Typography;

const statusConfig: Record<string, { label: string; color: string }> = {
  PASSED: { label: "Đạt", color: "green" },
  FAILED: { label: "Chưa đạt", color: "red" },
};

export default function UserTestsPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  const queryArgs = useMemo(() => {
    if (!userId) return undefined;
    return {
      where: { userId },
      include: {
        component: {
          include: {
            test: true,
            lesson: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" as const },
    };
  }, [userId]);

  const {
    data: testResults,
    isLoading,
    isFetching,
    error,
  } = useFindManyTestResult(queryArgs, {
    enabled: Boolean(userId),
  });

  const totals = useMemo(() => {
    const list = testResults ?? [];
    const totalAttempts = list.length;
    const totalPassed = list.filter((item) => item.status === "PASSED").length;
    const averageMark = totalAttempts
      ? Math.round(
          list.reduce((acc, item) => acc + (item.mark ?? 0), 0) / totalAttempts,
        )
      : 0;
    const bestScore = list.reduce(
      (acc, item) => Math.max(acc, item.mark ?? 0),
      0,
    );

    return { totalAttempts, totalPassed, averageMark, bestScore };
  }, [testResults]);

  if (!userId || isLoading || isFetching) {
    return (
      <div className="flex justify-center items-center h-72">
        <Spin size="large" tip="Đang tải kết quả kiểm tra...">
          <div style={{ minHeight: 50, minWidth: 100 }} />
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải kết quả kiểm tra"
        description="Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
      />
    );
  }

  if (!testResults?.length) {
    return (
      <Empty
        description="Bạn chưa hoàn thành bài kiểm tra nào."
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Title level={3}>Kết quả kiểm tra</Title>
        <Text type="secondary">
          Xem lại lịch sử làm bài và điểm số của bạn.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Số lần làm bài"
              value={totals.totalAttempts}
              prefix={<FileText size={18} className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Bài đạt yêu cầu"
              value={totals.totalPassed}
              prefix={<ClipboardCheck size={18} className="text-emerald-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Điểm trung bình"
              value={totals.averageMark}
              prefix={<Clock size={18} className="text-amber-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Điểm cao nhất"
              value={totals.bestScore}
              prefix={<Award size={18} className="text-purple-500" />}
            />
          </Card>
        </Col>
      </Row>

      <List
        dataSource={testResults}
        renderItem={(item) => {
          const component = item.component;
          const test = component?.test;
          const lesson = component?.lesson;
          const course = lesson?.course;
          const status = statusConfig[item.status] ?? statusConfig.FAILED;

          return (
            <List.Item>
              <Card className="w-full" hoverable>
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Space size={12} wrap>
                    <Tag color={status.color}>{status.label}</Tag>
                    <Tag color="geekblue">Lần làm {item.attemptNumber}</Tag>
                    <Tag color="gold">Điểm: {item.mark ?? 0}</Tag>
                  </Space>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      {test?.name || "Bài kiểm tra"}
                    </Title>
                    <Text type="secondary">
                      {course?.title ? `${course.title} · ` : ""}
                      {lesson?.title || "Bài học"}
                    </Text>
                  </div>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={8}>
                      <InfoRow label="Trạng thái" value={status.label} />
                    </Col>
                    <Col xs={24} md={8}>
                      <InfoRow
                        label="Điểm số"
                        value={`${item.mark ?? 0} điểm`}
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <InfoRow
                        label="Thời lượng"
                        value={`${test?.duration ?? 0} phút`}
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <InfoRow
                        label="Ngày làm bài"
                        value={new Date(item.createdAt).toLocaleString("vi-VN")}
                      />
                    </Col>
                  </Row>
                </Space>
              </Card>
            </List.Item>
          );
        }}
      />
    </Space>
  );
}

type InfoRowProps = {
  label: string;
  value: ReactNode;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <Text type="secondary">{label}</Text>
      <br />
      <Text strong>{value}</Text>
    </div>
  );
}
