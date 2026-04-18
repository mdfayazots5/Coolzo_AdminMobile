import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export type TechnicianStatus = 'available' | 'on-job' | 'off-duty' | 'on-leave';

export interface TechnicianSkill {
  id: string;
  name: string;
  category: 'brand' | 'equipment' | 'special';
  certifiedDate?: string;
}

export interface TechnicianPerformance {
  avgRating: number;
  totalJobs: number;
  slaCompliance: number; // percentage
  revisitRate: number; // percentage
  revenueGenerated: number;
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'leave' | 'holiday';
  checkIn?: string;
  checkOut?: string;
}

export interface Technician {
  id: string;
  employeeId: string;
  name: string;
  photo?: string;
  phone: string;
  designation: 'Senior Technician' | 'Junior Technician' | 'Helper';
  branch: string;
  zones: string[]; // Zone IDs
  skills: TechnicianSkill[];
  status: TechnicianStatus;
  rating: number;
  todayJobCount: number;
  performance: TechnicianPerformance;
  attendance: AttendanceRecord[];
  shifts: {
    dayOfWeek: number; // 0-6
    startTime: string; // "09:00"
    endTime: string;   // "19:00"
    isOffDay: boolean;
  }[];
  currentJobId?: string;
  nextFreeSlot?: string;
}

export interface TechnicianRepository {
  getTechnicians(filters: any): Promise<Technician[]>;
  getTechnicianById(id: string): Promise<Technician | null>;
  updateTechnician(id: string, data: Partial<Technician>): Promise<Technician>;
  getAvailabilityBoard(): Promise<Technician[]>;
}

export class MockTechnicianRepository implements TechnicianRepository {
  private technicians: Technician[] = [
    {
      id: 'tech1',
      employeeId: 'CZ-TECH-001',
      name: 'Rajesh Kumar',
      phone: '+91 98200 11223',
      designation: 'Senior Technician',
      branch: 'Mumbai West',
      zones: ['z1', 'z2'],
      skills: [
        { id: 's1', name: 'Daikin Certified', category: 'brand' },
        { id: 's2', name: 'Split AC Expert', category: 'equipment' },
        { id: 's3', name: 'Gas Charging', category: 'special' }
      ],
      status: 'available',
      rating: 4.8,
      todayJobCount: 2,
      performance: {
        avgRating: 4.8,
        totalJobs: 145,
        slaCompliance: 96,
        revisitRate: 2,
        revenueGenerated: 245000
      },
      attendance: [
        { date: '2024-04-10', status: 'present', checkIn: '09:00', checkOut: '18:30' },
        { date: '2024-04-11', status: 'present', checkIn: '08:55' }
      ],
      shifts: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '19:00', isOffDay: false },
        { dayOfWeek: 2, startTime: '09:00', endTime: '19:00', isOffDay: false },
        { dayOfWeek: 3, startTime: '09:00', endTime: '19:00', isOffDay: false },
        { dayOfWeek: 4, startTime: '09:00', endTime: '19:00', isOffDay: false },
        { dayOfWeek: 5, startTime: '09:00', endTime: '19:00', isOffDay: false },
        { dayOfWeek: 6, startTime: '09:00', endTime: '19:00', isOffDay: false },
        { dayOfWeek: 0, startTime: '09:00', endTime: '19:00', isOffDay: true },
      ],
      nextFreeSlot: '14:00'
    },
    {
      id: 'tech2',
      employeeId: 'CZ-TECH-002',
      name: 'Vikram Singh',
      phone: '+91 98200 44556',
      designation: 'Junior Technician',
      branch: 'Mumbai West',
      zones: ['z3'],
      skills: [
        { id: 's4', name: 'LG Certified', category: 'brand' },
        { id: 's2', name: 'Split AC Expert', category: 'equipment' }
      ],
      status: 'on-job',
      rating: 4.5,
      todayJobCount: 3,
      performance: {
        avgRating: 4.5,
        totalJobs: 88,
        slaCompliance: 92,
        revisitRate: 5,
        revenueGenerated: 120000
      },
      attendance: [
        { date: '2024-04-11', status: 'present', checkIn: '09:15' }
      ],
      shifts: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '19:00', isOffDay: false },
        { dayOfWeek: 2, startTime: '09:00', endTime: '19:00', isOffDay: false },
        { dayOfWeek: 3, startTime: '09:00', endTime: '19:00', isOffDay: false },
        { dayOfWeek: 4, startTime: '09:00', endTime: '19:00', isOffDay: false },
        { dayOfWeek: 5, startTime: '09:00', endTime: '19:00', isOffDay: false },
        { dayOfWeek: 6, startTime: '09:00', endTime: '19:00', isOffDay: false },
        { dayOfWeek: 0, startTime: '09:00', endTime: '19:00', isOffDay: true },
      ],
      currentJobId: 'SR-99281',
      nextFreeSlot: '16:30'
    }
  ];

  async getTechnicians(_filters: any) {
    await new Promise(r => setTimeout(r, 400));
    return this.technicians;
  }

  async getTechnicianById(id: string) {
    return this.technicians.find(t => t.id === id) || null;
  }

  async updateTechnician(id: string, data: Partial<Technician>) {
    const i = this.technicians.findIndex(t => t.id === id);
    if (i !== -1) {
      this.technicians[i] = { ...this.technicians[i], ...data };
      return this.technicians[i];
    }
    throw new Error('Technician not found');
  }

  async getAvailabilityBoard() {
    return this.technicians;
  }
}

export class LiveTechnicianRepository implements TechnicianRepository {
  async getTechnicians(filters: any) {
    const response = await apiClient.get<Technician[]>('/api/v1/technicians', { params: filters });
    return response.data;
  }

  async getTechnicianById(id: string) {
    const response = await apiClient.get<Technician>(`/api/v1/technicians/${id}`);
    return response.data;
  }

  async updateTechnician(id: string, data: Partial<Technician>) {
    const response = await apiClient.patch<Technician>(`/api/v1/technicians/${id}`, data);
    return response.data;
  }

  async getAvailabilityBoard() {
    const response = await apiClient.get<Technician[]>('/api/v1/technicians/availability');
    return response.data;
  }
}

export const technicianRepository: TechnicianRepository = isDemoMode()
  ? new MockTechnicianRepository()
  : new LiveTechnicianRepository();
