/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from "../../store/auth-store";
import { PermissionSet } from "../auth/rbac-engine";
import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

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
    const response = await apiClient.get<Role[]>('/admin/roles');
    return response.data;
  }

  async getRoleById(id: string): Promise<Role | null> {
    const response = await apiClient.get<Role>(`/admin/roles/${id}`);
    return response.data;
  }

  async createRole(role: Partial<Role>): Promise<Role> {
    const response = await apiClient.post<Role>('/admin/roles', role);
    return response.data;
  }

  async updateRole(id: string, role: Partial<Role>): Promise<Role> {
    const response = await apiClient.patch<Role>(`/admin/roles/${id}`, role);
    return response.data;
  }
}

export const roleRepository: RoleRepository = isDemoMode()
  ? new MockRoleRepository()
  : new LiveRoleRepository();
