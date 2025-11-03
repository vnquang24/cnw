import {
  BookOpen,
  ClipboardList,
  CheckCircle2,
  UserRound,
  Settings,
  CircleDot,
} from "lucide-react";
import { MenuItem } from "@/components/panel/menu-item/type";

export const userMenuItems: MenuItem[] = [
  {
    icon: BookOpen,
    label: "Khóa học của tôi",
    pathname: "/user/courses",
  },
  {
    icon: CheckCircle2,
    label: "Tiến độ học tập",
    pathname: "/user/progress",
  },
  {
    icon: ClipboardList,
    label: "Kết quả kiểm tra",
    pathname: "/user/tests",
  },
  {
    icon: UserRound,
    label: "Hồ sơ học viên",
    pathname: "/user/profile",
  },
  {
    icon: Settings,
    label: "Quản lý thông tin",
    pathname: "/profile",
  },
];
