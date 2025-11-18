import {
  Home,
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  Database,
  FolderOpen,
  Monitor,
  Settings,
  CircleDot,
  Activity,
  BarChart3,
  UserCheck,
} from "lucide-react";
import { MenuItem } from "@/components/panel/menu-item/type";

export const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    pathname: "/admin/dashboard",
  },
  {
    icon: BookOpen,
    label: "Quản lý khóa học",
    pathname: "/admin/courses",
  },
  {
    icon: FileText,
    label: "Bài kiểm tra",
    pathname: "/admin/tests",
    // subMenu: [
    //   {
    //     label: "Danh sách bài kiểm tra",
    //     pathname: "/admin/tests",
    //     icon: CircleDot,
    //   },
    // {
    //   label: "Câu hỏi",
    //   pathname: "/admin/questions",
    //   icon: CircleDot,
    // },
    // {
    //   label: "Kết quả kiểm tra",
    //   pathname: "/admin/test-results",
    //   icon: CircleDot,
    // },
    // ],
  },
  {
    icon: Users,
    label: "Quản lý người dùng",
    pathname: "/admin/users",
  },
  {
    icon: UserCheck,
    label: "Đăng ký khóa học",
    pathname: "/admin/enrollments",
  },
  {
    icon: Monitor,
    label: "Demo & Thử nghiệm",
    pathname: "",
    subMenu: [
      {
        label: "Demo Components",
        pathname: "/admin/demo",
        icon: CircleDot,
      },
      {
        label: "API Examples",
        pathname: "/admin/example",
        icon: CircleDot,
      },
    ],
  },
];
