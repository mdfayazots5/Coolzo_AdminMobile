/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Branch } from "./user-repository";
import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export interface BranchRepository {
  getBranches(): Promise<Branch[]>;
  getBranchById(id: string): Promise<Branch | null>;
  createBranch(branch: Partial<Branch>): Promise<Branch>;
  updateBranch(id: string, branch: Partial<Branch>): Promise<Branch>;
}

export class MockBranchRepository implements BranchRepository {
  private branches: Branch[] = [
    { id: 'B1', name: 'Hyderabad Central', city: 'Hyderabad', address: 'Banjara Hills, Hyderabad', managerId: '2', technicianCount: 24, srCount: 450 },
    { id: 'B2', name: 'Delhi South', city: 'Delhi', address: 'Saket, New Delhi', managerId: '6', technicianCount: 18, srCount: 320 },
    { id: 'B3', name: 'Bangalore East', city: 'Bangalore', address: 'Indiranagar, Bangalore', managerId: '7', technicianCount: 15, srCount: 280 },
  ];

  async getBranches(): Promise<Branch[]> {
    return this.branches;
  }

  async getBranchById(id: string): Promise<Branch | null> {
    return this.branches.find(b => b.id === id) || null;
  }

  async createBranch(branch: Partial<Branch>): Promise<Branch> {
    const newBranch = { ...branch, id: 'B' + (this.branches.length + 1), technicianCount: 0, srCount: 0 } as Branch;
    this.branches.push(newBranch);
    return newBranch;
  }

  async updateBranch(id: string, branch: Partial<Branch>): Promise<Branch> {
    const index = this.branches.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Branch not found');
    this.branches[index] = { ...this.branches[index], ...branch };
    return this.branches[index];
  }
}

export class LiveBranchRepository implements BranchRepository {
  async getBranches(): Promise<Branch[]> {
    const response = await apiClient.get<Branch[]>('/admin/branches');
    return response.data;
  }

  async getBranchById(id: string): Promise<Branch | null> {
    const response = await apiClient.get<Branch>(`/admin/branches/${id}`);
    return response.data;
  }

  async createBranch(branch: Partial<Branch>): Promise<Branch> {
    const response = await apiClient.post<Branch>('/admin/branches', branch);
    return response.data;
  }

  async updateBranch(id: string, branch: Partial<Branch>): Promise<Branch> {
    const response = await apiClient.patch<Branch>(`/admin/branches/${id}`, branch);
    return response.data;
  }
}

export const branchRepository: BranchRepository = isDemoMode()
  ? new MockBranchRepository()
  : new LiveBranchRepository();
