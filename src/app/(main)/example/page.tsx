'use client';

import { useState } from 'react';
import { getUserId } from '@/lib/auth';

// Mock data cho MinIO - thay thế bằng API thực tế
interface FileData {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  url: string;
}

export default function ExamplePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState<FileData[]>([
    {
      id: '1',
      name: 'document.pdf',
      size: '2.5 MB',
      uploadedAt: '2025-09-28',
      url: '/api/files/document.pdf'
    },
    {
      id: '2',
      name: 'image.jpg',
      size: '1.2 MB',
      uploadedAt: '2025-09-27',
      url: '/api/files/image.jpg'
    }
  ]);

  const [mockUsers] = useState([
    { id: '1', email: 'user1@example.com', name: 'User 1' },
    { id: '2', email: 'user2@example.com', name: 'User 2' },
    { id: '3', email: 'user3@example.com', name: 'User 3' }
  ]);

  // File upload handler (mock)
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    // Mock upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Add file to list
          const newFile: FileData = {
            id: Date.now().toString(),
            name: selectedFile.name,
            size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
            uploadedAt: new Date().toISOString().split('T')[0],
            url: URL.createObjectURL(selectedFile)
          };
          setFiles(prev => [...prev, newFile]);
          setSelectedFile(null);
          setUploadProgress(0);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ví dụ sử dụng API</h1>
        <p className="mt-1 text-sm text-gray-600">
          Demo ZenStack hooks và MinIO file upload
        </p>
      </div>

      {/* ZenStack Example - Mock Data */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          ZenStack Users Management (Mock)
        </h2>
        
        <div className="mb-4">
          <button
            onClick={() => alert('Feature sẽ được implement với ZenStack hooks thực tế')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Tạo User Mới (Mock)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => alert('Update function (Mock)')}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Cập nhật
                    </button>
                    <button
                      onClick={() => alert('Delete function (Mock)')}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">ZenStack Integration:</h3>
          <pre className="text-sm text-blue-800 bg-blue-100 p-2 rounded overflow-x-auto">
{`// Example ZenStack hooks usage:
import { useUsersControllerFindAll } from '@/generated/api/cnwComponents';

const { data: users, isLoading, error } = useUsersControllerFindAll({
  // query parameters
});`}
          </pre>
        </div>
      </div>

      {/* MinIO File Upload Example */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          MinIO File Upload (Mock)
        </h2>
        
        <div className="mb-4">
          <div className="flex items-center space-x-4">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile || uploadProgress > 0}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              Upload
            </button>
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Files đã upload:</h3>
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{file.name}</div>
                  <div className="text-sm text-gray-500">{file.size} • {file.uploadedAt}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  Xem
                </a>
                <button
                  onClick={() => setFiles(files.filter(f => f.id !== file.id))}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">MinIO Integration:</h3>
          <pre className="text-sm text-green-800 bg-green-100 p-2 rounded overflow-x-auto">
{`// Example MinIO upload function:
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/minio/upload', {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
};`}
          </pre>
        </div>
      </div>

      {/* API Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          API Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900">ZenStack</h3>
            <p className="text-sm text-blue-700">Mock Ready</p>
            <p className="text-xs text-blue-600 mt-1">Sẵn sàng integrate với hooks thực tế</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900">MinIO</h3>
            <p className="text-sm text-green-700">Mock Connected</p>
            <p className="text-xs text-green-600 mt-1">Demo upload functionality</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium text-purple-900">Auth</h3>
            <p className="text-sm text-purple-700">
              User ID: {getUserId() || 'N/A'}
            </p>
            <p className="text-xs text-purple-600 mt-1">Authentication active</p>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Code Examples
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">1. ZenStack Hook Usage:</h3>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
{`// Import hooks từ generated API
import { useUsersControllerFindAll, useAuthControllerLogin } from '@/generated/api/cnwComponents';

// Sử dụng trong component
const { data: users, isLoading, error } = useUsersControllerFindAll();

// Mutation example
const loginMutation = useAuthControllerLogin({
  onSuccess: (data) => {
    // Handle success
    console.log('Login successful:', data);
  },
  onError: (error) => {
    // Handle error
    console.error('Login failed:', error);
  }
});`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">2. MinIO File Upload:</h3>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
{`// MinIO upload function
const uploadToMinIO = async (file: File, bucketName: string) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucketName);

    const response = await fetch('/api/minio/upload', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${accessToken}\`
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    
    return await response.json();
  } catch (error) {
    console.error('MinIO upload error:', error);
    throw error;
  }
};`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}