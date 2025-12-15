"use client";

import { type ReactNode, useEffect, useState } from "react";
import SharedLayout from "@/components/panel/shared-layout";
import { userMenuItems } from "@/lib/menu-data/user-menu";
import { menuItems } from "@/lib/menu-data";
import { getUserInfo } from "@/lib/auth";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<"USER" | "ADMIN" | null>(null);

  useEffect(() => {
    const info = getUserInfo();
    if (info) {
      setUserRole(info.role as "USER" | "ADMIN");
    }
  }, []);

  // Chọn menu dựa trên role
  const menuToUse = userRole === "ADMIN" ? menuItems : userMenuItems;

  return (
    <SharedLayout
      menuItems={menuToUse}
      title="Quản lý thông tin"
      logoText="LearnHub"
    >
      {children}
    </SharedLayout>
  );
}
