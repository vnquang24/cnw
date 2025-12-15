"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Upload,
  Table,
  Space,
  Popconfirm,
  Input,
  Row,
  Col,
  Typography,
  Alert,
  Spin,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FolderOpenOutlined,
  FileOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import {
  useMinioControllerFindAll,
  useMinioControllerCreateUploadUrl,
  fetchMinioControllerCreateUploadUrl,
  fetchMinioControllerPresignedGetObject,
} from "../../../../generated/api/cnwComponents";
import { showToast } from "@/lib/toast";

const { Title, Text } = Typography;
const { Search } = Input;

type BucketItemType = {
  name?: string;
  size?: number;
  lastModified?: string;
  prefix?: string;
  etag?: string;
};

export default function MinioManagerPage() {
  const [currentPath, setCurrentPath] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // Fetch danh sách files với error handling
  const {
    data: files = [],
    isLoading: isLoadingFiles,
    error: filesError,
    refetch: refetchFiles,
  } = useMinioControllerFindAll({
    queryParams: {
      path: currentPath || undefined,
      limit: 100,
    },
  });

  // Debug: Log dữ liệu API trả về
  console.log("=== DEBUG MinIO API Response ===");
  console.log("Raw files data:", files);
  console.log("Files length:", files?.length);
  console.log("Current path:", currentPath);
  console.log("Is loading:", isLoadingFiles);
  console.log("Error:", filesError);
  console.log("================================");

  // Hook để tạo upload URL
  const createUploadUrlMutation = useMinioControllerCreateUploadUrl({
    onSuccess: (data) => {
      console.log("Upload URL created:", data);
    },
    onError: (error) => {
      showToast.error("Không thể tạo URL upload");
      console.error("Upload URL creation failed:", error);
    },
  });

  // Hàm upload file
  const handleFileUpload = async (file: File) => {
    const filePath = `${currentPath}${currentPath ? "/" : ""}${file.name}`;

    try {
      const loadingToast = showToast.loading(`Đang upload ${file.name}...`);

      // Bước 1: Tạo upload URL - sử dụng 'path' thay vì 'fileName'
      const uploadUrlResponse = await fetchMinioControllerCreateUploadUrl({
        body: {
          path: filePath,
        },
      });

      showToast.dismiss(loadingToast);

      if (!uploadUrlResponse.url) {
        throw new Error("Không nhận được URL upload");
      }

      // Bước 2: Upload file trực tiếp lên MinIO
      const uploadResponse = await fetch(uploadUrlResponse.url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      showToast.success(`Upload ${file.name} thành công!`);

      // Refresh danh sách files
      refetchFiles();
    } catch (error) {
      console.error("Upload error:", error);
      showToast.error(
        `Upload ${file.name} thất bại: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  };

  // Hàm tải file xuống
  const handleDownload = async (fileName?: string) => {
    if (!fileName) {
      showToast.error("Tên file không hợp lệ");
      return;
    }

    try {
      const loadingToast = showToast.loading("Đang tạo link tải xuống...");

      const objectName = `${currentPath}${currentPath ? "/" : ""}${fileName}`;
      const downloadUrlResponse = await fetchMinioControllerPresignedGetObject({
        queryParams: {
          objectName: objectName,
        },
      });

      showToast.dismiss(loadingToast);

      if (downloadUrlResponse.url) {
        // Mở link tải xuống trong tab mới
        window.open(downloadUrlResponse.url, "_blank");
        showToast.success("Link tải xuống đã được tạo");
      } else {
        throw new Error("Không nhận được URL tải xuống");
      }
    } catch (error) {
      console.error("Download error:", error);
      showToast.error("Không thể tạo link tải xuống");
    }
  };

  // Hàm điều hướng thư mục
  const navigateToFolder = (folderName?: string) => {
    if (!folderName) return;
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
  };

  // Hàm quay lại thư mục cha
  const goBack = () => {
    const pathParts = currentPath.split("/");
    pathParts.pop();
    setCurrentPath(pathParts.join("/"));
  };

  // Lọc files theo từ khóa tìm kiếm
  const filteredFiles = files.filter((file: BucketItemType) =>
    file.name?.toLowerCase().includes(searchKeyword.toLowerCase()),
  );

  // Cấu hình Upload component
  const uploadProps: UploadProps = {
    multiple: true,
    showUploadList: false,
    beforeUpload: (file) => {
      handleFileUpload(file);
      return false; // Prevent automatic upload
    },
  };

  // Xác định xem item có phải là thư mục không (dựa trên prefix hoặc name kết thúc bằng /)
  const isDirectory = (item: BucketItemType) => {
    return !!item.prefix || (item.name && item.name.endsWith("/"));
  };

  // Columns cho Table
  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (name: string | undefined, record: BucketItemType) => (
        <Space>
          {isDirectory(record) ? (
            <>
              <FolderOpenOutlined style={{ color: "#1890ff" }} />
              <Button
                type="link"
                onClick={() => navigateToFolder(name)}
                style={{ padding: 0 }}
              >
                {name || record.prefix}
              </Button>
            </>
          ) : (
            <>
              <FileOutlined />
              <span>{name}</span>
            </>
          )}
        </Space>
      ),
    },
    {
      title: "Kích thước",
      dataIndex: "size",
      key: "size",
      render: (size?: number) =>
        size ? `${(size / 1024).toFixed(2)} KB` : "-",
    },
    {
      title: "Ngày sửa đổi",
      dataIndex: "lastModified",
      key: "lastModified",
      render: (date?: string) =>
        date ? new Date(date).toLocaleString("vi-VN") : "-",
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: BucketItemType) =>
        !isDirectory(record) && (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record.name)}
            >
              Tải xuống
            </Button>
            <Popconfirm
              title="Bạn có chắc muốn xóa file này?"
              onConfirm={() => {
                showToast.error("Chức năng xóa chưa được implement trong API");
              }}
            >
              <Button
                type="primary"
                danger
                size="small"
                icon={<DeleteOutlined />}
              >
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2}>Quản lý Files MinIO</Title>
          <Text type="secondary">
            Quản lý files và thư mục trong MinIO storage
          </Text>
        </div>
      </div>

      {/* Error Alert */}
      {filesError && (
        <Alert
          message="Lỗi khi tải danh sách files"
          description="Vui lòng kiểm tra kết nối và thử lại"
          type="error"
          showIcon
          closable
        />
      )}

      {/* Navigation & Actions */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Space className="w-full flex-wrap">
              {currentPath && (
                <Button onClick={goBack} icon={<ReloadOutlined />}>
                  Quay lại
                </Button>
              )}
              <Text strong className="break-all">
                Đường dẫn: /{currentPath}
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: "right" }}>
            <Space>
              <Upload {...uploadProps}>
                <Button type="primary" icon={<UploadOutlined />}>
                  Upload Files
                </Button>
              </Upload>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetchFiles()}
                loading={isLoadingFiles}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Search
              placeholder="Tìm kiếm files..."
              allowClear
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} md={12}>
            <Text type="secondary">Tổng số items: {filteredFiles.length}</Text>
          </Col>
        </Row>
      </Card>

      {/* Files Table */}
      <Card>
        <Spin spinning={isLoadingFiles}>
          <Table
            columns={columns}
            dataSource={filteredFiles}
            rowKey={(record) =>
              record.name || record.prefix || Math.random().toString()
            }
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} items`,
              responsive: true,
            }}
            scroll={{ x: 800 }}
          />
        </Spin>
      </Card>

      {/* Usage Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <div className="text-center">
              <Title level={3}>{filteredFiles.length}</Title>
              <Text type="secondary">Tổng Items</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <div className="text-center">
              <Title level={3}>
                {
                  filteredFiles.filter((f: BucketItemType) => isDirectory(f))
                    .length
                }
              </Title>
              <Text type="secondary">Thư mục</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <div className="text-center">
              <Title level={3}>
                {(
                  filteredFiles
                    .filter((f: BucketItemType) => !isDirectory(f))
                    .reduce(
                      (acc: number, f: BucketItemType) => acc + (f.size || 0),
                      0,
                    ) /
                  1024 /
                  1024
                ).toFixed(2)}{" "}
                MB
              </Title>
              <Text type="secondary">Tổng dung lượng</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* API Usage Examples */}
      <Card title="Hướng dẫn sử dụng API MinIO">
        <div className="space-y-4">
          <div>
            <Title level={4}>1. Upload File:</Title>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
              {`// Tạo upload URL
const uploadUrlResponse = await fetchMinioControllerCreateUploadUrl({
  body: {
    path: "path/to/file.pdf"  // Sử dụng 'path' không phải 'fileName'
  }
});

// Upload file trực tiếp lên MinIO
await fetch(uploadUrlResponse.url, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type }
});`}
            </pre>
          </div>

          <div>
            <Title level={4}>2. Download File:</Title>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
              {`// Tạo download URL
const downloadResponse = await fetchMinioControllerPresignedGetObject({
  queryParams: { objectName: "path/to/file.pdf" }
});

// Mở link download
window.open(downloadResponse.url, '_blank');`}
            </pre>
          </div>

          <div>
            <Title level={4}>3. List Files:</Title>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
              {`// Sử dụng hook
const { data: files, isLoading, refetch } = useMinioControllerFindAll({
  queryParams: {
    path: "folder-path",     // Thư mục hiện tại
    limit: 100,              // Số lượng tối đa
    startAfter: "file-name"  // Phân trang
  }
});`}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
}
