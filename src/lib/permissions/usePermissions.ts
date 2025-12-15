import { useMemo } from "react";
import { useFindUniqueUser } from "@/generated/hooks/user";
import { getUserInfo } from "@/lib/auth";
import { createAbility, defaultAbility, type AppAbility } from "./ability";

export function usePermissions(): {
  ability: AppAbility;
  isLoading: boolean;
  permissions: Array<{ name: string; permissionType: string }>;
} {
  const userInfo = getUserInfo();
  const userId = userInfo?.userId;

  // Fetch user with groups and permissions
  const { data: user, isLoading } = useFindUniqueUser(
    {
      where: { id: userId || "" },
      include: {
        group: {
          include: {
            permission: true,
          },
        },
      },
    },
    {
      enabled: !!userId,
    },
  );

  // Extract all permissions from user's groups
  const permissions = useMemo(() => {
    if (!user?.group) return [];

    const perms: Array<{ name: string; permissionType: string }> = [];
    user.group.forEach((group) => {
      group.permission?.forEach((perm) => {
        // Avoid duplicates
        if (
          !perms.some(
            (p) =>
              p.name === perm.name && p.permissionType === perm.permissionType,
          )
        ) {
          perms.push({
            name: perm.name,
            permissionType: perm.permissionType,
          });
        }
      });
    });

    return perms;
  }, [user]);

  // Create CASL ability from permissions
  const ability = useMemo(() => {
    if (!permissions.length) return defaultAbility;
    return createAbility(permissions);
  }, [permissions]);

  return {
    ability,
    isLoading,
    permissions,
  };
}
