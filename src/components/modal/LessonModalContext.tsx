"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface LessonModalContextType {
  selectedLessonId: string;
  setSelectedLessonId: (id: string) => void;

  // Modal states
  isViewModalOpen: boolean;
  isEditModalOpen: boolean;

  // Modal actions
  openViewModal: (lessonId: string) => void;
  closeViewModal: () => void;
  openEditModal: (lessonId: string) => void;
  closeEditModal: () => void;
}

const LessonModalContext = createContext<LessonModalContextType | undefined>(
  undefined,
);

export const useLessonModal = () => {
  const context = useContext(LessonModalContext);
  if (!context) {
    throw new Error("useLessonModal must be used within LessonModalProvider");
  }
  return context;
};

interface LessonModalProviderProps {
  children: ReactNode;
}

export const LessonModalProvider = ({ children }: LessonModalProviderProps) => {
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const openViewModal = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedLessonId("");
  };

  const openEditModal = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedLessonId("");
  };

  return (
    <LessonModalContext.Provider
      value={{
        selectedLessonId,
        setSelectedLessonId,
        isViewModalOpen,
        isEditModalOpen,
        openViewModal,
        closeViewModal,
        openEditModal,
        closeEditModal,
      }}
    >
      {children}
    </LessonModalContext.Provider>
  );
};
