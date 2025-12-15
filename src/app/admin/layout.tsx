"use client";

import { type ReactNode } from "react";
import SharedLayout from "@/components/panel/shared-layout";
import StoreProviderWrapper from "@/components/store-provider";
import { menuItems } from "@/lib/menu-data";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProviderWrapper>
      <SharedLayout
        menuItems={menuItems}
        title="Dashboard"
        logoText="LearnHub"
        requiredRole="ADMIN"
        redirectPath="/user/courses"
      >
        {children}
      </SharedLayout>
    </StoreProviderWrapper>
  );
}
