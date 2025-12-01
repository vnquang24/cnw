"use client";

import { App, ConfigProvider, theme } from "antd";

interface AntdConfigProviderProps {
  children: React.ReactNode;
}

export default function AntdConfigProvider({
  children,
}: AntdConfigProviderProps) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          // Brand colors
          colorPrimary: "#3b82f6", // blue-500
          colorSuccess: "#10b981", // green-500
          colorWarning: "#f59e0b", // amber-500
          colorError: "#ef4444", // red-500

          // Border radius
          borderRadius: 6,
          borderRadiusLG: 8,
          borderRadiusSM: 4,

          // Spacing
          padding: 16,
          paddingLG: 24,
          paddingSM: 12,

          // Typography
          fontSize: 14,
          fontSizeLG: 16,
          fontSizeSM: 12,

          // Light theme colors
          colorBgContainer: "#ffffff",
          colorBgLayout: "#f9fafb",
          colorBgElevated: "#ffffff",
          colorBorder: "#e5e7eb",
          colorBorderSecondary: "#f3f4f6",
          colorText: "#111827",
          colorTextSecondary: "#6b7280",
          colorTextTertiary: "#9ca3af",
          colorFill: "#f3f4f6",
          colorFillSecondary: "#f9fafb",
        },
        components: {
          Button: {
            borderRadius: 6,
            controlHeight: 40,
            fontSize: 14,
            fontWeight: 500,
          },
          Input: {
            borderRadius: 6,
            controlHeight: 40,
            fontSize: 14,
          },
          Select: {
            borderRadius: 6,
            controlHeight: 40,
          },
          Card: {
            borderRadius: 8,
            colorBgContainer: "#ffffff",
            colorBorderSecondary: "#e5e7eb",
          },
          Modal: {
            borderRadius: 8,
          },
          Drawer: {
            borderRadius: 8,
          },
          Form: {
            itemMarginBottom: 16,
          },
          // Typography: {
          //   colorText: '#111827',
          //   colorTextSecondary: '#6b7280',
          //   colorTextTertiary: '#9ca3af',
          // },
          Layout: {
            headerBg: "#ffffff",
            headerColor: "#000000",
            headerHeight: 64,
            headerPadding: "0 16px",
            bodyBg: "#ffffff",
            siderBg: "#ffffff",
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
