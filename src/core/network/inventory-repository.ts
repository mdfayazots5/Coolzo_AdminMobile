/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type MovementType = 'IN' | 'OUT' | 'ADJ' | 'RET';
export type POStatus = 'draft' | 'submitted' | 'confirmed' | 'partially_received' | 'fully_received' | 'cancelled';

export interface Part {
  id: string;
  partCode: string;
  name: string;
  category: string;
  description: string;
  compatibleBrands: string[];
  unitCost: number;
  sellingPrice?: number;
  stockQuantity: number;
  minReorderLevel: number;
  reorderQuantity: number;
  location: string;
  status: StockStatus;
  imageUrl?: string;
  supplierIds?: string[];
}

export interface StockMovement {
  id: string;
  partId: string;
  partName: string;
  type: MovementType;
  quantity: number;
  balanceAfter: number;
  referenceId: string; // SR ID, PO ID, or Manual
  referenceType: 'job' | 'po' | 'manual' | 'return';
  timestamp: string;
  actor: string;
  notes?: string;
}

export interface PartsRequest {
  id: string;
  technicianId: string;
  technicianName: string;
  srId: string;
  srNumber: string;
  urgency: 'normal' | 'emergency';
  status: 'pending' | 'approved' | 'partially_approved' | 'rejected';
  items: { partId: string; partName: string; requestedQty: number; issuedQty?: number; status: 'available' | 'insufficient' | 'out_of_stock' }[];
  submittedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  items: { partId: string; partName: string; orderedQty: number; receivedQty: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  expectedDeliveryDate: string;
  receivedAt?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  leadTimeDays: number;
  paymentTerms: string;
}

export interface InventoryRepository {
  getParts(filters: any): Promise<Part[]>;
  getPartById(id: string): Promise<Part | null>;
  createPart(data: Partial<Part>): Promise<Part>;
  updatePart(id: string, data: Partial<Part>): Promise<Part>;
  getPartsRequests(filters: any): Promise<PartsRequest[]>;
  getPartsRequestById(id: string): Promise<PartsRequest | null>;
  processPartsRequest(id: string, status: string, items: any[]): Promise<void>;
  getStockMovements(filters: any): Promise<StockMovement[]>;
  adjustStock(partId: string, quantity: number, reason: string): Promise<void>;
  getPurchaseOrders(filters: any): Promise<PurchaseOrder[]>;
  getPurchaseOrderById(id: string): Promise<PurchaseOrder | null>;
  createPurchaseOrder(po: Partial<PurchaseOrder>): Promise<PurchaseOrder>;
  receivePurchaseOrder(id: string, receivedQtys: Record<string, number>): Promise<void>;
  getLowStockAlerts(): Promise<Part[]>;
  getSuppliers(): Promise<Supplier[]>;
  addSupplier(supplier: Partial<Supplier>): Promise<Supplier>;
  getInventoryStats(): Promise<any>;
}

export class MockInventoryRepository implements InventoryRepository {
  private parts: Part[] = [
    { id: 'p1', partCode: 'CAP-45', name: 'Capacitor 45mfd', category: 'Electrical', description: 'Run capacitor for compressor', compatibleBrands: ['Daikin', 'LG', 'Samsung'], unitCost: 850, stockQuantity: 24, minReorderLevel: 10, reorderQuantity: 50, location: 'Bin A-12', status: 'in_stock' },
    { id: 'p2', partCode: 'GAS-R410A', name: 'Refrigerant R410A (kg)', category: 'Gas', description: 'Eco-friendly refrigerant gas', compatibleBrands: ['All'], unitCost: 1200, stockQuantity: 5, minReorderLevel: 15, reorderQuantity: 30, location: 'Cylinder Rack', status: 'low_stock' },
    { id: 'p3', partCode: 'MOT-IDU-1.5', name: 'IDU Fan Motor 1.5T', category: 'Motors', description: 'Indoor unit blower motor', compatibleBrands: ['Daikin', 'Blue Star'], unitCost: 3200, stockQuantity: 0, minReorderLevel: 2, reorderQuantity: 5, location: 'Bin B-04', status: 'out_of_stock' }
  ];

  private requests: PartsRequest[] = [
    {
      id: 'pr1',
      technicianId: 't1',
      technicianName: 'Suresh Kumar',
      srId: 'sr1',
      srNumber: 'SR-99281',
      urgency: 'normal',
      status: 'pending',
      items: [
        { partId: 'p1', partName: 'Capacitor 45mfd', requestedQty: 1, status: 'available' }
      ],
      submittedAt: '2024-04-11T10:15:00Z'
    }
  ];

  private movements: StockMovement[] = [
    { id: 'm1', partId: 'p1', partName: 'Capacitor 45mfd', type: 'IN', quantity: 50, balanceAfter: 50, referenceId: 'PO-1001', referenceType: 'po', timestamp: '2024-04-01T09:00:00Z', actor: 'Store Manager' },
    { id: 'm2', partId: 'p1', partName: 'Capacitor 45mfd', type: 'OUT', quantity: 1, balanceAfter: 49, referenceId: 'SR-99200', referenceType: 'job', timestamp: '2024-04-05T14:30:00Z', actor: 'Suresh Kumar' }
  ];

  private pos: PurchaseOrder[] = [
    {
      id: 'po1',
      poNumber: 'PO-1001',
      supplierId: 's1',
      supplierName: 'Cooling Parts Hub',
      status: 'fully_received',
      items: [
        { partId: 'p1', partName: 'Capacitor 45mfd', orderedQty: 50, receivedQty: 50, unitPrice: 750, total: 37500 }
      ],
      subtotal: 37500,
      tax: 6750,
      total: 44250,
      createdAt: '2024-03-25T10:00:00Z',
      expectedDeliveryDate: '2024-04-01',
      receivedAt: '2024-04-01T09:00:00Z'
    }
  ];

  private suppliers: Supplier[] = [
    { id: 's1', name: 'Cooling Parts Hub', contactPerson: 'John Doe', phone: '+91 99887 76655', email: 'sales@coolparts.com', leadTimeDays: 3, paymentTerms: 'Net 30' }
  ];

  async getParts(_filters: any) {
    await new Promise(r => setTimeout(r, 500));
    return this.parts;
  }

  async getPartById(id: string) {
    return this.parts.find(p => p.id === id) || null;
  }

  async createPart(data: Partial<Part>) {
    const newPart = {
      ...data,
      id: `p${this.parts.length + 1}`,
      status: 'in_stock',
      stockQuantity: data.stockQuantity || 0,
    } as Part;
    this.parts.push(newPart);
    return newPart;
  }

  async updatePart(id: string, data: Partial<Part>) {
    const i = this.parts.findIndex(p => p.id === id);
    if (i !== -1) {
      this.parts[i] = { ...this.parts[i], ...data };
      return this.parts[i];
    }
    throw new Error('Part not found');
  }

  async getPartsRequests(_filters: any) {
    return this.requests;
  }

  async getPartsRequestById(id: string) {
    return this.requests.find(r => r.id === id) || null;
  }

  async processPartsRequest(id: string, status: any, items: any[]) {
    const req = this.requests.find(r => r.id === id);
    if (req) {
      req.status = status;
      req.processedAt = new Date().toISOString();
      req.items = items;
      
      // Deduct stock for approved items
      if (status === 'approved' || status === 'partially_approved') {
        items.forEach(item => {
          if (item.issuedQty > 0) {
            const part = this.parts.find(p => p.id === item.partId);
            if (part) {
              part.stockQuantity -= item.issuedQty;
              this.movements.push({
                id: 'm' + (this.movements.length + 1),
                partId: part.id,
                partName: part.name,
                type: 'OUT',
                quantity: item.issuedQty,
                balanceAfter: part.stockQuantity,
                referenceId: req.srNumber,
                referenceType: 'job',
                timestamp: new Date().toISOString(),
                actor: 'Store Manager'
              });
            }
          }
        });
      }
    }
  }

  async getStockMovements(_filters: any) {
    return this.movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async adjustStock(partId: string, quantity: number, reason: string) {
    const part = this.parts.find((item) => item.id === partId);
    if (!part) {
      throw new Error('Part not found');
    }

    part.stockQuantity += quantity;
    this.movements.unshift({
      id: `m${this.movements.length + 1}`,
      partId: part.id,
      partName: part.name,
      type: 'ADJ',
      quantity: Math.abs(quantity),
      balanceAfter: part.stockQuantity,
      referenceId: `ADJ-${part.partCode}`,
      referenceType: 'manual',
      timestamp: new Date().toISOString(),
      actor: 'Inventory Manager',
      notes: reason,
    });
  }

  async getPurchaseOrders(_filters: any) {
    return this.pos;
  }

  async getPurchaseOrderById(id: string) {
    return this.pos.find(p => p.id === id) || null;
  }

  async createPurchaseOrder(po: Partial<PurchaseOrder>) {
    const newPO = {
      ...po,
      id: 'po' + (this.pos.length + 1),
      poNumber: 'PO-' + (1000 + this.pos.length + 1),
      status: 'submitted',
      createdAt: new Date().toISOString()
    } as PurchaseOrder;
    this.pos.push(newPO);
    return newPO;
  }

  async receivePurchaseOrder(id: string, receivedQtys: Record<string, number>) {
    const po = this.pos.find((item) => item.id === id);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    po.items = po.items.map((item) => {
      const receivedQty = receivedQtys[item.partId] ?? item.receivedQty;
      const part = this.parts.find((record) => record.id === item.partId);
      if (part && receivedQty > item.receivedQty) {
        const increment = receivedQty - item.receivedQty;
        part.stockQuantity += increment;
        this.movements.unshift({
          id: `m${this.movements.length + 1}`,
          partId: part.id,
          partName: part.name,
          type: 'IN',
          quantity: increment,
          balanceAfter: part.stockQuantity,
          referenceId: po.poNumber,
          referenceType: 'po',
          timestamp: new Date().toISOString(),
          actor: 'Warehouse Receipt',
        });
      }

      return { ...item, receivedQty };
    });

    po.receivedAt = new Date().toISOString();
    po.status = po.items.every((item) => item.receivedQty >= item.orderedQty) ? 'fully_received' : 'partially_received';
  }

  async getLowStockAlerts() {
    return this.parts.filter((part) => part.stockQuantity <= part.minReorderLevel);
  }

  async getSuppliers() {
    return this.suppliers;
  }

  async addSupplier(supplier: Partial<Supplier>) {
    const nextSupplier = {
      id: `s${this.suppliers.length + 1}`,
      leadTimeDays: 0,
      paymentTerms: 'Net 30',
      ...supplier,
    } as Supplier;
    this.suppliers.push(nextSupplier);
    return nextSupplier;
  }

  async getInventoryStats() {
    return {
      totalSKUs: this.parts.length,
      totalStockValue: this.parts.reduce((acc, p) => acc + (p.stockQuantity * p.unitCost), 0),
      lowStockCount: this.parts.filter(p => p.status === 'low_stock').length,
      outOfStockCount: this.parts.filter(p => p.status === 'out_of_stock').length,
      pendingRequests: this.requests.filter(r => r.status === 'pending').length,
      openPOs: this.pos.filter(p => p.status !== 'fully_received' && p.status !== 'cancelled').length
    };
  }
}

import { apiClient } from "./api-client";
import { isDemoMode } from "../config/api-config";

export class LiveInventoryRepository implements InventoryRepository {
  async getParts(filters: any) {
    const response = await apiClient.get<Part[]>('/api/inventory/parts', { params: filters });
    return response.data;
  }

  async getPartById(id: string) {
    const response = await apiClient.get<Part>(`/api/inventory/parts/${id}`);
    return response.data;
  }

  async createPart(data: Partial<Part>) {
    const response = await apiClient.post<Part>('/api/inventory/parts', data);
    return response.data;
  }

  async updatePart(id: string, data: Partial<Part>) {
    const response = await apiClient.put<Part>(`/api/inventory/parts/${id}`, data);
    return response.data;
  }

  async getPartsRequests(filters: any) {
    const response = await apiClient.get<PartsRequest[]>('/api/inventory/requests', { params: filters });
    return response.data;
  }

  async getPartsRequestById(id: string) {
    const response = await apiClient.get<PartsRequest>(`/api/inventory/requests/${id}`);
    return response.data;
  }

  async processPartsRequest(id: string, status: string, items: any[]) {
    const action = status === 'approved' ? 'approve' : status === 'partially_approved' ? 'partial' : 'reject';
    await apiClient.patch(`/api/inventory/parts-requests/${id}/${action}`, { items });
  }

  async getStockMovements(filters: any) {
    const response = await apiClient.get<StockMovement[]>('/api/inventory/stock-movements', { params: filters });
    return response.data;
  }

  async adjustStock(partId: string, quantity: number, reason: string) {
    await apiClient.post('/api/inventory/stock-adjust', { partId, quantity, reason });
  }

  async getPurchaseOrders(filters: any) {
    const response = await apiClient.get<PurchaseOrder[]>('/api/inventory/purchase-orders', { params: filters });
    return response.data;
  }

  async getPurchaseOrderById(id: string) {
    const response = await apiClient.get<PurchaseOrder>(`/api/inventory/purchase-orders/${id}`);
    return response.data;
  }

  async createPurchaseOrder(po: Partial<PurchaseOrder>) {
    const response = await apiClient.post<PurchaseOrder>('/api/inventory/purchase-orders', po);
    return response.data;
  }

  async receivePurchaseOrder(id: string, receivedQtys: Record<string, number>) {
    await apiClient.patch(`/api/inventory/purchase-orders/${id}/receive`, { receivedQtys });
  }

  async getLowStockAlerts() {
    const response = await apiClient.get<Part[]>('/api/inventory/low-stock-alerts');
    return response.data;
  }

  async getSuppliers() {
    const response = await apiClient.get<Supplier[]>('/api/inventory/suppliers');
    return response.data;
  }

  async addSupplier(supplier: Partial<Supplier>) {
    const response = await apiClient.post<Supplier>('/api/inventory/suppliers', supplier);
    return response.data;
  }

  async getInventoryStats() {
    const response = await apiClient.get('/api/inventory/dashboard');
    return response.data;
  }
}

export const inventoryRepository: InventoryRepository = isDemoMode()
  ? new MockInventoryRepository()
  : new LiveInventoryRepository();
