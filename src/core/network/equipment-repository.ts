/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export interface Equipment {
  id: string;
  equipmentId: string; // Display ID
  brand: string;
  model: string;
  type: 'split' | 'window' | 'cassette' | 'vrf' | 'tower';
  capacity: string; // e.g. "1.5 Ton"
  serialNumber: string;
  installationYear: number;
  customerId: string;
  customerName: string;
  locationLabel: string; // e.g. "Master Bedroom"
  zoneId: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  warrantyExpiry?: string;
  isUnderAMC: boolean;
  amcContractId?: string;
  serviceHistory: {
    srId: string;
    date: string;
    type: string;
    technician: string;
    status: string;
  }[];
}

export interface WarrantyRecord {
  id: string;
  equipmentId: string;
  equipmentDisplayId: string;
  customerName?: string;
  partName: string;
  replacementDate: string;
  expiryDate: string;
  technicianName: string;
  srId: string;
  status?: 'active' | 'expiring' | 'expired';
}

export interface EquipmentRepository {
  getEquipment(filters: any): Promise<Equipment[]>;
  getEquipmentById(id: string): Promise<Equipment | null>;
  getEquipmentByCustomerId(customerId: string): Promise<Equipment[]>;
  addEquipment(equipment: Partial<Equipment>): Promise<Equipment>;
  updateEquipment(id: string, data: Partial<Equipment>): Promise<Equipment>;
  getWarrantyRecords(filters: any): Promise<WarrantyRecord[]>;
}

export class MockEquipmentRepository implements EquipmentRepository {
  private equipment: Equipment[] = [
    {
      id: 'eq1',
      equipmentId: 'EQ-001',
      brand: 'Daikin',
      model: 'FTKF Series',
      type: 'split',
      capacity: '1.5 Ton',
      serialNumber: 'DKN123456789',
      installationYear: 2022,
      customerId: 'c1',
      customerName: 'Rajesh Kumar',
      locationLabel: 'Master Bedroom',
      zoneId: 'z2',
      lastServiceDate: '2024-02-15',
      nextServiceDate: '2024-06-15',
      warrantyExpiry: '2025-01-01',
      isUnderAMC: true,
      amcContractId: 'amc1',
      serviceHistory: [
        { srId: 'sr1', date: '2024-02-15', type: 'AMC Visit', technician: 'Suresh Kumar', status: 'completed' }
      ]
    },
    {
      id: 'eq2',
      equipmentId: 'EQ-002',
      brand: 'Daikin',
      model: 'FTKF Series',
      type: 'split',
      capacity: '1.5 Ton',
      serialNumber: 'DKN987654321',
      installationYear: 2022,
      customerId: 'c1',
      customerName: 'Rajesh Kumar',
      locationLabel: 'Living Room',
      zoneId: 'z2',
      lastServiceDate: '2024-02-15',
      nextServiceDate: '2024-06-15',
      isUnderAMC: true,
      amcContractId: 'amc1',
      serviceHistory: [
        { srId: 'sr1', date: '2024-02-15', type: 'AMC Visit', technician: 'Suresh Kumar', status: 'completed' }
      ]
    }
  ];

  private warranties: WarrantyRecord[] = [
    {
      id: 'w1',
      equipmentId: 'eq1',
      equipmentDisplayId: 'EQ-001',
      partName: 'Compressor',
      replacementDate: '2023-06-10',
      expiryDate: '2024-06-10',
      technicianName: 'Suresh Kumar',
      srId: 'sr-old-1'
    }
  ];

  async getEquipment(_filters: any) {
    await new Promise(r => setTimeout(r, 500));
    return this.equipment;
  }

  async getEquipmentById(id: string) {
    return this.equipment.find(e => e.id === id) || null;
  }

  async getEquipmentByCustomerId(customerId: string) {
    return this.equipment.filter(e => e.customerId === customerId);
  }

  async addEquipment(eq: Partial<Equipment>) {
    const newEq = {
      ...eq,
      id: 'eq' + (this.equipment.length + 1),
      equipmentId: `EQ-00${this.equipment.length + 1}`,
      serviceHistory: [],
      isUnderAMC: false
    } as Equipment;
    this.equipment.push(newEq);
    return newEq;
  }

  async updateEquipment(id: string, data: Partial<Equipment>) {
    const i = this.equipment.findIndex(e => e.id === id);
    if (i !== -1) {
      this.equipment[i] = { ...this.equipment[i], ...data };
      return this.equipment[i];
    }
    throw new Error('Equipment not found');
  }

  async getWarrantyRecords(_filters: any) {
    return this.warranties;
  }
}

export class LiveEquipmentRepository implements EquipmentRepository {
  async getEquipment(filters: any) {
    const response = await apiClient.get<Equipment[]>('/api/equipment', { params: filters });
    return response.data;
  }

  async getEquipmentById(id: string) {
    const response = await apiClient.get<Equipment>(`/api/equipment/${id}`);
    return response.data;
  }

  async getEquipmentByCustomerId(customerId: string) {
    const response = await apiClient.get<Equipment[]>(`/api/customers/${customerId}/equipment`);
    return response.data;
  }

  async addEquipment(equipment: Partial<Equipment>) {
    const response = await apiClient.post<Equipment>('/api/equipment', equipment);
    return response.data;
  }

  async updateEquipment(id: string, data: Partial<Equipment>) {
    const response = await apiClient.patch<Equipment>(`/api/equipment/${id}`, data);
    return response.data;
  }

  async getWarrantyRecords(filters: any) {
    const response = await apiClient.get<WarrantyRecord[]>('/api/warranty/records', { params: filters });
    return response.data;
  }
}

export const equipmentRepository: EquipmentRepository = isDemoMode()
  ? new MockEquipmentRepository()
  : new LiveEquipmentRepository();
