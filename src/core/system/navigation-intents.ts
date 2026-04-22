/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocalStorage, StorageKey } from "../storage/local-storage";

export interface PushNavigationIntent {
  type: string;
  srId?: string;
  requestId?: string;
  ticketId?: string;
  contractId?: string;
  invoiceId?: string;
}

export function navigateToPath(path: string, replace = false) {
  if (replace) {
    window.history.replaceState({}, "", path);
  } else {
    window.history.pushState({}, "", path);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function queuePendingRoute(path: string) {
  LocalStorage.set(StorageKey.SYSTEM_PENDING_ROUTE, path);
}

export function consumePendingRoute() {
  const path = LocalStorage.get<string>(StorageKey.SYSTEM_PENDING_ROUTE);
  if (path) {
    LocalStorage.remove(StorageKey.SYSTEM_PENDING_ROUTE);
  }
  return path;
}

export function resolveDeepLinkPath(rawLink: string): string | null {
  if (!rawLink) {
    return null;
  }

  const normalized = rawLink.trim();

  if (normalized.startsWith("coolzo://")) {
    const url = new URL(normalized);
    const entity = url.hostname;
    const identifier = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

    switch (entity) {
      case "jobs":
        return `/field/job/${identifier}`;
      case "sr":
        return `/service-requests/${identifier}`;
      case "estimate":
        return `/estimates/${identifier}`;
      case "invoice":
        return `/billing/invoices/${identifier}`;
      case "ticket":
        return `/support/tickets/${identifier}`;
      case "amc":
        return `/amc/contract/${identifier}`;
      case "renewal":
        return `/amc/dashboard?focus=renewals&contractId=${identifier}`;
      case "offer":
        return `/governance/coupons?offerId=${identifier}`;
      case "reset-password": {
        const token = url.searchParams.get("token");
        return token ? `/reset-password?token=${encodeURIComponent(token)}` : "/reset-password";
      }
      default:
        return null;
    }
  }

  try {
    const browserUrl = new URL(normalized);
    const embeddedDeepLink = browserUrl.searchParams.get("deep_link");
    if (embeddedDeepLink) {
      return resolveDeepLinkPath(embeddedDeepLink);
    }
  } catch {
    return null;
  }

  return null;
}

export function resolvePushIntentPath(intent: PushNavigationIntent): string | null {
  switch (intent.type) {
    case "job_assigned":
      return intent.srId ? `/field/job/${intent.srId}` : null;
    case "parts_approved":
      return intent.requestId ? `/inventory/requests/${intent.requestId}` : null;
    case "estimate_response":
      return intent.srId ? `/service-requests/${intent.srId}?focus=estimate` : null;
    case "sla_breach":
      return intent.srId ? `/service-requests/${intent.srId}?focus=sla` : null;
    case "ticket_reply":
      return intent.ticketId ? `/support/tickets/${intent.ticketId}` : null;
    case "amc_renewal":
      return intent.contractId ? `/amc/contract/${intent.contractId}` : null;
    case "invoice_overdue":
      return intent.invoiceId ? `/billing/invoices/${intent.invoiceId}` : null;
    case "new_sr":
      return intent.srId ? `/service-requests/${intent.srId}` : null;
    case "emergency_sr":
      return "/operations/dispatch";
    default:
      return null;
  }
}
