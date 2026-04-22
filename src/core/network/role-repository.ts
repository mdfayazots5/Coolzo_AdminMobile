/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from "../../store/auth-store";
import { PermissionAction, PermissionSet } from "../auth/rbac-engine";
import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";
import { BackendPermissionSnapshot, buildPermissionSet, buildPermissionSetFromSnapshot, mapBackendRole } from "../auth/auth-session";

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: PermissionSet;
  isSystem: boolean;
}

export interface RoleRepository {
  getRoles(): Promise<Role[]>;
  getRoleById(id: string): Promise<Role | null>;
  createRole(role: Partial<Role>): Promise<Role>;
  updateRole(id: string, role: Partial<Role>): Promise<Role>;
}

interface BackendRole {
  roleId: number;
  roleName: string;
  displayName: string;
  description: string;
  isActive: boolean;
  userCount: number;
  permissionIds: number[];
  permissions: string[];
}

interface BackendRolePermissionSnapshot extends BackendPermissionSnapshot {
  roleId: number;
  permissionIds: number[];
  roleName?: string;
  displayName?: string;
}

interface BackendPermissionCatalogItem {
  permissionId: number;
  permissionName: string;
  displayName: string;
  moduleName: string;
  actionName: string;
  isActive: boolean;
}

const SYSTEM_ROLE_KEYS = new Set([
  'superadmin',
  'admin',
  'operationsmanager',
  'operationsexecutive',
  'customersupportexecutive',
  'support',
  'technician',
  'helper',
  'inventorymanager',
  'billingexecutive',
  'financemanager',
  'marketingmanager',
]);

export class MockRoleRepository implements RoleRepository {
  private roles: Role[] = [
    { 
      id: 'r1', 
      name: 'Super Admin', 
      description: 'Full system access', 
      userCount: 2, 
      isSystem: true,
      permissions: {} // Full access logic handled in engine
    },
    { 
      id: 'r2', 
      name: 'Operations Manager', 
      description: 'Manages branch operations', 
      userCount: 5, 
      isSystem: true,
      permissions: {
        'dashboard': ['view'],
        'service-requests': ['view', 'create', 'edit', 'approve'],
        'technicians': ['view', 'edit'],
      }
    },
    { 
      id: 'r3', 
      name: 'Technician', 
      description: 'Field service provider', 
      userCount: 45, 
      isSystem: true,
      permissions: {
        'jobs': ['view', 'edit'],
        'attendance': ['view', 'create'],
      }
    }
  ];

  async getRoles(): Promise<Role[]> {
    return this.roles;
  }

  async getRoleById(id: string): Promise<Role | null> {
    return this.roles.find(r => r.id === id) || null;
  }

  async createRole(role: Partial<Role>): Promise<Role> {
    const newRole = { ...role, id: 'custom_' + Date.now(), userCount: 0, isSystem: false } as Role;
    this.roles.push(newRole);
    return newRole;
  }

  async updateRole(id: string, role: Partial<Role>): Promise<Role> {
    const index = this.roles.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Role not found');
    this.roles[index] = { ...this.roles[index], ...role };
    return this.roles[index];
  }
}

export class LiveRoleRepository implements RoleRepository {
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get<BackendRole[]>('/api/v1/roles', {
      params: { pageNumber: 1, pageSize: 200 },
    });
    return response.data.map(mapBackendRoleResponse);
  }

  async getRoleById(id: string): Promise<Role | null> {
    const [roles, response] = await Promise.all([
      this.getRoles(),
      apiClient.get<BackendRolePermissionSnapshot>(`/api/v1/roles/${id}/permissions`),
    ]);

    const existingRole = roles.find((role) => role.id === id);
    const fallbackRoleName = existingRole?.name || `Role ${id}`;

    return {
      id,
      name: response.data.displayName || fallbackRoleName,
      description: existingRole?.description || "Role permission configuration",
      userCount: existingRole?.userCount || 0,
      permissions: buildPermissionSetFromSnapshot(response.data, response.data.roleName ? mapBackendRole(response.data.roleName) : undefined),
      isSystem: existingRole?.isSystem ?? true,
    };
  }

  async createRole(role: Partial<Role>): Promise<Role> {
    const permissionIds = await resolvePermissionIds(role.permissions || {});
    const displayName = role.name || 'Custom Role';
    const response = await apiClient.post<BackendRole>('/api/v1/roles', {
      roleName: toRoleName(displayName),
      displayName,
      description: role.description || '',
      isActive: true,
      permissionIds,
    });

    return mapBackendRoleResponse(response.data);
  }

  async updateRole(id: string, role: Partial<Role>): Promise<Role> {
    const permissionIds = await resolvePermissionIds(role.permissions || {});
    const response = await apiClient.put<BackendRole>(`/api/v1/roles/${id}/permissions`, {
      permissionIds,
    });

    return mapBackendRoleResponse(response.data);
  }
}

const mapBackendRoleResponse = (role: BackendRole): Role => ({
  id: String(role.roleId),
  name: role.displayName || role.roleName,
  description: role.description,
  userCount: role.userCount || 0,
  permissions: buildPermissionSet(role.permissions || [], mapBackendRole(role.roleName)),
  isSystem: SYSTEM_ROLE_KEYS.has(role.roleName.replace(/[^a-z0-9]/gi, '').toLowerCase()),
});

const toRoleName = (displayName: string) =>
  displayName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment, index) => index === 0
      ? segment.charAt(0).toLowerCase() + segment.slice(1)
      : segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');

const UI_PERMISSION_TO_BACKEND_NAMES: Record<string, Partial<Record<PermissionAction, string[]>>> = {
  dashboard: { view: ['dashboard.read'] },
  operations: { view: ['operationsDashboard.read'], edit: ['assignment.manage'] },
  'service-requests': {
    view: ['serviceRequest.read', 'booking.read'],
    create: ['serviceRequest.create', 'booking.create'],
    edit: ['serviceRequest.update'],
    approve: ['assignment.manage'],
  },
  scheduling: { view: ['assignment.manage'], edit: ['assignment.manage'] },
  amc: {
    view: ['amc.read', 'warranty.read', 'revisit.read', 'serviceHistory.read'],
    create: ['amc.create', 'revisit.create', 'warranty.claim'],
    edit: ['amc.assign'],
  },
  equipment: { view: ['warranty.read', 'serviceHistory.read', 'revisit.read'] },
  inventory: {
    view: ['item.read', 'warehouse.read', 'stock.read', 'jobConsumption.read'],
    create: ['item.create', 'warehouse.create', 'jobConsumption.create'],
    edit: ['stock.manage'],
    approve: ['stock.manage'],
  },
  billing: {
    view: ['billing.read', 'invoice.read', 'quotation.read'],
    create: ['invoice.create', 'quotation.create'],
    approve: ['quotation.approve'],
  },
  finance: {
    view: ['payment.read'],
    edit: ['payment.collect'],
    approve: ['payment.collect'],
    export: ['report.read', 'analytics.read'],
  },
  support: {
    view: ['support.read'],
    create: ['support.manage'],
    edit: ['support.manage'],
    approve: ['support.manage'],
  },
  team: {
    view: ['technician.read', 'user.read'],
    create: ['user.create'],
    edit: ['user.update'],
  },
  marketing: {
    view: ['cms.read'],
    create: ['cms.manage'],
    edit: ['cms.manage'],
  },
  reports: { view: ['report.read', 'analytics.read'], export: ['report.read', 'analytics.read'] },
  settings: {
    view: ['role.read', 'permission.read', 'lookup.read', 'configuration.read', 'health.read', 'notificationTemplate.read', 'notificationTrigger.read', 'communicationPreference.read', 'user.read'],
    create: ['role.create', 'user.create', 'lookup.manage', 'configuration.manage', 'notificationTemplate.manage', 'notificationTrigger.manage', 'communicationPreference.manage'],
    edit: ['role.update', 'user.update', 'lookup.manage', 'configuration.manage', 'notificationTemplate.manage', 'notificationTrigger.manage', 'communicationPreference.manage'],
  },
};

const resolvePermissionIds = async (permissionSet: PermissionSet): Promise<number[]> => {
  const requestedPermissionNames = new Set(
    Object.entries(permissionSet)
      .flatMap(([module, actions]) => actions.flatMap((action) => UI_PERMISSION_TO_BACKEND_NAMES[module]?.[action] || []))
  );

  if (requestedPermissionNames.size === 0) {
    return [];
  }

  const response = await apiClient.get<BackendPermissionCatalogItem[]>('/api/v1/permissions', {
    params: { pageNumber: 1, pageSize: 200 },
  });

  return response.data
    .filter((permission) => requestedPermissionNames.has(permission.permissionName))
    .map((permission) => permission.permissionId);
};

export const roleRepository: RoleRepository = isDemoMode()
  ? new MockRoleRepository()
  : new LiveRoleRepository();
