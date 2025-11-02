# Manage Questions Component - CRUD đầy đủ

Component này cho phép quản lý câu hỏi cho bài kiểm tra với đầy đủ tính năng CRUD (Create, Read, Update, Delete).

## Tính năng CRUD

### 1. CREATE - Tạo câu hỏi mới
- ➕ **Thêm câu hỏi**: Click nút "Thêm câu hỏi mới" ở cuối danh sách
- ✏️ **Nhập nội dung**: Gõ trực tiếp vào các ô input
- 💾 **Lưu**: Click nút "Lưu" để tạo câu hỏi mới vào database

### 2. READ - Xem danh sách câu hỏi
- 📋 **Hiển thị tất cả**: Tự động load tất cả câu hỏi của bài test
- 👁️ **Xem chi tiết**: Hiển thị đầy đủ nội dung câu hỏi và đáp án
- 🔄 **Refresh**: Tự động cập nhật sau mỗi thao tác

### 3. UPDATE - Cập nhật câu hỏi
- ✏️ **Vào chế độ sửa**: Click nút "Sửa" trên mỗi câu hỏi
- 📝 **Chỉnh sửa**: Thay đổi nội dung, loại câu hỏi, đáp án
- 💾 **Lưu thay đổi**: Click "Lưu" để cập nhật vào database
- ❌ **Hủy sửa**: Click "Hủy" để bỏ qua các thay đổi

### 4. DELETE - Xóa câu hỏi/đáp án
- 🗑️ **Xóa câu hỏi**: Click "Xóa câu hỏi" với xác nhận
- 🗑️ **Xóa đáp án**: Click icon thùng rác bên cạnh đáp án
- ⚠️ **Xác nhận**: Popconfirm để tránh xóa nhầm

### 2. Loại câu hỏi
**Multiple choice (Trắc nghiệm 1 đáp án)**
- Icon: Radio button (○)
- Chỉ cho phép chọn 1 đáp án đúng
- Khi chọn đáp án mới, đáp án cũ sẽ tự động bỏ chọn

**Checkboxes (Trắc nghiệm nhiều đáp án)**
- Icon: Checkbox (☐)
- Cho phép chọn nhiều đáp án đúng
- Có thể check/uncheck bất kỳ đáp án nào

### 3. Quản lý đáp án
- ➕ **Thêm đáp án**: Click nút "Add option"
- ✏️ **Nhập nội dung đáp án**: Gõ trực tiếp vào ô "Answer 1", "Answer 2"...
- ✅ **Chọn đáp án đúng**:
  - Click radio button (câu hỏi 1 đáp án)
  - Click checkbox (câu hỏi nhiều đáp án)
- **Tối thiểu**: 2 đáp án
- **Bắt buộc**: Ít nhất 1 đáp án đúng

### 4. Validation
Component tự động kiểm tra:
- ✅ Tất cả câu hỏi phải có nội dung
- ✅ Tất cả đáp án phải có nội dung
- ✅ Mỗi câu hỏi phải có ít nhất 1 đáp án đúng
- ✅ Phải có ít nhất 1 câu hỏi
- ✅ Mỗi câu hỏi phải có ít nhất 2 đáp án

## Cách sử dụng

### Xem và quản lý câu hỏi
1. Click nút **"Câu hỏi"** ở cột "Hành động" trong bảng bài kiểm tra
2. Modal "Quản lý câu hỏi" hiện ra với danh sách câu hỏi hiện có

### Tạo câu hỏi mới
1. Click nút **"Thêm câu hỏi mới"** (hoặc "Thêm câu hỏi đầu tiên" nếu chưa có)
2. Nhập nội dung câu hỏi
3. Chọn loại: "Trắc nghiệm 1 đáp án" hoặc "Trắc nghiệm nhiều đáp án"
4. Nhập nội dung các đáp án
5. Đánh dấu đáp án đúng (radio/checkbox)
6. Click **"Lưu"** để tạo

### Sửa câu hỏi
1. Click nút **"Sửa"** trên câu hỏi cần chỉnh sửa
2. Card chuyển sang màu hồng (chế độ edit)
3. Thay đổi nội dung tùy ý
4. Click **"Lưu"** để cập nhật hoặc **"Hủy"** để bỏ qua

### Xóa câu hỏi/đáp án
1. Click **"Xóa câu hỏi"** hoặc icon thùng rác bên đáp án
2. Xác nhận trong Popconfirm
3. Dữ liệu sẽ bị xóa khỏi database

## Giao diện

### Màu sắc chế độ
- **Chế độ xem**: Nền xám (#f5f5f5) - Read-only
- **Chế độ sửa**: Nền hồng (#fadadd) - Có thể chỉnh sửa
- **Câu hỏi mới**: Nền hồng (#fadadd) - Đang tạo

### Buttons
- **"Sửa"**: Vào chế độ edit (icon Edit)
- **"Lưu"**: Lưu thay đổi (icon Save, màu xanh)
- **"Hủy"**: Hủy edit (icon X)
- **"Xóa câu hỏi"**: Xóa câu hỏi (icon Trash2, màu đỏ)
- **"Thêm đáp án"**: Thêm đáp án mới
- **"Thêm câu hỏi mới"**: Button dashed full width

### Elements
- **Input**: Nền trắng, border radius 8px
- **Radio/Checkbox**: Tùy loại câu hỏi
- **Popconfirm**: Xác nhận xóa với title và description

## Props

```typescript
interface ManageQuestionsProps {
  open: boolean;           // Hiển thị/ẩn modal
  testId: string;          // ID của bài test
  onCancel: () => void;    // Callback khi đóng modal
}
```

## API Integration - CRUD Operations

### Queries (Read)
- `useFindManyQuestion()` - Lấy danh sách câu hỏi
- `useFindManyAnswer()` - Lấy danh sách đáp án
- Auto refetch sau mỗi mutation

### Mutations
**Question:**
- `useCreateQuestion()` - Tạo câu hỏi mới (CREATE)
- `useUpdateQuestion()` - Cập nhật câu hỏi (UPDATE)
- `useDeleteQuestion()` - Xóa câu hỏi (DELETE)

**Answer:**
- `useCreateAnswer()` - Tạo đáp án mới (CREATE)
- `useUpdateAnswer()` - Cập nhật đáp án (UPDATE)
- `useDeleteAnswer()` - Xóa đáp án (DELETE)

### Data Relations
```
Test (1) → (N) Questions (1) → (N) Answers
```

## State Management

### Local State
- `editingQuestions[]` - Danh sách câu hỏi đang edit
- `hasChanges` - Có thay đổi chưa lưu
- `isEditing` - Câu hỏi đang ở chế độ edit
- `isNew` - Câu hỏi/đáp án mới chưa lưu DB

### Edit Modes
1. **View Mode**: Read-only, hiển thị dữ liệu từ DB
2. **Edit Mode**: Có thể chỉnh sửa, chưa lưu DB
3. **New Mode**: Đang tạo mới, chưa có trong DB

## Features Chi Tiết

### ✅ Smart Save
- Chỉ lưu khi có thay đổi
- Tự động phân biệt Create/Update
- Batch save với "Lưu tất cả"

### ✅ Validation
- Bắt buộc nhập nội dung câu hỏi
- Bắt buộc nhập nội dung đáp án
- Ít nhất 1 đáp án đúng
- Tối thiểu 2 đáp án

### ✅ UX Enhancements
- Loading state
- Empty state với hướng dẫn
- Confirmation trước khi xóa
- Toast notifications
- Disable inputs khi không edit
- Auto refetch sau mutations

### ✅ Data Integrity
- Cascade delete answers khi xóa question
- Validate trước khi save
- Error handling
- Optimistic updates
