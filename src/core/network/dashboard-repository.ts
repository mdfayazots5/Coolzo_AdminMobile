import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export interface DashboardStats {
  totalRevenue: number;
  activeJobs: number;
  customerSatisfaction: number;
  slaCompliance: number;
  revenueTrend: { date: string; value: number }[];
  jobStatusDistribution: { status: string; count: number }[];
  topTechnicians: { name: string; jobs: number; rating: number }[];
}

export interface DashboardRepository {
  getStats(): Promise<DashboardStats>;
}

export class MockDashboardRepository implements DashboardRepository {
  async getStats(): Promise<DashboardStats> {
    await new Promise(r => setTimeout(r, 500));
    return {
      totalRevenue: 1245000,
      activeJobs: 42,
      customerSatisfaction: 4.8,
      slaCompliance: 94,
      revenueTrend: [
        { date: '2024-04-01', value: 45000 },
        { date: '2024-04-02', value: 52000 },
        { date: '2024-04-03', value: 48000 },
        { date: '2024-04-04', value: 61000 },
        { date: '2024-04-05', value: 55000 },
        { date: '2024-04-06', value: 67000 },
        { date: '2024-04-07', value: 72000 },
      ],
      jobStatusDistribution: [
        { status: 'Pending', count: 12 },
        { status: 'Assigned', count: 18 },
        { status: 'In Progress', count: 8 },
        { status: 'Completed', count: 45 },
      ],
      topTechnicians: [
        { name: 'Rajesh Kumar', jobs: 145, rating: 4.8 },
        { name: 'Vikram Singh', jobs: 132, rating: 4.7 },
        { name: 'Amit Shah', jobs: 128, rating: 4.9 },
      ]
    };
  }
}

export class LiveDashboardRepository implements DashboardRepository {
  async getStats() {
    const response = await apiClient.get<DashboardStats>('/api/v1/dashboard/stats');
    return response.data;
  }
}

export const dashboardRepository: DashboardRepository = isDemoMode()
  ? new MockDashboardRepository()
  : new LiveDashboardRepository();
