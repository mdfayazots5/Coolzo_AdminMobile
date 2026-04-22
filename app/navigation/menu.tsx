import type { AppNavItem } from "../domain/models/admin";
import { ROLE_NAVIGATION } from "../modules/role-navigation";
import type { UserRole } from "../store/session-store";

export function getNavigationForRole(role?: UserRole): AppNavItem[] {
  if (!role) {
    return [];
  }

  return ROLE_NAVIGATION[role] ?? [];
}

