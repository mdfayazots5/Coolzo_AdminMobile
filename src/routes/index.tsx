/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { useAuthStore, AuthStatus } from '../store/auth-store';
import SplashScreen from '../features/splash/SplashScreen';
import LoginScreen from '../features/auth/LoginScreen';
import OTPVerificationScreen from '../features/auth/OTPVerificationScreen';
import ForgotPasswordScreen from '../features/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../features/auth/ResetPasswordScreen';
import ForgotPINScreen from '../features/auth/ForgotPINScreen';
import SessionExpiredScreen from '../features/auth/SessionExpiredScreen';
import UnauthorizedScreen from '../features/error/UnauthorizedScreen';
import UpdatePromptScreen from '../features/error/UpdatePromptScreen';
import NotFoundScreen from '../features/error/NotFoundScreen';
import RootErrorBoundary from '../features/error/RootErrorBoundary';
import { AdminScaffold } from '../components/shared/AdminScaffold';
import { RBACProvider, useRBAC } from '../core/auth/RBACProvider';
import UserManagementListScreen from '../features/admin/UserManagementListScreen';
import UserDetailScreen from '../features/admin/UserDetailScreen';
import CreateUserScreen from '../features/admin/CreateUserScreen';
import RoleManagementListScreen from '../features/admin/RoleManagementListScreen';
import RolePermissionEditorScreen from '../features/admin/RolePermissionEditorScreen';
import BranchManagementListScreen from '../features/admin/BranchManagementListScreen';
import BranchDetailScreen from '../features/admin/BranchDetailScreen';
import CreateBranchScreen from '../features/admin/CreateBranchScreen';
import SystemConfigHomeScreen from '../features/admin/SystemConfigHomeScreen';
import ServiceCatalogScreen from '../features/admin/ServiceCatalogScreen';
import PricingConfigScreen from '../features/admin/PricingConfigScreen';
import WorkflowConfigScreen from '../features/admin/WorkflowConfigScreen';
import TaxConfigScreen from '../features/admin/TaxConfigScreen';
import SRListScreen from '../features/operations/SRListScreen';
import SRDetailScreen from '../features/operations/SRDetailScreen';
import CreateSRScreen from '../features/operations/CreateSRScreen';
import CustomerListScreen from '../features/customers/CustomerListScreen';
import Customer360ViewScreen from '../features/customers/Customer360ViewScreen';
import CreateCustomerScreen from '../features/customers/CreateCustomerScreen';
import TechnicianListScreen from '../features/team/TechnicianListScreen';
import TechnicianDetailScreen from '../features/team/TechnicianDetailScreen';
import TechnicianAvailabilityBoard from '../features/team/TechnicianAvailabilityBoard';
import MyProfileScreen from '../features/team/MyProfileScreen';
import DashboardScreen from '../features/dashboard/DashboardScreen';
import OperationsDashboardScreen from '../features/operations/dashboard/OperationsDashboardScreen';
import DispatchManagementScreen from '../features/operations/dashboard/DispatchManagementScreen';
import SLAAlertsScreen from '../features/operations/dashboard/SLAAlertsScreen';
import LiveJobMap from '../features/operations/dashboard/LiveJobMap';
import SchedulingBoardDayView from '../features/operations/scheduling/SchedulingBoardDayView';
import TechnicianShiftScheduler from '../features/operations/scheduling/TechnicianShiftScheduler';
import AMCAutoScheduleBoard from '../features/operations/scheduling/AMCAutoScheduleBoard';
import TechnicianHomeDashboard from '../features/field/TechnicianHomeDashboard';
import MyJobsList from '../features/field/MyJobsList';
import JobWorkflowContainer from '../features/field/JobWorkflowContainer';
import HelperJobView from '../features/field/HelperJobView';
import AttendanceScreen from '../features/field/AttendanceScreen';
import AMCDashboard from '../features/amc/AMCDashboard';
import AMCContractList from '../features/amc/AMCContractList';
import AMCContractDetail from '../features/amc/AMCContractDetail';
import AMCEnrollmentForm from '../features/amc/AMCEnrollmentForm';
import AMCVisitManagement from '../features/amc/AMCVisitManagement';
import AMCRenewalManagement from '../features/amc/AMCRenewalManagement';
import EquipmentRegisterList from '../features/equipment/EquipmentRegisterList';
import EquipmentDetail from '../features/equipment/EquipmentDetail';
import WarrantyManagement from '../features/equipment/WarrantyManagement';
import EstimateList from '../features/estimates/EstimateList';
import EstimateDetail from '../features/estimates/EstimateDetail';
import WorkOrderList from '../features/estimates/WorkOrderList';
import WorkOrderDetail from '../features/estimates/WorkOrderDetail';
import JobReportQueue from '../features/estimates/JobReportQueue';
import JobReportDetail from '../features/estimates/JobReportDetail';
import ReportQualityDashboard from '../features/estimates/ReportQualityDashboard';
import InventoryDashboard from '../features/inventory/InventoryDashboard';
import PartsCatalogList from '../features/inventory/PartsCatalogList';
import PartDetail from '../features/inventory/PartDetail';
import PartsRequestQueue from '../features/inventory/PartsRequestQueue';
import PartsRequestDetail from '../features/inventory/PartsRequestDetail';
import StockMovementLedger from '../features/inventory/StockMovementLedger';
import PurchaseOrderList from '../features/inventory/PurchaseOrderList';
import PurchaseOrderDetail from '../features/inventory/PurchaseOrderDetail';
import InvoiceListScreen from '../features/billing/InvoiceListScreen';
import InvoiceDetailScreen from '../features/billing/InvoiceDetailScreen';
import ARDashboard from '../features/billing/ARDashboard';
import CreateManualInvoice from '../features/billing/CreateManualInvoice';
import FinanceDashboard from '../features/finance/FinanceDashboard';
import PaymentListScreen from '../features/finance/PaymentListScreen';
import TaxReport from '../features/finance/TaxReport';
import SupportDashboard from '../features/support/SupportDashboard';
import SupportTicketQueue from '../features/support/SupportTicketQueue';
import TicketDetailScreen from '../features/support/TicketDetailScreen';
import FeedbackList from '../features/support/FeedbackList';
import FeedbackDetail from '../features/support/FeedbackDetail';
import NotificationTemplates from '../features/governance/NotificationTemplates';
import CMSManager from '../features/governance/CMSManager';
import ReportsHub from '../features/governance/ReportsHub';
import AuditLogs from '../features/governance/AuditLogs';
import CouponManager from '../features/governance/CouponManager';
import SystemHealthDashboard from '../features/system/SystemHealthDashboard';
import PermissionsSettings from '../features/system/PermissionsSettings';
import OfflineSyncQueue from '../features/system/OfflineSyncQueue';
import { useEffect, useState } from 'react';

// Placeholder components for future phases
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-brand-muted">This module is part of a future implementation phase.</p>
  </div>
);

// Role Guard
const RoleGuard = ({ module, children }: { module: string; children: React.ReactNode }) => {
  const { canView } = useRBAC();
  if (!canView(module)) return <UnauthorizedScreen />;
  return <>{children}</>;
};

// Auth Guard
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { status, isInitialized } = useAuthStore();
  
  if (!isInitialized) return <SplashScreen />;
  
  if (status === AuthStatus.UNAUTHENTICATED) return <Navigate to="/login" replace />;
  if (status === AuthStatus.REQUIRES_2FA) return <Navigate to="/verify-otp" replace />;
  if (status === AuthStatus.SESSION_EXPIRED) return <Navigate to="/session-expired" replace />;
  
  return (
    <RBACProvider>
      <AdminScaffold>
        {children}
      </AdminScaffold>
    </RBACProvider>
  );
};

// Guest Guard (for login page)
const GuestGuard = ({ children }: { children: React.ReactNode }) => {
  const { status, isInitialized } = useAuthStore();
  
  if (!isInitialized) return <SplashScreen />;
  if (status === AuthStatus.AUTHENTICATED) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <GuestGuard>
        <LoginScreen />
      </GuestGuard>
    ),
  },
  {
    path: '/verify-otp',
    element: <OTPVerificationScreen />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordScreen />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordScreen />,
  },
  {
    path: '/forgot-pin',
    element: <ForgotPINScreen />,
  },
  {
    path: '/session-expired',
    element: <SessionExpiredScreen />,
  },
  {
    path: '/update-required',
    element: <UpdatePromptScreen />,
  },
  {
    path: '/dashboard',
    element: (
      <AuthGuard>
        <RoleGuard module="dashboard">
          <DashboardScreen />
        </RoleGuard>
      </AuthGuard>
    ),
  },
  // Placeholders for other phases
  { path: '/service-requests', element: <AuthGuard><RoleGuard module="service-requests"><SRListScreen /></RoleGuard></AuthGuard> },
  { path: '/service-requests/create', element: <AuthGuard><RoleGuard module="service-requests"><CreateSRScreen /></RoleGuard></AuthGuard> },
  { path: '/service-requests/:id', element: <AuthGuard><RoleGuard module="service-requests"><SRDetailScreen /></RoleGuard></AuthGuard> },
  { path: '/service-requests/:id/edit', element: <AuthGuard><RoleGuard module="service-requests"><CreateSRScreen /></RoleGuard></AuthGuard> },
  { path: '/operations/dashboard', element: <AuthGuard><RoleGuard module="operations"><OperationsDashboardScreen /></RoleGuard></AuthGuard> },
  { path: '/operations/dispatch', element: <AuthGuard><RoleGuard module="operations"><DispatchManagementScreen /></RoleGuard></AuthGuard> },
  { path: '/operations/sla-alerts', element: <AuthGuard><RoleGuard module="operations"><SLAAlertsScreen /></RoleGuard></AuthGuard> },
  { path: '/operations/map', element: <AuthGuard><RoleGuard module="operations"><LiveJobMap /></RoleGuard></AuthGuard> },
  { path: '/scheduling', element: <AuthGuard><RoleGuard module="scheduling"><SchedulingBoardDayView /></RoleGuard></AuthGuard> },
  { path: '/scheduling/shifts', element: <AuthGuard><RoleGuard module="scheduling"><TechnicianShiftScheduler /></RoleGuard></AuthGuard> },
  { path: '/scheduling/amc', element: <AuthGuard><RoleGuard module="scheduling"><AMCAutoScheduleBoard /></RoleGuard></AuthGuard> },
  { path: '/field/dashboard', element: <AuthGuard><RoleGuard module="jobs"><TechnicianHomeDashboard /></RoleGuard></AuthGuard> },
  { path: '/field/jobs', element: <AuthGuard><RoleGuard module="jobs"><MyJobsList /></RoleGuard></AuthGuard> },
  { path: '/field/job/:id', element: <AuthGuard><RoleGuard module="jobs"><JobWorkflowContainer /></RoleGuard></AuthGuard> },
  { path: '/field/helper/job/:id', element: <AuthGuard><RoleGuard module="jobs"><HelperJobView /></RoleGuard></AuthGuard> },
  
  // Phase 13: AMC & Equipment
  { path: '/amc/dashboard', element: <AuthGuard><RoleGuard module="amc"><AMCDashboard /></RoleGuard></AuthGuard> },
  { path: '/amc/contracts', element: <AuthGuard><RoleGuard module="amc"><AMCContractList /></RoleGuard></AuthGuard> },
  { path: '/amc/contract/:id', element: <AuthGuard><RoleGuard module="amc"><AMCContractDetail /></RoleGuard></AuthGuard> },
  { path: '/amc/enroll', element: <AuthGuard><RoleGuard module="amc"><AMCEnrollmentForm /></RoleGuard></AuthGuard> },
  { path: '/amc/visits', element: <AuthGuard><RoleGuard module="amc"><AMCVisitManagement /></RoleGuard></AuthGuard> },
  { path: '/amc/renewals', element: <AuthGuard><RoleGuard module="amc"><AMCRenewalManagement /></RoleGuard></AuthGuard> },
  { path: '/equipment', element: <AuthGuard><RoleGuard module="equipment"><EquipmentRegisterList /></RoleGuard></AuthGuard> },
  { path: '/equipment/:id', element: <AuthGuard><RoleGuard module="equipment"><EquipmentDetail /></RoleGuard></AuthGuard> },
  { path: '/warranty', element: <AuthGuard><RoleGuard module="equipment"><WarrantyManagement /></RoleGuard></AuthGuard> },

  // Phase 14: Estimates, Work Orders & Job Reports
  { path: '/estimates', element: <AuthGuard><RoleGuard module="amc"><EstimateList /></RoleGuard></AuthGuard> },
  { path: '/estimates/:id', element: <AuthGuard><RoleGuard module="amc"><EstimateDetail /></RoleGuard></AuthGuard> },
  { path: '/work-orders', element: <AuthGuard><RoleGuard module="amc"><WorkOrderList /></RoleGuard></AuthGuard> },
  { path: '/work-orders/:id', element: <AuthGuard><RoleGuard module="amc"><WorkOrderDetail /></RoleGuard></AuthGuard> },
  { path: '/job-reports', element: <AuthGuard><RoleGuard module="amc"><JobReportQueue /></RoleGuard></AuthGuard> },
  { path: '/job-reports/:id', element: <AuthGuard><RoleGuard module="amc"><JobReportDetail /></RoleGuard></AuthGuard> },
  { path: '/job-reports/dashboard', element: <AuthGuard><RoleGuard module="amc"><ReportQualityDashboard /></RoleGuard></AuthGuard> },

  // Phase 15: Inventory & Warehouse Management
  { path: '/inventory', element: <AuthGuard><RoleGuard module="inventory"><InventoryDashboard /></RoleGuard></AuthGuard> },
  { path: '/inventory/catalog', element: <AuthGuard><RoleGuard module="inventory"><PartsCatalogList /></RoleGuard></AuthGuard> },
  { path: '/inventory/catalog/:id', element: <AuthGuard><RoleGuard module="inventory"><PartDetail /></RoleGuard></AuthGuard> },
  { path: '/inventory/requests', element: <AuthGuard><RoleGuard module="inventory"><PartsRequestQueue /></RoleGuard></AuthGuard> },
  { path: '/inventory/requests/:id', element: <AuthGuard><RoleGuard module="inventory"><PartsRequestDetail /></RoleGuard></AuthGuard> },
  { path: '/inventory/ledger', element: <AuthGuard><RoleGuard module="inventory"><StockMovementLedger /></RoleGuard></AuthGuard> },
  { path: '/inventory/orders', element: <AuthGuard><RoleGuard module="inventory"><PurchaseOrderList /></RoleGuard></AuthGuard> },
  { path: '/inventory/orders/:id', element: <AuthGuard><RoleGuard module="inventory"><PurchaseOrderDetail /></RoleGuard></AuthGuard> },

  // Phase 16: Billing & Invoice Management
  { path: '/billing/invoices', element: <AuthGuard><RoleGuard module="billing"><InvoiceListScreen /></RoleGuard></AuthGuard> },
  { path: '/billing/invoices/:id', element: <AuthGuard><RoleGuard module="billing"><InvoiceDetailScreen /></RoleGuard></AuthGuard> },
  { path: '/billing/dashboard', element: <AuthGuard><RoleGuard module="billing"><ARDashboard /></RoleGuard></AuthGuard> },
  { path: '/billing/new', element: <AuthGuard><RoleGuard module="billing"><CreateManualInvoice /></RoleGuard></AuthGuard> },

  // Phase 17: Payment Management & Financial Reporting
  { path: '/finance/dashboard', element: <AuthGuard><RoleGuard module="finance"><FinanceDashboard /></RoleGuard></AuthGuard> },
  { path: '/finance/payments', element: <AuthGuard><RoleGuard module="finance"><PaymentListScreen /></RoleGuard></AuthGuard> },
  { path: '/finance/tax', element: <AuthGuard><RoleGuard module="finance"><TaxReport /></RoleGuard></AuthGuard> },

  // Phase 18: Customer Support & Feedback
  { path: '/support/dashboard', element: <AuthGuard><RoleGuard module="support"><SupportDashboard /></RoleGuard></AuthGuard> },
  { path: '/support/tickets', element: <AuthGuard><RoleGuard module="support"><SupportTicketQueue /></RoleGuard></AuthGuard> },
  { path: '/support/tickets/:id', element: <AuthGuard><RoleGuard module="support"><TicketDetailScreen /></RoleGuard></AuthGuard> },
  { path: '/support/feedback', element: <AuthGuard><RoleGuard module="support"><FeedbackList /></RoleGuard></AuthGuard> },
  { path: '/support/feedback/:id', element: <AuthGuard><RoleGuard module="support"><FeedbackDetail /></RoleGuard></AuthGuard> },

  // Phase 19: Governance, CMS & Intelligence
  { path: '/governance/cms', element: <AuthGuard><RoleGuard module="settings"><CMSManager /></RoleGuard></AuthGuard> },
  { path: '/governance/reports', element: <AuthGuard><RoleGuard module="settings"><ReportsHub /></RoleGuard></AuthGuard> },
  { path: '/governance/audit', element: <AuthGuard><RoleGuard module="settings"><AuditLogs /></RoleGuard></AuthGuard> },
  { path: '/governance/coupons', element: <AuthGuard><RoleGuard module="settings"><CouponManager /></RoleGuard></AuthGuard> },

  // Phase 20: Production Polish & System Hardening
  { path: '/system/health', element: <AuthGuard><RoleGuard module="settings"><SystemHealthDashboard /></RoleGuard></AuthGuard> },
  { path: '/system/permissions', element: <AuthGuard><RoleGuard module="settings"><PermissionsSettings /></RoleGuard></AuthGuard> },
  { path: '/system/sync', element: <AuthGuard><RoleGuard module="settings"><OfflineSyncQueue /></RoleGuard></AuthGuard> },

  { path: '/technician-workflow', element: <AuthGuard><RoleGuard module="jobs"><Placeholder title="Phase 8: Technician Field Workflow" /></RoleGuard></AuthGuard> },
  { path: '/inventory', element: <Navigate to="/inventory/catalog" replace /> },
  { path: '/billing', element: <Navigate to="/billing/dashboard" replace /> },
  { path: '/finance', element: <Navigate to="/finance/dashboard" replace /> },
  { path: '/team', element: <AuthGuard><RoleGuard module="team"><TechnicianListScreen /></RoleGuard></AuthGuard> },
  { path: '/team/availability', element: <AuthGuard><RoleGuard module="team"><TechnicianAvailabilityBoard /></RoleGuard></AuthGuard> },
  { path: '/team/:id', element: <AuthGuard><RoleGuard module="team"><TechnicianDetailScreen /></RoleGuard></AuthGuard> },
  { path: '/team/create', element: <AuthGuard><RoleGuard module="team"><CreateUserScreen /></RoleGuard></AuthGuard> },
  { path: '/profile', element: <AuthGuard><MyProfileScreen /></AuthGuard> },
  { path: '/customers', element: <AuthGuard><RoleGuard module="customers"><CustomerListScreen /></RoleGuard></AuthGuard> },
  { path: '/customers/create', element: <AuthGuard><RoleGuard module="customers"><CreateCustomerScreen /></RoleGuard></AuthGuard> },
  { path: '/customers/:id', element: <AuthGuard><RoleGuard module="customers"><Customer360ViewScreen /></RoleGuard></AuthGuard> },
  { path: '/customers/:id/edit', element: <AuthGuard><RoleGuard module="customers"><CreateCustomerScreen /></RoleGuard></AuthGuard> },
  { path: '/marketing', element: <Navigate to="/governance/cms" replace /> },
  { path: '/reports', element: <Navigate to="/governance/reports" replace /> },
  { path: '/settings', element: <AuthGuard><RoleGuard module="settings"><SystemConfigHomeScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/master/services', element: <AuthGuard><RoleGuard module="settings"><ServiceCatalogScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/master/pricing', element: <AuthGuard><RoleGuard module="settings"><PricingConfigScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/master/workflow', element: <AuthGuard><RoleGuard module="settings"><WorkflowConfigScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/master/tax', element: <AuthGuard><RoleGuard module="settings"><TaxConfigScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/master/notifications', element: <AuthGuard><RoleGuard module="settings"><NotificationTemplates /></RoleGuard></AuthGuard> },
  { path: '/settings/users', element: <AuthGuard><RoleGuard module="settings"><UserManagementListScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/users/:id', element: <AuthGuard><RoleGuard module="settings"><UserDetailScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/users/:id/edit', element: <AuthGuard><RoleGuard module="settings"><CreateUserScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/roles', element: <AuthGuard><RoleGuard module="settings"><RoleManagementListScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/roles/:id', element: <AuthGuard><RoleGuard module="settings"><RolePermissionEditorScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/branches', element: <AuthGuard><RoleGuard module="settings"><BranchManagementListScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/branches/:id', element: <AuthGuard><RoleGuard module="settings"><BranchDetailScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/branches/:id/edit', element: <AuthGuard><RoleGuard module="settings"><CreateBranchScreen /></RoleGuard></AuthGuard> },
  { path: '/settings/branches/create', element: <AuthGuard><RoleGuard module="settings"><CreateBranchScreen /></RoleGuard></AuthGuard> },
  { path: '/attendance', element: <AuthGuard><RoleGuard module="attendance"><AttendanceScreen /></RoleGuard></AuthGuard> },
  { path: '/support-tickets', element: <Navigate to="/support/tickets" replace /> },
  { path: '*', element: <NotFoundScreen /> },
]);

// Wrap the router with the RootErrorBoundary at the top level
const finalRouter = createBrowserRouter(
  router.routes.map(route => ({
    ...route,
    errorElement: <RootErrorBoundary />
  }))
);

export default function AppRouter() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen />;

  return <RouterProvider router={finalRouter} />;
}
