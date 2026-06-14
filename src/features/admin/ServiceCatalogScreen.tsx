/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ServiceCatalogManager from "./ServiceCatalogManager"

/**
 * Service Catalog admin screen (/settings/master/services).
 *
 * Manages service categories and the bookable services within each (add / edit / delete + image
 * upload), via ServiceCatalogManager.
 *
 * History: this screen previously also hosted "Service Subtypes", "Equipment Brands", and
 * "Equipment Models" tabs (generic Phase-4 DynamicMasterRecord master data). Those were removed
 * 2026-06-14 — analysis confirmed NO surface consumed them (no web/mobile/booking/equipment flow,
 * not even the CMS snapshot). The booking flow uses a separate tblBrand (/booking-lookups/brands)
 * and customer equipment uses free-text brand/type, so the dynamic masters were dead UI.
 */
export default function ServiceCatalogScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Service Catalog</h1>
        <p className="text-sm text-brand-muted">
          Manage service categories and the bookable services within each — including pricing and photos.
        </p>
      </div>
      <ServiceCatalogManager />
    </div>
  )
}
