import type { ReactNode } from "react";
import type { UserRole } from "../../../src/store/auth-store";

export interface AppNavItem {
  id: string;
  label: string;
  path: string;
  module: string;
  icon: ReactNode;
}

export interface BookingRecord {
  id: string;
  reference: string;
  linkedServiceRequestId: string;
  customerName: string;
  phone: string;
  serviceType: string;
  status: string;
  priority: string;
  requestedDate: string;
  requestedSlot: string;
  city: string;
  zoneId: string;
  address: string;
  assignedTechnicianName?: string;
}

export interface NotificationActivity {
  id: string;
  triggerEvent: string;
  recipient: string;
  channel: string;
  status: string;
  sentAt: string;
}

export interface SettingsShortcut {
  id: string;
  title: string;
  description: string;
  path: string;
  module: string;
  roles?: UserRole[];
}
