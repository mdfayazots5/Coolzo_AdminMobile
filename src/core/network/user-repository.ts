/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { mapBackendRole } from "../auth/auth-session";
import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";
import { UserRole } from "../../store/auth-store";

export interface User {
  id: string;
  userName: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  roleLabel: string;
  roleIds: string[];
  roles: string[];
  branchId: string;
  employeeId?: string;
  status: "active" | "inactive";
  lastLogin?: string;
  createdAt: string;
  mustChangePassword: boolean;
  isTemporaryPassword?: boolean;
  passwordExpiryOnUtc?: string | null;
  permissions?: string[];
  recentActivity?: UserActivity[];
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  managerId?: string;
  managerName?: string;
  zones: string[];
  isActive: boolean;
  technicianCount: number;
  srCount: number;
}

export interface UserActivity {
  id: string;
  action: string;
  status: string;
  performedBy: string;
  timestamp: string;
  details: string;
}

export interface UserListFilters {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
  status?: "active" | "inactive";
  roleIds?: string[];
  branchIds?: string[];
  sortBy?: "name" | "createdAt" | "lastLogin";
  sortOrder?: "asc" | "desc";
}

export interface CreateUserInput {
  userName: string;
  email: string;
  fullName: string;
  password: string;
  isActive: boolean;
  roleIds: string[];
  branchId?: string;
}

export interface UpdateUserInput {
  email: string;
  fullName: string;
  isActive: boolean;
  roleIds: string[];
  branchId?: string;
}

export interface UserPasswordResetResult {
  passwordUpdated: boolean;
  passwordGenerated: boolean;
  requiresPasswordDelivery: boolean;
  mustChangePassword: boolean;
  isTemporaryPassword: boolean;
  passwordExpiryOnUtc?: string | null;
  temporaryPassword?: string | null;
}

export interface UserRepository {
  getUsers(filters: UserListFilters): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  createUser(user: CreateUserInput): Promise<User>;
  updateUser(id: string, user: UpdateUserInput): Promise<User>;
  deactivateUser(id: string, reason?: string): Promise<User>;
  reactivateUser(id: string): Promise<User>;
  resetPassword(id: string, reason?: string): Promise<UserPasswordResetResult>;
  resetPin(id: string, reason?: string): Promise<UserPasswordResetResult>;
}

interface BackendUserSummary {
  userId: number;
  userName: string;
  email: string;
  fullName: string;
  isActive: boolean;
  branchId: number;
  roleIds: number[];
  roles: string[];
  dateCreated: string;
  lastLoginDateUtc?: string | null;
  mustChangePassword: boolean;
}

interface BackendUserActivity {
  activityId: string;
  actionName: string;
  statusName: string;
  actorName: string;
  description: string;
  timestampUtc: string;
}

interface BackendUserDetail extends BackendUserSummary {
  permissions: string[];
  lastUpdated?: string | null;
  isTemporaryPassword: boolean;
  passwordExpiryOnUtc?: string | null;
  recentActivity: BackendUserActivity[];
}

interface BackendUserPasswordResetResponse {
  passwordUpdated: boolean;
  passwordGenerated: boolean;
  requiresPasswordDelivery: boolean;
  mustChangePassword: boolean;
  isTemporaryPassword: boolean;
  passwordExpiryOnUtc?: string | null;
  temporaryPassword?: string | null;
}

const mapBackendUserSummary = (user: BackendUserSummary): User => {
  const roles = user.roles || [];
  const roleLabel = roles[0] || "Unassigned";

  return {
    id: String(user.userId),
    userName: user.userName,
    name: user.fullName,
    email: user.email,
    role: mapBackendRole(roleLabel),
    roleLabel,
    roles,
    roleIds: (user.roleIds || []).map(String),
    branchId: String(user.branchId || 1),
    status: user.isActive ? "active" : "inactive",
    lastLogin: user.lastLoginDateUtc || undefined,
    createdAt: user.dateCreated,
    mustChangePassword: user.mustChangePassword,
  };
};

const mapBackendUserDetail = (user: BackendUserDetail): User => ({
  ...mapBackendUserSummary(user),
  isTemporaryPassword: user.isTemporaryPassword,
  passwordExpiryOnUtc: user.passwordExpiryOnUtc || null,
  permissions: user.permissions || [],
  recentActivity: (user.recentActivity || []).map((activity) => ({
    id: activity.activityId,
    action: activity.actionName,
    status: activity.statusName,
    performedBy: activity.actorName,
    timestamp: activity.timestampUtc,
    details: activity.description,
  })),
});

const toRoleNameFromId = (roleId: string): UserRole => {
  const normalizedId = Number(roleId);

  switch (normalizedId) {
    case 1:
      return UserRole.SUPER_ADMIN;
    case 2:
      return UserRole.OPS_MANAGER;
    case 3:
      return UserRole.OPS_EXECUTIVE;
    case 4:
      return UserRole.SUPPORT;
    case 5:
      return UserRole.TECHNICIAN;
    case 6:
      return UserRole.HELPER;
    case 7:
      return UserRole.INVENTORY_MANAGER;
    case 8:
      return UserRole.BILLING_EXECUTIVE;
    case 9:
      return UserRole.FINANCE_MANAGER;
    case 10:
      return UserRole.MARKETING_MANAGER;
    default:
      return UserRole.ADMIN;
  }
};

export class MockUserRepository implements UserRepository {
  private users: User[] = [
    {
      id: "1",
      userName: "superadmin",
      name: "Fayaz Ahmed",
      email: "fayaz@coolzo.com",
      role: UserRole.SUPER_ADMIN,
      roleLabel: "Super Admin",
      roles: ["Super Admin"],
      roleIds: ["1"],
      branchId: "1",
      status: "active",
      createdAt: "2024-01-01T00:00:00Z",
      lastLogin: "2024-04-11T09:45:00Z",
      mustChangePassword: false,
      permissions: ["user.read", "user.create", "user.update", "role.read", "role.create", "role.update"],
      recentActivity: [],
    },
    {
      id: "2",
      userName: "opsmanager",
      name: "Rahul Sharma",
      email: "rahul@coolzo.com",
      role: UserRole.OPS_MANAGER,
      roleLabel: "Operations Manager",
      roles: ["Operations Manager"],
      roleIds: ["2"],
      branchId: "1",
      status: "active",
      createdAt: "2024-01-15T00:00:00Z",
      lastLogin: "2024-04-10T18:30:00Z",
      mustChangePassword: false,
      permissions: ["user.read", "role.read"],
      recentActivity: [],
    },
  ];

  async getUsers(filters: UserListFilters): Promise<User[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const requestedStatus = filters.status || (
      typeof filters.isActive === "boolean"
        ? (filters.isActive ? "active" : "inactive")
        : undefined
    );

    const filteredUsers = this.users.filter((user) => {
      const matchesSearch =
        !filters.searchTerm ||
        [user.name, user.email, user.userName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(filters.searchTerm!.toLowerCase()));
      const matchesStatus = !requestedStatus || user.status === requestedStatus;
      const matchesRole =
        !filters.roleIds?.length ||
        user.roleIds.some((roleId) => filters.roleIds?.includes(roleId));
      const matchesBranch =
        !filters.branchIds?.length ||
        filters.branchIds.includes(user.branchId);

      return matchesSearch && matchesStatus && matchesRole && matchesBranch;
    });

    const sortBy = filters.sortBy || "name";
    const sortOrder = filters.sortOrder || "asc";

    const sortedUsers = [...filteredUsers].sort((left, right) => {
      const leftValue =
        sortBy === "createdAt" ? left.createdAt :
        sortBy === "lastLogin" ? (left.lastLogin || "") :
        left.name;
      const rightValue =
        sortBy === "createdAt" ? right.createdAt :
        sortBy === "lastLogin" ? (right.lastLogin || "") :
        right.name;

      const comparison = leftValue.localeCompare(rightValue);
      return sortOrder === "asc" ? comparison : comparison * -1;
    });

    const pageNumber = filters.pageNumber ?? 1;
    const pageSize = filters.pageSize ?? (sortedUsers.length || 1);
    const startIndex = (pageNumber - 1) * pageSize;

    return sortedUsers.slice(startIndex, startIndex + pageSize);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) || null;
  }

  async createUser(user: CreateUserInput): Promise<User> {
    const roleKey = toRoleNameFromId(user.roleIds[0] || "0");
    const newUser: User = {
      id: String(Date.now()),
      userName: user.userName,
      name: user.fullName,
      email: user.email,
      role: roleKey,
      roleLabel: roleKey.replace(/_/g, " "),
      roles: [roleKey.replace(/_/g, " ")],
      roleIds: user.roleIds,
      branchId: user.branchId || "1",
      status: user.isActive ? "active" : "inactive",
      createdAt: new Date().toISOString(),
      mustChangePassword: true,
      permissions: [],
      recentActivity: [],
    };

    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: string, user: UpdateUserInput): Promise<User> {
    const existingUser = this.users.find((item) => item.id === id);

    if (!existingUser) {
      throw new Error("User not found");
    }

    existingUser.name = user.fullName;
    existingUser.email = user.email;
    existingUser.status = user.isActive ? "active" : "inactive";
    existingUser.roleIds = user.roleIds;
    existingUser.branchId = user.branchId || existingUser.branchId;

    return existingUser;
  }

  async deactivateUser(id: string): Promise<User> {
    const user = this.users.find((item) => item.id === id);

    if (!user) {
      throw new Error("User not found");
    }

    user.status = "inactive";
    return user;
  }

  async reactivateUser(id: string): Promise<User> {
    const user = this.users.find((item) => item.id === id);

    if (!user) {
      throw new Error("User not found");
    }

    user.status = "active";
    return user;
  }

  async resetPassword(): Promise<UserPasswordResetResult> {
    return {
      passwordUpdated: true,
      passwordGenerated: true,
      requiresPasswordDelivery: true,
      mustChangePassword: true,
      isTemporaryPassword: true,
      temporaryPassword: "Welcome@123",
      passwordExpiryOnUtc: null,
    };
  }

  async resetPin(): Promise<UserPasswordResetResult> {
    return {
      passwordUpdated: true,
      passwordGenerated: true,
      requiresPasswordDelivery: true,
      mustChangePassword: true,
      isTemporaryPassword: true,
      temporaryPassword: "482913",
      passwordExpiryOnUtc: null,
    };
  }
}

export class LiveUserRepository implements UserRepository {
  async getUsers(filters: UserListFilters): Promise<User[]> {
    const response = await apiClient.get<BackendUserSummary[]>("/api/v1/users", {
      params: {
        pageNumber: filters.pageNumber ?? 1,
        pageSize: filters.pageSize ?? 100,
        searchTerm: filters.searchTerm || undefined,
        isActive: typeof filters.isActive === "boolean"
          ? filters.isActive
          : filters.status === "active"
            ? true
            : filters.status === "inactive"
              ? false
              : undefined,
        roleIds: filters.roleIds?.map((value) => Number(value)),
        branchIds: filters.branchIds?.map((value) => Number(value)),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      },
    });

    return response.data.map(mapBackendUserSummary);
  }

  async getUserById(id: string): Promise<User | null> {
    const response = await apiClient.get<BackendUserDetail>(`/api/v1/users/${id}`);
    return mapBackendUserDetail(response.data);
  }

  async createUser(user: CreateUserInput): Promise<User> {
    const response = await apiClient.post<BackendUserSummary>("/api/v1/users", {
      userName: user.userName.trim(),
      email: user.email.trim(),
      fullName: user.fullName.trim(),
      password: user.password,
      isActive: user.isActive,
      roleIds: user.roleIds.map((value) => Number(value)),
      branchId: user.branchId ? Number(user.branchId) : undefined,
    });

    return mapBackendUserSummary(response.data);
  }

  async updateUser(id: string, user: UpdateUserInput): Promise<User> {
    const response = await apiClient.put<BackendUserSummary>(`/api/v1/users/${id}`, {
      userId: Number(id),
      email: user.email.trim(),
      fullName: user.fullName.trim(),
      isActive: user.isActive,
      roleIds: user.roleIds.map((value) => Number(value)),
      branchId: user.branchId ? Number(user.branchId) : undefined,
    });

    return mapBackendUserSummary(response.data);
  }

  async deactivateUser(id: string, reason?: string): Promise<User> {
    const response = await apiClient.post<BackendUserSummary>(`/api/v1/users/${id}/deactivate`, {
      reason: reason || undefined,
    });

    return mapBackendUserSummary(response.data);
  }

  async reactivateUser(id: string): Promise<User> {
    const response = await apiClient.post<BackendUserSummary>(`/api/v1/users/${id}/reactivate`);
    return mapBackendUserSummary(response.data);
  }

  async resetPassword(id: string, reason?: string): Promise<UserPasswordResetResult> {
    const response = await apiClient.post<BackendUserPasswordResetResponse>(
      `/api/v1/users/${id}/reset-password`,
      { reason: reason || undefined }
    );

    return response.data;
  }

  async resetPin(id: string, reason?: string): Promise<UserPasswordResetResult> {
    const response = await apiClient.post<BackendUserPasswordResetResponse>(
      `/api/v1/users/${id}/reset-pin`,
      { reason: reason || undefined }
    );

    return response.data;
  }
}

export const userRepository: UserRepository = isDemoMode()
  ? new MockUserRepository()
  : new LiveUserRepository();
