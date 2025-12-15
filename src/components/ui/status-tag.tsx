import { Tag } from "antd";
import type { ReactNode } from "react";

export type StatusType = "success" | "error" | "warning" | "info" | "default";

interface StatusTagProps {
  status: StatusType;
  icon?: ReactNode;
  text: string;
  minWidth?: number;
}

/**
 * StatusTag component - Hiển thị tag với icon và text căn chỉnh đẹp mắt
 *
 * @param status - Loại status (success, error, warning, info, default)
 * @param icon - Icon component (từ lucide-react hoặc ant-design/icons)
 * @param text - Text hiển thị
 * @param minWidth - Độ rộng tối thiểu (default: 95px)
 */
export function StatusTag({
  status,
  icon,
  text,
  minWidth = 95,
}: StatusTagProps) {
  return (
    <Tag
      color={status}
      style={{
        minWidth,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "2px 8px",
      }}
    >
      {icon && (
        <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
      )}
      <span>{text}</span>
    </Tag>
  );
}
