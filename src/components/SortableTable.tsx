"use client";

import React, { useState } from "react";
import { Table, Space, Button, App } from "antd";
import type { TableProps } from "antd";
import { Edit, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DropAnimation } from "@dnd-kit/core";

interface SortableTableProps<T> {
  dataSource: T[];
  columns: TableProps<T>["columns"];
  loading?: boolean;
  onReorder: (updatedItems: T[]) => Promise<void>;
  emptyDescription?: string;
  emptyButtonText?: string;
  onAdd?: () => void;
  pagination?: TableProps<T>["pagination"];
  rowKey?: string;
  renderDragOverlay?: (item: T) => React.ReactNode;
}

interface SortableRowProps {
  children: React.ReactNode;
  "data-row-key": string;
}

function SortableRow({ children, ...props }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
    position: "relative",
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.3 : 1,
    backgroundColor: isDragging ? "#e3f2fd" : undefined,
    boxShadow: isDragging ? "0 10px 30px rgba(0,0,0,0.2)" : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...props}>
      {React.Children.map(children, (child, index) => {
        if (index === 0 && React.isValidElement(child)) {
          // Add drag handle to the first cell
          return (
            <td>
              <div className="flex items-center gap-2">
                <div
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing hover:bg-gray-100 p-1 rounded transition-colors"
                  title="Kéo để sắp xếp lại"
                >
                  <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </div>
                {(child.props as any)?.children}
              </div>
            </td>
          );
        }
        return child;
      })}
    </tr>
  );
}

export function SortableTable<T extends { id: string; indexInLesson: number }>({
  dataSource,
  columns,
  loading,
  onReorder,
  emptyDescription = "Chưa có dữ liệu",
  emptyButtonText = "Thêm mới",
  onAdd,
  pagination,
  rowKey = "id",
  renderDragOverlay,
}: SortableTableProps<T>) {
  const { message } = App.useApp();
  const [isReordering, setIsReordering] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = dataSource.findIndex((item) => item.id === active.id);
    const newIndex = dataSource.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Create reordered array
    const reorderedItems = arrayMove(dataSource, oldIndex, newIndex);

    // Update indexInLesson for all affected items
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      indexInLesson: index + 1,
    }));

    setIsReordering(true);
    try {
      await onReorder(updatedItems);
      message.success("Cập nhật vị trí thành công!");
    } catch (error) {
      console.error("Error reordering:", error);
      message.error("Có lỗi xảy ra khi cập nhật vị trí!");
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = activeId
    ? dataSource.find((item) => item.id === activeId)
    : null;

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={dataSource.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <Table<T>
          columns={columns}
          dataSource={dataSource}
          loading={loading || isReordering}
          rowKey={rowKey}
          pagination={pagination}
          components={{
            body: {
              row: SortableRow,
            },
          }}
          locale={{
            emptyText: onAdd ? (
              <div className="py-8">
                <p className="mb-4 text-gray-500">{emptyDescription}</p>
                <Button type="primary" onClick={onAdd}>
                  {emptyButtonText}
                </Button>
              </div>
            ) : (
              emptyDescription
            ),
          }}
        />
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeItem ? (
          <div
            className="bg-white rounded-lg shadow-2xl border-2 border-blue-400 p-4 min-w-[400px]"
            style={{
              opacity: 0.95,
              cursor: "grabbing",
            }}
          >
            {renderDragOverlay ? (
              renderDragOverlay(activeItem)
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-semibold">
                  {activeItem.indexInLesson}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Đang di chuyển...</div>
                  <div className="font-medium text-gray-900">
                    Vị trí {activeItem.indexInLesson}
                  </div>
                </div>
                <GripVertical className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
