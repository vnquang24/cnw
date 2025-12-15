"use client";

import Link from "next/link";
import {
  Button,
  Tag,
  Spin,
  Alert,
  Modal,
  Form,
  Input,
  InputNumber,
  App,
  Space,
  Table,
} from "antd";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Settings,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import {
  useFindUniqueCourse,
  useFindManyLesson,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from "@/generated/hooks";
import { useLessonModal } from "@/components/modal/LessonModalContext";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getUserId, getUserInfo } from "@/lib/auth";
import { Can } from "@/components/permissions/Can";

interface LessonData {
  id: string;
  title: string;
  position: number;
  _count?: {
    components: number;
    userLessons: number;
  };
  creator?: {
    id: string;
    name: string | null;
  } | null;
}

interface LessonFormData {
  title: string;
  position: number;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const currentUserId = getUserId(); // Lấy ID giáo viên hiện tại
  const userInfo = getUserInfo();
  const isSuperAdmin = userInfo?.sub === "superadmin@gmail.com";

  const { openViewModal, openEditModal } = useLessonModal();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonData | null>(null);
  const [form] = Form.useForm();

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
        _count: {
          select: {
            lessons: true,
            userCourses: true,
          },
        },
      },
    },
    {
      enabled: !!id,
    },
  );

  // Fetch lessons
  const { data: lessons, isLoading: lessonsLoading } = useFindManyLesson(
    {
      where: { courseId: id },
      include: {
        _count: {
          select: {
            components: true,
            userLessons: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { position: "asc" },
    },
    {
      enabled: !!id,
    },
  );

  // Mutations
  const createLessonMutation = useCreateLesson({
    onSuccess: () => {
      message.success("Thêm bài học thành công!");
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["Lesson"] });
      queryClient.invalidateQueries({ queryKey: ["Course"] });
    },
    onError: (error) => {
      console.error("Error creating lesson:", error);
      message.error("Có lỗi xảy ra khi thêm bài học!");
    },
  });

  const updateLessonMutation = useUpdateLesson({
    onSuccess: () => {
      message.success("Cập nhật bài học thành công!");
      setIsModalOpen(false);
      setEditingLesson(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["Lesson"] });
      queryClient.invalidateQueries({ queryKey: ["Course"] });
    },
    onError: (error) => {
      console.error("Error updating lesson:", error);
      message.error("Có lỗi xảy ra khi cập nhật bài học!");
    },
  });

  const deleteLessonMutation = useDeleteLesson({
    onSuccess: () => {
      message.success("Xóa bài học thành công!");
      queryClient.invalidateQueries({ queryKey: ["Lesson"] });
      queryClient.invalidateQueries({ queryKey: ["Course"] });
    },
    onError: (error) => {
      console.error("Error deleting lesson:", error);
      message.error("Có lỗi xảy ra khi xóa bài học!");
    },
  });

  // Handlers
  const handleAddLesson = () => {
    setEditingLesson(null);
    form.resetFields();
    form.setFieldsValue({
      position: (lessons?.length || 0) + 1,
    });
    setIsModalOpen(true);
  };

  const handleEditLesson = (lesson: LessonData) => {
    setEditingLesson(lesson);
    form.setFieldsValue({
      title: lesson.title,
      position: lesson.position,
    });
    setIsModalOpen(true);
  };

  const handleDeleteLesson = (lessonId: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content:
        "Bạn có chắc chắn muốn xóa bài học này? Tất cả thành phần bên trong sẽ bị xóa.",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: () => {
        deleteLessonMutation.mutate({
          where: { id: lessonId },
        });
      },
    });
  };

  const handleSubmit = async (values: LessonFormData) => {
    try {
      const data = {
        title: values.title,
        position: values.position,
        courseId: id,
        createdBy: getUserId(),
      };

      if (editingLesson) {
        await updateLessonMutation.mutateAsync({
          where: { id: editingLesson.id },
          data: {
            title: values.title,
            position: values.position,
          },
        });
      } else {
        await createLessonMutation.mutateAsync({
          data,
        });
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

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

  // Kiểm tra authorization - chỉ creator hoặc superadmin mới được truy cập
  const isCreator = course.createdBy === currentUserId;
  if (!isCreator && !isSuperAdmin) {
    return (
      <div className="p-6">
        <Alert
          message="Không có quyền truy cập"
          description="Bạn không có quyền truy cập khóa học này. Chỉ giáo viên tạo khóa học mới có thể quản lý."
          type="warning"
          showIcon
          action={
            <Button
              type="primary"
              onClick={() => router.push("/admin/courses")}
            >
              Quay lại danh sách khóa học
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

  // Table columns for lessons
  const columns = [
    {
      title: "STT",
      dataIndex: "position",
      key: "position",
      width: 80,
      render: (position: number) => (
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
          {position}
        </div>
      ),
    },
    {
      title: "Tên bài học",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: LessonData) => (
        <Link
          href={`/admin/courses/${id}/lessons/${record.id}`}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {title}
        </Link>
      ),
    },
    {
      title: "Thành phần",
      key: "components",
      width: 120,
      render: (record: LessonData) => (
        <Tag color="blue">{record._count?.components || 0} thành phần</Tag>
      ),
    },
    {
      title: "Học viên hoàn thành",
      key: "userLessons",
      width: 150,
      render: (record: LessonData) => (
        <Tag color="green">{record._count?.userLessons || 0} học viên</Tag>
      ),
    },
    {
      title: "Tác giả",
      key: "creator",
      width: 120,
      render: (record: LessonData) => (
        <span className="text-sm text-gray-600">
          {record.creator?.name || "N/A"}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 250,
      render: (record: LessonData) => (
        <Space size="small">
          <Link href={`/admin/courses/${id}/lessons/${record.id}`}>
            <Button
              type="default"
              size="small"
              icon={<Settings className="w-4 h-4" />}
              className="text-purple-600 hover:text-purple-700"
            >
              Chi tiết
            </Button>
          </Link>
          <Button
            type="default"
            size="small"
            onClick={() => openViewModal(record.id)}
            className="text-blue-600 hover:text-blue-700"
          >
            Xem
          </Button>
          <Can do="UPDATE" on="Lesson">
            <Button
              type="default"
              size="small"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => handleEditLesson(record)}
              className="text-gray-600 hover:text-gray-700"
            >
              Sửa
            </Button>
          </Can>
          <Can do="DELETE" on="Lesson">
            <Button
              type="default"
              size="small"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => handleDeleteLesson(record.id)}
              className="text-red-600 hover:text-red-700"
              danger
            >
              Xóa
            </Button>
          </Can>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/admin/courses"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại danh sách khóa học
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Chi tiết khóa học
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content - 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Course Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                <div className="w-full sm:w-auto">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    {course.title}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
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

            {/* Lessons Card - Now with full table */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Danh sách bài học ({lessons?.length || 0})
                </h3>
                <Can do="CREATE" on="Lesson">
                  <Button
                    type="primary"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={handleAddLesson}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    Thêm bài học
                  </Button>
                </Can>
              </div>

              <Table
                columns={columns}
                dataSource={lessons}
                loading={lessonsLoading}
                rowKey="id"
                scroll={{ x: 800 }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} của ${total} bài học`,
                  responsive: true,
                }}
                locale={{
                  emptyText: (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h4 className="text-lg font-medium text-gray-500 mb-2">
                        Chưa có bài học nào
                      </h4>
                      <p className="text-sm text-gray-400 mb-4">
                        Tạo bài học đầu tiên cho khóa học này
                      </p>
                      <Can do="CREATE" on="Lesson">
                        <Button
                          type="primary"
                          icon={<Plus className="w-4 h-4" />}
                          onClick={handleAddLesson}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Thêm bài học
                        </Button>
                      </Can>
                    </div>
                  ),
                }}
              />
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">
                Thông tin khóa học
              </h3>
              <div className="space-y-3 sm:space-y-4">
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
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
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
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
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

      {/* Lesson Form Modal */}
      <Modal
        title={editingLesson ? "Chỉnh sửa bài học" : "Thêm bài học mới"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingLesson(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={
            createLessonMutation.isPending || updateLessonMutation.isPending
          }
        >
          <Form.Item
            label="Tên bài học"
            name="title"
            rules={[
              { required: true, message: "Vui lòng nhập tên bài học!" },
              { min: 3, message: "Tên bài học phải có ít nhất 3 ký tự!" },
              { max: 255, message: "Tên bài học không được quá 255 ký tự!" },
            ]}
          >
            <Input placeholder="Nhập tên bài học..." />
          </Form.Item>

          <Form.Item
            label="Vị trí"
            name="position"
            rules={[
              { required: true, message: "Vui lòng nhập vị trí bài học!" },
              { type: "number", min: 1, message: "Vị trí phải lớn hơn 0!" },
            ]}
          >
            <InputNumber
              placeholder="Nhập vị trí bài học..."
              className="w-full"
              min={1}
            />
          </Form.Item>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              onClick={() => {
                setIsModalOpen(false);
                setEditingLesson(null);
                form.resetFields();
              }}
              disabled={
                createLessonMutation.isPending || updateLessonMutation.isPending
              }
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={
                createLessonMutation.isPending || updateLessonMutation.isPending
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingLesson ? "Cập nhật" : "Thêm"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
