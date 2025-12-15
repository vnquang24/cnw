import type { MenuItem } from "./type";
import type { AppAbility } from "@/lib/permissions/ability";

/**
 * Filter menu items dựa trên permissions
 * Recursively filter cả subMenu
 */
export function filterMenuItemsByPermission(
  menuItems: MenuItem[],
  ability: AppAbility,
): MenuItem[] {
  return menuItems
    .filter((item) => {
      // Filter by hidden flag
      if (item.hidden) return false;

      // Check permission nếu có requiredPermission
      if (item.requiredPermission) {
        return ability.can(
          item.requiredPermission.action,
          item.requiredPermission.resource,
        );
      }

      // Không có requiredPermission => luôn hiển thị
      return true;
    })
    .map((item) => {
      // Nếu có subMenu, filter recursively
      if (item.subMenu && item.subMenu.length > 0) {
        return {
          ...item,
          subMenu: filterMenuItemsByPermission(item.subMenu, ability),
        };
      }
      return item;
    })
    .filter((item) => {
      // Remove parent nếu tất cả children bị filter hết
      if (item.subMenu !== undefined) {
        return item.subMenu.length > 0;
      }
      return true;
    });
}

/**
 * Check if user có ít nhất 1 permission trong danh sách
 */
export function hasAnyPermission(
  ability: AppAbility,
  permissions: Array<{ action: string; resource: string }>,
): boolean {
  return permissions.some((perm) => ability.can(perm.action, perm.resource));
}

/**
 * Check if user có tất cả permissions trong danh sách
 */
export function hasAllPermissions(
  ability: AppAbility,
  permissions: Array<{ action: string; resource: string }>,
): boolean {
  return permissions.every((perm) => ability.can(perm.action, perm.resource));
}
