# API Integration Master File

This document tracks the status of real API integrations across the Coolzo Admin Platform.

**Global Toggle:** `DEMO_FLAG` (Defined in `src/core/config/api-config.ts`)

Current truth note:
Only Batch 1, Batch 2, and Batch 18 have been re-verified against the current .NET backend in the 2026-04-19 admin-mobile audit pass. Later batch rows below are historical entries until they are re-audited against live controllers and repositories.

---

## Batch 1: Authentication & Identity
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Login Screen | `POST /api/v1/auth/login` | Done | `{ userNameOrEmail, password }` | `ApiResponse<{ accessToken, refreshToken, expiresAtUtc, currentUser }>` | `email or username -> userNameOrEmail`, `password -> password` |
| Field Login | `POST /api/v1/auth/login-field` | Done | `{ employeeId, pin }` | `ApiResponse<{ accessToken, refreshToken, expiresAtUtc, currentUser }>` | `employeeId -> employeeId`, `pin -> pin` |
| OTP Verification | `POST /api/v1/auth/verify-otp` | Done | `{ email, otp }` | `ApiResponse<{ accessToken, refreshToken, expiresAtUtc, currentUser }>` | `otp -> otp` |
| Forgot Password | `POST /api/v1/auth/forgot-password` | Done | `{ email }` | `ApiResponse<{ success, message }>` | `email -> email` |
| Reset Password | `POST /api/v1/auth/reset-password` | Done | `{ token, password }` | `ApiResponse<{ success, message }>` | `token -> token`, `password -> password` |
| My Profile | `GET /api/v1/auth/me` | Done | `void` | `ApiResponse<CurrentUserResponse>` | `fullName -> name`, `roles[0] -> role`, `permissions -> permissions[]` |
| Token Refresh | `POST /api/v1/auth/refresh-token` | Done | `{ accessToken, refreshToken }` | `ApiResponse<{ accessToken, refreshToken, expiresAtUtc, currentUser }>` | Axios 401 interceptor retries once per request, max 3 refresh attempts total |
| Logout | `POST /api/v1/auth/logout` | Done | `{ refreshToken }` | `ApiResponse<{ success, message }>` | Sign-out clears local auth + permission cache |
| Permission Snapshot | `GET /api/v1/auth/me/permissions` | Done | `void` | `ApiResponse<{ modules, dataScope, permissions[] }>` | `modules` -> client RBAC matrix, `permissions[]` retained for compatibility |
| Force Logout | `POST /api/v1/auth/force-logout/{userId}` | Done | `void` | `ApiResponse<{ success, message }>` | Super Admin only |
| Forgot PIN | N/A | Done | N/A | N/A | Info Screen / Help Desk |
| Session Expired | N/A | Done | N/A | N/A | UI State |

Batch 1 verification note:
- 2026-04-19: Phase 1 was re-verified end to end against the live ASP.NET Core auth stack and the actual Vite/React admin-mobile client. Fixed the backend `login-field` contract so technician/helper employee codes resolve to real users, aligned `tblOtpVerification` access to the current schema by removing the stale `BranchId` mapping, constrained password-reset tokens to the live 16-character OTP column, changed the staff login field to accept username or email, aligned post-login routing to `/admin/dashboard`, `/technician/home`, `/operations/dashboard`, `/support/dashboard`, `/finance/dashboard`, and `/marketing/dashboard`, and added `e2e/tests/auth.spec.js` to cover login, field login, OTP verify/login, refresh, logout, force logout, forgot password, and reset password. The phase-1 auth suite now passes in full.

## Batch 2: System & Governance
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| RBAC Provider Bootstrap | `GET /api/v1/auth/me/permissions` | Done | `void` | `ApiResponse<{ modules, dataScope, permissions[] }>` | Backend module/action matrix -> `PermissionSet` cache in local storage |
| Role List | `GET /api/v1/roles` | Done | `{ pageNumber, pageSize }` | `ApiResponse<PagedResult<RoleResponse>>` | `displayName -> name`, `permissions[] -> permission matrix` |
| Role Permission Snapshot | `GET /api/v1/roles/{id}/permissions` | Done | `void` | `ApiResponse<{ roleId, permissionIds[], modules, dataScope, permissions[], roleName, displayName }>` | Role editor loads live permission matrix |
| Role Permission Update | `PUT /api/v1/roles/{id}/permissions` | Done | `{ permissionIds[] }` | `ApiResponse<RoleResponse>` | Permission matrix save maps selected UI actions back to backend permission ids |
| View As Role | `POST /api/v1/admin/view-as-role` | Done | `{ roleId }` | `ApiResponse<{ roleId, roleName, displayName, modules, dataScope, permissions[], issuedAtUtc }>` | Super Admin gets scoped UI permission snapshot, header `X-Coolzo-View-As-Role` sent while active |
| Dynamic Navigation Shell | `GET /api/v1/auth/me/permissions` | Done | `void` | Cached client snapshot | Navigation tabs are filtered at runtime via `canView(module)` |
| System Health | `GET /system/health` | Done | `void` | `SystemHealth` | `status -> status`, `uptime -> uptime`, `version -> version`, `apiLatency -> latency` |
| Health Refresh | `GET /system/health` | Done | `void` | `SystemHealth` | Triggered by Refresh button |
| App Permissions | `GET /system/permissions` | Done | `void` | `DevicePermission[]` | `id -> id`, `status -> status` |
| Sync Queue | `GET /system/offline-queue` | Done | `void` | `OfflineSubmission[]` | `type -> type`, `status -> status` |
| Sync Item | `POST /system/sync/{id}` | Done | `void` | `void` | Individual retry button |
| Delete Sync Item | `DELETE /system/sync/{id}` | Done | `void` | `void` | Cleanup simulation |
| Audit Logs | `GET /api/v1/governance/audit-logs` | Done | `filters` | `AuditLog[]` | `action -> action`, `timestamp -> timestamp` |
| Audit Export | N/A | Done | `void` | `CSV File` | Simulation triggered via button |
| CMS Control | `GET /api/v1/governance/cms/content` | Done | `type?` | `CMSContent[]` | `title -> title`, `type -> type` |
| CMS Delete | `DELETE /api/v1/governance/cms/{id}` | Done | `void` | `void` | Inline trash button |

Batch 2 verification note:
- 2026-04-19: Phase 2 RBAC/navigation was re-verified end to end against the live ASP.NET Core API and actual Vite/React admin-mobile client. Added backend module/action permission matrices to `/auth/me/permissions` and `/roles/{id}/permissions` while preserving raw `permissions[]`, fixed role permission replacement to avoid duplicate role-permission key failures, added `POST /api/v1/admin/view-as-role` with audit logging, wired client RBAC cache/foreground refresh/navigation filtering to the live `modules` contract, added Super Admin view-as-role UI with an orange persistent banner and `X-Coolzo-View-As-Role` request header, redirected denied routes to `/unauthorized`, and added `e2e/tests/rbac.spec.js`. Verification passed: `dotnet build`, `npm run build`, `npm run test:rbac` (5/5), and `npm run test:auth` (8/8).

## Batch 3: Admin - User & Role Management
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| User Management | `GET /admin/users` | Done | `filters` | `User[]` | `id -> id`, `name -> name`, `email -> email`, `role -> role`, `status -> status` |
| User Detail | `GET /admin/users/{id}` | Done | `void` | `User` | `id -> id`, `email -> email`, `phone -> phone`, `branchId -> branchId`, `employeeId -> employeeId` |
| Create User | `POST /admin/users` | Done | `Partial<User>` | `User` | `name -> name`, `email -> email`, `role -> role`, `branchId -> branchId` |
| Update User | `PATCH /admin/users/{id}` | Done | `Partial<User>` | `User` | Profile Edit Flow |
| Deactivate User | `POST /admin/users/{id}/deactivate` | Done | `{reason}` | `void` | Inline security action |
| Reset Creds | `POST /admin/users/{id}/reset-password` | Done | `void` | `void` | Confirmation flow |
| Role Management | `GET /admin/roles` | Done | `void` | `Role[]` | `id -> id`, `name -> name`, `userCount -> userCount`, `description -> description` |
| Role Permission Editor | `PATCH /admin/roles/{id}` | Done | `Partial<Role>` | `Role` | `permissions -> permissions`, `name -> name` |

## Batch 4: Admin - Organizational Structure
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Branch List | `GET /admin/branches` | Done | `void` | `Branch[]` | `id -> id`, `name -> name`, `city -> city`, `managerId -> managerId`, `technicianCount -> technicianCount` |
| Branch Detail | `GET /admin/branches/{id}` | Done | `id` | `Branch` | `managerId -> manager`, `address -> address` |
| Create Branch | `POST /admin/branches` | Done | `Partial<Branch>` | `Branch` | New registration flow |
| Update Branch | `PATCH /admin/branches/{id}` | Done | `Partial<Branch>` | `Branch` | Operational config edit |
| Zone Mapping | N/A (Mocked) | Done | `void` | `Zone[]` | Internal region/pincode mapping |
| Service Catalog | `GET /admin/service-types` | Done | `void` | `ServiceType[]` | `id -> id`, `name -> name`, `category -> category`, `basePrice -> basePrice`, `status -> status` |
| Pricing Config | `GET /admin/pricing-rules` | Done | `void` | `PricingRule[]` | `id -> id`, `serviceTypeId -> serviceTypeId`, `equipmentType -> equipmentType`, `price -> price` |
| Tax Config | `GET /admin/tax-configs` | Done | `void` | `TaxConfig[]` | `id -> id`, `category -> category`, `rate -> rate`, `hsnCode -> hsnCode` |
| Workflow Config | N/A | Static | N/A | N/A | Static UI / Hardcoded SLA Rules |

## Batch 5: CRM - Customer Management
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Customer List | `GET /api/v1/customers` | Done | `filters` | `Customer[]` | `id -> id`, `name -> name`, `phone -> phone`, `type -> type`, `amcStatus -> amcStatus` |
| Customer Profile | `GET /api/v1/customers/{id}` | Done | `void` | `Customer` | `id -> id`, `addresses -> addresses`, `equipment -> equipment`, `notes -> notes` |
| Create Customer | `POST /api/v1/customers` | Done | `Partial<Customer>` | `Customer` | `name -> name`, `phone -> phone`, `email -> email`, `type -> type` |
| Update Customer | `PATCH /api/v1/customers/{id}` | Done | `Partial<Customer>` | `Customer` | Profile edit flow |
| Customer Notes | `POST /api/v1/customers/{id}/notes` | Done | `{ content }` | `void` | Internal history updates |
| Customer Equipment | `POST /api/v1/customers/{id}/equipment` | Done | `Partial<CustomerEquipment>` | `void` | `brand -> brand`, `model -> model`, `type -> type`, `locationLabel -> locationLabel` |
| Customer Addresses | `POST /api/v1/customers/{id}/addresses` | Done | `Partial<CustomerAddress>` | `void` | `label -> label`, `addressLine -> addressLine`, `city -> city`, `pinCode -> pinCode` |

## Batch 6: Operations - Service Requests
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| SR List | `GET /api/v1/service-requests` | Done | `filters` | `ServiceRequest[]` | `id -> id`, `srNumber -> srNumber`, `status -> status`, `priority -> priority`, `customer.name -> customerName` |
| SR Detail | `GET /api/v1/service-requests/{id}` | Done | `void` | `ServiceRequest` | `id -> id`, `status -> status`, `equipment -> equipment`, `location -> location`, `timeline -> timeline` |
| Create SR | `POST /api/v1/service-requests` | Done | `Partial<ServiceRequest>` | `ServiceRequest` | `customerId -> customer.id`, `serviceType -> serviceType`, `requestedDate -> requestedDate` |
| SR Triage | `PATCH /api/v1/service-requests/{id}` | Done | `Partial<ServiceRequest>` | `ServiceRequest` | `priority -> priority`, `status -> status`, `internalNotes -> internalNotes` |
| SR Timeline | `GET /api/v1/service-requests/{id}` | Done | `void` | `ServiceRequest` | `timeline -> timeline`, `timeline[].status -> status`, `timeline[].timestamp -> timestamp` |

## Batch 7: Operations - Dashboards & Map
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Operations Dashboard | `GET /api/v1/ops/stats` | Done | `void` | `OpsStats` | `total -> total`, `pending -> pending`, `slaCompliance -> slaCompliance`, `avgResponseTime -> avgResponseTime` |
| Dispatch Management | `GET /api/v1/service-requests` | Done | `filters` | `ServiceRequest[]` | `id -> id`, `status -> status`, `priority -> priority`, `customer.name -> customerName` |
| Live Job Map | `GET /api/v1/technicians/availability` | Done | `void` | `Technician[]` | `id -> id`, `name -> name`, `status -> status`, `currentJobId -> currentJobId` |
| SLA Alerts List | `GET /api/v1/ops/sla-alerts` | Done | `void` | `ServiceRequest[]` | `id -> id`, `srNumber -> srNumber`, `priority -> priority`, `escalationReason -> escalationReason` |
| Revenue Dashboard | `GET /api/v1/dashboard/stats` | Done | `void` | `DashboardStats` | `totalRevenue -> totalRevenue`, `revenueTrend -> revenueTrend`, `customerSatisfaction -> satisfaction` |

## Batch 8: Operations - Scheduling
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Scheduling Board | `GET /api/v1/technicians/availability` | Done | `void` | `Technician[]` | `id -> id`, `name -> name`, `status -> status`, `nextFreeSlot -> nextFreeSlot` |
| Shift Scheduler | `PATCH /api/v1/technicians/{id}` | Done | `Partial<Technician>` | `Technician` | `shifts -> shifts`, `status -> status` |
| AMC Auto-Schedule | `GET /api/v1/service-requests` | Done | `filters` | `ServiceRequest[]` | `id -> id`, `serviceType -> serviceType`, `customer.name -> customerName` |
| Technician List | `GET /api/v1/technicians` | Done | `filters` | `Technician[]` | `id -> id`, `name -> name`, `employeeId -> employeeId`, `designation -> designation` |
| Technician Detail | `GET /api/v1/technicians/{id}` | Done | `void` | `Technician` | `id -> id`, `performance -> performance`, `attendance -> attendance` |

## Batch 9: Field Technician Workflow
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Tech Home | `GET /api/v1/technicians/{id}` | Done | `void` | `Technician` | `performance -> performance`, `todayJobCount -> todayJobCount`, `status -> status` |
| My Jobs List | `GET /api/v1/tech/jobs` | Done | `technicianId` | `ServiceRequest[]` | `id -> id`, `srNumber -> srNumber`, `status -> status`, `customer.name -> customerName`, `location.address -> address` |
| Job Workflow | `PATCH /api/v1/tech/jobs/{id}/status` | Done | `{ status, location }` | `void` | `status -> status`, `location.lat -> lat`, `location.lng -> lng` |
| Service Report | `POST /api/v1/tech/jobs/{id}/report` | Done | `reportData` | `void` | `checklist -> checklist`, `actionTaken -> actionTaken`, `recommendations -> recommendations`, `photos -> photos` |
| Digital Signature | `POST /api/v1/tech/jobs/{id}/sign` | Done | `signatureData` | `void` | `customerName -> customerName`, `signatureUrl -> signatureUrl` |
| Attendance Tracking | `GET /api/v1/technicians/{id}` | Done | `void` | `Technician` | `attendance -> logs`, `checkIn -> time` |

## Batch 10: AMC & Equipment
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AMC Dashboard | `GET /api/v1/amc/stats` | Done | `void` | `AMCDashboardStats` | `activeContracts -> activeContracts`, `renewalRate -> renewalRate`, `revenue -> revenue`, `visitCompletionRate -> completionRate` |
| AMC Contract List | `GET /api/v1/amc/contracts` | Done | `filters` | `AMCContract[]` | `id -> id`, `contractNumber -> contractNumber`, `status -> status`, `planType -> planType`, `customerName -> customerName` |
| AMC Contract Detail | `GET /api/v1/amc/contracts/{id}` | Done | `void` | `AMCContract` | `id -> id`, `visits -> visits`, `startDate -> startDate`, `endDate -> endDate`, `fee -> fee` |
| AMC Enrollment | `POST /api/v1/amc/contracts` | Done | `Partial<AMCContract>` | `AMCContract` | `customerId -> customerId`, `planType -> planType`, `equipmentIds -> equipmentIds` |
| AMC Visit Management | `GET /api/v1/amc/visits` | Done | `filters` | `AMCVisit[]` | `id -> id`, `visitNumber -> visitNumber`, `status -> status`, `scheduledDate -> scheduledDate`, `assignedTechnicianName -> techName` |

## Batch 11: Equipment & Warranty
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Equipment Register | `GET /api/v1/equipment` | Done | `filters` | `Equipment[]` | `id -> id`, `equipmentId -> equipmentId`, `brand -> brand`, `model -> model`, `isUnderAMC -> isUnderAMC` |
| Add Equipment | `POST /api/v1/equipment` | Done | `Partial<Equipment>` | `Equipment` | Brand, Model, Serial, Customer mapping |
| Update Equipment | `PATCH /api/v1/equipment/{id}` | Done | `Partial<Equipment>` | `Equipment` | Manual record correction |
| Equipment Detail | `GET /api/v1/equipment/{id}` | Done | `void` | `Equipment` | `id -> id`, `serialNumber -> serialNumber`, `capacity -> capacity`, `locationLabel -> locationLabel`, `serviceHistory -> history` |
| Warranty Management | `GET /api/v1/equipment/warranty-records` | Done | `filters` | `WarrantyRecord[]` | `id -> id`, `partName -> partName`, `expiryDate -> expiryDate`, `equipmentDisplayId -> equipmentId` |
| AMC Renewal Queue | `GET /api/v1/amc/renewal-queue` | Done | `void` | `AMCContract[]` | `id -> id`, `contractNumber -> contractNumber`, `endDate -> endDate`, `customerName -> customerName`, `status -> status` |

## Batch 12: Estimates & Work Orders
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Estimate List | `GET /api/v1/estimates` | Done | `filters` | `Estimate[]` | `id -> id`, `estimateNumber -> estimateNumber`, `customerName -> customerName`, `total -> total`, `status -> status` |
| Estimate Detail | `GET /api/v1/estimates/{id}` | Done | `void` | `Estimate` | `id -> id`, `lineItems -> lineItems`, `subtotal -> subtotal`, `tax -> tax`, `total -> total` |
| Work Order List | `GET /api/v1/work-orders` | Done | `filters` | `WorkOrder[]` | `id -> id`, `woNumber -> woNumber`, `customerName -> customerName`, `status -> status` |
| Work Order Detail | `GET /api/v1/work-orders/{id}` | Done | `void` | `WorkOrder` | `id -> id`, `totalValue -> totalValue`, `partsIssuedStatus -> partsStatus`, `completedAt -> completedAt` |
| Create Work Order | `POST /api/v1/work-orders/from-estimate/{id}` | Done | `void` | `WorkOrder` | `estimateId -> estimateId`, `woNumber -> woNumber` |

## Batch 13: Job Reports & Quality
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Job Report List | `GET /api/v1/reports/jobs` | Done | `filters` | `JobReport[]` | `id -> id`, `srNumber -> srNumber`, `technicianName -> techName`, `qualityScore -> score`, `status -> status` |
| Job Report Detail | `GET /api/v1/reports/jobs/{id}` | Done | `void` | `JobReport` | `id -> id`, `checklist -> checklist`, `observations -> observations`, `photos -> photos`, `qualityScore -> qualityScore` |
| Quality Dashboard | `GET /api/v1/reports/quality-metrics` | Done | `void` | `any` | `avgChecklistCompletion -> avgCompletion`, `flaggedRate -> flaggedRate`, `technicianPerformance -> techPerformance` |
| Report Review | `POST /api/v1/reports/jobs/{id}/review` | Done | `{ status, notes }` | `void` | `status -> status`, `notes -> notes` |
| Report Submission | `POST /api/v1/tech/jobs/{id}/report` | Done | `reportData` | `void` | `checklist -> checklist`, `photos -> photos`, `observations -> observations` |

## Batch 14: Inventory & Warehouse
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Inventory Dashboard | `GET /api/v1/inventory/stats` | Done | `void` | `any` | `totalSKUs -> SKUs`, `lowStockCount -> lowStock`, `totalStockValue -> stockValue`, `pendingRequests -> pendingReqs` |
| Parts Catalog | `GET /api/v1/inventory/parts` | Done | `filters` | `Part[]` | `id -> id`, `partCode -> partCode`, `name -> name`, `stockQuantity -> stock`, `status -> status` |
| Part Detail | `GET /api/v1/inventory/parts/{id}` | Done | `void` | `Part` | `id -> id`, `description -> desc`, `unitCost -> cost`, `minReorderLevel -> reorderLevel`, `location -> bin` |
| Parts Requests | `GET /api/v1/inventory/requests` | Done | `filters` | `PartsRequest[]` | `id -> id`, `srNumber -> srNumber`, `technicianName -> techName`, `urgency -> urgency`, `status -> status` |
| Request Detail | `GET /api/v1/inventory/requests/{id}` | Done | `void` | `PartsRequest` | `id -> id`, `items -> items`, `items[].partName -> partName`, `items[].requestedQty -> qty` |

## Batch 15: Warehouse & Stock
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Stock Ledger | `GET /api/v1/inventory/movements` | Done | `filters` | `StockMovement[]` | `id -> id`, `partName -> partName`, `type -> type`, `quantity -> qty`, `balanceAfter -> balance`, `timestamp -> time` |
| Purchase Orders | `GET /api/v1/inventory/purchase-orders` | Done | `filters` | `PurchaseOrder[]` | `id -> id`, `poNumber -> poNumber`, `supplierName -> supplier`, `total -> total`, `status -> status` |
| PO Detail | `GET /api/v1/inventory/purchase-orders/{id}` | Done | `void` | `PurchaseOrder` | `id -> id`, `items -> items`, `subtotal -> subtotal`, `tax -> tax`, `total -> total`, `expectedDeliveryDate -> eta` |
| Supplier List | `GET /api/v1/inventory/suppliers` | Done | `void` | `Supplier[]` | `id -> id`, `name -> name`, `contactPerson -> contact`, `phone -> phone`, `leadTimeDays -> leadTime` |
| Create Purchase Order | `POST /api/v1/inventory/purchase-orders` | Done | `Partial<PurchaseOrder>` | `PurchaseOrder` | `supplierId -> supplierId`, `items -> items`, `total -> total` |

## Batch 16: Billing & Invoices
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Invoice List | `GET /api/v1/billing/invoices` | Done | `filters` | `Invoice[]` | `id -> id`, `invoiceNumber -> invoiceNumber`, `customerName -> customer`, `netPayable -> total`, `status -> status` |
| Invoice Detail | `GET /api/v1/billing/invoices/{id}` | Done | `void` | `Invoice` | `id -> id`, `items -> items`, `subtotal -> subtotal`, `taxTotal -> tax`, `netPayable -> net`, `amountPaid -> paid`, `balanceDue -> balance` |
| AR Dashboard | `GET /api/v1/billing/ar-aging` | Done | `void` | `ARAgingBucket[]` | `label -> bucket`, `amount -> amount`, `count -> count` |
| Create Invoice | `POST /api/v1/billing/invoices` | Done | `Partial<Invoice>` | `Invoice` | `srId -> srId`, `items -> items`, `netPayable -> total` |
| Record Payment | `POST /api/v1/billing/invoices/{id}/payments` | Done | `Partial<PaymentRecord>` | `Invoice` | `amount -> amount`, `method -> method`, `reference -> ref`, `date -> date` |

## Batch 17: Finance & Payments
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Finance Dashboard | `GET /api/v1/finance/stats/kpis` | Done | `void` | `FinancialKPIs` | `revenueToday -> revToday`, `collectionRate -> collectionRate`, `outstandingReceivables -> outstanding`, `avgDaysToCollect -> dso` |
| Payment List | `GET /api/v1/finance/payments` | Done | `filters` | `Payment[]` | `id -> id`, `paymentId -> ref`, `invoiceNumber -> invNum`, `amount -> amount`, `method -> method`, `status -> status` |
| Tax Report | `GET /api/v1/finance/stats/tax-summary` | Done | `period` | `any` | `totalGst -> gst`, `hsnBreakdown -> hsnData` |
| Revenue Analytics | `GET /api/v1/finance/stats/revenue-trend` | Done | `period` | `RevenueDataPoint[]` | `period -> x`, `amount -> y`, `target -> target` |
| Payment Verification | `POST /api/v1/finance/payments/{id}/verify` | Done | `{ verifierId }` | `Payment` | `status -> status`, `verifiedBy -> verifiedBy`, `verificationDate -> date` |

## Batch 18: Support & Feedback
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Support Dashboard | `GET /api/v1/analytics/support` | Done | `dateFrom?, dateTo?, trendBy?, status?` | `ApiResponse<SupportAnalyticsResponse>` | `openTickets -> openTickets`, `averageResolutionHours -> avgResolutionTime`, `escalationCount -> escalatedCount` |
| Support Ticket Queue | `GET /api/v1/support-tickets` | Done | `ticketNumber?, customerMobile?, categoryId?, priorityId?, status?, pageNumber, pageSize` | `ApiResponse<PagedResult<SupportTicketListItemResponse>>` | `supportTicketId -> id`, `ticketNumber -> ticketNumber`, `categoryName -> category`, `priorityName -> priority`, `status -> status` |
| Create Ticket | `POST /api/v1/support-tickets` | Done | `{ customerId, subject, categoryId, priorityId, description, links: [] }` | `ApiResponse<SupportTicketDetailResponse>` | `supportTicketId -> id`, `subject -> subject`, `description -> opening message` |
| Ticket Detail | `GET /api/v1/support-tickets/{id}` | Done | `supportTicketId` | `ApiResponse<SupportTicketDetailResponse>` | `replies -> messages`, `assignedOwnerName -> assignedAgentName`, `links.ServiceRequest -> linkedSrNumber` |
| Ticket Reply | `POST /api/v1/support-tickets/{id}/replies` | Done | `{ replyText, isInternalOnly }` | `ApiResponse<SupportTicketReplyResponse>` | `replyText -> text`, `isInternalOnly -> isInternal` |
| Ticket Status | `POST /api/v1/support-tickets/{id}/change-status` | Done | `{ status, remarks }` | `ApiResponse<SupportTicketDetailResponse>` | `open/in_progress/resolved/closed -> Open/InProgress/Resolved/Closed` |
| Feedback List | `GET /api/v1/customer-reviews` | Done | `serviceId?` | `ApiResponse<CustomerReviewResponse[]>` | `customerReviewId -> id`, `userName -> customerName`, `comment -> reviewText`, `rating -> rating` |
| Feedback Detail | `GET /api/v1/customer-reviews` | Done | `serviceId?` | `ApiResponse<CustomerReviewResponse[]>` | Client filters by `customerReviewId`; admin response remains unsupported by current backend schema |

## Batch 19: Governance & CMS
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Notifications Template | `GET /api/v1/governance/notifications/templates` | Done | `void` | `NotificationTemplate[]` | `id -> id`, `triggerEvent -> trigger`, `body -> body`, `isEnabled -> isActive` |
| CMS Manager | `GET /api/v1/governance/cms/content` | Done | `type?` | `CMSContent[]` | `id -> id`, `type -> type`, `title -> title`, `status -> status` |
| Audit Logs | `GET /api/v1/governance/audit-logs` | Done | `filters` | `AuditLog[]` | `id -> id`, `action -> action`, `userName -> user`, `entityType -> entity`, `timestamp -> time` |
| Coupon Manager | `GET /api/v1/governance/coupons` | Done | `void` | `Coupon[]` | `id -> id`, `code -> code`, `discountType -> type`, `value -> value`, `status -> status` |
| Quality Hub Stats | `GET /api/v1/reports/quality-metrics` | Done | `void` | `any` | `avgChecklistCompletion -> completion`, `flaggedRate -> flags` |

## Batch 20: System & Polish
| Screen Name | API Endpoint | Status | Request Structure | Response Structure | Fields Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| System Health | `GET /system/health` | Done | `void` | `SystemHealth` | `status -> overallStatus`, `uptime -> uptime`, `apiLatency -> latency`, `version -> version` |
| Permissions Management | `GET /system/permissions` | Done | `void` | `DevicePermission[]` | `id -> id`, `name -> name`, `status -> currentStatus`, `isRequired -> mandatory` |
| Offline Sync Queue | `GET /system/offline-queue` | Done | `void` | `OfflineSubmission[]` | `id -> id`, `type -> type`, `status -> syncStatus`, `timestamp -> created` |
| Versioning Info | `GET /system/health` | Done | `void` | `SystemHealth` | `version -> appVersion`, `minSupportedVersion -> minVersion` |
| Latency Monitoring | `GET /system/health` | Done | `void` | `SystemHealth` | `apiLatency -> latencyValue`, `errorRate -> errorRate` |
| Not Found Screen | N/A | Done | N/A | N/A | 404 Catch-all |
| Error Boundary | N/A | Done | N/A | N/A | Global Exception Handler |
