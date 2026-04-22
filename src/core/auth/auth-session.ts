/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PermissionAction, PermissionSet, RBACEngine } from "./rbac-engine";
import { UserProfile, UserRole } from "@/store/auth-store";

export interface BackendCurrentUser {
  userId: number;
  userName: string;
  email: string;
  fullName: string;
  technicianId?: number | null;
  helperProfileId?: number | null;
  branchId: number;
  roles: string[];
  permissions: string[];
  customerId?: number | null;
  mustChangePassword?: boolean;
  isTemporaryPassword?: boolean;
  passwordExpiryOnUtc?: string | null;
}

export interface BackendAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  currentUser: BackendCurrentUser;
  requiresTwoFactor?: boolean;
}

export interface BackendPermissionSnapshot {
  modules?: Record<string, PermissionModuleActions>;
  permissions?: string[];
  dataScope: string;
}

export interface BackendViewAsRoleResponse extends BackendPermissionSnapshot {
  roleId: number;
  roleName: string;
  displayName: string;
  issuedAtUtc: string;
}

export interface PermissionModuleActions {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  approve?: boolean;
  export?: boolean;
}

export interface ViewAsRoleSession {
  roleId: string;
  roleName: string;
  displayName: string;
  permissionSet: PermissionSet;
  rawPermissions: string[];
  dataScope: string;
  startedAt: number;
}

const COMMON_ROLE_ALIASES: Record<string, UserRole> = {
  superadmin: UserRole.SUPER_ADMIN,
  admin: UserRole.ADMIN,
  operationsmanager: UserRole.OPS_MANAGER,
  operationsexecutive: UserRole.OPS_EXECUTIVE,
  customersupportexecutive: UserRole.SUPPORT,
  support: UserRole.SUPPORT,
  technician: UserRole.TECHNICIAN,
  helper: UserRole.HELPER,
  inventorymanager: UserRole.INVENTORY_MANAGER,
  billingexecutive: UserRole.BILLING_EXECUTIVE,
  financemanager: UserRole.FINANCE_MANAGER,
  marketingmanager: UserRole.MARKETING_MANAGER,
};

type PermissionTarget = {
  module: string;
  actions: PermissionAction[];
};

const normalizeRoleKey = (roleName: string) => roleName.replace(/[^a-z0-9]/gi, "").toLowerCase();

export const mapBackendRole = (roleName?: string | null): UserRole => {
  if (!roleName) {
    return UserRole.ADMIN;
  }

  return COMMON_ROLE_ALIASES[normalizeRoleKey(roleName)] ?? UserRole.ADMIN;
};

export const mapBackendCurrentUser = (currentUser: BackendCurrentUser): UserProfile => {
  const roles = (currentUser.roles || []).map(mapBackendRole);
  const role = roles[0] ?? UserRole.ADMIN;

  return {
    id: String(currentUser.userId),
    name: currentUser.fullName || currentUser.userName,
    email: currentUser.email,
    role,
    roles,
    permissions: currentUser.permissions || [],
    branchId: currentUser.branchId,
    technicianId: currentUser.technicianId ? String(currentUser.technicianId) : undefined,
    helperProfileId: currentUser.helperProfileId ? String(currentUser.helperProfileId) : undefined,
  };
};

export const mapBackendAuthResponse = (response: BackendAuthTokenResponse) => ({
  user: mapBackendCurrentUser(response.currentUser),
  token: response.accessToken,
  refreshToken: response.refreshToken,
  requires2FA: response.requiresTwoFactor ?? false,
});

export const resolveDefaultRoute = (role?: UserRole | null) => {
  switch (role) {
    case UserRole.TECHNICIAN:
    case UserRole.HELPER:
      return "/technician/home";
    case UserRole.OPS_MANAGER:
    case UserRole.OPS_EXECUTIVE:
      return "/operations/dashboard";
    case UserRole.SUPPORT:
      return "/support/dashboard";
    case UserRole.FINANCE_MANAGER:
    case UserRole.BILLING_EXECUTIVE:
      return "/finance/dashboard";
    case UserRole.MARKETING_MANAGER:
      return "/marketing/dashboard";
    case UserRole.INVENTORY_MANAGER:
      return "/inventory/catalog";
    case UserRole.ADMIN:
    case UserRole.SUPER_ADMIN:
    default:
      return "/admin/dashboard";
  }
};

const addActions = (permissionSet: PermissionSet, module: string, actions: PermissionAction[]) => {
  const current = permissionSet[module] || [];
  permissionSet[module] = Array.from(new Set([...current, ...actions]));
};

const normalizeModuleId = (moduleName: string) => {
  const normalized = moduleName.replace(/[_\s]+/g, '-');
  const kebab = normalized.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

  if (kebab === 'servicerequests') {
    return 'service-requests';
  }

  return kebab;
};

export const buildPermissionSetFromModules = (modules?: Record<string, PermissionModuleActions> | null): PermissionSet => {
  const permissionSet: PermissionSet = {};

  for (const [moduleName, actions] of Object.entries(modules || {})) {
    const enabledActions = (['view', 'create', 'edit', 'delete', 'approve', 'export'] as PermissionAction[])
      .filter((action) => Boolean(actions?.[action]));

    if (enabledActions.length > 0) {
      permissionSet[normalizeModuleId(moduleName)] = enabledActions;
    }
  }

  return permissionSet;
};

export const buildPermissionSetFromSnapshot = (
  snapshot: BackendPermissionSnapshot,
  role?: UserRole | null
): PermissionSet => {
  const fromModules = buildPermissionSetFromModules(snapshot.modules);
  if (Object.keys(fromModules).length > 0) {
    return fromModules;
  }

  return buildPermissionSet(snapshot.permissions || [], role);
};

const mapPermissionName = (permissionName: string): PermissionTarget[] => {
  const [scope, verb = "read"] = permissionName.split(".");

  const viewAction = verb === "read" ? (["view"] as PermissionAction[]) : [];
  const createAction = verb === "create" ? (["create"] as PermissionAction[]) : [];
  const editAction = verb === "update" || verb === "manage" ? (["edit"] as PermissionAction[]) : [];

  switch (scope) {
    case "dashboard":
      return [{ module: "dashboard", actions: ["view"] as PermissionAction[] }];
    case "operationsDashboard":
      return [{ module: "operations", actions: ["view"] as PermissionAction[] }];
    case "serviceRequest":
      return [{ module: "service-requests", actions: [...viewAction, ...createAction, ...editAction] }];
    case "assignment":
      return [
        { module: "service-requests", actions: ["edit", "approve"] },
        { module: "operations", actions: ["view", "edit"] as PermissionAction[] },
        { module: "scheduling", actions: ["view", "edit"] as PermissionAction[] },
      ];
    case "technician":
      return [{ module: "team", actions: ["view", ...(verb === "update" ? ["edit"] : [])] as PermissionAction[] }];
    case "analytics":
    case "report":
      return [{ module: "reports", actions: ["view", "export"] as PermissionAction[] }];
    case "user":
    case "role":
    case "permission":
    case "lookup":
    case "configuration":
    case "health":
    case "notificationTemplate":
    case "notificationTrigger":
    case "communicationPreference":
      return [{ module: "settings", actions: [...viewAction, ...createAction, ...editAction] }];
    case "cms":
      return [
        { module: "settings", actions: [...viewAction, ...createAction, ...editAction] },
        { module: "marketing", actions: [...viewAction, ...createAction, ...editAction] },
      ];
    case "quotation":
      return [{ module: "billing", actions: ["view", "create", ...(verb === "approve" ? ["approve"] : [])] as PermissionAction[] }];
    case "invoice":
    case "billing":
      return [{ module: "billing", actions: [...viewAction, ...createAction, ...editAction] }];
    case "payment":
      return [{ module: "finance", actions: ["view", ...(verb === "collect" ? ["approve", "edit"] : [])] as PermissionAction[] }];
    case "amc":
      return [{ module: "amc", actions: ["view", ...(verb === "create" || verb === "assign" ? ["create", "edit"] : [])] as PermissionAction[] }];
    case "warranty":
    case "revisit":
    case "serviceHistory":
      return [
        { module: "amc", actions: ["view", ...(verb === "claim" || verb === "create" ? ["create"] : [])] as PermissionAction[] },
        { module: "equipment", actions: ["view"] as PermissionAction[] },
      ];
    case "item":
    case "warehouse":
    case "stock":
    case "jobConsumption":
      return [{ module: "inventory", actions: [...viewAction, ...createAction, ...editAction] }];
    case "support":
      return [{ module: "support", actions: ["view", "create", ...(verb === "manage" ? ["edit", "approve"] : [])] as PermissionAction[] }];
    default:
      return [];
  }
};

export const buildPermissionSet = (permissionNames: string[], role?: UserRole | null): PermissionSet => {
  if ((!permissionNames || permissionNames.length === 0) && role) {
    return RBACEngine.getDefaultPermissions(role);
  }

  const permissionSet: PermissionSet = {};

  for (const permissionName of permissionNames || []) {
    for (const target of mapPermissionName(permissionName)) {
      addActions(permissionSet, target.module, target.actions);
    }
  }

  if (role) {
    addActions(permissionSet, "profile", ["view", "edit"]);
  }

  if (role === UserRole.TECHNICIAN || role === UserRole.HELPER) {
    addActions(permissionSet, "jobs", ["view", "edit"]);
    addActions(permissionSet, "attendance", ["view", "create"]);
  }

  return permissionSet;
};
