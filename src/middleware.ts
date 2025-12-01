import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Định nghĩa danh sách các routes công khai không cần xác thực
const publicRoutes = [
  "/public", // Routes công khai (/public/*)
  "/_next", // Next.js static files
  "/api/public", // API routes công khai (nếu có)
];

// Routes xác thực (auth routes)
const authRoutes = ["/login", "/register"];

// Routes được bảo vệ cần xác thực
const protectedRoutes = [
  "/admin", // Admin panel - cần role ADMIN
  "/user", // User panel - cần role USER
  "/profile", // Profile routes - cần đăng nhập
  "/main", // Main routes (nếu còn sử dụng)
];

// Tối ưu middleware để xử lý nhiều requests cùng lúc
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  // Kiểm tra nếu đang ở trang chủ
  if (pathname === "/") {
    // Nếu đã đăng nhập, chuyển đến user courses (trang mặc định cho user)
    if (accessToken) {
      return NextResponse.redirect(new URL("/user/courses", request.url));
    }
    // Nếu chưa đăng nhập, chuyển đến public page
    return NextResponse.redirect(new URL("/public", request.url));
  }

  // Kiểm tra routes công khai - cho phép truy cập tự do
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Kiểm tra routes xác thực (login/register)
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    // Nếu đã đăng nhập và đang truy cập trang auth, chuyển về user courses
    if (accessToken) {
      return NextResponse.redirect(new URL("/user/courses", request.url));
    }
    return NextResponse.next();
  }

  // Kiểm tra routes được bảo vệ (admin, user, profile, main)
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // Nếu chưa đăng nhập, chuyển đến trang login
    if (!accessToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Đã đăng nhập - cho phép truy cập
    // Note: Việc kiểm tra role (ADMIN/USER) được xử lý ở layout của từng route
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Chỉ định các routes cần được middleware xử lý
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
