import {
  BookOpen,
  ClipboardList,
  CheckCircle2,
  UserRound,
  Settings,
  CircleDot,
  GraduationCap,
  TrendingUp,
  Award,
  UserCircle,
  UserCog,
  Smartphone,
} from "lucide-react";
import { MenuItem } from "@/components/panel/menu-item/type";

export const userMenuItems: MenuItem[] = [
  {
    icon: GraduationCap,
    label: "Khóa học của tôi",
    pathname: "/user/courses",
  },
  {
    icon: TrendingUp,
    label: "Tiến độ học tập",
    pathname: "/user/progress",
  },
  {
    icon: Award,
    label: "Kết quả kiểm tra",
    pathname: "/user/tests",
  },
  {
    icon: UserCircle,
    label: "Hồ sơ học viên",
    pathname: "/user/profile",
  },
  {
    icon: UserCog,
    label: "Quản lý thông tin",
    pathname: "/profile",
  },
  {
    icon: Smartphone,
    label: "Quản lý thiết bị",
    pathname: "/devices",
  },
];
