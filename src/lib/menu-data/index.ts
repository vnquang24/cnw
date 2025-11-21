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
  Library,
  ClipboardCheck,
  ListChecks,
  TestTube,
  Award,
  Beaker,
  Target,
} from "lucide-react";
import { MenuItem } from "@/components/panel/menu-item/type";

export const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    pathname: "/admin/dashboard",
  },
  {
    icon: GraduationCap,
    label: "Quản lý khóa học",
    pathname: "/admin/courses",
    subMenu: [
      {
        label: "Danh sách khóa học",
        pathname: "/admin/courses",
        icon: Library,
      },
      {
        label: "Đăng ký khóa học",
        pathname: "/admin/enrollments",
        icon: UserCheck,
      },
    ],
  },
  {
    icon: ClipboardCheck,
    label: "Bài kiểm tra",
    pathname: "",
    subMenu: [
      {
        label: "Danh sách bài kiểm tra",
        pathname: "/admin/tests",
        icon: ListChecks,
      },
      {
        label: "Kết quả kiểm tra",
        pathname: "/admin/test-results",
        icon: Award,
      },
    ],
  },
  {
    icon: Users,
    label: "Quản lý người dùng",
    pathname: "/admin/users",
  },
  {
    icon: Beaker,
    label: "Demo & Thử nghiệm",
    pathname: "",
    subMenu: [
      {
        label: "Demo Components",
        pathname: "/admin/demo",
        icon: Monitor,
      },
      {
        label: "API Examples",
        pathname: "/admin/example",
        icon: Target,
      },
    ],
  },
];
