"use client";

import Link from "next/link";
import { Button, Typography, Tag, Spin, Alert } from "antd";
import { ChevronLeft, Calendar, Clock, Users, BookOpen } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useFindUniqueCourse } from "@/generated/hooks";

const { Title, Text } = Typography;

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const {
    data: course,
    isLoading,
    error,
  } = useFindUniqueCourse(
    {
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        lessons: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            position: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            userCourses: true,
          },
        },
      },
    },
    {
      // Chỉ query khi có id
      enabled: !!id,
    },
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6">
        <Alert
          message="Lỗi"
          description="Không thể tải thông tin khóa học. Vui lòng thử lại sau."
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => router.back()}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  // Mapping cho status và level
  const statusMap = {
    ACTIVE: { color: "green", text: "Đang hoạt động" },
    INACTIVE: { color: "red", text: "Đã hủy" },
  } as const;

  const levelMap = {
    BEGINNER: { color: "green", text: "Cơ bản" },
    INTERMEDIATE: { color: "blue", text: "Trung cấp" },
    ADVANCED: { color: "orange", text: "Nâng cao" },
  } as const;

  const statusInfo = statusMap[course.status as keyof typeof statusMap] || {
    color: "default",
    text: course.status,
  };

  const levelInfo = levelMap[course.level as keyof typeof levelMap] || {
    color: "default",
    text: course.level,
  };

  return (
    <div>
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/admin/courses"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại danh sách khóa học
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Chi tiết khóa học
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="col-span-2 space-y-6">
            {/* Course Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {course.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                    <Tag color={levelInfo.color}>{levelInfo.text}</Tag>
                  </div>
                </div>
                {/* <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Chỉnh sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 bg-transparent"
                  >
                    Xóa
                  </Button>
                </div> */}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    Mô tả khóa học
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {course.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Lessons Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách bài học ({course.lessons?.length || 0})
                </h3>
                <Button className="bg-blue-600 hover:bg-blue-700" size="middle">
                  + Thêm bài học
                </Button>
              </div>

              <div className="space-y-2">
                {course.lessons?.map((lesson: any, index: number) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {lesson.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="default"
                        size="small"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Xem
                      </Button>
                      <Button
                        type="default"
                        size="small"
                        className="text-gray-600 hover:text-gray-700"
                      >
                        Sửa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">
                Thông tin khóa học
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Thời lượng</div>
                    <div className="text-sm font-medium text-gray-900">
                      {course.duration} phút
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Học viên</div>
                    <div className="text-sm font-medium text-gray-900">
                      {course._count?.userCourses || 0}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Bài học</div>
                    <div className="text-sm font-medium text-gray-900">
                      {course._count?.lessons || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">
                Lịch sử
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Ngày tạo</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(course.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">
                      Cập nhật lần cuối
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(course.updatedAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
