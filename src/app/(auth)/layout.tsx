export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col justify-center">
        {/* Header */}
        <div className="text-center py-8">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-600 shadow-lg">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">LearnHub</h1>
          <p className="mt-2 text-sm text-gray-600">
            Hệ thống học tập trực tuyến
          </p>
        </div>

        {/* Main content */}
        <div className="flex-1">{children}</div>

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-gray-500">
          © 2025 LearnHub. Tất cả quyền được bảo lưu.
        </footer>
      </div>
    </div>
  );
}
