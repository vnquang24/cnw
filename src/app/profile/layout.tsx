"use client";

import { type ReactNode } from "react";
import SharedLayout from "@/components/panel/shared-layout";
import { userMenuItems } from "@/lib/menu-data/user-menu";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <SharedLayout
      menuItems={userMenuItems}
      title="Quản lý thông tin cá nhân"
      logoText="EduSystem"
      requiredRole="USER"
      redirectPath="/admin/dashboard"
    >
      {children}
    </SharedLayout>
  );
}
