"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserInfo, isTokenValid, type UserRole } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const valid = await isTokenValid();
        if (valid) {
          const userInfo = getUserInfo();
          const role = userInfo?.role as UserRole | undefined;
          if (role === "ADMIN") {
            router.push("/admin/dashboard");
          } else if (role === "USER") {
            router.push("/user/courses");
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch (error) {
        router.push("/login");
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
