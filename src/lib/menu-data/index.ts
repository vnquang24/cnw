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
  UserCog,
  Smartphone,
  Shield,
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
    requiredPermission: {
      action: "READ",
      resource: "Course",
    },
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
    requiredPermission: {
      action: "READ",
      resource: "Test",
    },
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
    requiredPermission: {
      action: "READ",
      resource: "User",
    },
  },
  {
    icon: Shield,
    label: "Phân quyền",
    pathname: "/admin/permissions",
    requiredPermission: {
      action: "READ",
      resource: "Permission",
    },
  },
  {
    icon: UserCog,
    label: "Thông tin cá nhân",
    pathname: "/profile",
  },
  {
    icon: Smartphone,
    label: "Quản lý thiết bị",
    pathname: "/devices",
  },
];
