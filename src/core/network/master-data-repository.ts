/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export interface ServiceType {
  id: string;
  name: string;
  category: 'Installation' | 'Repair' | 'Maintenance' | 'AMC';
  basePrice: number;
  duration: number; // in minutes
  status: 'active' | 'inactive';
  description: string;
}

export interface Zone {
  id: string;
  name: string;
  city: string;
  pinCodes: string[];
  status: 'active' | 'inactive';
  technicianCount: number;
}

export interface PricingRule {
  id: string;
  serviceTypeId: string;
  equipmentType: string;
  tonnage: string;
  zoneId: string;
  price: number;
}

export interface TaxConfig {
  id: string;
  category: string;
  rate: number;
  hsnCode: string;
}

export interface AMCPlan {
  id: string;
  name: string;
  visitsPerYear: number;
  price: number;
  description: string;
  status: 'active' | 'inactive';
}

export interface MasterDataRepository {
  getServiceTypes(): Promise<ServiceType[]>;
  getZones(): Promise<Zone[]>;
  getPricingRules(): Promise<PricingRule[]>;
  getTaxConfigs(): Promise<TaxConfig[]>;
  getAMCPlans(): Promise<AMCPlan[]>;
  
  updateServiceType(id: string, data: Partial<ServiceType>): Promise<ServiceType>;
  updateZone(id: string, data: Partial<Zone>): Promise<Zone>;
  updatePricingRule(id: string, data: Partial<PricingRule>): Promise<PricingRule>;
  updateTaxConfig(id: string, data: Partial<TaxConfig>): Promise<TaxConfig>;
  updateAMCPlan(id: string, data: Partial<AMCPlan>): Promise<AMCPlan>;
}

export class MockMasterDataRepository implements MasterDataRepository {
  private serviceTypes: ServiceType[] = [
    { id: 'st1', name: 'AC Deep Cleaning', category: 'Maintenance', basePrice: 1200, duration: 90, status: 'active', description: 'Complete chemical cleaning of indoor and outdoor units.' },
    { id: 'st2', name: 'Gas Charging', category: 'Repair', basePrice: 2500, duration: 60, status: 'active', description: 'Refilling of refrigerant gas and leak check.' },
    { id: 'st3', name: 'Installation', category: 'Installation', basePrice: 1500, duration: 120, status: 'active', description: 'Standard installation of split or window AC.' },
  ];

  private zones: Zone[] = [
    { id: 'z1', name: 'Andheri East', city: 'Mumbai', pinCodes: ['400069', '400093'], status: 'active', technicianCount: 12 },
    { id: 'z2', name: 'Bandra West', city: 'Mumbai', pinCodes: ['400050'], status: 'active', technicianCount: 8 },
  ];

  private amcPlans: AMCPlan[] = [
    { id: 'p1', name: 'Coolzo Basic', visitsPerYear: 2, price: 1999, description: '2 preventive maintenance visits per year.', status: 'active' },
    { id: 'p2', name: 'Coolzo Premium', visitsPerYear: 4, price: 3499, description: '4 preventive maintenance visits + unlimited breakdown calls.', status: 'active' },
  ];

  async getServiceTypes() { return this.serviceTypes; }
  async getZones() { return this.zones; }
  async getPricingRules() { return []; }
  async getTaxConfigs() { 
    return [
      { id: 't1', category: 'Labor', rate: 18, hsnCode: '9987' },
      { id: 't2', category: 'Material', rate: 28, hsnCode: '8415' }
    ];
  }
  async getAMCPlans() { return this.amcPlans; }

  async updateServiceType(id: string, data: Partial<ServiceType>) {
    const i = this.serviceTypes.findIndex(s => s.id === id);
    this.serviceTypes[i] = { ...this.serviceTypes[i], ...data };
    return this.serviceTypes[i];
  }

  async updateZone(id: string, data: Partial<Zone>) {
    const i = this.zones.findIndex(z => z.id === id);
    this.zones[i] = { ...this.zones[i], ...data };
    return this.zones[i];
  }

  async updatePricingRule(id: string, data: Partial<PricingRule>) { return {} as any; }
  async updateTaxConfig(id: string, data: Partial<TaxConfig>) { return {} as any; }
  async updateAMCPlan(id: string, data: Partial<AMCPlan>) {
    const i = this.amcPlans.findIndex(p => p.id === id);
    this.amcPlans[i] = { ...this.amcPlans[i], ...data };
    return this.amcPlans[i];
  }
}

export class LiveMasterDataRepository implements MasterDataRepository {
  async getServiceTypes(): Promise<ServiceType[]> {
    const response = await apiClient.get<ServiceType[]>('/admin/service-types');
    return response.data;
  }

  async getZones(): Promise<Zone[]> {
    const response = await apiClient.get<Zone[]>('/admin/zones');
    return response.data;
  }

  async getPricingRules(): Promise<PricingRule[]> {
    const response = await apiClient.get<PricingRule[]>('/admin/pricing-rules');
    return response.data;
  }

  async getTaxConfigs(): Promise<TaxConfig[]> {
    const response = await apiClient.get<TaxConfig[]>('/admin/tax-configs');
    return response.data;
  }

  async getAMCPlans(): Promise<AMCPlan[]> {
    const response = await apiClient.get<AMCPlan[]>('/admin/amc-plans');
    return response.data;
  }

  async updateServiceType(id: string, data: Partial<ServiceType>): Promise<ServiceType> {
    const response = await apiClient.patch<ServiceType>(`/admin/service-types/${id}`, data);
    return response.data;
  }

  async updateZone(id: string, data: Partial<Zone>): Promise<Zone> {
    const response = await apiClient.patch<Zone>(`/admin/zones/${id}`, data);
    return response.data;
  }

  async updatePricingRule(id: string, data: Partial<PricingRule>): Promise<PricingRule> {
    const response = await apiClient.patch<PricingRule>(`/admin/pricing-rules/${id}`, data);
    return response.data;
  }

  async updateTaxConfig(id: string, data: Partial<TaxConfig>): Promise<TaxConfig> {
    const response = await apiClient.patch<TaxConfig>(`/admin/tax-configs/${id}`, data);
    return response.data;
  }

  async updateAMCPlan(id: string, data: Partial<AMCPlan>): Promise<AMCPlan> {
    const response = await apiClient.patch<AMCPlan>(`/admin/amc-plans/${id}`, data);
    return response.data;
  }
}

export const masterDataRepository: MasterDataRepository = isDemoMode()
  ? new MockMasterDataRepository()
  : new LiveMasterDataRepository();
