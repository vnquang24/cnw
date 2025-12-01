"use client";

import { type ReactNode } from "react";
import SharedLayout from "@/components/panel/shared-layout";
import { userMenuItems } from "@/lib/menu-data/user-menu";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SharedLayout
      menuItems={userMenuItems}
      title="Khu vực học viên"
      logoText="EduSystem"
      requiredRole="USER"
      redirectPath="/admin/dashboard"
    >
      {children}
    </SharedLayout>
  );
}
