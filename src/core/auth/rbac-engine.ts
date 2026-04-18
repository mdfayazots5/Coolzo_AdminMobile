/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from "../../store/auth-store";

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export interface PermissionSet {
  [module: string]: PermissionAction[];
}

export class RBACEngine {
  private permissions: PermissionSet = {};
  private role: UserRole | null = null;

  constructor(role: UserRole | null, permissions: PermissionSet = {}) {
    this.role = role;
    this.permissions = permissions;
  }

  can(module: string, action: PermissionAction): boolean {
    // Super Admin has full access
    if (this.role === UserRole.SUPER_ADMIN) return true;

    const modulePermissions = this.permissions[module];
    if (!modulePermissions) return false;

    return modulePermissions.includes(action);
  }

  canView(module: string): boolean { return this.can(module, 'view'); }
  canCreate(module: string): boolean { return this.can(module, 'create'); }
  canEdit(module: string): boolean { return this.can(module, 'edit'); }
  canDelete(module: string): boolean { return this.can(module, 'delete'); }
  canApprove(module: string): boolean { return this.can(module, 'approve'); }
  canExport(module: string): boolean { return this.can(module, 'export'); }

  // Default permissions for roles if not provided by API
  static getDefaultPermissions(role: UserRole): PermissionSet {
    const common: Record<string, PermissionAction[]> = {
      'dashboard': ['view'],
      'profile': ['view', 'edit'],
      'settings': ['view']
    };

    switch (role) {
      case UserRole.TECHNICIAN:
      case UserRole.HELPER:
        return {
          ...common,
          'jobs': ['view', 'edit'],
          'attendance': ['view', 'create'],
        };
      case UserRole.FINANCE_MANAGER:
      case UserRole.BILLING_EXECUTIVE:
        return {
          ...common,
          'billing': ['view', 'create', 'edit', 'approve', 'export'],
          'finance': ['view', 'approve', 'export'],
          'reports': ['view', 'export'],
        };
      case UserRole.OPS_MANAGER:
      case UserRole.OPS_EXECUTIVE:
        return {
          ...common,
          'operations': ['view', 'edit'],
          'scheduling': ['view', 'edit'],
          'amc': ['view', 'edit'],
          'equipment': ['view', 'edit'],
          'service-requests': ['view', 'create', 'edit', 'approve'],
          'team': ['view', 'create', 'edit'],
        };
      case UserRole.ADMIN:
        return {
          ...common,
          'operations': ['view', 'edit'],
          'scheduling': ['view', 'edit'],
          'amc': ['view', 'edit'],
          'inventory': ['view', 'create', 'edit'],
          'equipment': ['view', 'edit'],
          'service-requests': ['view', 'create', 'edit', 'approve'],
          'billing': ['view', 'create', 'edit'],
          'finance': ['view', 'view'],
          'support': ['view', 'create', 'edit'],
          'team': ['view', 'create', 'edit'],
          'customers': ['view', 'create', 'edit'],
        };
      case UserRole.SUPPORT:
        return {
          ...common,
          'service-requests': ['view', 'create', 'edit'],
          'customers': ['view', 'create', 'edit'],
          'support': ['view', 'create', 'edit'],
        };
      case UserRole.INVENTORY_MANAGER:
        return {
          ...common,
          'inventory': ['view', 'create', 'edit', 'approve'],
        };
      case UserRole.MARKETING_MANAGER:
        return {
          ...common,
          'marketing': ['view', 'create', 'edit'],
        };
      default:
        return common;
    }
  }
}
