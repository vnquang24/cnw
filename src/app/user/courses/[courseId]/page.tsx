"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  List,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { StatusTag } from "@/components/ui/status-tag";
import { InfoBadge } from "@/components/ui/info-badge";
import {
  BookOpen,
  ChevronLeft,
  Compass,
  Layers,
  UserRound,
} from "lucide-react";
import {
  useFindUniqueCourse,
  useFindManyUserLesson,
  useFindManyUserCourse,
} from "@/generated/hooks";
import { getUserId } from "@/lib/auth";

const { Title, Text, Paragraph } = Typography;

const lessonStatusConfig: Record<
  string,
  {
    label: string;
    status: "success" | "error" | "warning" | "info" | "default";
    icon: React.ReactNode;
  }
> = {
  TODO: { label: "Chưa học", status: "default", icon: <BookOpen size={14} /> },
  DOING: { label: "Đang học", status: "info", icon: <Compass size={14} /> },
  PASS: {
    label: "Hoàn thành",
    status: "success",
    icon: <BookOpen size={14} />,
  },
  FAIL: {
    label: "Cần ôn lại",
    status: "warning",
    icon: <BookOpen size={14} />,
  },
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string | undefined;
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  const courseQueryArgs = useMemo(
    () => ({
      where: { id: courseId ?? "" },
      include: {
        creator: true,
        lessons: {
          include: {
            components: true,
          },
          orderBy: { position: "asc" as const },
        },
      },
    }),
    [courseId],
  );

  const {
    data: course,
    isLoading: courseLoading,
    isFetching: courseFetching,
    error: courseError,
  } = useFindUniqueCourse(courseQueryArgs, {
    enabled: Boolean(courseId),
  });

  const userLessonsArgs = useMemo(
    () => ({
      where: {
        userId: userId ?? "",
        lesson: {
          courseId: courseId ?? "",
        },
      },
    }),
    [userId, courseId],
  );

  const { data: userLessons } = useFindManyUserLesson(userLessonsArgs, {
    enabled: Boolean(userId && courseId),
  });

  const enrolmentArgs = useMemo(
    () => ({
      where: {
        userId: userId ?? "",
        courseId: courseId ?? "",
      },
      take: 1,
    }),
    [userId, courseId],
  );

  const { data: enrolment } = useFindManyUserCourse(enrolmentArgs, {
    enabled: Boolean(userId && courseId),
  });

  const lessonStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    (userLessons ?? []).forEach((entry) => {
      map.set(entry.lessonId, entry.status);
    });
    return map;
  }, [userLessons]);

  if (!courseId || courseLoading || courseFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải thông tin khóa học...">
          <div style={{ minHeight: 50, minWidth: 100 }} />
        </Spin>
      </div>
    );
  }

  if (courseError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải khóa học"
        description="Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
      />
    );
  }

  if (!course) {
    return <Empty description="Không tìm thấy khóa học." />;
  }

  const enrolmentInfo = enrolment?.[0];
  const progressValue = Math.min(enrolmentInfo?.progress ?? 0, 100);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Button
        icon={<ChevronLeft size={16} />}
        onClick={() => router.back()}
        style={{ width: "fit-content" }}
      >
        Quay lại
      </Button>

      <Card>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={18}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Space size={12}>
                <Avatar
                  shape="square"
                  size={64}
                  style={{ backgroundColor: "#1677ff20" }}
                >
                  <BookOpen size={28} className="text-blue-600" />
                </Avatar>
                <div>
                  <Title level={3} style={{ margin: 0 }}>
                    {course.title}
                  </Title>
                  <Space size={16} wrap>
                    <InfoBadge
                      icon={<BookOpen size={14} />}
                      text={`${course.duration} phút`}
                      type="secondary"
                      size="small"
                    />
                    <InfoBadge
                      icon={<Layers size={14} />}
                      text={`${course.lessons?.length || 0} bài học`}
                      type="secondary"
                      size="small"
                    />
                  </Space>
                </div>
              </Space>
              {course.description && (
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {course.description}
                </Paragraph>
              )}
              <InfoBadge
                icon={<UserRound size={16} />}
                text={`Giảng viên: ${course.creator?.name || "Chưa cập nhật"}`}
                type="secondary"
              />
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Card variant="borderless" className="bg-gray-50">
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Statistic
                  title="Tiến độ khóa học"
                  value={progressValue}
                  suffix="%"
                />
                <Progress
                  percent={progressValue}
                  status={progressValue === 100 ? "success" : undefined}
                />
                {enrolmentInfo?.enrolmentStatus && (
                  <StatusTag
                    status="info"
                    text={enrolmentInfo.enrolmentStatus}
                    minWidth={100}
                  />
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card
        title="Danh sách bài học"
        extra={
          <InfoBadge
            icon={<BookOpen size={14} />}
            text={`${course.lessons?.length || 0} bài`}
            type="default"
            size="small"
          />
        }
      >
        {course.lessons?.length ? (
          <List
            itemLayout="vertical"
            dataSource={course.lessons}
            renderItem={(lesson, index) => {
              const statusKey = lessonStatusMap.get(lesson.id) ?? "TODO";
              const status =
                lessonStatusConfig[statusKey] ?? lessonStatusConfig.TODO;
              const componentCount = lesson.components?.length ?? 0;

              return (
                <List.Item
                  key={lesson.id}
                  actions={[
                    <Link
                      key="learn"
                      href={`/user/courses/${course.id}/lessons/${lesson.id}`}
                    >
                      <Button type="primary">Bắt đầu học</Button>
                    </Link>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <StatusTag
                        status={"default"}
                        text={`Bài ${lesson.position ?? index + 1}`}
                        minWidth={70}
                      />
                    }
                    title={
                      <Space size={8} wrap>
                        <Text strong>{lesson.title}</Text>
                        <StatusTag
                          status={status.status}
                          icon={status.icon}
                          text={status.label}
                          minWidth={100}
                        />
                      </Space>
                    }
                    description={
                      <Space size={16} wrap>
                        <InfoBadge
                          icon={<Layers size={16} />}
                          text={`${componentCount} nội dung`}
                          type="secondary"
                        />
                        <InfoBadge
                          icon={<Compass size={16} />}
                          text={`Cập nhật ${new Date(lesson.updatedAt).toLocaleDateString("vi-VN")}`}
                          type="secondary"
                        />
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty description="Khóa học chưa có bài học." />
        )}
      </Card>
    </Space>
  );
}
