"use client";

import { type ReactNode } from "react";
import { useAbility } from "@/lib/permissions/AbilityContext";

interface CanProps {
  /** Action to check (CREATE, READ, UPDATE, DELETE) */
  do: string;
  /** Resource/table name to check */
  on: string;
  /** Children to render if permission granted */
  children: ReactNode;
  /** Optional fallback to render if permission denied */
  fallback?: ReactNode;
  /** Optional passthrough - always render children (for debugging) */
  passthrough?: boolean;
}

/**
 * Permission component - Only renders children if user has permission
 *
 * @example
 * ```tsx
 * <Can do="CREATE" on="Course">
 *   <Button>Tạo khóa học</Button>
 * </Can>
 *
 * <Can do="UPDATE" on="User" fallback={<Text>Không có quyền</Text>}>
 *   <Button>Sửa người dùng</Button>
 * </Can>
 * ```
 */
export function Can({
  do: action,
  on: resource,
  children,
  fallback = null,
  passthrough = false,
}: CanProps) {
  const ability = useAbility();

  // For debugging - always render
  if (passthrough) {
    return <>{children}</>;
  }

  // Check permission
  const hasPermission = ability.can(action, resource);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Inverse of Can - Only renders children if user does NOT have permission
 */
export function Cannot({
  do: action,
  on: resource,
  children,
  fallback = null,
}: CanProps) {
  const ability = useAbility();

  const hasPermission = ability.can(action, resource);

  if (hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
