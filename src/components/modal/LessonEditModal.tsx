"use client";

import { Modal, Form, Input, Button, InputNumber, App } from "antd";
import { BookOpen } from "lucide-react";
import { useFindUniqueLesson, useUpdateLesson } from "@/generated/hooks";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLessonModal } from "./LessonModalContext";

interface FormValues {
  title: string;
  position: number;
}

const LessonEditModal = () => {
  const { selectedLessonId, isEditModalOpen, closeEditModal } =
    useLessonModal();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: lesson, isLoading } = useFindUniqueLesson(
    {
      where: { id: selectedLessonId || "" },
      select: {
        id: true,
        title: true,
        position: true,
        courseId: true,
      },
    },
    {
      enabled: !!selectedLessonId && isEditModalOpen,
    },
  );

  const updateLessonMutation = useUpdateLesson({
    onSuccess: () => {
      message.success("Cập nhật bài học thành công!");
      closeEditModal();
      // Invalidate và refetch data
      queryClient.invalidateQueries({
        queryKey: ["Lesson"],
      });
      queryClient.invalidateQueries({
        queryKey: ["Course"],
      });
    },
    onError: (error) => {
      console.error("Error updating lesson:", error);
      message.error("Có lỗi xảy ra khi cập nhật bài học!");
    },
  });

  useEffect(() => {
    if (lesson && isEditModalOpen) {
      form.setFieldsValue({
        title: lesson.title,
        position: lesson.position,
      });
    }
  }, [lesson, isEditModalOpen, form]);

  const handleSubmit = async (values: FormValues) => {
    if (!selectedLessonId) {
      message.error("Không tìm thấy ID bài học!");
      return;
    }

    try {
      await updateLessonMutation.mutateAsync({
        where: { id: selectedLessonId },
        data: {
          title: values.title,
          position: values.position,
        },
      });
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    closeEditModal();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          <span>Chỉnh sửa bài học</span>
        </div>
      }
      open={isEditModalOpen}
      onCancel={handleCancel}
      width={600}
      footer={null}
      className="lesson-edit-modal"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <span className="text-gray-500">Đang tải...</span>
          </div>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={updateLessonMutation.isPending}
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
              onClick={handleCancel}
              disabled={updateLessonMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateLessonMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Cập nhật
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default LessonEditModal;
