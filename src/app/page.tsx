'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenValid } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const valid = await isTokenValid();
        if (valid) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch (error) {
        // Nếu có lỗi, redirect đến login
        router.push('/login');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Hiển thị loading trong khi kiểm tra auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
