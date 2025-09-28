"use client";

import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as ZenStackHooksProvider } from '../../generated/hooks';
import { fetchInstance, queryClient } from '@/lib/api';
import StoreProviderWrapper from './store-provider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toast } from '@/components/ui/toast';
import { ThemeProvider } from 'next-themes';
import AntdConfigProvider from '@/components/antd-config-provider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <ZenStackHooksProvider
          value={{
            endpoint: (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000') + "/api/models",
            fetch: fetchInstance,
          }}
        >
          <AntdConfigProvider>
            <StoreProviderWrapper>
              {children}
            </StoreProviderWrapper>
          </AntdConfigProvider>
          <Toast position="top-center" />
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        </ZenStackHooksProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}