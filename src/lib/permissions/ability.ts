import { AbilityBuilder, PureAbility } from "@casl/ability";

// Define the ability type - uses string literals from database
export type AppAbility = PureAbility<[string, string]>;

// Create ability builder
export function createAbility(
  permissions: Array<{ name: string; permissionType: string }>,
): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(PureAbility);

  // Add permissions from user's groups
  // name: resource table name (User, Course, etc.)
  // permissionType: action (CREATE, READ, UPDATE, DELETE)
  permissions.forEach((permission) => {
    can(permission.permissionType, permission.name);
  });

  return build();
}

// Default ability (no permissions)
export const defaultAbility = new PureAbility<[string, string]>([]);
