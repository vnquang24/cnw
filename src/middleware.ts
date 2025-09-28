import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Định nghĩa danh sách các routes công khai không cần xác thực
const publicRoutes = [
  '/login',
  '/register'
]

// Routes được bảo vệ cần xác thực
const protectedRoutes = [
  '/dashboard',
  '/courses',
  '/tests',
  '/example',
  '/demo'
]

// Tối ưu middleware để xử lý nhiều requests cùng lúc
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('accessToken')?.value

  // Kiểm tra nếu đang ở trang chủ
  if (pathname === '/') {
    // Nếu đã đăng nhập, chuyển đến dashboard
    if (accessToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Nếu chưa đăng nhập, chuyển đến login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Kiểm tra routes công khai (auth routes)
  if (publicRoutes.some(route => pathname === route)) {
    // Nếu đã đăng nhập và đang truy cập trang auth, chuyển về dashboard
    if (accessToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }
  
  // Kiểm tra routes được bảo vệ (main routes)
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Nếu chưa đăng nhập, chuyển đến trang login
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }
  
  // Đối với các route khác, kiểm tra token và quyết định
  if (!accessToken && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}