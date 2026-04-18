/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { 
  LayoutDashboard, 
  Wrench, 
  CalendarCheck, 
  UserCircle, 
  ClipboardList, 
  Users, 
  FileText, 
  CreditCard, 
  Package, 
  BarChart3, 
  Settings,
  Ticket,
  MessageSquare,
  Megaphone,
  Database,
  Zap,
  MapPin,
  ShieldCheck,
  Globe,
  Activity,
  RefreshCw,
  ClipboardCheck,
  Bell
} from "lucide-react"
import { UserRole } from "../../store/auth-store"

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  module: string;
}

export const NavigationConfig: Record<UserRole, NavItem[]> = {
  [UserRole.SUPER_ADMIN]: [
    { id: 'dash', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', module: 'dashboard' },
    { id: 'live', label: 'Dashboard', icon: <Zap size={20} />, path: '/operations/dashboard', module: 'operations' },
    { id: 'dispatch', label: 'Dispatch', icon: <RefreshCw size={20} />, path: '/operations/dispatch', module: 'operations' },
    { id: 'sla', label: 'SLA Alerts', icon: <ShieldCheck size={20} />, path: '/operations/sla-alerts', module: 'operations' },
    { id: 'map', label: 'Live Map', icon: <MapPin size={20} />, path: '/operations/map', module: 'operations' },
    { id: 'schedule', label: 'Schedule', icon: <CalendarCheck size={20} />, path: '/scheduling', module: 'scheduling' },
    { id: 'amc', label: 'AMC', icon: <ShieldCheck size={20} />, path: '/amc/dashboard', module: 'amc' },
    { id: 'inventory', label: 'Inventory', icon: <Package size={20} />, path: '/inventory', module: 'inventory' },
    { id: 'estimates', label: 'Estimates', icon: <FileText size={20} />, path: '/estimates', module: 'amc' },
    { id: 'workorders', label: 'Work Orders', icon: <ClipboardList size={20} />, path: '/work-orders', module: 'amc' },
    { id: 'job-reports', label: 'Job Reports', icon: <ClipboardCheck size={20} />, path: '/job-reports', module: 'amc' },
    { id: 'equipment', label: 'Equipment', icon: <Wrench size={20} />, path: '/equipment', module: 'equipment' },
    { id: 'ops', label: 'Operations', icon: <Wrench size={20} />, path: '/service-requests', module: 'service-requests' },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={20} />, path: '/billing/dashboard', module: 'billing' },
    { id: 'finance', label: 'Finance', icon: <BarChart3 size={20} />, path: '/finance/dashboard', module: 'finance' },
    { id: 'support', label: 'Support', icon: <MessageSquare size={20} />, path: '/support/dashboard', module: 'support' },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} />, path: '/governance/reports', module: 'settings' },
    { id: 'cms', label: 'CMS', icon: <Globe size={20} />, path: '/governance/cms', module: 'settings' },
    { id: 'audit', label: 'Audit', icon: <ShieldCheck size={20} />, path: '/governance/audit', module: 'settings' },
    { id: 'health', label: 'Health', icon: <Activity size={20} />, path: '/system/health', module: 'settings' },
    { id: 'sync', label: 'Sync', icon: <RefreshCw size={20} />, path: '/system/sync', module: 'settings' },
    { id: 'team', label: 'Team', icon: <Users size={20} />, path: '/team', module: 'team' },
  ],
  [UserRole.ADMIN]: [
    { id: 'dash', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', module: 'dashboard' },
    { id: 'live', label: 'Ops Dash', icon: <Zap size={20} />, path: '/operations/dashboard', module: 'operations' },
    { id: 'dispatch', label: 'Dispatch', icon: <RefreshCw size={20} />, path: '/operations/dispatch', module: 'operations' },
    { id: 'map', label: 'Live Map', icon: <MapPin size={20} />, path: '/operations/map', module: 'operations' },
    { id: 'schedule', label: 'Schedule', icon: <CalendarCheck size={20} />, path: '/scheduling', module: 'scheduling' },
    { id: 'amc', label: 'AMC', icon: <ShieldCheck size={20} />, path: '/amc/dashboard', module: 'amc' },
    { id: 'inventory', label: 'Inventory', icon: <Package size={20} />, path: '/inventory', module: 'inventory' },
    { id: 'estimates', label: 'Estimates', icon: <FileText size={20} />, path: '/estimates', module: 'amc' },
    { id: 'workorders', label: 'Work Orders', icon: <ClipboardList size={20} />, path: '/work-orders', module: 'amc' },
    { id: 'job-reports', label: 'Job Reports', icon: <ClipboardCheck size={20} />, path: '/job-reports', module: 'amc' },
    { id: 'equipment', label: 'Equipment', icon: <Wrench size={20} />, path: '/equipment', module: 'equipment' },
    { id: 'ops', label: 'Operations', icon: <Wrench size={20} />, path: '/service-requests', module: 'service-requests' },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={20} />, path: '/billing/dashboard', module: 'billing' },
    { id: 'finance', label: 'Finance', icon: <BarChart3 size={20} />, path: '/finance/dashboard', module: 'finance' },
    { id: 'support', label: 'Support', icon: <MessageSquare size={20} />, path: '/support/dashboard', module: 'support' },
    { id: 'team', label: 'Team', icon: <Users size={20} />, path: '/team', module: 'team' },
    { id: 'customers', label: 'Customers', icon: <UserCircle size={20} />, path: '/customers', module: 'customers' },
    { id: 'more', label: 'More', icon: <Settings size={20} />, path: '/settings', module: 'settings' },
  ],
  [UserRole.TECHNICIAN]: [
    { id: 'dash', label: 'Home', icon: <LayoutDashboard size={20} />, path: '/field/dashboard', module: 'jobs' },
    { id: 'jobs', label: 'My Jobs', icon: <ClipboardList size={20} />, path: '/field/jobs', module: 'jobs' },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={20} />, path: '/attendance', module: 'attendance' },
    { id: 'profile', label: 'Profile', icon: <UserCircle size={20} />, path: '/profile', module: 'profile' },
  ],
  [UserRole.HELPER]: [
    { id: 'dash', label: 'Home', icon: <LayoutDashboard size={20} />, path: '/field/dashboard', module: 'jobs' },
    { id: 'jobs', label: 'My Jobs', icon: <ClipboardList size={20} />, path: '/field/jobs', module: 'jobs' },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={20} />, path: '/attendance', module: 'attendance' },
    { id: 'profile', label: 'Profile', icon: <UserCircle size={20} />, path: '/profile', module: 'profile' },
  ],
  [UserRole.OPS_MANAGER]: [
    { id: 'dash', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', module: 'dashboard' },
    { id: 'live', label: 'Ops Dash', icon: <Zap size={20} />, path: '/operations/dashboard', module: 'operations' },
    { id: 'dispatch', label: 'Dispatch', icon: <RefreshCw size={20} />, path: '/operations/dispatch', module: 'operations' },
    { id: 'sla', label: 'SLA Alerts', icon: <ShieldCheck size={20} />, path: '/operations/sla-alerts', module: 'operations' },
    { id: 'schedule', label: 'Schedule', icon: <CalendarCheck size={20} />, path: '/scheduling', module: 'scheduling' },
    { id: 'amc', label: 'AMC', icon: <ShieldCheck size={20} />, path: '/amc/dashboard', module: 'amc' },
    { id: 'equipment', label: 'Equipment', icon: <Wrench size={20} />, path: '/equipment', module: 'equipment' },
    { id: 'map', label: 'Live Map', icon: <MapPin size={20} />, path: '/operations/map', module: 'operations' },
    { id: 'sr', label: 'Requests', icon: <Wrench size={20} />, path: '/service-requests', module: 'service-requests' },
    { id: 'techs', label: 'Team', icon: <Users size={20} />, path: '/team', module: 'team' },
    { id: 'more', label: 'More', icon: <Settings size={20} />, path: '/settings', module: 'settings' },
  ],
  [UserRole.OPS_EXECUTIVE]: [
    { id: 'dash', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', module: 'dashboard' },
    { id: 'live', label: 'Live Ops', icon: <Zap size={20} />, path: '/operations/dashboard', module: 'operations' },
    { id: 'schedule', label: 'Schedule', icon: <CalendarCheck size={20} />, path: '/scheduling', module: 'scheduling' },
    { id: 'amc', label: 'AMC', icon: <ShieldCheck size={20} />, path: '/amc/dashboard', module: 'amc' },
    { id: 'equipment', label: 'Equipment', icon: <Wrench size={20} />, path: '/equipment', module: 'equipment' },
    { id: 'sr', label: 'Requests', icon: <Wrench size={20} />, path: '/service-requests', module: 'service-requests' },
    { id: 'techs', label: 'Team', icon: <Users size={20} />, path: '/team', module: 'team' },
    { id: 'more', label: 'More', icon: <Settings size={20} />, path: '/settings', module: 'settings' },
  ],
  [UserRole.FINANCE_MANAGER]: [
    { id: 'dash', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', module: 'dashboard' },
    { id: 'inv', label: 'Invoices', icon: <FileText size={20} />, path: '/billing/dashboard', module: 'billing' },
    { id: 'pay', label: 'Payments', icon: <CreditCard size={20} />, path: '/finance/dashboard', module: 'finance' },
    { id: 'rep', label: 'Reports', icon: <BarChart3 size={20} />, path: '/governance/reports', module: 'settings' },
  ],
  [UserRole.BILLING_EXECUTIVE]: [
    { id: 'dash', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', module: 'dashboard' },
    { id: 'inv', label: 'Invoices', icon: <FileText size={20} />, path: '/billing/dashboard', module: 'billing' },
    { id: 'pay', label: 'Payments', icon: <CreditCard size={20} />, path: '/finance/dashboard', module: 'finance' },
    { id: 'rep', label: 'Reports', icon: <BarChart3 size={20} />, path: '/governance/reports', module: 'settings' },
  ],
  [UserRole.INVENTORY_MANAGER]: [
    { id: 'dash', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', module: 'dashboard' },
    { id: 'parts', label: 'Catalog', icon: <Package size={20} />, path: '/inventory', module: 'inventory' },
    { id: 'req', label: 'Requests', icon: <ClipboardList size={20} />, path: '/inventory/requests', module: 'inventory' },
    { id: 'po', label: 'Orders', icon: <FileText size={20} />, path: '/inventory/orders', module: 'inventory' },
  ],
  [UserRole.SUPPORT]: [
    { id: 'dash', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', module: 'dashboard' },
    { id: 'sr', label: 'Requests', icon: <Wrench size={20} />, path: '/service-requests', module: 'service-requests' },
    { id: 'cust', label: 'Customers', icon: <UserCircle size={20} />, path: '/customers', module: 'customers' },
    { id: 'tix', label: 'Tickets', icon: <Ticket size={20} />, path: '/support/tickets', module: 'support' },
  ],
  [UserRole.MARKETING_MANAGER]: [
    { id: 'dash', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', module: 'dashboard' },
    { id: 'cms', label: 'CMS', icon: <Globe size={20} />, path: '/governance/cms', module: 'settings' },
    { id: 'promo', label: 'Promos', icon: <Megaphone size={20} />, path: '/governance/coupons', module: 'settings' },
    { id: 'stats', label: 'Analytics', icon: <BarChart3 size={20} />, path: '/governance/reports', module: 'settings' },
  ],
};
