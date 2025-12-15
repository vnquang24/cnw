"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MainPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard by default
    router.push("/public/dashboard");
  }, [router]);

  return null;
}
