import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export type CustomerType = 'residential' | 'commercial' | 'enterprise';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface CustomerAddress {
  id: string;
  label: string; // Home, Office, etc.
  addressLine: string;
  city: string;
  pinCode: string;
  zoneId: string;
  isDefault: boolean;
  isArchived?: boolean;
}

export interface CustomerEquipment {
  id: string;
  brand: string;
  model: string;
  type: string; // Split, Window, VRF
  tonnage: string;
  serialNumber?: string;
  installationYear?: number;
  locationLabel: string; // Bedroom 1, Living Room, etc.
  lastServiceDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: CustomerType;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  customerSince: string;
  amcStatus: 'active' | 'inactive' | 'none';
  riskLevel: RiskLevel;
  totalServices: number;
  totalRevenue: number;
  outstandingAmount: number;
  accountManagerId?: string;
  accountManagerName?: string;
  addresses: CustomerAddress[];
  equipment: CustomerEquipment[];
  notes: {
    id: string;
    author: string;
    timestamp: string;
    content: string;
  }[];
}

export interface CorporateAccount {
  id: string;
  companyName: string;
  industry: string;
  primaryContactId: string;
  authorizedRequesters: string[];
  billingFrequency: 'per-job' | 'monthly' | 'quarterly';
  paymentTerms: number; // days
  approvalThreshold: number;
  slaOverrideHours?: number;
}

export interface CustomerRepository {
  getCustomers(filters: any): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  createCustomer(data: Partial<Customer>): Promise<Customer>;
  updateCustomer(id: string, data: Partial<Customer>): Promise<Customer>;
  addAddress(customerId: string, address: Partial<CustomerAddress>): Promise<void>;
  addEquipment(customerId: string, equipment: Partial<CustomerEquipment>): Promise<void>;
  addNote(customerId: string, content: string): Promise<void>;
}

export class MockCustomerRepository implements CustomerRepository {
  private customers: Customer[] = [
    {
      id: 'cust1',
      name: 'Anjali Sharma',
      phone: '+91 98765 43210',
      email: 'anjali.s@example.com',
      type: 'residential',
      customerSince: '2023-05-15',
      amcStatus: 'active',
      riskLevel: 'low',
      totalServices: 4,
      totalRevenue: 8500,
      outstandingAmount: 0,
      addresses: [
        { id: 'addr1', label: 'Home', addressLine: 'Flat 202, Sunshine Apts, Powai', city: 'Mumbai', pinCode: '400076', zoneId: 'z3', isDefault: true }
      ],
      equipment: [
        { id: 'eq1', brand: 'LG', model: 'Dual Inverter', type: 'Split AC', tonnage: '1.5 Ton', locationLabel: 'Master Bedroom', lastServiceDate: '2024-02-10' }
      ],
      notes: [
        { id: 'n1', author: 'Priya (CS)', timestamp: '2024-01-05T10:00:00Z', content: 'Prefers morning slots between 10 AM - 12 PM.' }
      ]
    },
    {
      id: 'cust2',
      name: 'TechSolutions Hub',
      phone: '+91 22 4455 6677',
      email: 'admin@techsolutions.com',
      type: 'enterprise',
      customerSince: '2022-11-20',
      amcStatus: 'none',
      riskLevel: 'medium',
      totalServices: 12,
      totalRevenue: 45000,
      outstandingAmount: 12500,
      accountManagerName: 'Rahul Sharma',
      addresses: [
        { id: 'addr2', label: 'Main Office', addressLine: 'Unit 405, IT Park, Goregaon East', city: 'Mumbai', pinCode: '400063', zoneId: 'z4', isDefault: true }
      ],
      equipment: [
        { id: 'eq2', brand: 'Blue Star', model: 'VRF IV', type: 'VRF System', tonnage: '10 Ton', locationLabel: 'Server Room', lastServiceDate: '2024-03-15' }
      ],
      notes: []
    }
  ];

  async getCustomers(_filters: any) {
    await new Promise(r => setTimeout(r, 500));
    return this.customers;
  }

  async getCustomerById(id: string) {
    return this.customers.find(c => c.id === id) || null;
  }

  async createCustomer(data: Partial<Customer>) {
    const newCust = {
      ...data,
      id: 'cust' + (this.customers.length + 1),
      customerSince: new Date().toISOString().split('T')[0],
      totalServices: 0,
      totalRevenue: 0,
      outstandingAmount: 0,
      addresses: data.addresses || [],
      equipment: data.equipment || [],
      notes: []
    } as Customer;
    this.customers.push(newCust);
    return newCust;
  }

  async updateCustomer(id: string, data: Partial<Customer>) {
    const i = this.customers.findIndex(c => c.id === id);
    this.customers[i] = { ...this.customers[i], ...data };
    return this.customers[i];
  }

  async addAddress(customerId: string, address: Partial<CustomerAddress>) {
    const cust = await this.getCustomerById(customerId);
    if (cust) {
      cust.addresses.push({ ...address, id: Date.now().toString() } as CustomerAddress);
    }
  }

  async addEquipment(customerId: string, equipment: Partial<CustomerEquipment>) {
    const cust = await this.getCustomerById(customerId);
    if (cust) {
      cust.equipment.push({ ...equipment, id: Date.now().toString() } as CustomerEquipment);
    }
  }

  async addNote(customerId: string, content: string) {
    const cust = await this.getCustomerById(customerId);
    if (cust) {
      cust.notes.push({ id: Date.now().toString(), author: 'Current User', timestamp: new Date().toISOString(), content });
    }
  }
}

export class LiveCustomerRepository implements CustomerRepository {
  async getCustomers(filters: any) {
    const response = await apiClient.get<Customer[]>('/api/v1/customers', { params: filters });
    return response.data;
  }

  async getCustomerById(id: string) {
    const response = await apiClient.get<Customer>(`/api/v1/customers/${id}`);
    return response.data;
  }

  async createCustomer(data: Partial<Customer>) {
    const response = await apiClient.post<Customer>('/api/v1/customers', data);
    return response.data;
  }

  async updateCustomer(id: string, data: Partial<Customer>) {
    const response = await apiClient.patch<Customer>(`/api/v1/customers/${id}`, data);
    return response.data;
  }

  async addAddress(customerId: string, address: Partial<CustomerAddress>) {
    await apiClient.post(`/api/v1/customers/${customerId}/addresses`, address);
  }

  async addEquipment(customerId: string, equipment: Partial<CustomerEquipment>) {
    await apiClient.post(`/api/v1/customers/${customerId}/equipment`, equipment);
  }

  async addNote(customerId: string, content: string) {
    await apiClient.post(`/api/v1/customers/${customerId}/notes`, { content });
  }
}

export const customerRepository: CustomerRepository = isDemoMode()
  ? new MockCustomerRepository()
  : new LiveCustomerRepository();
