"use client";

import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Avatar,
  Input,
  Select,
} from "antd";
import {
  BookOpen,
  Users,
  Clock,
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useFindManyCourse,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from "@/generated/hooks";
import {
  CourseFormDialog,
  CourseFormData,
} from "@/components/admin/courses/CourseFormDialog";
import { showToast } from "@/lib/toast";
import { getUserId } from "@/lib/auth";

const { Title, Text } = Typography;
const { Option } = Select;

// Mock data cho khóa học
// const courses = [
//   {
//     key: "1",
//     id: 1,
//     title: "JavaScript Cơ bản",
//     description: "Học lập trình JavaScript từ cơ bản đến nâng cao",
//     instructor: "Nguyễn Văn A",
//     students: 45,
//     lessons: 12,
//     duration: "6 tuần",
//     status: "active",
//     level: "Cơ bản",
//     createdAt: "2024-01-15",
//   },
//   {
//     key: "2",
//     id: 2,
//     title: "React Advanced",
//     description: "Khóa học React nâng cao cho developers",
//     instructor: "Trần Thị B",
//     students: 32,
//     lessons: 15,
//     duration: "8 tuần",
//     status: "active",
//     level: "Nâng cao",
//     createdAt: "2024-01-20",
//   },
//   {
//     key: "3",
//     id: 3,
//     title: "Node.js Backend",
//     description: "Phát triển backend với Node.js và Express",
//     instructor: "Lê Văn C",
//     students: 28,
//     lessons: 10,
//     duration: "5 tuần",
//     status: "draft",
//     level: "Trung bình",
//     createdAt: "2024-02-01",
//   },
//   {
//     key: "4",
//     id: 4,
//     title: "Database Design",
//     description: "Thiết kế và quản lý cơ sở dữ liệu",
//     instructor: "Phạm Thị D",
//     students: 25,
//     lessons: 8,
//     duration: "4 tuần",
//     status: "completed",
//     level: "Trung bình",
//     createdAt: "2024-01-10",
//   },
// ];

export default function CoursesPage() {
  const router = useRouter();
  const userId = getUserId();
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddClick = () => {
    setDialogMode("add");
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleEditClick = (courseId: string) => {
    setDialogMode("edit");
    setEditingId(courseId);
    setDialogOpen(true);
  };

  const {
    data: courses = [],
    isLoading,
    error,
    refetch,
  } = useFindManyCourse({
    orderBy: { createdAt: "desc" },
    include: {
      creator: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          lessons: true,
          userCourses: true,
        },
      },
    },
  });

  // Mutation hooks
  const createCourseMutation = useCreateCourse({
    onSuccess: () => {
      showToast.success("Tạo khóa học thành công!");
      refetch();
      setDialogOpen(false);
    },
    onError: (error) => {
      showToast.error("Lỗi khi tạo khóa học!");
      console.error(error);
    },
  });

  const updateCourseMutation = useUpdateCourse({
    onSuccess: () => {
      showToast.success("Cập nhật khóa học thành công!");
      refetch();
      setDialogOpen(false);
    },
    onError: (error) => {
      showToast.error("Lỗi khi cập nhật khóa học!");
      console.error(error);
    },
  });

  const handleFormSubmit = async (data: CourseFormData) => {
    if (dialogMode === "add") {
      await createCourseMutation.mutateAsync({
        data: {
          title: data.title,
          description: data.description,
          duration: data.duration,
          level: data.level,
          status: data.status,
          createdBy: userId,
        },
      });
    } else if (dialogMode === "edit" && editingId) {
      await updateCourseMutation.mutateAsync({
        where: { id: editingId },
        data: {
          title: data.title,
          description: data.description,
          duration: data.duration,
          level: data.level,
          status: data.status,
        },
      });
    }
  };

  // ✅ Hook xóa khóa học
  const deleteCourseMutation = useDeleteCourse({
    onSuccess: () => {
      showToast.success("Xóa khóa học thành công!");
      refetch();
    },
    onError: (error) => {
      showToast.error("Lỗi khi xóa khóa học!");
      console.error(error);
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa khóa học này?")) {
      deleteCourseMutation.mutate({ where: { id } });
    }
  };

  // Lấy dữ liệu khóa học đang edit
  const editingCourse = editingId
    ? courses.find((c) => c.id === editingId)
    : undefined;

  const initialFormData: CourseFormData | undefined = editingCourse
    ? {
        title: editingCourse.title,
        description: editingCourse.description || "",
        duration: editingCourse.duration,
        level: editingCourse.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
        status: editingCourse.status as "ACTIVE" | "INACTIVE",
      }
    : undefined;

  const columns = [
    {
      title: "Khóa học",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>{text}</div>
          <div style={{ color: "#666", fontSize: "12px" }}>
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: "Giảng viên",
      dataIndex: "instructor",
      key: "instructor",
      render: (text: string) => (
        <Space>
          <Avatar size="small">{text.charAt(0)}</Avatar>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: "Học viên",
      dataIndex: "students",
      key: "students",
      render: (count: number) => (
        <Space>
          <Users size={14} />
          <span>{count}</span>
        </Space>
      ),
    },
    {
      title: "Bài học",
      dataIndex: "lessons",
      key: "lessons",
      render: (count: number) => (
        <Space>
          <BookOpen size={14} />
          <span>{count}</span>
        </Space>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "duration",
      key: "duration",
      render: (duration: string) => (
        <Space>
          <Clock size={14} />
          <span>{duration}</span>
        </Space>
      ),
    },
    {
      title: "Cấp độ",
      dataIndex: "level",
      key: "level",
      render: (level: string) => {
        const levelMap = {
          BEGINNER: { color: "green", text: "Cơ bản" },
          INTERMEDIATE: { color: "blue", text: "Trung cấp" },
          ADVANCED: { color: "orange", text: "Nâng cao" },
        };
        const levelInfo = levelMap[level as keyof typeof levelMap];
        return <Tag color={levelInfo.color}>{levelInfo.text}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusMap = {
          ACTIVE: { color: "green", text: "Đang hoạt động" },
          DRAFT: { color: "orange", text: "Nháp" },
          COMPLETED: { color: "blue", text: "Hoàn thành" },
          INACTIVE: { color: "red", text: "Đã hủy" },
        };
        const statusInfo = statusMap[status as keyof typeof statusMap];
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<Eye size={14} />}
            size="small"
            onClick={() => router.push(`/admin/courses/${record.id}`)}
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<Edit size={14} />}
            size="small"
            onClick={() => handleEditClick(record.id)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            danger
            icon={<Trash2 size={14} />}
            size="small"
            onClick={() => {
              handleDelete(record.id);
            }}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const filteredCourses = courses
    .map((course) => ({
      ...course,
      key: course.id, // Thêm key cho mỗi item
      instructor: course.creator?.name || "N/A",
      students: course._count?.userCourses || 0,
      lessons: course._count?.lessons || 0,
      duration: `${course.duration} phút`,
      status: course.status, // Mặc định active (có thể thêm field status vào model sau)
      level: course.level, // Mặc định (có thể thêm field level vào model sau)
      createdAt: new Date(course.createdAt).toLocaleDateString("vi-VN"),
    }))
    .filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchText.toLowerCase()) ||
        (course.creator?.name || "")
          .toLowerCase()
          .includes(searchText.toLowerCase());
      const matchesFilter =
        filterStatus === "ALL" || course.status === filterStatus;
      return matchesSearch && matchesFilter;
    });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Quản lý khóa học</Title>
        <Text type="secondary">Quản lý và theo dõi tất cả các khóa học</Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng khóa học"
              value={courses.length}
              prefix={<BookOpen size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={
                filteredCourses.filter((c) => c.status === "ACTIVE").length
              }
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng học viên"
              value={courses.reduce(
                (sum, course) => sum + (course._count?.userCourses || 0),
                0,
              )}
              prefix={<Users size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Tổng bài học"
              value={courses.reduce(
                (sum, course) => sum + (course._count?.lessons || 0),
                0,
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space>
              <Input
                placeholder="Tìm kiếm khóa học hoặc giảng viên..."
                prefix={<Search size={14} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: 150 }}
              >
                <Option value="ALL">Tất cả</Option>
                <Option value="ACTIVE">Đang hoạt động</Option>
                <Option value="DRAFT">Nháp</Option>
                <Option value="COMPLETED">Hoàn thành</Option>
                <Option value="INACTIVE">Đã hủy</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={handleAddClick}
            >
              Thêm khóa học mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Courses Table */}
      <Card>
        <Table
          key={`courses-table-${searchText}-${filterStatus}`}
          rowKey="id"
          columns={columns}
          dataSource={filteredCourses}
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} khóa học`,
          }}
        />
      </Card>

      <CourseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleFormSubmit}
        mode={dialogMode}
        initialData={initialFormData}
      />
    </div>
  );
}
