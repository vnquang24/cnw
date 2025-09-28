'use client';

import { ConfigProvider, theme } from 'antd';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface AntdConfigProviderProps {
  children: React.ReactNode;
}

export default function AntdConfigProvider({ children }: AntdConfigProviderProps) {
  const { theme: currentTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#3b82f6',
            colorSuccess: '#10b981',
            colorWarning: '#f59e0b',
            colorError: '#ef4444',
            borderRadius: 6,
            borderRadiusLG: 8,
            borderRadiusSM: 4,
            padding: 16,
            paddingLG: 24,
            paddingSM: 12,
            fontSize: 14,
            fontSizeLG: 16,
            fontSizeSM: 12,
          },
        }}
      >
        {children}
      </ConfigProvider>
    );
  }

  const resolvedTheme = currentTheme === 'system' ? systemTheme : currentTheme;
  const isDark = resolvedTheme === 'dark';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          // Brand colors
          colorPrimary: '#3b82f6', // blue-500
          colorSuccess: '#10b981', // green-500
          colorWarning: '#f59e0b', // amber-500
          colorError: '#ef4444', // red-500
          
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
          
          // Background colors based on theme
          colorBgContainer: isDark ? '#1f2937' : '#ffffff',
          colorBgLayout: isDark ? '#111827' : '#f9fafb',
          colorBorder: isDark ? '#374151' : '#e5e7eb',
          colorText: isDark ? '#f9fafb' : '#111827',
          colorTextSecondary: isDark ? '#d1d5db' : '#6b7280',
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
        }
      }}
    >
      {children}
    </ConfigProvider>
  );
}