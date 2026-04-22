/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface JobReportItem {
  task: string;
  status: 'completed' | 'not_required' | 'skipped';
  notes?: string;
}

export interface JobReport {
  id: string;
  srId: string;
  srNumber: string;
  technicianId: string;
  technicianName: string;
  serviceType: string;
  submissionTime: string;
  checklist: JobReportItem[];
  observations: string;
  partsUsed: { name: string; qty: number; cost: number }[];
  photos: { url: string; type: 'before' | 'after'; caption?: string }[];
  customerSignature: string;
  customerRating?: number;
  qualityScore: number;
  qualityBreakdown?: {
    checklistCompletion: number;
    photoCoverage: number;
    customerSignature: number;
    observationDepth: number;
  };
  reviewed: boolean;
  reviewedBy?: string;
  reviewNotes?: string;
  status: 'pending_review' | 'approved' | 'flagged';
}

export interface JobReportRepository {
  getJobReports(filters: any): Promise<JobReport[]>;
  getJobReportById(id: string): Promise<JobReport | null>;
  reviewJobReport(id: string, status: 'approved' | 'flagged', notes: string): Promise<void>;
  getQualityMetrics(): Promise<any>;
}

const calculateQualityBreakdown = (report: Pick<JobReport, "checklist" | "photos" | "customerSignature" | "observations">) => {
  const checklistCompletionRate =
    report.checklist.length === 0
      ? 0
      : report.checklist.filter((item) => item.status === "completed").length / report.checklist.length;
  const checklistCompletion = Math.round(checklistCompletionRate * 40);
  const photoCoverage = report.photos.length >= 3 ? 30 : report.photos.length === 2 ? 20 : Math.min(report.photos.length * 10, 20);
  const customerSignature = report.customerSignature ? 20 : 0;
  const observationDepth = report.observations.trim().length > 50 ? 10 : 0;

  return {
    checklistCompletion,
    photoCoverage,
    customerSignature,
    observationDepth,
  };
};

const calculateQualityScore = (report: Pick<JobReport, "checklist" | "photos" | "customerSignature" | "observations">) => {
  const breakdown = calculateQualityBreakdown(report);
  return {
    breakdown,
    score: breakdown.checklistCompletion + breakdown.photoCoverage + breakdown.customerSignature + breakdown.observationDepth,
  };
};

export class MockJobReportRepository implements JobReportRepository {
  private reports: JobReport[] = [
    {
      id: 'jr1',
      srId: 'sr1',
      srNumber: 'SR-99281',
      technicianId: 't1',
      technicianName: 'Suresh Kumar',
      serviceType: 'Maintenance',
      submissionTime: '2024-04-11T09:30:00Z',
      checklist: [
        { task: 'Clean Air Filter', status: 'completed' },
        { task: 'Check Gas Pressure', status: 'completed' },
        { task: 'Clean Condenser Coil', status: 'completed' }
      ],
      observations: 'Unit was very dirty. Advised customer to clean filters every 2 weeks.',
      partsUsed: [],
      photos: [
        { url: 'https://picsum.photos/seed/ac1/400/300', type: 'before', caption: 'Dirty Filter' },
        { url: 'https://picsum.photos/seed/ac2/400/300', type: 'after', caption: 'Clean Filter' }
      ],
      customerSignature: 'data:image/png;base64,mock_signature',
      qualityScore: 90,
      qualityBreakdown: { checklistCompletion: 40, photoCoverage: 20, customerSignature: 20, observationDepth: 10 },
      reviewed: false,
      status: 'pending_review'
    },
    {
      id: 'jr2',
      srId: 'sr2',
      srNumber: 'SR-99282',
      technicianId: 't2',
      technicianName: 'Amit Singh',
      serviceType: 'Repair',
      submissionTime: '2024-04-10T18:00:00Z',
      checklist: [
        { task: 'Leak Testing', status: 'completed' },
        { task: 'Gas Charging', status: 'completed' }
      ],
      observations: 'Found leak in flare nut. Tightened and recharged gas.',
      partsUsed: [
        { name: 'R410A Gas', qty: 1.5, cost: 1800 }
      ],
      photos: [
        { url: 'https://picsum.photos/seed/leak/400/300', type: 'before', caption: 'Leak detected' }
      ],
      customerSignature: 'data:image/png;base64,mock_signature',
      qualityScore: 70,
      qualityBreakdown: { checklistCompletion: 40, photoCoverage: 10, customerSignature: 20, observationDepth: 0 },
      reviewed: true,
      reviewedBy: 'Admin',
      status: 'approved'
    }
  ];

  async getJobReports(_filters: any) {
    await new Promise(r => setTimeout(r, 500));
    return this.reports.map((report) => {
      const { score, breakdown } = calculateQualityScore(report);
      return {
        ...report,
        qualityScore: score,
        qualityBreakdown: breakdown,
      };
    });
  }

  async getJobReportById(id: string) {
    const report = this.reports.find(r => r.id === id) || null;
    if (!report) {
      return null;
    }

    const { score, breakdown } = calculateQualityScore(report);
    return {
      ...report,
      qualityScore: score,
      qualityBreakdown: breakdown,
    };
  }

  async reviewJobReport(id: string, status: 'approved' | 'flagged', notes: string) {
    const report = this.reports.find(r => r.id === id);
    if (report) {
      report.reviewed = true;
      report.status = status;
      report.reviewNotes = notes;
      report.reviewedBy = 'Current User';
    }
  }

  async getQualityMetrics() {
    return {
      avgChecklistCompletion: 92,
      avgPhotoCount: 4.2,
      signatureRate: 98,
      flaggedRate: 5,
      technicianPerformance: [
        { name: 'Suresh Kumar', score: 94 },
        { name: 'Amit Singh', score: 82 },
        { name: 'Vijay Patil', score: 88 }
      ]
    };
  }
}

import { apiClient } from "./api-client";
import { isDemoMode } from "../config/api-config";

export class LiveJobReportRepository implements JobReportRepository {
  async getJobReports(filters: any) {
    const response = await apiClient.get<JobReport[]>('/api/v1/job-reports', { params: filters });
    return response.data;
  }

  async getJobReportById(id: string) {
    const response = await apiClient.get<JobReport>(`/api/v1/job-reports/${id}`);
    return response.data;
  }

  async reviewJobReport(id: string, status: 'approved' | 'flagged', notes: string) {
    const endpoint = status === 'approved' ? 'approve' : 'flag';
    await apiClient.patch(`/api/v1/job-reports/${id}/${endpoint}`, { notes });
  }

  async getQualityMetrics() {
    const response = await apiClient.get<any>('/api/v1/job-reports/quality-dashboard');
    return response.data;
  }
}

export const jobReportRepository: JobReportRepository = isDemoMode()
  ? new MockJobReportRepository()
  : new LiveJobReportRepository();
