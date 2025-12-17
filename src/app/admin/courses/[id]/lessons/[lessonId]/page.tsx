"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Button,
  Typography,
  Tag,
  Spin,
  Alert,
  Tabs,
  Table,
  Empty,
  Space,
  Modal,
  App,
} from "antd";
import HLSPlayer from "@/components/video/HLSPlayer";
import VideoPreviewModal from "@/components/video/VideoPreviewModal";
import ChunkedUploadModal from "@/components/video/ChunkedUploadModal";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  FileText,
  Brain,
  TestTube,
  ArrowLeft,
  Clock,
  Video,
  Play,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import type { Prisma, WordType } from "@prisma/client";
import { getCookie } from "cookies-next";
import {
  useFindUniqueLesson,
  useFindManyComponent,
  useCreateComponent,
  useUpdateComponent,
  useDeleteComponent,
  useCreateWord,
  useUpdateWord,
  useCreateVideoContent,
  useUpdateVideoContent,
  useFindManyVideoContent,
} from "@/generated/hooks";
import {
  useVideoControllerUploadVideo,
  useVideoControllerProcessVideoToHLS,
} from "@/generated/api/cnwComponents";
import { useQueryClient } from "@tanstack/react-query";
import ContentModal from "@/components/modal/ContentModal";
import WordModal from "@/components/modal/WordModal";
import VideoModal from "@/components/modal/VideoModal";
import { SortableTable } from "@/components/SortableTable";
import { getUserId, getUserInfo } from "@/lib/auth";

const { Title, Text } = Typography;

interface ComponentData {
  id: string;
  componentType: string;
  content?: string | null;
  indexInLesson: number;
  wordId?: string | null;
  testId?: string | null;
  videoId?: string | null;
  word?: {
    id: string;
    content: string;
    meaning: string;
    wordType: string;
  } | null;
  test?: {
    id: string;
    name: string;
    duration: number;
  } | null;
  video?: {
    id: string;
    title: string;
    description?: string | null;
    hlsPlaylistUrl?: string | null;
    thumbnailUrl?: string | null;
    duration?: number | null;
  } | null;
}

interface ContentFormData {
  content: string;
  indexInLesson: number;
}

interface WordFormData {
  content: string;
  meaning: string;
  wordType: string;
  indexInLesson: number;
}

interface VideoFormData {
  title: string;
  description?: string;
  indexInLesson: number;
}

interface VideoTabProps {
  components: ComponentData[];
  loading: boolean;
  onAdd: () => void;
  onAddLarge: () => void;
  onEdit: (component: ComponentData) => void;
  onDelete: (id: string) => void;
  onPreviewVideo: (video: {
    title: string;
    hlsUrl: string;
    thumbnailUrl?: string;
  }) => void;
  isPreviewOpening: boolean;
}

export default function LessonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const lessonId = params?.lessonId as string;
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const currentUserId = getUserId(); // Lấy ID giáo viên hiện tại
  const userInfo = getUserInfo();
  const isSuperAdmin = userInfo?.sub === "superadmin@gmail.com";

  const [activeTab, setActiveTab] = useState("content");

  // Modal states
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [wordModalOpen, setWordModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<{
    content: string;
    indexInLesson: number;
    id: string;
  } | null>(null);
  const [editingWord, setEditingWord] = useState<{
    content: string;
    meaning: string;
    wordType: string;
    indexInLesson: number;
    wordId: string;
    componentId: string;
  } | null>(null);
  const [editingVideo, setEditingVideo] = useState<{
    title: string;
    description?: string;
    indexInLesson: number;
    id: string;
    videoId: string;
    componentId: string;
  } | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{
    title: string;
    hlsUrl: string;
    thumbnailUrl?: string;
  } | null>(null);
  const [isPreviewOpening, setIsPreviewOpening] = useState(false);
  const [chunkedUploadModalOpen, setChunkedUploadModalOpen] = useState(false);

  // Fetch lesson data
  const {
    data: lesson,
    isLoading: lessonLoading,
    error: lessonError,
  } = useFindUniqueLesson(
    {
      where: { id: lessonId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            createdBy: true, // Lấy thêm createdBy để check authorization
          },
        },
      },
    },
    {
      enabled: !!lessonId,
    },
  );

  // Fetch components by type
  const { data: contentComponents, isLoading: contentLoading } =
    useFindManyComponent(
      {
        where: {
          lessonId,
          componentType: "PARAGRAPH",
        },
        orderBy: { indexInLesson: "asc" },
      },
      {
        enabled: !!lessonId,
      },
    );

  const { data: wordComponents, isLoading: wordLoading } = useFindManyComponent(
    {
      where: {
        lessonId,
        componentType: "WORD",
      },
      include: {
        word: {
          select: {
            id: true,
            content: true,
            meaning: true,
            wordType: true,
          },
        },
      },
      orderBy: { indexInLesson: "asc" },
    },
    {
      enabled: !!lessonId,
    },
  );

  const { data: testComponents, isLoading: testLoading } = useFindManyComponent(
    {
      where: {
        lessonId,
        componentType: "TEST",
      },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
      orderBy: { indexInLesson: "asc" },
    },
    {
      enabled: !!lessonId,
    },
  );

  const { data: videoComponents, isLoading: videoLoading } =
    useFindManyComponent(
      {
        where: {
          lessonId,
          componentType: "VIDEO",
        },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              description: true,
              hlsPlaylistUrl: true,
              thumbnailUrl: true,
              duration: true,
            },
          },
        },
        orderBy: { indexInLesson: "asc" },
      },
      {
        enabled: !!lessonId,
      },
    );

  // Mutations
  const createComponentMutation = useCreateComponent();
  const updateComponentMutation = useUpdateComponent();
  const deleteComponentMutation = useDeleteComponent();
  const createWordMutation = useCreateWord();
  const updateWordMutation = useUpdateWord();
  const createVideoMutation = useCreateVideoContent();
  const updateVideoMutation = useUpdateVideoContent();
  const uploadVideoMutation = useVideoControllerUploadVideo();
  const processHLSMutation = useVideoControllerProcessVideoToHLS();

  // Batch update positions
  const handleReorderComponents = async (updatedItems: ComponentData[]) => {
    try {
      // Update all components in parallel
      await Promise.all(
        updatedItems.map((item) =>
          updateComponentMutation.mutateAsync({
            where: { id: item.id },
            data: { indexInLesson: item.indexInLesson },
          }),
        ),
      );

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({
        queryKey: ["findManyComponent"],
      });
    } catch (error) {
      console.error("Error reordering components:", error);
      throw error;
    }
  };

  // Loading state
  if (lessonLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  // Error state
  if (lessonError || !lesson) {
    return (
      <Alert
        message="Lỗi"
        description="Không thể tải thông tin bài học. Vui lòng thử lại sau."
        type="error"
        className="m-4"
      />
    );
  }

  // Content handlers
  const handleAddContent = () => {
    setEditingContent(null);
    setContentModalOpen(true);
  };

  const handleEditContent = (component: ComponentData) => {
    setEditingContent({
      content: component.content || "",
      indexInLesson: component.indexInLesson,
      id: component.id,
    });
    setContentModalOpen(true);
  };

  const handleSubmitContent = async (values: ContentFormData) => {
    try {
      if (editingContent) {
        // Update existing content
        await updateComponentMutation.mutateAsync({
          where: { id: editingContent.id },
          data: {
            content: values.content,
            indexInLesson: values.indexInLesson,
          },
        });
      } else {
        // Create new content
        await createComponentMutation.mutateAsync({
          data: {
            lessonId,
            componentType: "PARAGRAPH",
            content: values.content,
            indexInLesson: values.indexInLesson,
          },
        });
      }

      // Refetch content components
      queryClient.invalidateQueries({
        queryKey: [
          "findManyComponent",
          { where: { lessonId, componentType: "PARAGRAPH" } },
        ],
      });
    } catch (error) {
      console.error("Error with content:", error);
      throw error;
    }
  };

  // Word handlers
  const handleAddWord = () => {
    setEditingWord(null);
    setWordModalOpen(true);
  };

  const handleEditWord = (component: ComponentData) => {
    if (component.word) {
      setEditingWord({
        content: component.word.content,
        meaning: component.word.meaning,
        wordType: component.word.wordType,
        indexInLesson: component.indexInLesson,
        wordId: component.word.id,
        componentId: component.id,
      });
      setWordModalOpen(true);
    }
  };

  const handleSubmitWord = async (values: WordFormData) => {
    try {
      if (editingWord) {
        // Update existing word
        await updateWordMutation.mutateAsync({
          where: { id: editingWord.wordId },
          data: {
            content: values.content,
            meaning: values.meaning,
            wordType: values.wordType as WordType,
          },
        });

        await updateComponentMutation.mutateAsync({
          where: { id: editingWord.componentId },
          data: {
            indexInLesson: values.indexInLesson,
          },
        });
      } else {
        // Create new word and component
        const newWord = await createWordMutation.mutateAsync({
          data: {
            content: values.content,
            meaning: values.meaning,
            wordType: values.wordType as WordType,
          },
        });

        if (!newWord?.id) {
          throw new Error("Failed to create word");
        }

        await createComponentMutation.mutateAsync({
          data: {
            lessonId,
            componentType: "WORD",
            wordId: newWord.id,
            indexInLesson: values.indexInLesson,
          },
        });
      }

      // Refetch word components
      queryClient.invalidateQueries({
        queryKey: [
          "findManyComponent",
          { where: { lessonId, componentType: "WORD" } },
        ],
      });
    } catch (error) {
      console.error("Error with word:", error);
      throw error;
    }
  };

  // Video handlers
  const handleAddVideo = () => {
    setEditingVideo(null);
    setVideoModalOpen(true);
  };

  const handleAddLargeVideo = () => {
    setChunkedUploadModalOpen(true);
  };

  const handleEditVideo = (component: ComponentData) => {
    if (component.video) {
      setEditingVideo({
        title: component.video.title,
        description: component.video.description || undefined,
        indexInLesson: component.indexInLesson,
        id: component.id,
        videoId: component.video.id,
        componentId: component.id,
      });
      setVideoModalOpen(true);
    }
  };

  const handleSubmitVideo = async (
    values: VideoFormData,
    file: File,
    onProgress?: (progress: number) => void,
  ) => {
    try {
      if (editingVideo) {
        // Update existing video metadata only
        onProgress?.(20);
        await updateVideoMutation.mutateAsync({
          where: { id: editingVideo.videoId },
          data: {
            title: values.title,
            description: values.description,
          },
        });

        onProgress?.(70);
        await updateComponentMutation.mutateAsync({
          where: { id: editingVideo.componentId },
          data: {
            indexInLesson: values.indexInLesson,
          },
        });

        onProgress?.(100);
        message.success("Cập nhật video thành công!");
      } else {
        // Validate file exists
        if (!file) {
          message.error("Không có file được chọn!");
          throw new Error("No file selected");
        }

        console.log("Uploading file:", file.name, file.size, file.type);
        onProgress?.(10);

        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", file, file.name);
        formData.append("title", values.title);
        if (values.description) {
          formData.append("description", values.description);
        }

        // Get access token from cookies
        const accessToken = getCookie("accessToken");

        // Upload video with XMLHttpRequest for progress tracking
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const uploadedVideo = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 60); // 10-70%
              onProgress?.(10 + progress);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (error) {
                reject(new Error("Invalid JSON response"));
              }
            } else {
              try {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.message || "Upload failed"));
              } catch {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.open("POST", `${baseUrl}/api/video/upload`);
          if (accessToken) {
            xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          }

          xhr.send(formData);
        });

        onProgress?.(70);
        console.log("Upload success:", uploadedVideo);

        // Create component linking to video
        await createComponentMutation.mutateAsync({
          data: {
            lessonId,
            componentType: "VIDEO",
            videoId: (uploadedVideo as any).id,
            indexInLesson: values.indexInLesson,
          },
        });

        onProgress?.(80);
        message.success("Upload video thành công! Đang xử lý HLS...");

        // Trigger HLS processing asynchronously (don't block UI)
        processHLSMutation
          .mutateAsync({
            pathParams: { id: (uploadedVideo as any).id },
          })
          .then(() => {
            // Refresh data when HLS processing is complete
            queryClient.invalidateQueries({
              queryKey: [
                "findManyComponent",
                { where: { lessonId, componentType: "VIDEO" } },
              ],
            });
            message.success("Video đã được xử lý thành HLS format!");
          })
          .catch((error) => {
            console.error("HLS processing error:", error);
            message.warning(
              "Upload thành công nhưng xử lý HLS thất bại. Video vẫn có thể xem được.",
            );
          });
      }

      // Refetch video components
      queryClient.invalidateQueries({
        queryKey: [
          "findManyComponent",
          { where: { lessonId, componentType: "VIDEO" } },
        ],
      });
    } catch (error) {
      console.error("Error with video:", error);
      message.error("Có lỗi xảy ra khi upload video!");
      throw error;
    }
  };

  // Delete handlers
  const handleDeleteComponent = async (componentId: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa thành phần này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteComponentMutation.mutateAsync({
            where: { id: componentId },
          });

          // Refetch all components
          queryClient.invalidateQueries({
            queryKey: ["findManyComponent"],
          });
          message.success("Xóa thành phần thành công!");
        } catch (error) {
          console.error("Error deleting component:", error);
          message.error("Có lỗi xảy ra khi xóa thành phần!");
        }
      },
    });
  };

  const getWordTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      NOUN: "Danh từ",
      VERB: "Động từ",
      ADJECTIVE: "Tính từ",
      ADVERB: "Trạng từ",
      PREPOSITION: "Giới từ",
      CONJUNCTION: "Liên từ",
      INTERJECTION: "Thán từ",
      PRONOUN: "Đại từ",
      ARTICLE: "Mạo từ",
      DETERMINER: "Từ hạn định",
      NUMERAL: "Số từ",
      OTHER: "Khác",
    };
    return typeMap[type] || type;
  };

  // Tab items
  const tabItems = [
    {
      key: "content",
      label: (
        <span className="flex items-center gap-2 px-3">
          <FileText className="w-4 h-4" />
          Nội dung ({contentComponents?.length || 0})
        </span>
      ),
      children: (
        <ContentTab
          components={(contentComponents || []) as ComponentData[]}
          loading={contentLoading}
          onAdd={handleAddContent}
          onEdit={handleEditContent}
          onDelete={handleDeleteComponent}
          onReorder={handleReorderComponents}
        />
      ),
    },
    {
      key: "word",
      label: (
        <span className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Từ vựng ({wordComponents?.length || 0})
        </span>
      ),
      children: (
        <WordTab
          components={(wordComponents || []) as ComponentData[]}
          loading={wordLoading}
          onAdd={handleAddWord}
          onEdit={handleEditWord}
          onDelete={handleDeleteComponent}
          getWordTypeLabel={getWordTypeLabel}
          onReorder={handleReorderComponents}
        />
      ),
    },
    {
      key: "video",
      label: (
        <span className="flex items-center gap-2">
          <Video className="w-4 h-4" />
          Video ({videoComponents?.length || 0})
        </span>
      ),
      children: (
        <VideoTab
          components={(videoComponents || []) as ComponentData[]}
          loading={videoLoading}
          onAdd={handleAddVideo}
          onAddLarge={handleAddLargeVideo}
          onEdit={handleEditVideo}
          onDelete={handleDeleteComponent}
          onPreviewVideo={(video) => {
            setIsPreviewOpening(true);
            setPreviewVideo(video);
            setTimeout(() => {
              setIsPreviewOpening(false);
            }, 500);
          }}
          isPreviewOpening={isPreviewOpening}
          onReorder={handleReorderComponents}
        />
      ),
    },
    {
      key: "test",
      label: (
        <span className="flex items-center gap-2">
          <TestTube className="w-4 h-4" />
          Bài kiểm tra ({testComponents?.length || 0})
        </span>
      ),
      children: (
        <TestTab
          components={(testComponents || []) as ComponentData[]}
          loading={testLoading}
          onAdd={() =>
            router.push(
              `/admin/tests?courseId=${courseId}&lessonId=${lessonId}`,
            )
          }
          onEdit={(component) => {
            if (component.test?.id) {
              router.push(`/admin/tests?testId=${component.test.id}`);
            }
          }}
          onDelete={handleDeleteComponent}
          onReorder={handleReorderComponents}
        />
      ),
    },
  ];

  // Loading state
  if (lessonLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // Error state
  if (lessonError || !lesson) {
    return (
      <div className="p-6">
        <Alert
          message="Lỗi"
          description="Không thể tải thông tin bài học. Vui lòng thử lại sau."
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => router.back()}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  // Authorization check - chỉ creator của course hoặc superadmin mới được truy cập
  const isCreator = lesson.course?.createdBy === currentUserId;
  if (!isCreator && !isSuperAdmin) {
    return (
      <div className="p-6">
        <Alert
          message="Không có quyền truy cập"
          description="Bạn không có quyền truy cập bài học này. Chỉ giáo viên tạo khóa học mới có thể quản lý."
          type="warning"
          showIcon
          action={
            <Button
              type="primary"
              onClick={() => router.push("/admin/courses")}
            >
              Quay lại danh sách khóa học
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className=" text-black shadow">
        <div className="container px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-blue-100 mb-3">
            <Link
              href="/admin/courses"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Khóa học
            </Link>
            <span>/</span>
            <Link
              href={`/admin/courses/${courseId}`}
              className="hover:text-white transition-colors"
            >
              {lesson.course?.title}
            </Link>
            <span>/</span>
            <Link
              href={`/admin/courses/${courseId}/lessons`}
              className="hover:text-white transition-colors"
            >
              Bài học
            </Link>
            <span>/</span>
            <span className="text-white font-medium">{lesson.title}</span>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <Title level={2} className=" text-black!">
                {lesson.title}
              </Title>
              <Text className="text-blue-100">
                Quản lý các thành phần của bài học
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-3">
        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />
        </div>

        {/* Modals */}
        <ContentModal
          open={contentModalOpen}
          onCancel={() => setContentModalOpen(false)}
          onSubmit={handleSubmitContent}
          editingData={editingContent}
          title={editingContent ? "Sửa nội dung" : "Thêm nội dung"}
          nextIndex={(contentComponents?.length || 0) + 1}
        />

        <WordModal
          open={wordModalOpen}
          onCancel={() => setWordModalOpen(false)}
          onSubmit={handleSubmitWord}
          editingData={editingWord}
          title={editingWord ? "Sửa từ vựng" : "Thêm từ vựng"}
          nextIndex={(wordComponents?.length || 0) + 1}
        />

        <VideoModal
          open={videoModalOpen}
          onCancel={() => setVideoModalOpen(false)}
          onSubmit={handleSubmitVideo}
          editingData={editingVideo}
          title={editingVideo ? "Sửa video" : "Upload video"}
          nextIndex={(videoComponents?.length || 0) + 1}
        />

        {/* Video Preview Modal */}
        <VideoPreviewModal
          open={!!previewVideo}
          onClose={() => {
            setPreviewVideo(null);
            setIsPreviewOpening(false);
          }}
          title={previewVideo?.title || "Video"}
          src={previewVideo?.hlsUrl || ""}
          poster={previewVideo?.thumbnailUrl}
        />

        {/* Chunked Upload Modal */}
        <ChunkedUploadModal
          open={chunkedUploadModalOpen}
          onCancel={() => setChunkedUploadModalOpen(false)}
          title="Upload Video Lớn (Multi-GB)"
          onSuccess={async (result) => {
            console.log("Chunked upload success:", result);

            // Create component linking to video
            try {
              await createComponentMutation.mutateAsync({
                data: {
                  lessonId,
                  componentType: "VIDEO",
                  videoId: result.id,
                  indexInLesson: (videoComponents?.length || 0) + 1,
                },
              });

              // Trigger HLS processing asynchronously
              processHLSMutation
                .mutateAsync({
                  pathParams: { id: result.id },
                })
                .then(() => {
                  queryClient.invalidateQueries({
                    queryKey: [
                      "findManyComponent",
                      { where: { lessonId, componentType: "VIDEO" } },
                    ],
                  });
                  message.success("Video lớn đã được xử lý thành HLS format!");
                })
                .catch((error) => {
                  console.error("HLS processing error:", error);
                  message.warning(
                    "Upload thành công nhưng xử lý HLS thất bại. Video vẫn có thể xem được.",
                  );
                });

              // Refresh video components
              queryClient.invalidateQueries({
                queryKey: [
                  "findManyComponent",
                  { where: { lessonId, componentType: "VIDEO" } },
                ],
              });
            } catch (error) {
              console.error("Error creating video component:", error);
              message.error("Upload thành công nhưng không thể tạo component!");
            }
          }}
        />
      </div>
    </div>
  );
}

// Tab Components
interface TabProps {
  components: ComponentData[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (component: ComponentData) => void;
  onDelete: (componentId: string) => void;
  onReorder: (updatedItems: ComponentData[]) => Promise<void>;
}

interface WordTabProps extends TabProps {
  getWordTypeLabel: (type: string) => string;
}

interface VideoTabProps extends TabProps {
  onPreviewVideo: (video: {
    title: string;
    hlsUrl: string;
    thumbnailUrl?: string;
  }) => void;
  isPreviewOpening: boolean;
}

function ContentTab({
  components,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: TabProps) {
  const columns = [
    {
      title: "Vị trí",
      dataIndex: "indexInLesson",
      key: "index",
      width: 120,
      align: "center" as const,
      render: (index: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-semibold">
          {index}
        </span>
      ),
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      key: "content",
      render: (content: string) => (
        <div className="text-gray-700 line-clamp-2">
          {content || "Không có nội dung"}
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      align: "center" as const,
      render: (_: unknown, record: ComponentData) => (
        <Space>
          <Button
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => onEdit(record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => onDelete(record.id)}
            danger
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <Text className="font-semibold text-gray-900">
              Nội dung bài học
            </Text>
            <Text type="secondary" className="text-sm block">
              Kéo thả để sắp xếp lại vị trí các đoạn văn
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={onAdd}
        >
          Thêm nội dung
        </Button>
      </div>

      <SortableTable
        dataSource={components}
        columns={columns}
        loading={loading}
        onReorder={onReorder}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} nội dung`,
        }}
        emptyDescription="Chưa có nội dung nào"
        emptyButtonText="Thêm nội dung đầu tiên"
        onAdd={onAdd}
        renderDragOverlay={(item) => (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-semibold text-lg">
              {item.indexInLesson}
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Nội dung bài học</div>
              <div className="font-medium text-gray-900 line-clamp-2">
                {item.content || "Không có nội dung"}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}

function WordTab({
  components,
  loading,
  onAdd,
  onEdit,
  onDelete,
  getWordTypeLabel,
  onReorder,
}: WordTabProps) {
  const columns = [
    {
      title: "Vị trí",
      dataIndex: "indexInLesson",
      key: "index",
      width: 120,
      align: "center" as const,
      render: (index: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700 font-semibold">
          {index}
        </span>
      ),
    },
    {
      title: "Từ vựng",
      key: "word",
      render: (_: unknown, record: ComponentData) => (
        <div>
          <div className="font-semibold text-gray-900 mb-1">
            {record.word?.content}
          </div>
          <div className="text-sm text-gray-600">{record.word?.meaning}</div>
        </div>
      ),
    },
    {
      title: "Loại từ",
      key: "wordType",
      width: 120,
      align: "center" as const,
      render: (_: unknown, record: ComponentData) => (
        <Tag color="green">
          {record.word?.wordType
            ? getWordTypeLabel(record.word.wordType)
            : "N/A"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      align: "center" as const,
      render: (_: unknown, record: ComponentData) => (
        <Space>
          <Button
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => onEdit(record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => onDelete(record.id)}
            danger
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <Text className="font-semibold text-gray-900">Từ vựng</Text>
            <Text type="secondary" className="text-sm block">
              Kéo thả để sắp xếp lại vị trí các từ vựng
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={onAdd}
          className="bg-green-600 hover:bg-green-700!"
        >
          Thêm từ vựng
        </Button>
      </div>

      <SortableTable
        dataSource={components}
        columns={columns}
        loading={loading}
        onReorder={onReorder}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} từ vựng`,
        }}
        emptyDescription="Chưa có từ vựng nào"
        emptyButtonText="Thêm từ vựng đầu tiên"
        onAdd={onAdd}
        renderDragOverlay={(item) => (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-700 font-semibold text-lg">
              {item.indexInLesson}
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">
                Từ vựng -{" "}
                {item.word?.wordType
                  ? getWordTypeLabel(item.word.wordType)
                  : "N/A"}
              </div>
              <div className="font-semibold text-gray-900">
                {item.word?.content}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {item.word?.meaning}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}

function VideoTab({
  components,
  loading,
  onAdd,
  onAddLarge,
  onEdit,
  onDelete,
  onPreviewVideo,
  isPreviewOpening,
  onReorder,
}: VideoTabProps) {
  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return "Chưa xử lý";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const columns = [
    {
      title: "Vị trí",
      dataIndex: "indexInLesson",
      key: "index",
      width: 120,
      align: "center" as const,
      render: (index: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-semibold">
          {index}
        </span>
      ),
    },
    {
      title: "Video",
      key: "video",
      render: (_: unknown, record: ComponentData) => (
        <div>
          <div className="font-semibold text-gray-900 mb-1">
            {record.video?.title}
          </div>
          {record.video?.description && (
            <div className="text-sm text-gray-600 line-clamp-1">
              {record.video.description}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(record.video?.duration)}</span>
            </div>
            {record.video?.hlsPlaylistUrl && (
              <Tag color="success">HLS Ready</Tag>
            )}
            {!record.video?.hlsPlaylistUrl && (
              <Tag color="processing">Đang xử lý...</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      align: "center" as const,
      render: (_: unknown, record: ComponentData) => (
        <Space>
          {record.video?.hlsPlaylistUrl && (
            <Button
              type="link"
              size="small"
              icon={<Play className="w-4 h-4" />}
              loading={isPreviewOpening}
              onClick={() => {
                if (isPreviewOpening) return;

                onPreviewVideo({
                  title: record.video?.title || "Video",
                  hlsUrl: record.video?.hlsPlaylistUrl || "",
                  thumbnailUrl: record.video?.thumbnailUrl || undefined,
                });
              }}
            >
              Xem
            </Button>
          )}
          <Button
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => onEdit(record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => onDelete(record.id)}
            danger
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <Text className="font-semibold text-gray-900">Video bài giảng</Text>
            <Text type="secondary" className="text-sm block">
              Kéo thả để sắp xếp lại vị trí các video
            </Text>
          </div>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={onAdd}
            className="bg-purple-600 hover:bg-purple-700!"
          >
            Upload video
          </Button>
          {/* <Button
            type="primary"
            ghost
            icon={<Plus className="w-4 h-4" />}
            onClick={onAddLarge}
            className="border-purple-600 text-purple-600 hover:bg-purple-50!"
          >
            Upload lớn (GB)
          </Button> */}
        </Space>
      </div>

      <SortableTable
        dataSource={components}
        columns={columns}
        loading={loading}
        onReorder={onReorder}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} video`,
        }}
        emptyDescription="Chưa có video nào"
        emptyButtonText="Upload video đầu tiên"
        onAdd={onAdd}
        renderDragOverlay={(item) => {
          const formatDuration = (seconds: number | null | undefined) => {
            if (!seconds) return "Chưa xử lý";
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, "0")}`;
          };

          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-700 font-semibold text-lg">
                {item.indexInLesson}
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">
                  Video bài giảng • {formatDuration(item.video?.duration)}
                </div>
                <div className="font-semibold text-gray-900">
                  {item.video?.title}
                </div>
                {item.video?.description && (
                  <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                    {item.video.description}
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

function TestTab({
  components,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: TabProps) {
  const columns = [
    {
      title: "Vị trí",
      dataIndex: "indexInLesson",
      key: "index",
      width: 120,
      align: "center" as const,
      render: (index: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-semibold">
          {index}
        </span>
      ),
    },
    {
      title: "Bài kiểm tra",
      key: "test",
      render: (_: unknown, record: ComponentData) => (
        <div>
          <div className="font-semibold text-gray-900 mb-1">
            {record.test?.name}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{record.test?.duration} phút</span>
          </div>
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      align: "center" as const,
      render: (_: unknown, record: ComponentData) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => onEdit(record)}
            className="bg-orange-500 hover:bg-orange-600!"
          >
            Sửa test
          </Button>
          <Button
            size="small"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => onDelete(record.id)}
            danger
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
            <TestTube className="w-5 h-5 text-white" />
          </div>
          <div>
            <Text className="font-semibold text-gray-900">Bài kiểm tra</Text>
            <Text type="secondary" className="text-sm block">
              Kéo thả để sắp xếp lại vị trí các bài kiểm tra
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={onAdd}
          className="bg-orange-600 hover:bg-orange-700!"
        >
          Tạo bài kiểm tra
        </Button>
      </div>

      <SortableTable
        dataSource={components}
        columns={columns}
        loading={loading}
        onReorder={onReorder}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} bài kiểm tra`,
        }}
        emptyDescription="Chưa có bài kiểm tra nào"
        emptyButtonText="Tạo bài kiểm tra đầu tiên"
        onAdd={onAdd}
        renderDragOverlay={(item) => (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 text-orange-700 font-semibold text-lg">
              {item.indexInLesson}
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">
                Bài kiểm tra • {item.test?.duration} phút
              </div>
              <div className="font-semibold text-gray-900">
                {item.test?.name}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
