import { Tag } from "antd";
import type { ReactNode } from "react";

interface InfoBadgeProps {
  icon: ReactNode;
  text: string;
  type?: "default" | "secondary" | "success" | "warning" | "danger";
  size?: "small" | "medium" | "large";
}

/**
 * InfoBadge component - Hiển thị thông tin với icon và text căn chỉnh ngang dạng Tag
 *
 * @param icon - Icon component (từ lucide-react hoặc ant-design/icons)
 * @param text - Text hiển thị
 * @param type - Loại hiển thị (default, secondary, success, warning, danger)
 * @param size - Kích thước (small, medium, large)
 */
export function InfoBadge({
  icon,
  text,
  type = "secondary",
  size = "medium",
}: InfoBadgeProps) {
  const getColor = () => {
    switch (type) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "danger":
        return "error";
      case "default":
        return "default";
      case "secondary":
      default:
        return undefined;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "small":
        return "11px";
      case "large":
        return "14px";
      default:
        return "12px";
    }
  };

  const getPadding = () => {
    switch (size) {
      case "small":
        return "0 6px";
      case "large":
        return "2px 10px";
      default:
        return "1px 8px";
    }
  };

  return (
    <Tag
      icon={icon}
      color={getColor()}
      style={{
        fontSize: getFontSize(),
        padding: getPadding(),
        margin: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {text}
    </Tag>
  );
}
