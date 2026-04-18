/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole } from "../../store/auth-store";
import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  branchId: string;
  employeeId?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  managerId: string;
  technicianCount: number;
  srCount: number;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetUser: string;
  timestamp: string;
  details: string;
}

export interface UserRepository {
  getUsers(filters: any): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deactivateUser(id: string, reason: string): Promise<void>;
  reactivateUser(id: string): Promise<void>;
  resetPassword(id: string): Promise<void>;
}

export class MockUserRepository implements UserRepository {
  private users: User[] = [
    { id: '1', name: 'Fayaz Ahmed', email: 'fayaz@coolzo.com', phone: '+91 9876543210', role: UserRole.SUPER_ADMIN, branchId: 'B1', status: 'active', createdAt: '2024-01-01', lastLogin: '2024-04-11T09:45:00Z' },
    { id: '2', name: 'Rahul Sharma', email: 'rahul@coolzo.com', phone: '+91 9876543211', role: UserRole.OPS_MANAGER, branchId: 'B1', status: 'active', createdAt: '2024-01-15', lastLogin: '2024-04-10T18:30:00Z' },
    { id: '3', name: 'Suresh Kumar', email: 'suresh@coolzo.com', phone: '+91 9876543212', role: UserRole.TECHNICIAN, branchId: 'B1', employeeId: 'CZ-1001', status: 'active', createdAt: '2024-02-01', lastLogin: '2024-04-11T08:00:00Z' },
    { id: '4', name: 'Amit Patel', email: 'amit@coolzo.com', phone: '+91 9876543213', role: UserRole.FINANCE_MANAGER, branchId: 'B1', status: 'active', createdAt: '2024-01-10', lastLogin: '2024-04-09T14:20:00Z' },
    { id: '5', name: 'Priya Singh', email: 'priya@coolzo.com', phone: '+91 9876543214', role: UserRole.SUPPORT, branchId: 'B2', status: 'inactive', createdAt: '2024-03-01' },
  ];

  async getUsers(_filters: any): Promise<User[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.users;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async createUser(user: Partial<User>): Promise<User> {
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9), status: 'active', createdAt: new Date().toISOString() } as User;
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    this.users[index] = { ...this.users[index], ...user };
    return this.users[index];
  }

  async deactivateUser(id: string, _reason: string): Promise<void> {
    const user = this.users.find(u => u.id === id);
    if (user) user.status = 'inactive';
  }

  async reactivateUser(id: string): Promise<void> {
    const user = this.users.find(u => u.id === id);
    if (user) user.status = 'active';
  }

  async resetPassword(_id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export class LiveUserRepository implements UserRepository {
  async getUsers(filters: any): Promise<User[]> {
    const response = await apiClient.get<User[]>('/admin/users', { params: filters });
    return response.data;
  }

  async getUserById(id: string): Promise<User | null> {
    const response = await apiClient.get<User>(`/admin/users/${id}`);
    return response.data;
  }

  async createUser(user: Partial<User>): Promise<User> {
    const response = await apiClient.post<User>('/admin/users', user);
    return response.data;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>(`/admin/users/${id}`, user);
    return response.data;
  }

  async deactivateUser(id: string, reason: string): Promise<void> {
    await apiClient.post(`/admin/users/${id}/deactivate`, { reason });
  }

  async reactivateUser(id: string): Promise<void> {
    await apiClient.post(`/admin/users/${id}/reactivate`);
  }

  async resetPassword(id: string): Promise<void> {
    await apiClient.post(`/admin/users/${id}/reset-password`);
  }
}

export const userRepository: UserRepository = isDemoMode()
  ? new MockUserRepository()
  : new LiveUserRepository();
