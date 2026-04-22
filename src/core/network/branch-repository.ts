/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

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

export interface BranchListFilters {
  searchTerm?: string;
  isActive?: boolean;
}

export interface CreateBranchInput {
  name: string;
  city: string;
  address: string;
  managerId?: string;
  zones?: string[];
  isActive: boolean;
}

export interface UpdateBranchInput extends CreateBranchInput {}

export interface BranchRepository {
  getBranches(filters?: BranchListFilters): Promise<Branch[]>;
  getBranchById(id: string): Promise<Branch | null>;
  createBranch(branch: CreateBranchInput): Promise<Branch>;
  updateBranch(id: string, branch: UpdateBranchInput): Promise<Branch>;
}

interface BackendBranch {
  branchId: number;
  name: string;
  city: string;
  address: string;
  managerId?: number | null;
  managerName?: string | null;
  zones?: string[] | null;
  isActive?: boolean;
  technicianCount?: number;
  serviceRequestCount?: number;
}

const mapBackendBranch = (branch: BackendBranch): Branch => ({
  id: String(branch.branchId),
  name: branch.name,
  city: branch.city,
  address: branch.address,
  managerId: branch.managerId ? String(branch.managerId) : undefined,
  managerName: branch.managerName || undefined,
  zones: branch.zones || [],
  isActive: branch.isActive ?? true,
  technicianCount: branch.technicianCount ?? 0,
  srCount: branch.serviceRequestCount ?? 0,
});

const normalizeZones = (zones?: string[]) =>
  (zones || [])
    .map((value) => value.trim())
    .filter(Boolean);

const buildManagerName = (managerId?: string) =>
  managerId ? `Manager ${managerId}` : undefined;

export class MockBranchRepository implements BranchRepository {
  private branches: Branch[] = [
    {
      id: "1",
      name: "Hyderabad Central",
      city: "Hyderabad",
      address: "Banjara Hills, Hyderabad",
      managerId: "2",
      managerName: "Rahul Sharma",
      zones: ["500034", "500081", "500033"],
      isActive: true,
      technicianCount: 24,
      srCount: 450,
    },
    {
      id: "2",
      name: "Delhi South",
      city: "Delhi",
      address: "Saket, New Delhi",
      managerName: "Neha Malhotra",
      zones: ["110017", "110019"],
      isActive: true,
      technicianCount: 18,
      srCount: 320,
    },
    {
      id: "3",
      name: "Bangalore East",
      city: "Bangalore",
      address: "Indiranagar, Bangalore",
      managerName: "Arjun Rao",
      zones: ["560038", "560008", "560075"],
      isActive: false,
      technicianCount: 15,
      srCount: 280,
    },
  ];

  async getBranches(filters?: BranchListFilters): Promise<Branch[]> {
    const searchTerm = filters?.searchTerm?.trim().toLowerCase();

    return this.branches.filter((branch) => {
      const matchesSearch = !searchTerm || [branch.name, branch.city, branch.address]
        .some((value) => value.toLowerCase().includes(searchTerm));
      const matchesStatus =
        typeof filters?.isActive !== "boolean" ||
        branch.isActive === filters.isActive;

      return matchesSearch && matchesStatus;
    });
  }

  async getBranchById(id: string): Promise<Branch | null> {
    return this.branches.find((branch) => branch.id === id) || null;
  }

  async createBranch(branch: CreateBranchInput): Promise<Branch> {
    const newBranch: Branch = {
      id: String(this.branches.length + 1),
      name: branch.name.trim(),
      city: branch.city.trim(),
      address: branch.address.trim(),
      managerId: branch.managerId || undefined,
      managerName: buildManagerName(branch.managerId),
      zones: normalizeZones(branch.zones),
      isActive: branch.isActive,
      technicianCount: 0,
      srCount: 0,
    };

    this.branches.push(newBranch);
    return newBranch;
  }

  async updateBranch(id: string, branch: UpdateBranchInput): Promise<Branch> {
    const index = this.branches.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("Branch not found");
    }

    this.branches[index] = {
      ...this.branches[index],
      name: branch.name.trim(),
      city: branch.city.trim(),
      address: branch.address.trim(),
      managerId: branch.managerId || undefined,
      managerName: buildManagerName(branch.managerId),
      zones: normalizeZones(branch.zones),
      isActive: branch.isActive,
    };

    return this.branches[index];
  }
}

export class LiveBranchRepository implements BranchRepository {
  async getBranches(filters?: BranchListFilters): Promise<Branch[]> {
    const response = await apiClient.get<BackendBranch[]>("/api/v1/branches", {
      params: {
        searchTerm: filters?.searchTerm || undefined,
        isActive: filters?.isActive,
      },
    });

    return response.data.map(mapBackendBranch);
  }

  async getBranchById(id: string): Promise<Branch | null> {
    const response = await apiClient.get<BackendBranch>(`/api/v1/branches/${id}`);
    return mapBackendBranch(response.data);
  }

  async createBranch(branch: CreateBranchInput): Promise<Branch> {
    const response = await apiClient.post<BackendBranch>("/api/v1/branches", {
      name: branch.name.trim(),
      city: branch.city.trim(),
      address: branch.address.trim(),
      managerId: branch.managerId ? Number(branch.managerId) : undefined,
      zones: normalizeZones(branch.zones),
      isActive: branch.isActive,
    });

    return mapBackendBranch(response.data);
  }

  async updateBranch(id: string, branch: UpdateBranchInput): Promise<Branch> {
    const response = await apiClient.put<BackendBranch>(`/api/v1/branches/${id}`, {
      branchId: Number(id),
      name: branch.name.trim(),
      city: branch.city.trim(),
      address: branch.address.trim(),
      managerId: branch.managerId ? Number(branch.managerId) : undefined,
      zones: normalizeZones(branch.zones),
      isActive: branch.isActive,
    });

    return mapBackendBranch(response.data);
  }
}

export const branchRepository: BranchRepository = isDemoMode()
  ? new MockBranchRepository()
  : new LiveBranchRepository();
