"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { CheckCircle2, Clock, Layers, RefreshCw } from "lucide-react";
import { useFindManyUserLesson } from "@/generated/hooks";
import { getUserId } from "@/lib/auth";

const { Title, Text } = Typography;

const lessonStatusConfig: Record<string, { label: string; color?: string }> = {
  TODO: { label: "Chưa học" },
  DOING: { label: "Đang học", color: "blue" },
  PASS: { label: "Hoàn thành", color: "green" },
  FAIL: { label: "Cần ôn lại", color: "volcano" },
};

type CourseProgress = {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  learnedLessons: number;
  doingLessons: number;
  retryLessons: number;
  remainingLessons: number;
  completionRate: number;
};

export default function UserProgressPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  const queryArgs = useMemo(() => {
    if (!userId) return undefined;
    return {
      where: { userId },
      include: {
        lesson: {
          include: {
            course: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" as const },
    };
  }, [userId]);

  const {
    data: userLessons,
    isLoading,
    isFetching,
    error,
  } = useFindManyUserLesson(queryArgs, {
    enabled: Boolean(userId),
  });

  const { courses, stats } = useMemo(() => {
    const list = userLessons ?? [];
    const map = new Map<
      string,
      CourseProgress & {
        passCount: number;
        failCount: number;
        doingCount: number;
        todoCount: number;
      }
    >();

    list.forEach((entry) => {
      const lesson = entry.lesson;
      const course = lesson?.course;
      if (!lesson || !course) return;

      const totalLessons = course.lessons?.length ?? 0;
      if (!map.has(course.id)) {
        map.set(course.id, {
          courseId: course.id,
          courseTitle: course.title,
          totalLessons,
          learnedLessons: 0,
          doingLessons: 0,
          retryLessons: 0,
          remainingLessons: 0,
          completionRate: 0,
          passCount: 0,
          failCount: 0,
          doingCount: 0,
          todoCount: 0,
        });
      }

      const record = map.get(course.id)!;
      switch (entry.status) {
        case "PASS":
          record.passCount += 1;
          break;
        case "FAIL":
          record.failCount += 1;
          break;
        case "DOING":
          record.doingCount += 1;
          break;
        default:
          record.todoCount += 1;
          break;
      }
    });

    const courses: CourseProgress[] = Array.from(map.values()).map((course) => {
      const total =
        course.totalLessons ||
        course.passCount +
          course.failCount +
          course.doingCount +
          course.todoCount;
      const learned = course.passCount;
      const doing = course.doingCount;
      const retry = course.failCount;
      const remaining = Math.max(total - (learned + doing + retry), 0);
      const completionRate = total ? Math.round((learned / total) * 100) : 0;

      return {
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        totalLessons: total,
        learnedLessons: learned,
        doingLessons: doing,
        retryLessons: retry,
        remainingLessons: remaining,
        completionRate,
      };
    });

    const stats = courses.reduce(
      (acc, course) => {
        acc.totalLessons += course.totalLessons;
        acc.completed += course.learnedLessons;
        acc.doing += course.doingLessons;
        acc.retry += course.retryLessons;
        return acc;
      },
      { totalLessons: 0, completed: 0, doing: 0, retry: 0 },
    );

    return { courses, stats };
  }, [userLessons]);

  const completionPercent = useMemo(() => {
    const total = stats.totalLessons || 0;
    if (!total) return 0;
    return Math.round((stats.completed / total) * 100);
  }, [stats.completed, stats.totalLessons]);

  if (!userId || isLoading || isFetching) {
    return (
      <div className="flex justify-center items-center h-72">
        <Spin size="large" tip="Đang tải tiến độ học tập...">
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
        message="Không thể tải tiến độ học tập"
        description="Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
      />
    );
  }

  if (!userLessons?.length) {
    return (
      <Empty
        description="Bạn chưa bắt đầu bài học nào."
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={3}>Tiến độ học tập</Title>
          <Text type="secondary">
            Theo dõi trạng thái từng khóa học và bài học bạn đã tham gia.
          </Text>
        </Col>
        <Col>
          <div style={{ textAlign: "right" }}>
            <Progress
              type="circle"
              percent={completionPercent}
              width={76}
              strokeWidth={10}
              strokeColor={
                completionPercent === 100
                  ? { "0%": "#a7f3d0", "100%": "#10b981" }
                  : { "0%": "#e0f2fe", "100%": "#667eea" }
              }
            />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(2,6,23,0.06)",
            }}
          >
            <Statistic
              title="Tổng bài học"
              value={stats.totalLessons}
              prefix={<Layers size={18} className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(2,6,23,0.06)",
            }}
          >
            <Statistic
              title="Đã hoàn thành"
              value={stats.completed}
              prefix={<CheckCircle2 size={18} className="text-emerald-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(2,6,23,0.06)",
            }}
          >
            <Statistic
              title="Đang học"
              value={stats.doing}
              prefix={<Clock size={18} className="text-amber-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(2,6,23,0.06)",
            }}
          >
            <Statistic
              title="Cần ôn lại"
              value={stats.retry}
              prefix={<RefreshCw size={18} className="text-rose-500" />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {courses.map((course) => (
          <Col xs={24} md={12} key={course.courseId}>
            <Card
              hoverable
              style={{
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
                transition: "transform 0.12s ease, box-shadow 0.12s ease",
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow =
                  "0 18px 50px rgba(2,6,23,0.09)";
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(2,6,23,0.06)";
              }}
            >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div>
                  <Title level={4} style={{ marginBottom: 4 }}>
                    {course.courseTitle}
                  </Title>
                  <Text type="secondary">
                    {course.learnedLessons}/{course.totalLessons} bài học đã
                    hoàn thành
                  </Text>
                </div>
                <Progress
                  percent={course.completionRate}
                  status={course.completionRate === 100 ? "success" : undefined}
                />
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <StatTag
                      label="Đang học"
                      value={course.doingLessons}
                      status="DOING"
                    />
                  </Col>
                  <Col span={12}>
                    <StatTag
                      label="Cần ôn lại"
                      value={course.retryLessons}
                      status="FAIL"
                    />
                  </Col>
                  <Col span={12}>
                    <StatTag
                      label="Chưa học"
                      value={course.remainingLessons}
                      status="TODO"
                    />
                  </Col>
                  <Col span={12}>
                    <StatTag
                      label="Đã hoàn thành"
                      value={course.learnedLessons}
                      status="PASS"
                    />
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}

type StatTagProps = {
  label: string;
  value: number;
  status: keyof typeof lessonStatusConfig;
};

function StatTag({ label, value, status }: StatTagProps) {
  const config = lessonStatusConfig[status];
  return (
    <Card
      size="small"
      bordered={false}
      style={{
        backgroundColor: "#fafafa",
        borderRadius: 8,
        padding: 10,
        boxShadow: "0 6px 18px rgba(2,6,23,0.04)",
      }}
    >
      <Space direction="vertical" size={4}>
        <Text type="secondary">{label}</Text>
        <Tag color={config.color} style={{ width: "fit-content" }}>
          {config.label}: {value}
        </Tag>
      </Space>
    </Card>
  );
}
