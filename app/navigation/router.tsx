import * as React from "react";
import { createBrowserRouter, Navigate, RouterProvider, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AdminScaffold } from "../../src/components/shared/AdminScaffold";
import { RBACProvider, useRBAC } from "../../src/core/auth/RBACProvider";
import { logPermissionDeniedAttempt } from "../../src/core/auth/permission-audit";
import { resolveDefaultRoute } from "../../src/core/auth/auth-session";
import { authRepository } from "../../src/core/network/auth-repository";
import { LocalStorage, StorageKey } from "../../src/core/storage/local-storage";
import {
  consumePendingRoute,
  navigateToPath,
  queuePendingRoute,
  resolveDeepLinkPath,
  resolvePushIntentPath,
  PushNavigationIntent,
} from "../../src/core/system/navigation-intents";
import LoginScreen from "../../src/features/auth/LoginScreen";
import OTPVerificationScreen from "../../src/features/auth/OTPVerificationScreen";
import ForgotPasswordScreen from "../../src/features/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../../src/features/auth/ResetPasswordScreen";
import ForgotPINScreen from "../../src/features/auth/ForgotPINScreen";
import SessionExpiredScreen from "../../src/features/auth/SessionExpiredScreen";
import DashboardScreen from "../../src/features/dashboard/DashboardScreen";
import UnauthorizedScreen from "../../src/features/error/UnauthorizedScreen";
import UpdatePromptScreen from "../../src/features/error/UpdatePromptScreen";
import NotFoundScreen from "../../src/features/error/NotFoundScreen";
import RootErrorBoundary from "../../src/features/error/RootErrorBoundary";
import SplashScreen from "../../src/features/splash/SplashScreen";
import SRListScreen from "../../src/features/operations/SRListScreen";
import SRDetailScreen from "../../src/features/operations/SRDetailScreen";
import CreateSRScreen from "../../src/features/operations/CreateSRScreen";
import CustomerListScreen from "../../src/features/customers/CustomerListScreen";
import Customer360ViewScreen from "../../src/features/customers/Customer360ViewScreen";
import CreateCustomerScreen from "../../src/features/customers/CreateCustomerScreen";
import TechnicianListScreen from "../../src/features/team/TechnicianListScreen";
import TechnicianDetailScreen from "../../src/features/team/TechnicianDetailScreen";
import TechnicianEditorScreen from "../../src/features/team/TechnicianEditorScreen";
import TechnicianAvailabilityBoard from "../../src/features/team/TechnicianAvailabilityBoard";
import MyProfileScreen from "../../src/features/team/MyProfileScreen";
import OperationsDashboardScreen from "../../src/features/operations/dashboard/OperationsDashboardScreen";
import DispatchManagementScreen from "../../src/features/operations/dashboard/DispatchManagementScreen";
import SLAAlertsScreen from "../../src/features/operations/dashboard/SLAAlertsScreen";
import LiveJobMap from "../../src/features/operations/dashboard/LiveJobMap";
import SchedulingBoardDayView from "../../src/features/operations/scheduling/SchedulingBoardDayView";
import TechnicianShiftScheduler from "../../src/features/operations/scheduling/TechnicianShiftScheduler";
import AMCAutoScheduleBoard from "../../src/features/operations/scheduling/AMCAutoScheduleBoard";
import TechnicianHomeDashboard from "../../src/features/field/TechnicianHomeDashboard";
import MyJobsList from "../../src/features/field/MyJobsList";
import JobWorkflowContainer from "../../src/features/field/JobWorkflowContainer";
import HelperJobView from "../../src/features/field/HelperJobView";
import AttendanceScreen from "../../src/features/field/AttendanceScreen";
import AMCDashboard from "../../src/features/amc/AMCDashboard";
import AMCContractList from "../../src/features/amc/AMCContractList";
import AMCContractDetail from "../../src/features/amc/AMCContractDetail";
import AMCEnrollmentForm from "../../src/features/amc/AMCEnrollmentForm";
import AMCVisitManagement from "../../src/features/amc/AMCVisitManagement";
import AMCRenewalManagement from "../../src/features/amc/AMCRenewalManagement";
import EquipmentRegisterList from "../../src/features/equipment/EquipmentRegisterList";
import EquipmentDetail from "../../src/features/equipment/EquipmentDetail";
import WarrantyManagement from "../../src/features/equipment/WarrantyManagement";
import EstimateList from "../../src/features/estimates/EstimateList";
import EstimateDetail from "../../src/features/estimates/EstimateDetail";
import WorkOrderList from "../../src/features/estimates/WorkOrderList";
import WorkOrderDetail from "../../src/features/estimates/WorkOrderDetail";
import JobReportQueue from "../../src/features/estimates/JobReportQueue";
import JobReportDetail from "../../src/features/estimates/JobReportDetail";
import ReportQualityDashboard from "../../src/features/estimates/ReportQualityDashboard";
import InventoryDashboard from "../../src/features/inventory/InventoryDashboard";
import PartsCatalogList from "../../src/features/inventory/PartsCatalogList";
import PartDetail from "../../src/features/inventory/PartDetail";
import PartsRequestQueue from "../../src/features/inventory/PartsRequestQueue";
import PartsRequestDetail from "../../src/features/inventory/PartsRequestDetail";
import StockMovementLedger from "../../src/features/inventory/StockMovementLedger";
import PurchaseOrderList from "../../src/features/inventory/PurchaseOrderList";
import PurchaseOrderDetail from "../../src/features/inventory/PurchaseOrderDetail";
import SupplierManagement from "../../src/features/inventory/SupplierManagement";
import InvoiceListScreen from "../../src/features/billing/InvoiceListScreen";
import InvoiceDetailScreen from "../../src/features/billing/InvoiceDetailScreen";
import ARDashboard from "../../src/features/billing/ARDashboard";
import CreateManualInvoice from "../../src/features/billing/CreateManualInvoice";
import FinanceDashboard from "../../src/features/finance/FinanceDashboard";
import PaymentListScreen from "../../src/features/finance/PaymentListScreen";
import PaymentDetailScreen from "../../src/features/finance/PaymentDetailScreen";
import ReceiptManagementScreen from "../../src/features/finance/ReceiptManagementScreen";
import FinanceReportScreen from "../../src/features/finance/FinanceReportScreen";
import TaxReport from "../../src/features/finance/TaxReport";
import SupportDashboard from "../../src/features/support/SupportDashboard";
import SupportTicketQueue from "../../src/features/support/SupportTicketQueue";
import TicketDetailScreen from "../../src/features/support/TicketDetailScreen";
import SupportTicketCreateScreen from "../../src/features/support/SupportTicketCreateScreen";
import FeedbackList from "../../src/features/support/FeedbackList";
import FeedbackDetail from "../../src/features/support/FeedbackDetail";
import NotificationTemplates from "../../src/features/governance/NotificationTemplates";
import CMSManager from "../../src/features/governance/CMSManager";
import ReportsHub from "../../src/features/governance/ReportsHub";
import AuditLogs from "../../src/features/governance/AuditLogs";
import CouponManager from "../../src/features/governance/CouponManager";
import SystemHealthDashboard from "../../src/features/system/SystemHealthDashboard";
import PermissionsSettings from "../../src/features/system/PermissionsSettings";
import OfflineSyncQueue from "../../src/features/system/OfflineSyncQueue";
import SystemConfigHomeScreen from "../../src/features/admin/SystemConfigHomeScreen";
import ServiceCatalogScreen from "../../src/features/admin/ServiceCatalogScreen";
import ZoneManagementScreen from "../../src/features/admin/ZoneManagementScreen";
import BusinessHoursScreen from "../../src/features/admin/BusinessHoursScreen";
import PricingConfigScreen from "../../src/features/admin/PricingConfigScreen";
import WorkflowConfigScreen from "../../src/features/admin/WorkflowConfigScreen";
import TaxConfigScreen from "../../src/features/admin/TaxConfigScreen";
import UserManagementListScreen from "../../src/features/admin/UserManagementListScreen";
import CreateUserScreen from "../../src/features/admin/CreateUserScreen";
import UserDetailScreen from "../../src/features/admin/UserDetailScreen";
import RoleManagementListScreen from "../../src/features/admin/RoleManagementListScreen";
import RolePermissionEditorScreen from "../../src/features/admin/RolePermissionEditorScreen";
import BranchManagementListScreen from "../../src/features/admin/BranchManagementListScreen";
import BranchDetailScreen from "../../src/features/admin/BranchDetailScreen";
import CreateBranchScreen from "../../src/features/admin/CreateBranchScreen";
import { AuthStatus, useAuthStore } from "../store/session-store";
import { BookingDetailScreen } from "../screens/BookingDetailScreen";
import { BookingListScreen } from "../screens/BookingListScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { SettingsHomeScreen } from "../screens/SettingsHomeScreen";

const RoleGuard = ({ module, children }: { module: string; children: React.ReactNode }) => {
  const { canView, isPermissionsReady } = useRBAC();
  const location = useLocation();

  if (!isPermissionsReady) {
    return <SplashScreen />;
  }

  if (!canView(module)) {
    logPermissionDeniedAttempt({ module, action: "view", route: location.pathname });
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname, module }} />;
  }

  return <>{children}</>;
};

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { status, isInitialized } = useAuthStore();

  if (!isInitialized) return <SplashScreen />;
  if (status === AuthStatus.UNAUTHENTICATED) return <Navigate to="/login" replace />;
  if (status === AuthStatus.REQUIRES_2FA) return <Navigate to="/verify-otp" replace />;
  if (status === AuthStatus.SESSION_EXPIRED) return <Navigate to="/session-expired" replace />;

  return (
    <RBACProvider>
      <AdminScaffold>{children}</AdminScaffold>
    </RBACProvider>
  );
};

const GuestGuard = ({ children }: { children: React.ReactNode }) => {
  const { status, isInitialized, user } = useAuthStore();

  if (!isInitialized) return <SplashScreen />;
  if (status === AuthStatus.AUTHENTICATED) return <Navigate to={resolveDefaultRoute(user?.role)} replace />;

  return <>{children}</>;
};

const ParamRedirect = ({ resolve }: { resolve: (params: Record<string, string | undefined>) => string }) => {
  const params = useParams();
  return <Navigate to={resolve(params)} replace />;
};

const routes = [
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <GuestGuard><LoginScreen /></GuestGuard> },
  { path: "/verify-otp", element: <GuestGuard><OTPVerificationScreen /></GuestGuard> },
  { path: "/forgot-password", element: <ForgotPasswordScreen /> },
  { path: "/reset-password", element: <ResetPasswordScreen /> },
  { path: "/forgot-pin", element: <ForgotPINScreen /> },
  { path: "/session-expired", element: <GuestGuard><SessionExpiredScreen /></GuestGuard> },
  { path: "/update-required", element: <UpdatePromptScreen /> },
  { path: "/unauthorized", element: <AuthGuard><UnauthorizedScreen /></AuthGuard> },
  { path: "/dashboard", element: <AuthGuard><RoleGuard module="dashboard"><DashboardScreen /></RoleGuard></AuthGuard> },
  { path: "/admin/dashboard", element: <Navigate to="/dashboard" replace /> },
  { path: "/service-requests", element: <AuthGuard><RoleGuard module="service-requests"><SRListScreen /></RoleGuard></AuthGuard> },
  { path: "/service-requests/create", element: <AuthGuard><RoleGuard module="service-requests"><CreateSRScreen /></RoleGuard></AuthGuard> },
  { path: "/service-requests/:id", element: <AuthGuard><RoleGuard module="service-requests"><SRDetailScreen /></RoleGuard></AuthGuard> },
  { path: "/service-requests/:id/edit", element: <AuthGuard><RoleGuard module="service-requests"><CreateSRScreen /></RoleGuard></AuthGuard> },
  { path: "/bookings", element: <AuthGuard><RoleGuard module="service-requests"><BookingListScreen /></RoleGuard></AuthGuard> },
  { path: "/bookings/:id", element: <AuthGuard><RoleGuard module="service-requests"><BookingDetailScreen /></RoleGuard></AuthGuard> },
  { path: "/customers", element: <AuthGuard><RoleGuard module="customers"><CustomerListScreen /></RoleGuard></AuthGuard> },
  { path: "/customers/create", element: <AuthGuard><RoleGuard module="customers"><CreateCustomerScreen /></RoleGuard></AuthGuard> },
  { path: "/customers/:id", element: <AuthGuard><RoleGuard module="customers"><Customer360ViewScreen /></RoleGuard></AuthGuard> },
  { path: "/customers/:id/edit", element: <AuthGuard><RoleGuard module="customers"><CreateCustomerScreen /></RoleGuard></AuthGuard> },
  { path: "/team", element: <AuthGuard><RoleGuard module="team"><TechnicianListScreen /></RoleGuard></AuthGuard> },
  { path: "/team/availability", element: <AuthGuard><RoleGuard module="team"><TechnicianAvailabilityBoard /></RoleGuard></AuthGuard> },
  { path: "/team/create", element: <AuthGuard><RoleGuard module="team"><TechnicianEditorScreen /></RoleGuard></AuthGuard> },
  { path: "/team/:id", element: <AuthGuard><RoleGuard module="team"><TechnicianDetailScreen /></RoleGuard></AuthGuard> },
  { path: "/team/:id/edit", element: <AuthGuard><RoleGuard module="team"><TechnicianEditorScreen /></RoleGuard></AuthGuard> },
  { path: "/operations/dashboard", element: <AuthGuard><RoleGuard module="operations"><OperationsDashboardScreen /></RoleGuard></AuthGuard> },
  { path: "/operations/dispatch", element: <AuthGuard><RoleGuard module="operations"><DispatchManagementScreen /></RoleGuard></AuthGuard> },
  { path: "/operations/sla-alerts", element: <AuthGuard><RoleGuard module="operations"><SLAAlertsScreen /></RoleGuard></AuthGuard> },
  { path: "/operations/map", element: <AuthGuard><RoleGuard module="operations"><LiveJobMap /></RoleGuard></AuthGuard> },
  { path: "/scheduling", element: <AuthGuard><RoleGuard module="scheduling"><SchedulingBoardDayView /></RoleGuard></AuthGuard> },
  { path: "/scheduling/shifts", element: <AuthGuard><RoleGuard module="scheduling"><TechnicianShiftScheduler /></RoleGuard></AuthGuard> },
  { path: "/scheduling/amc", element: <AuthGuard><RoleGuard module="scheduling"><AMCAutoScheduleBoard /></RoleGuard></AuthGuard> },
  { path: "/technician/home", element: <AuthGuard><RoleGuard module="jobs"><TechnicianHomeDashboard /></RoleGuard></AuthGuard> },
  { path: "/field/dashboard", element: <AuthGuard><RoleGuard module="jobs"><TechnicianHomeDashboard /></RoleGuard></AuthGuard> },
  { path: "/field/jobs", element: <AuthGuard><RoleGuard module="jobs"><MyJobsList /></RoleGuard></AuthGuard> },
  { path: "/field/job/:id", element: <AuthGuard><RoleGuard module="jobs"><JobWorkflowContainer /></RoleGuard></AuthGuard> },
  { path: "/field/helper/job/:id", element: <AuthGuard><RoleGuard module="jobs"><HelperJobView /></RoleGuard></AuthGuard> },
  { path: "/attendance", element: <AuthGuard><RoleGuard module="attendance"><AttendanceScreen /></RoleGuard></AuthGuard> },
  { path: "/amc/dashboard", element: <AuthGuard><RoleGuard module="amc"><AMCDashboard /></RoleGuard></AuthGuard> },
  { path: "/amc/contracts", element: <AuthGuard><RoleGuard module="amc"><AMCContractList /></RoleGuard></AuthGuard> },
  { path: "/amc/contract/:id", element: <AuthGuard><RoleGuard module="amc"><AMCContractDetail /></RoleGuard></AuthGuard> },
  { path: "/amc/enroll", element: <AuthGuard><RoleGuard module="amc"><AMCEnrollmentForm /></RoleGuard></AuthGuard> },
  { path: "/amc/visits", element: <AuthGuard><RoleGuard module="amc"><AMCVisitManagement /></RoleGuard></AuthGuard> },
  { path: "/amc/renewals", element: <AuthGuard><RoleGuard module="amc"><AMCRenewalManagement /></RoleGuard></AuthGuard> },
  { path: "/equipment", element: <AuthGuard><RoleGuard module="equipment"><EquipmentRegisterList /></RoleGuard></AuthGuard> },
  { path: "/equipment/:id", element: <AuthGuard><RoleGuard module="equipment"><EquipmentDetail /></RoleGuard></AuthGuard> },
  { path: "/warranty", element: <AuthGuard><RoleGuard module="equipment"><WarrantyManagement /></RoleGuard></AuthGuard> },
  { path: "/estimates", element: <AuthGuard><RoleGuard module="amc"><EstimateList /></RoleGuard></AuthGuard> },
  { path: "/estimates/:id", element: <AuthGuard><RoleGuard module="amc"><EstimateDetail /></RoleGuard></AuthGuard> },
  { path: "/work-orders", element: <AuthGuard><RoleGuard module="amc"><WorkOrderList /></RoleGuard></AuthGuard> },
  { path: "/work-orders/:id", element: <AuthGuard><RoleGuard module="amc"><WorkOrderDetail /></RoleGuard></AuthGuard> },
  { path: "/job-reports", element: <AuthGuard><RoleGuard module="amc"><JobReportQueue /></RoleGuard></AuthGuard> },
  { path: "/job-reports/:id", element: <AuthGuard><RoleGuard module="amc"><JobReportDetail /></RoleGuard></AuthGuard> },
  { path: "/job-reports/dashboard", element: <AuthGuard><RoleGuard module="amc"><ReportQualityDashboard /></RoleGuard></AuthGuard> },
  { path: "/inventory", element: <AuthGuard><RoleGuard module="inventory"><InventoryDashboard /></RoleGuard></AuthGuard> },
  { path: "/inventory/catalog", element: <AuthGuard><RoleGuard module="inventory"><PartsCatalogList /></RoleGuard></AuthGuard> },
  { path: "/inventory/catalog/:id", element: <AuthGuard><RoleGuard module="inventory"><PartDetail /></RoleGuard></AuthGuard> },
  { path: "/inventory/requests", element: <AuthGuard><RoleGuard module="inventory"><PartsRequestQueue /></RoleGuard></AuthGuard> },
  { path: "/inventory/requests/:id", element: <AuthGuard><RoleGuard module="inventory"><PartsRequestDetail /></RoleGuard></AuthGuard> },
  { path: "/inventory/ledger", element: <AuthGuard><RoleGuard module="inventory"><StockMovementLedger /></RoleGuard></AuthGuard> },
  { path: "/inventory/orders", element: <AuthGuard><RoleGuard module="inventory"><PurchaseOrderList /></RoleGuard></AuthGuard> },
  { path: "/inventory/orders/:id", element: <AuthGuard><RoleGuard module="inventory"><PurchaseOrderDetail /></RoleGuard></AuthGuard> },
  { path: "/inventory/suppliers", element: <AuthGuard><RoleGuard module="inventory"><SupplierManagement /></RoleGuard></AuthGuard> },
  { path: "/billing", element: <Navigate to="/billing/dashboard" replace /> },
  { path: "/billing/dashboard", element: <AuthGuard><RoleGuard module="billing"><ARDashboard /></RoleGuard></AuthGuard> },
  { path: "/billing/invoices", element: <AuthGuard><RoleGuard module="billing"><InvoiceListScreen /></RoleGuard></AuthGuard> },
  { path: "/billing/invoices/:id", element: <AuthGuard><RoleGuard module="billing"><InvoiceDetailScreen /></RoleGuard></AuthGuard> },
  { path: "/billing/new", element: <AuthGuard><RoleGuard module="billing"><CreateManualInvoice /></RoleGuard></AuthGuard> },
  { path: "/finance", element: <Navigate to="/finance/dashboard" replace /> },
  { path: "/finance/dashboard", element: <AuthGuard><RoleGuard module="finance"><FinanceDashboard /></RoleGuard></AuthGuard> },
  { path: "/finance/payments", element: <AuthGuard><RoleGuard module="finance"><PaymentListScreen /></RoleGuard></AuthGuard> },
  { path: "/finance/payments/:id", element: <AuthGuard><RoleGuard module="finance"><PaymentDetailScreen /></RoleGuard></AuthGuard> },
  { path: "/finance/receipts", element: <AuthGuard><RoleGuard module="finance"><ReceiptManagementScreen /></RoleGuard></AuthGuard> },
  { path: "/finance/reports/:reportType", element: <AuthGuard><RoleGuard module="finance"><FinanceReportScreen /></RoleGuard></AuthGuard> },
  { path: "/finance/tax", element: <AuthGuard><RoleGuard module="finance"><TaxReport /></RoleGuard></AuthGuard> },
  { path: "/support/dashboard", element: <AuthGuard><RoleGuard module="support"><SupportDashboard /></RoleGuard></AuthGuard> },
  { path: "/support/tickets", element: <AuthGuard><RoleGuard module="support"><SupportTicketQueue /></RoleGuard></AuthGuard> },
  { path: "/support/new", element: <AuthGuard><RoleGuard module="support"><SupportTicketCreateScreen /></RoleGuard></AuthGuard> },
  { path: "/support/tickets/:id", element: <AuthGuard><RoleGuard module="support"><TicketDetailScreen /></RoleGuard></AuthGuard> },
  { path: "/support/feedback", element: <AuthGuard><RoleGuard module="support"><FeedbackList /></RoleGuard></AuthGuard> },
  { path: "/support/feedback/:id", element: <AuthGuard><RoleGuard module="support"><FeedbackDetail /></RoleGuard></AuthGuard> },
  { path: "/notifications", element: <AuthGuard><RoleGuard module="settings"><NotificationsScreen /></RoleGuard></AuthGuard> },
  { path: "/settings", element: <AuthGuard><RoleGuard module="settings"><SettingsHomeScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/master/services", element: <AuthGuard><RoleGuard module="settings"><ServiceCatalogScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/master/brands", element: <AuthGuard><RoleGuard module="settings"><ServiceCatalogScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/master/zones", element: <AuthGuard><RoleGuard module="settings"><ZoneManagementScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/master/hours", element: <AuthGuard><RoleGuard module="settings"><BusinessHoursScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/master/pricing", element: <AuthGuard><RoleGuard module="settings"><PricingConfigScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/master/amc", element: <AuthGuard><RoleGuard module="settings"><PricingConfigScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/master/workflow", element: <AuthGuard><RoleGuard module="settings"><WorkflowConfigScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/master/sla", element: <AuthGuard><RoleGuard module="settings"><WorkflowConfigScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/master/tax", element: <AuthGuard><RoleGuard module="settings"><TaxConfigScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/master/notifications", element: <AuthGuard><RoleGuard module="settings"><NotificationTemplates /></RoleGuard></AuthGuard> },
  { path: "/settings/users", element: <AuthGuard><RoleGuard module="settings"><UserManagementListScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/users/create", element: <AuthGuard><RoleGuard module="settings"><CreateUserScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/users/:id", element: <AuthGuard><RoleGuard module="settings"><UserDetailScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/users/:id/edit", element: <AuthGuard><RoleGuard module="settings"><CreateUserScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/roles", element: <AuthGuard><RoleGuard module="settings"><RoleManagementListScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/roles/create", element: <AuthGuard><RoleGuard module="settings"><RolePermissionEditorScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/roles/:id", element: <AuthGuard><RoleGuard module="settings"><RolePermissionEditorScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/branches", element: <AuthGuard><RoleGuard module="settings"><BranchManagementListScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/branches/:id", element: <AuthGuard><RoleGuard module="settings"><BranchDetailScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/branches/:id/edit", element: <AuthGuard><RoleGuard module="settings"><CreateBranchScreen /></RoleGuard></AuthGuard> },
  { path: "/settings/branches/create", element: <AuthGuard><RoleGuard module="settings"><CreateBranchScreen /></RoleGuard></AuthGuard> },
  { path: "/governance/cms", element: <AuthGuard><RoleGuard module="settings"><CMSManager /></RoleGuard></AuthGuard> },
  { path: "/marketing", element: <Navigate to="/marketing/dashboard" replace /> },
  { path: "/marketing/dashboard", element: <AuthGuard><RoleGuard module="settings"><CMSManager /></RoleGuard></AuthGuard> },
  { path: "/governance/reports", element: <AuthGuard><RoleGuard module="reports"><ReportsHub /></RoleGuard></AuthGuard> },
  { path: "/reports", element: <Navigate to="/governance/reports" replace /> },
  { path: "/governance/audit", element: <AuthGuard><RoleGuard module="settings"><AuditLogs /></RoleGuard></AuthGuard> },
  { path: "/governance/coupons", element: <AuthGuard><RoleGuard module="settings"><CouponManager /></RoleGuard></AuthGuard> },
  { path: "/system/health", element: <AuthGuard><RoleGuard module="settings"><SystemHealthDashboard /></RoleGuard></AuthGuard> },
  { path: "/system/permissions", element: <AuthGuard><RoleGuard module="settings"><PermissionsSettings /></RoleGuard></AuthGuard> },
  { path: "/system/sync", element: <AuthGuard><RoleGuard module="settings"><OfflineSyncQueue /></RoleGuard></AuthGuard> },
  { path: "/profile", element: <AuthGuard><MyProfileScreen /></AuthGuard> },
  { path: "/support-tickets", element: <Navigate to="/support/tickets" replace /> },
  { path: "/jobs/:srId", element: <ParamRedirect resolve={(params) => `/field/job/${params.srId ?? ""}`} /> },
  { path: "/sr/:srId", element: <ParamRedirect resolve={(params) => `/service-requests/${params.srId ?? ""}`} /> },
  { path: "/estimate/:srId", element: <ParamRedirect resolve={(params) => `/estimates/${params.srId ?? ""}`} /> },
  { path: "/invoice/:invoiceId", element: <ParamRedirect resolve={(params) => `/billing/invoices/${params.invoiceId ?? ""}`} /> },
  { path: "/ticket/:ticketId", element: <ParamRedirect resolve={(params) => `/support/tickets/${params.ticketId ?? ""}`} /> },
  { path: "/amc/:contractId", element: <ParamRedirect resolve={(params) => `/amc/contract/${params.contractId ?? ""}`} /> },
  { path: "/renewal/:contractId", element: <ParamRedirect resolve={(params) => `/amc/dashboard?focus=renewals&contractId=${params.contractId ?? ""}`} /> },
  { path: "/offer/:offerId", element: <ParamRedirect resolve={(params) => `/governance/coupons?offerId=${params.offerId ?? ""}`} /> },
  { path: "*", element: <NotFoundScreen /> },
];

const router = createBrowserRouter(
  routes.map((route) => ({
    ...route,
    errorElement: <RootErrorBoundary />,
  })),
);

export default function AppRouter() {
  const initialize = useAuthStore((state) => state.initialize);
  const status = useAuthStore((state) => state.status);
  const token = useAuthStore((state) => state.token);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const deepLinkPath = resolveDeepLinkPath(window.location.href);
    if (deepLinkPath && `${window.location.pathname}${window.location.search}` !== deepLinkPath) {
      navigateToPath(deepLinkPath, true);
    }
  }, []);

  useEffect(() => {
    const handlePushIntent = (event: Event) => {
      const detail = (event as CustomEvent<PushNavigationIntent>).detail;
      const path = resolvePushIntentPath(detail);
      if (!path) {
        return;
      }

      if (useAuthStore.getState().status === AuthStatus.AUTHENTICATED) {
        navigateToPath(path);
      } else {
        queuePendingRoute(path);
      }
    };

    window.addEventListener("coolzo:navigate", handlePushIntent as EventListener);
    return () => window.removeEventListener("coolzo:navigate", handlePushIntent as EventListener);
  }, []);

  useEffect(() => {
    if (status !== AuthStatus.AUTHENTICATED) {
      return;
    }

    const pendingRoute = consumePendingRoute();
    if (pendingRoute) {
      navigateToPath(pendingRoute, true);
    }
  }, [status]);

  useEffect(() => {
    const backgroundedAt = LocalStorage.get<number>(StorageKey.SYSTEM_LAST_BACKGROUND_AT);

    if (!backgroundedAt || !token || !refreshToken) {
      setShowSplash(false);
      return;
    }

    const THIRTY_MINUTES = 30 * 60 * 1000;
    if (Date.now() - backgroundedAt < THIRTY_MINUTES) {
      setShowSplash(false);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await authRepository.refreshToken(token, refreshToken);
        useAuthStore.getState().login(response.user, response.token, response.refreshToken);
      } catch (_error) {
        useAuthStore.getState().setSessionExpired();
      } finally {
        if (!cancelled) {
          setShowSplash(false);
        }
      }
    };

    void refresh();
    return () => {
      cancelled = true;
    };
  }, [refreshToken, token]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <RouterProvider router={router} />;
}
