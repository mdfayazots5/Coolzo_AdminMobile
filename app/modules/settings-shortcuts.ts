import type { SettingsShortcut } from "../domain/models/admin";
import { UserRole } from "../store/session-store";

export const SETTINGS_SHORTCUTS: SettingsShortcut[] = [
  {
    id: "notifications",
    title: "Notification Templates",
    description: "Review templates, toggles, and delivery logs.",
    path: "/settings/master/notifications",
    module: "settings",
  },
  {
    id: "services",
    title: "Service Catalog",
    description: "Manage services, brands, and equipment references.",
    path: "/settings/master/services",
    module: "settings",
  },
  {
    id: "zones",
    title: "Zones and Hours",
    description: "Maintain service zones, working hours, and slot rules.",
    path: "/settings/master/zones",
    module: "settings",
  },
  {
    id: "workflow",
    title: "Workflow Rules",
    description: "Adjust statuses, SLA controls, and escalations.",
    path: "/settings/master/workflow",
    module: "settings",
  },
  {
    id: "pricing",
    title: "Pricing and Tax",
    description: "Configure pricing, AMC plans, and tax behavior.",
    path: "/settings/master/pricing",
    module: "settings",
  },
  {
    id: "users",
    title: "Users and Roles",
    description: "Manage users, permissions, roles, and branches.",
    path: "/settings/users",
    module: "settings",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
];

