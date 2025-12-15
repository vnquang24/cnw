# Hệ thống E-Learning Frontend

Đây là ứng dụng frontend cho hệ thống học tập trực tuyến, được xây dựng bằng [Next.js](https://nextjs.org) với App Router, TypeScript, và Ant Design.

## 🚀 Hướng dẫn cài đặt và chạy hệ thống

### Yêu cầu hệ thống
- Node.js >= 18.0.0
- pnpm >= 8.0.0 (khuyên dùng) hoặc npm/yarn
- Git

### 1. Clone repository
```bash
git clone https://github.com/cong-nghe-web-K67/FE.git
cd fe-cong-nghe-web
```

### 2. Cài đặt dependencies
```bash
# Sử dụng pnpm (khuyên dùng)
pnpm install

# Hoặc sử dụng npm
npm install

# Hoặc sử dụng yarn
yarn install
```

### 3. Cấu hình environment variables
Tạo file `.env.local` từ template:
```bash
cp .env.example .env
```

### 4. Cài đặt và cấu hình cơ sở dữ liệu (nếu cần)
```bash
# Generate Prisma client
pnpm generate:zmodel
pnpm generate-api
```

### 5. Chạy development server
```bash
# Sử dụng pnpm
pnpm dev

# Hoặc sử dụng npm
npm run dev

# Hoặc sử dụng yarn
yarn dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt để xem kết quả.

### 6. Build cho production
```bash
# Build ứng dụng
pnpm build

# Chạy production server
pnpm start
```

## 📁 Cấu trúc thư mục chính

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── main/              # Protected main pages
│   ├── public/            # Public pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # UI components
│   └── panel/            # Layout panels
├── lib/                  # Utilities & configurations
│   ├── auth.ts           # Authentication utilities
│   ├── api/              # API configurations
│   └── redux/            # Redux store
├── generated/            # Generated code
│   ├── api/              # OpenAPI generated clients
│   └── hooks/            # Database hooks
└── middleware.ts         # Next.js middleware
```

## 🛠️ Công nghệ sử dụng

- **Framework**: Next.js 15 với App Router
- **Language**: TypeScript
- **UI Library**: Ant Design v5
- **Styling**: Tailwind CSS
- **State Management**: Redux với easy-peasy
- **Data Fetching**: TanStack Query (React Query)
- **Database**: Prisma với ZenStack
- **Authentication**: JWT với cookies
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Code Quality**: Biome (fast ESLint + Prettier replacement), Husky, lint-staged
- **Git Hooks**: Husky với pre-commit formatting

## 📝 Scripts có sẵn

```bash
# Development
pnpm dev              # Chạy development server
pnpm build            # Build cho production  
pnpm start            # Chạy production server
pnpm lint             # Kiểm tra code với Biome
pnpm format           # Format code với Biome

# Database
pnpm generate:zmodel  # Generate ZenStack schema
pnpm generate-api     # Generate API clients
pnpm generate:all     # Generate tất cả

# Code Quality & Git Hooks
pnpm lint-staged      # Chạy lint-staged manual
git commit            # Tự động format code trước khi commit
```

## 🔧 Cấu hình quan trọng

### Middleware
File `src/middleware.ts` xử lý:
- Authentication checks
- Route protection
- Redirects based on user state

### Authentication
- JWT tokens lưu trong cookies
- Refresh token mechanism
- Protected routes với middleware

### API Integration
- OpenAPI generated clients
- Type-safe API calls
- Error handling

### Code Quality & Git Hooks
- **Biome**: Fast all-in-one linter và formatter (thay thế ESLint + Prettier)
- **Husky**: Git hooks để tự động kiểm tra code
- **lint-staged**: Chỉ format/lint các file được stage
- **Pre-commit Hook**: Tự động format và fix code trước khi commit

#### Quy trình Pre-commit:
1. Stage files với `git add`
2. Run `git commit`  
3. Husky tự động chạy:
   - Biome format tự động cho tất cả staged files
   - Áp dụng cho: .js, .jsx, .ts, .tsx, .json, .md, .css, .scss
   - Tự động format code theo chuẩn Biome
4. Commit sẽ bao gồm code đã được format

#### Các lệnh hữu ích:
```bash
# Format toàn bộ codebase
pnpm format

# Check lint issues  
pnpm lint

# Chạy manual lint-staged
pnpm lint-staged
```

## 🎯 Tính năng chính

- **Authentication**: Đăng ký, đăng nhập, quản lý session
- **Dashboard**: Thống kê tổng quan hệ thống
- **Course Management**: Quản lý khóa học và bài học
- **User Management**: Quản lý người dùng
- **Word Learning**: Hệ thống học từ vựng với flashcards
- **Testing System**: Hệ thống kiểm tra và đánh giá
- **Device Management**: Quản lý thiết bị đăng nhập

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **Port 3000 đã được sử dụng**
   ```bash
   # Thay đổi port
   pnpm dev -- -p 3001
   ```

2. **Module not found errors**
   ```bash
   # Xóa node_modules và reinstall
   rm -rf node_modules
   rm pnpm-lock.yaml
   pnpm install
   ```

3. **Prisma client errors**
   ```bash
   # Regenerate Prisma client
   npx prisma generate
   ```

4. **TypeScript errors**
   ```bash
   # Check types
   pnpm type-check
   ```

## 📚 Tài liệu tham khảo

- [Next.js Documentation](https://nextjs.org/docs)
- [Ant Design Documentation](https://ant.design/docs/react/introduce)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query/latest)

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

This project is licensed under the MIT License.
