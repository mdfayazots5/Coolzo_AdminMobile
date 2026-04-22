import { isDemoMode } from "../config/api-config";
import { apiClient } from "./api-client";

export type CustomerType = "residential" | "commercial" | "enterprise";
export type RiskLevel = "low" | "medium" | "high";

export interface CustomerAddress {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  state?: string;
  pinCode: string;
  zoneId: string;
  isDefault: boolean;
  isArchived?: boolean;
}

export interface CustomerEquipment {
  id: string;
  brand: string;
  model: string;
  type: string;
  tonnage: string;
  serialNumber?: string;
  installationYear?: number;
  locationLabel: string;
  lastServiceDate?: string;
}

export interface CustomerNote {
  id: string;
  author: string;
  timestamp: string;
  content: string;
  isPrivate?: boolean;
  noteType?: string;
}

export interface CustomerServiceHistoryItem {
  id: string;
  historyType: string;
  referenceNumber: string;
  title: string;
  status: string;
  eventDate: string;
  detail: string;
  amount?: number;
}

export interface CustomerInvoiceSummaryItem {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: number;
  balanceAmount: number;
  issueDate: string;
}

export interface CustomerSupportTicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  assignedOwnerName?: string;
}

export interface CustomerCommunicationPreference {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsAppEnabled: boolean;
  pushEnabled: boolean;
  allowPromotionalContent: boolean;
  emailAddress: string;
  mobileNumber: string;
  lastUpdated?: string;
}

export interface CustomerAmcSummary {
  activeContractsCount: number;
  currentPlanName?: string;
  currentStatus?: string;
  visitsIncluded?: number;
  visitsUsed?: number;
  nextVisitDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: CustomerType;
  gender?: "male" | "female" | "other";
  dob?: string;
  customerSince: string;
  amcStatus: "active" | "inactive" | "none";
  riskLevel: RiskLevel;
  totalServices: number;
  totalRevenue: number;
  outstandingAmount: number;
  accountManagerId?: string;
  accountManagerName?: string;
  addresses: CustomerAddress[];
  equipment: CustomerEquipment[];
  notes: CustomerNote[];
  serviceHistory: CustomerServiceHistoryItem[];
  invoices: CustomerInvoiceSummaryItem[];
  supportTickets: CustomerSupportTicketItem[];
  communicationPreference?: CustomerCommunicationPreference;
  amcSummary?: CustomerAmcSummary;
  openSupportTicketCount?: number;
  totalSupportTicketCount?: number;
  lastInvoiceDate?: string;
  lastInvoiceStatus?: string;
  primaryAddressSummary?: string;
}

export interface CorporateAccount {
  id: string;
  companyName: string;
  industry: string;
  primaryContactId: string;
  authorizedRequesters: string[];
  billingFrequency: "per-job" | "monthly" | "quarterly";
  paymentTerms: number;
  approvalThreshold: number;
  slaOverrideHours?: number;
}

export interface CustomerRepository {
  getCustomers(filters: any): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  createCustomer(data: Partial<Customer>): Promise<Customer>;
  updateCustomer(id: string, data: Partial<Customer>): Promise<Customer>;
  addAddress(customerId: string, address: Partial<CustomerAddress>): Promise<void>;
  addEquipment(customerId: string, equipment: Partial<CustomerEquipment>): Promise<void>;
  addNote(customerId: string, content: string): Promise<CustomerNote>;
}

interface BackendCustomerListItem {
  customerId: number;
  customerName: string;
  mobileNumber: string;
  emailAddress: string;
  isActive: boolean;
  riskLevel: RiskLevel;
  totalServicesCount: number;
  totalRevenueAmount: number;
  outstandingAmount: number;
  hasActiveAmc: boolean;
  openSupportTicketCount: number;
  customerSinceUtc: string;
  lastServiceDateUtc?: string | null;
  primaryAddressSummary?: string | null;
}

interface BackendCustomerNote {
  noteId: string;
  author: string;
  content: string;
  timestampUtc: string;
  isPrivate: boolean;
  noteType: string;
}

interface BackendCustomerAddress {
  customerAddressId: number;
  customerId: number;
  addressLabel: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  cityName: string;
  stateName: string;
  pincode: string;
  addressType: string;
  zoneId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  isActive: boolean;
}

interface BackendCustomerEquipment {
  customerEquipmentId: number;
  customerId: number;
  name: string;
  type: string;
  brand: string;
  capacity: string;
  location: string;
  purchaseDate?: string | null;
  lastServiceDate?: string | null;
  serialNumber: string;
  isActive: boolean;
}

interface BackendCustomerDetail {
  customerId: number;
  customerName: string;
  mobileNumber: string;
  emailAddress: string;
  isActive: boolean;
  riskLevel: RiskLevel;
  totalServicesCount: number;
  totalRevenueAmount: number;
  outstandingAmount: number;
  hasActiveAmc: boolean;
  openSupportTicketCount: number;
  totalSupportTicketCount: number;
  customerSinceUtc: string;
  lastServiceDateUtc?: string | null;
  lastInvoiceDateUtc?: string | null;
  lastInvoiceStatus?: string | null;
  primaryAddressSummary?: string | null;
  activeAmcCount: number;
  activeAmcPlanName?: string | null;
  activeAmcStatus?: string | null;
  visitsIncluded?: number | null;
  visitsUsed?: number | null;
  nextAmcVisitDate?: string | null;
  addresses: BackendCustomerAddress[];
  equipment: BackendCustomerEquipment[];
  notes: BackendCustomerNote[];
}

interface BackendServiceHistoryItem {
  historyType: string;
  referenceNumber: string;
  title: string;
  status: string;
  eventDateUtc: string;
  detail: string;
  amount?: number | null;
  bookingId?: number | null;
  serviceRequestId?: number | null;
  jobCardId?: number | null;
  invoiceId?: number | null;
  customerAmcId?: number | null;
  revisitRequestId?: number | null;
}

interface BackendCustomerAmc {
  customerAmcId: number;
  customerId: number;
  customerName: string;
  amcPlanId: number;
  planName: string;
  currentStatus: string;
  startDateUtc: string;
  endDateUtc: string;
  totalVisitCount: number;
  consumedVisitCount: number;
  priceAmount: number;
  visits: Array<{
    amcVisitScheduleId: number;
    visitNumber: number;
    scheduledDate: string;
    currentStatus: string;
  }>;
}

interface BackendCommunicationPreference {
  communicationPreferenceId: number;
  customerId: number;
  emailAddress: string;
  mobileNumber: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsAppEnabled: boolean;
  pushEnabled: boolean;
  allowPromotionalContent: boolean;
  lastUpdated?: string | null;
}

interface BackendSupportTicketListItem {
  supportTicketId: number;
  ticketNumber: string;
  subject: string;
  categoryName: string;
  priorityName: string;
  status: string;
  assignedOwnerName?: string | null;
  dateCreated: string;
}

interface BackendInvoiceListItem {
  invoiceId: number;
  invoiceNumber: string;
  customerName: string;
  currentStatus: string;
  grandTotalAmount: number;
  balanceAmount: number;
  invoiceDateUtc: string;
}

const toCustomerType = (): CustomerType => "residential";

const toCustomerAddress = (address: BackendCustomerAddress): CustomerAddress => ({
  id: String(address.customerAddressId),
  label: address.addressLabel,
  addressLine: [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
  ].filter(Boolean).join(", "),
  city: address.cityName,
  state: address.stateName || undefined,
  pinCode: address.pincode,
  zoneId: address.zoneId ? String(address.zoneId) : "unassigned",
  isDefault: address.isDefault,
  isArchived: !address.isActive,
});

const toCustomerEquipment = (equipment: BackendCustomerEquipment): CustomerEquipment => ({
  id: String(equipment.customerEquipmentId),
  brand: equipment.brand,
  model: equipment.name,
  type: equipment.type,
  tonnage: equipment.capacity,
  serialNumber: equipment.serialNumber || undefined,
  locationLabel: equipment.location,
  lastServiceDate: equipment.lastServiceDate || undefined,
});

const toCustomerNote = (note: BackendCustomerNote): CustomerNote => ({
  id: note.noteId,
  author: note.author,
  timestamp: note.timestampUtc,
  content: note.content,
  isPrivate: note.isPrivate,
  noteType: note.noteType,
});

const toCustomerServiceHistoryItem = (item: BackendServiceHistoryItem): CustomerServiceHistoryItem => ({
  id: [
    item.historyType,
    item.referenceNumber,
    item.bookingId ?? "",
    item.serviceRequestId ?? "",
    item.invoiceId ?? "",
  ].join(":"),
  historyType: item.historyType,
  referenceNumber: item.referenceNumber,
  title: item.title,
  status: item.status,
  eventDate: item.eventDateUtc,
  detail: item.detail,
  amount: item.amount ?? undefined,
});

const toCustomerSupportTicket = (ticket: BackendSupportTicketListItem): CustomerSupportTicketItem => ({
  id: String(ticket.supportTicketId),
  ticketNumber: ticket.ticketNumber,
  subject: ticket.subject,
  status: ticket.status,
  priority: ticket.priorityName,
  createdAt: ticket.dateCreated,
  assignedOwnerName: ticket.assignedOwnerName ?? undefined,
});

const toCustomerInvoice = (invoice: BackendInvoiceListItem): CustomerInvoiceSummaryItem => ({
  id: String(invoice.invoiceId),
  invoiceNumber: invoice.invoiceNumber,
  status: invoice.currentStatus,
  amount: invoice.grandTotalAmount,
  balanceAmount: invoice.balanceAmount,
  issueDate: invoice.invoiceDateUtc,
});

const toCommunicationPreference = (
  preference: BackendCommunicationPreference | null,
  customer: Pick<Customer, "email" | "phone">
): CustomerCommunicationPreference => ({
  emailEnabled: preference?.emailEnabled ?? true,
  smsEnabled: preference?.smsEnabled ?? Boolean(customer.phone),
  whatsAppEnabled: preference?.whatsAppEnabled ?? Boolean(customer.phone),
  pushEnabled: preference?.pushEnabled ?? false,
  allowPromotionalContent: preference?.allowPromotionalContent ?? false,
  emailAddress: preference?.emailAddress ?? customer.email,
  mobileNumber: preference?.mobileNumber ?? customer.phone,
  lastUpdated: preference?.lastUpdated ?? undefined,
});

const toAmcSummary = (contracts: BackendCustomerAmc[]): CustomerAmcSummary => {
  const activeContract = contracts.find((contract) => contract.currentStatus.toLowerCase() === "active") ?? contracts[0];

  return {
    activeContractsCount: contracts.filter((contract) => contract.currentStatus.toLowerCase() === "active").length,
    currentPlanName: activeContract?.planName,
    currentStatus: activeContract?.currentStatus,
    visitsIncluded: activeContract?.totalVisitCount,
    visitsUsed: activeContract?.consumedVisitCount,
    nextVisitDate: activeContract?.visits
      ?.filter((visit) => visit.currentStatus.toLowerCase() === "scheduled")
      ?.sort((left, right) => left.scheduledDate.localeCompare(right.scheduledDate))[0]
      ?.scheduledDate,
  };
};

const mapListItemToCustomer = (item: BackendCustomerListItem): Customer => ({
  id: String(item.customerId),
  name: item.customerName,
  phone: item.mobileNumber,
  email: item.emailAddress,
  type: toCustomerType(),
  customerSince: item.customerSinceUtc.slice(0, 10),
  amcStatus: item.hasActiveAmc ? "active" : "none",
  riskLevel: item.riskLevel,
  totalServices: item.totalServicesCount,
  totalRevenue: item.totalRevenueAmount,
  outstandingAmount: item.outstandingAmount,
  addresses: [],
  equipment: [],
  notes: [],
  serviceHistory: [],
  invoices: [],
  supportTickets: [],
  openSupportTicketCount: item.openSupportTicketCount,
  primaryAddressSummary: item.primaryAddressSummary ?? undefined,
});

const hydrateCustomerDetail = (
  detail: BackendCustomerDetail,
  history: BackendServiceHistoryItem[],
  contracts: BackendCustomerAmc[],
  preference: BackendCommunicationPreference | null,
  tickets: BackendSupportTicketListItem[],
  invoices: BackendInvoiceListItem[],
): Customer => {
  const baseCustomer = mapListItemToCustomer({
    customerId: detail.customerId,
    customerName: detail.customerName,
    mobileNumber: detail.mobileNumber,
    emailAddress: detail.emailAddress,
    isActive: detail.isActive,
    riskLevel: detail.riskLevel,
    totalServicesCount: detail.totalServicesCount,
    totalRevenueAmount: detail.totalRevenueAmount,
    outstandingAmount: detail.outstandingAmount,
    hasActiveAmc: detail.hasActiveAmc,
    openSupportTicketCount: detail.openSupportTicketCount,
    customerSinceUtc: detail.customerSinceUtc,
    lastServiceDateUtc: detail.lastServiceDateUtc,
    primaryAddressSummary: detail.primaryAddressSummary,
  });

  return {
    ...baseCustomer,
    addresses: detail.addresses.map(toCustomerAddress),
    equipment: detail.equipment.map(toCustomerEquipment),
    notes: detail.notes.map(toCustomerNote),
    serviceHistory: history.map(toCustomerServiceHistoryItem),
    invoices: invoices.map(toCustomerInvoice),
    supportTickets: tickets.map(toCustomerSupportTicket),
    communicationPreference: toCommunicationPreference(preference, {
      email: baseCustomer.email,
      phone: baseCustomer.phone,
    }),
    amcSummary: toAmcSummary(contracts),
    totalSupportTicketCount: detail.totalSupportTicketCount,
    lastInvoiceDate: detail.lastInvoiceDateUtc ?? undefined,
    lastInvoiceStatus: detail.lastInvoiceStatus ?? undefined,
    primaryAddressSummary: detail.primaryAddressSummary ?? undefined,
  };
};

export class MockCustomerRepository implements CustomerRepository {
  private customers: Customer[] = [
    {
      id: "cust1",
      name: "Anjali Sharma",
      phone: "+91 98765 43210",
      email: "anjali.s@example.com",
      type: "residential",
      customerSince: "2023-05-15",
      amcStatus: "active",
      riskLevel: "low",
      totalServices: 4,
      totalRevenue: 8500,
      outstandingAmount: 0,
      addresses: [
        {
          id: "addr1",
          label: "Home",
          addressLine: "Flat 202, Sunshine Apts, Powai",
          city: "Mumbai",
          pinCode: "400076",
          zoneId: "z3",
          isDefault: true,
        },
      ],
      equipment: [
        {
          id: "eq1",
          brand: "LG",
          model: "Dual Inverter",
          type: "Split AC",
          tonnage: "1.5 Ton",
          locationLabel: "Master Bedroom",
          lastServiceDate: "2024-02-10",
        },
      ],
      notes: [
        {
          id: "n1",
          author: "Priya (CS)",
          timestamp: "2024-01-05T10:00:00Z",
          content: "Prefers morning slots between 10 AM - 12 PM.",
          isPrivate: true,
          noteType: "Internal",
        },
      ],
      serviceHistory: [],
      invoices: [],
      supportTickets: [],
      communicationPreference: {
        emailEnabled: true,
        smsEnabled: false,
        whatsAppEnabled: true,
        pushEnabled: false,
        allowPromotionalContent: false,
        emailAddress: "anjali.s@example.com",
        mobileNumber: "+91 98765 43210",
      },
      amcSummary: {
        activeContractsCount: 1,
        currentPlanName: "Premium AMC",
        currentStatus: "Active",
        visitsIncluded: 4,
        visitsUsed: 2,
        nextVisitDate: "2026-06-15",
      },
    },
    {
      id: "cust2",
      name: "TechSolutions Hub",
      phone: "+91 22 4455 6677",
      email: "admin@techsolutions.com",
      type: "enterprise",
      customerSince: "2022-11-20",
      amcStatus: "none",
      riskLevel: "high",
      totalServices: 12,
      totalRevenue: 45000,
      outstandingAmount: 12500,
      accountManagerName: "Rahul Sharma",
      addresses: [
        {
          id: "addr2",
          label: "Main Office",
          addressLine: "Unit 405, IT Park, Goregaon East",
          city: "Mumbai",
          pinCode: "400063",
          zoneId: "z4",
          isDefault: true,
        },
      ],
      equipment: [
        {
          id: "eq2",
          brand: "Blue Star",
          model: "VRF IV",
          type: "VRF System",
          tonnage: "10 Ton",
          locationLabel: "Server Room",
          lastServiceDate: "2024-03-15",
        },
      ],
      notes: [],
      serviceHistory: [],
      invoices: [],
      supportTickets: [],
    },
  ];

  async getCustomers(_filters: any) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return this.customers;
  }

  async getCustomerById(id: string) {
    return this.customers.find((customer) => customer.id === id) || null;
  }

  async createCustomer(data: Partial<Customer>) {
    const newCustomer: Customer = {
      id: `cust${this.customers.length + 1}`,
      name: data.name ?? "New Customer",
      phone: data.phone ?? "",
      email: data.email ?? "",
      type: data.type ?? "residential",
      customerSince: new Date().toISOString().slice(0, 10),
      amcStatus: "none",
      riskLevel: "low",
      totalServices: 0,
      totalRevenue: 0,
      outstandingAmount: 0,
      addresses: data.addresses ?? [],
      equipment: data.equipment ?? [],
      notes: [],
      serviceHistory: [],
      invoices: [],
      supportTickets: [],
    };

    this.customers.push(newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, data: Partial<Customer>) {
    const index = this.customers.findIndex((customer) => customer.id === id);
    if (index === -1) {
      throw new Error("Customer not found");
    }

    this.customers[index] = {
      ...this.customers[index],
      ...data,
      addresses: data.addresses ?? this.customers[index].addresses,
      equipment: data.equipment ?? this.customers[index].equipment,
      notes: data.notes ?? this.customers[index].notes,
      serviceHistory: data.serviceHistory ?? this.customers[index].serviceHistory,
      invoices: data.invoices ?? this.customers[index].invoices,
      supportTickets: data.supportTickets ?? this.customers[index].supportTickets,
    };

    return this.customers[index];
  }

  async addAddress(customerId: string, address: Partial<CustomerAddress>) {
    const customer = await this.getCustomerById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    customer.addresses.push({
      id: String(Date.now()),
      label: address.label ?? "Primary",
      addressLine: address.addressLine ?? "",
      city: address.city ?? "",
      pinCode: address.pinCode ?? "",
      zoneId: address.zoneId ?? "z1",
      isDefault: Boolean(address.isDefault),
    });
  }

  async addEquipment(customerId: string, equipment: Partial<CustomerEquipment>) {
    const customer = await this.getCustomerById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    customer.equipment.push({
      id: String(Date.now()),
      brand: equipment.brand ?? "",
      model: equipment.model ?? "",
      type: equipment.type ?? "",
      tonnage: equipment.tonnage ?? "",
      serialNumber: equipment.serialNumber,
      installationYear: equipment.installationYear,
      locationLabel: equipment.locationLabel ?? "",
      lastServiceDate: equipment.lastServiceDate,
    });
  }

  async addNote(customerId: string, content: string) {
    const customer = await this.getCustomerById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const note: CustomerNote = {
      id: String(Date.now()),
      author: "Current User",
      timestamp: new Date().toISOString(),
      content,
      isPrivate: true,
      noteType: "Internal",
    };

    customer.notes.unshift(note);
    return note;
  }
}

export class LiveCustomerRepository implements CustomerRepository {
  async getCustomers(filters: any) {
    const response = await apiClient.get<BackendCustomerListItem[]>("/api/v1/customers", {
      params: {
        searchTerm: filters?.searchTerm ?? filters?.search ?? undefined,
        pageNumber: filters?.pageNumber ?? 1,
        pageSize: filters?.pageSize ?? 50,
      },
    });

    return response.data.map(mapListItemToCustomer);
  }

  async getCustomerById(id: string) {
    const detailResponse = await apiClient.get<BackendCustomerDetail>(`/api/v1/customers/${id}`);
    const detail = detailResponse.data;

    const [historyResponse, amcResponse, preferenceResponse, ticketsResponse, invoicesResponse] = await Promise.all([
      apiClient.get<BackendServiceHistoryItem[]>(`/api/v1/service-history/customer/${id}`),
      apiClient.get<BackendCustomerAmc[]>(`/api/v1/amc/customer/${id}`),
      apiClient.get<BackendCommunicationPreference>(`/api/v1/communication-preferences/customer/${id}`).catch(() => ({ data: null as BackendCommunicationPreference | null })),
      apiClient.get<BackendSupportTicketListItem[]>("/api/v1/support-tickets", {
        params: {
          customerMobile: detail.mobileNumber,
          pageNumber: 1,
          pageSize: 10,
        },
      }),
      apiClient.get<BackendInvoiceListItem[]>("/api/v1/invoices", {
        params: {
          customerId: Number(id),
          pageNumber: 1,
          pageSize: 10,
        },
      }),
    ]);

    return hydrateCustomerDetail(
      detail,
      historyResponse.data,
      amcResponse.data,
      preferenceResponse.data,
      ticketsResponse.data,
      invoicesResponse.data,
    );
  }

  async createCustomer(data: Partial<Customer>) {
    const response = await apiClient.post<{
      customerId: number;
      customerName: string;
      mobileNumber: string;
      emailAddress: string;
    }>("/api/v1/customers", {
      customerName: data.name ?? "",
      mobileNumber: data.phone ?? "",
      emailAddress: data.email ?? "",
    });

    const customerId = String(response.data.customerId);

    if (data.addresses?.[0]) {
      await this.addAddress(customerId, data.addresses[0]);
    }

    const customer = await this.getCustomerById(customerId);
    if (!customer) {
      throw new Error("Customer could not be loaded after creation");
    }

    return {
      ...customer,
      type: data.type ?? customer.type,
    };
  }

  async updateCustomer(id: string, data: Partial<Customer>) {
    await apiClient.put<BackendCustomerDetail>(`/api/v1/customers/${id}`, {
      customerName: data.name ?? "",
      mobileNumber: data.phone ?? "",
      emailAddress: data.email ?? "",
    });

    const customer = await this.getCustomerById(id);
    if (!customer) {
      throw new Error("Customer could not be loaded after update");
    }

    return customer;
  }

  async addAddress(customerId: string, address: Partial<CustomerAddress>) {
    const zoneId =
      address.zoneId && /^[0-9]+$/.test(address.zoneId)
        ? Number(address.zoneId)
        : null;

    await apiClient.post(`/api/v1/customers/${customerId}/addresses`, {
      addressLabel: address.label ?? "Primary",
      addressLine1: address.addressLine ?? "",
      addressLine2: "",
      landmark: "",
      cityName: address.city ?? "",
      pincode: address.pinCode ?? "",
      zoneId,
      latitude: null,
      longitude: null,
      isDefault: address.isDefault ?? true,
      stateName: address.state ?? "",
      addressType: address.label ?? "Primary",
    });
  }

  async addEquipment(customerId: string, equipment: Partial<CustomerEquipment>) {
    await apiClient.post(`/api/v1/customers/${customerId}/equipment`, {
      name: equipment.model ?? "",
      type: equipment.type ?? "",
      brand: equipment.brand ?? "",
      capacity: equipment.tonnage ?? "",
      location: equipment.locationLabel ?? "",
      purchaseDate: null,
      lastServiceDate: equipment.lastServiceDate ?? null,
      serialNumber: equipment.serialNumber ?? null,
    });
  }

  async addNote(customerId: string, content: string) {
    const response = await apiClient.post<BackendCustomerNote>(`/api/v1/customers/${customerId}/notes`, {
      content,
      isPrivate: true,
      noteType: "Internal",
    });

    return toCustomerNote(response.data);
  }
}

export const customerRepository: CustomerRepository = isDemoMode()
  ? new MockCustomerRepository()
  : new LiveCustomerRepository();
