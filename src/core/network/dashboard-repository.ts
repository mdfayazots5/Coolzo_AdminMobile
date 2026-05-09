import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

interface DashboardTrendPoint {
  label: string;
  periodStartDate: string;
  value: number;
}

interface DashboardBreakdownItem {
  label: string;
  value: number;
}

interface DashboardRevenueSummary {
  totalRevenue: number;
  paidRevenue: number;
  outstandingRevenue: number;
  invoiceCount: number;
}

interface DashboardSupportOverview {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  escalationCount: number;
  averageResolutionHours: number;
}

interface BackendDashboardSummary {
  totalBookings: number;
  totalServiceRequests: number;
  totalJobs: number;
  totalRevenue: number;
  totalAmcCustomers: number;
  totalSupportTickets: number;
}

interface BackendDashboardMetrics {
  bookingTrends: DashboardTrendPoint[];
  jobStatusDistribution: DashboardBreakdownItem[];
  revenueSummary: DashboardRevenueSummary;
  supportOverview: DashboardSupportOverview;
}

export interface DashboardStats {
  totalRevenue: number;
  totalJobs: number;
  totalBookings: number;
  totalServiceRequests: number;
  totalAmcCustomers: number;
  totalSupportTickets: number;
  bookingTrend: DashboardTrendPoint[];
  jobStatusDistribution: { status: string; count: number }[];
  revenueSummary: DashboardRevenueSummary;
  supportOverview: DashboardSupportOverview;
}

export interface DashboardRepository {
  getStats(): Promise<DashboardStats>;
}

export class MockDashboardRepository implements DashboardRepository {
  async getStats(): Promise<DashboardStats> {
    await new Promise(r => setTimeout(r, 500));
    return {
      totalRevenue: 1245000,
      totalJobs: 83,
      totalBookings: 91,
      totalServiceRequests: 83,
      totalAmcCustomers: 126,
      totalSupportTickets: 18,
      bookingTrend: [
        { label: '01 Apr', periodStartDate: '2026-04-01', value: 12 },
        { label: '02 Apr', periodStartDate: '2026-04-02', value: 16 },
        { label: '03 Apr', periodStartDate: '2026-04-03', value: 14 },
        { label: '04 Apr', periodStartDate: '2026-04-04', value: 18 },
        { label: '05 Apr', periodStartDate: '2026-04-05', value: 17 },
        { label: '06 Apr', periodStartDate: '2026-04-06', value: 22 },
        { label: '07 Apr', periodStartDate: '2026-04-07', value: 24 },
      ],
      jobStatusDistribution: [
        { status: 'Pending', count: 12 },
        { status: 'Assigned', count: 18 },
        { status: 'In Progress', count: 8 },
        { status: 'Completed', count: 45 },
      ],
      revenueSummary: {
        totalRevenue: 1245000,
        paidRevenue: 1080000,
        outstandingRevenue: 165000,
        invoiceCount: 214,
      },
      supportOverview: {
        totalTickets: 18,
        openTickets: 5,
        resolvedTickets: 12,
        escalationCount: 1,
        averageResolutionHours: 6.4,
      },
    };
  }
}

export class LiveDashboardRepository implements DashboardRepository {
  async getStats() {
    const [summaryResponse, metricsResponse] = await Promise.all([
      apiClient.get<BackendDashboardSummary>('/api/dashboard/summary'),
      apiClient.get<BackendDashboardMetrics>('/api/dashboard/metrics'),
    ]);

    return {
      totalRevenue: summaryResponse.data.totalRevenue,
      totalJobs: summaryResponse.data.totalJobs,
      totalBookings: summaryResponse.data.totalBookings,
      totalServiceRequests: summaryResponse.data.totalServiceRequests,
      totalAmcCustomers: summaryResponse.data.totalAmcCustomers,
      totalSupportTickets: summaryResponse.data.totalSupportTickets,
      bookingTrend: metricsResponse.data.bookingTrends,
      jobStatusDistribution: metricsResponse.data.jobStatusDistribution.map((item) => ({
        status: item.label,
        count: Number(item.value),
      })),
      revenueSummary: metricsResponse.data.revenueSummary,
      supportOverview: metricsResponse.data.supportOverview,
    };
  }
}

export const dashboardRepository: DashboardRepository = isDemoMode()
  ? new MockDashboardRepository()
  : new LiveDashboardRepository();
