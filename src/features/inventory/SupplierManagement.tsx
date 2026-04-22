/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { AdminCard } from "@/components/shared/Cards";
import { SectionHeader, InlineLoader } from "@/components/shared/Layout";
import { inventoryRepository, Supplier } from "@/core/network/inventory-repository";
import { Building2, Mail, Phone, Plus, Timer } from "lucide-react";
import { AdminButton } from "@/components/shared/AdminButton";
import { toast } from "sonner";

const emptySupplier = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  leadTimeDays: 0,
  paymentTerms: "",
};

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [draft, setDraft] = React.useState(emptySupplier);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await inventoryRepository.getSuppliers();
        setSuppliers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleCreate = async () => {
    if (!draft.name || !draft.contactPerson) {
      return;
    }

    try {
      setIsSubmitting(true);
      const nextSupplier = await inventoryRepository.addSupplier(draft);
      setSuppliers((current) => [...current, nextSupplier]);
      setDraft(emptySupplier);
      toast.success("Supplier added");
    } catch {
      toast.error("Failed to add supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <InlineLoader className="h-screen" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Supplier Management</h1>
        <p className="text-sm text-brand-muted">Maintain supplier contacts, lead times, and payment terms.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <AdminCard className="p-8">
          <SectionHeader title="Supplier Directory" icon={<Building2 size={18} />} />
          <div className="mt-6 space-y-4">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{supplier.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted">{supplier.contactPerson}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-brand-navy">{supplier.paymentTerms}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted">{supplier.leadTimeDays} day lead</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-brand-muted">
                  <span className="flex items-center gap-2"><Phone size={12} /> {supplier.phone}</span>
                  <span className="flex items-center gap-2"><Mail size={12} /> {supplier.email}</span>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="p-8">
          <SectionHeader title="Add Supplier" icon={<Plus size={18} />} />
          <div className="mt-6 space-y-4">
            <input className="w-full rounded-2xl border border-border bg-brand-navy/5 px-4 py-3 text-sm outline-none focus:border-brand-gold" placeholder="Supplier name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            <input className="w-full rounded-2xl border border-border bg-brand-navy/5 px-4 py-3 text-sm outline-none focus:border-brand-gold" placeholder="Contact person" value={draft.contactPerson} onChange={(event) => setDraft((current) => ({ ...current, contactPerson: event.target.value }))} />
            <input className="w-full rounded-2xl border border-border bg-brand-navy/5 px-4 py-3 text-sm outline-none focus:border-brand-gold" placeholder="Phone" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
            <input className="w-full rounded-2xl border border-border bg-brand-navy/5 px-4 py-3 text-sm outline-none focus:border-brand-gold" placeholder="Email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <input className="w-full rounded-2xl border border-border bg-brand-navy/5 px-4 py-3 text-sm outline-none focus:border-brand-gold" placeholder="Lead time days" type="number" value={draft.leadTimeDays} onChange={(event) => setDraft((current) => ({ ...current, leadTimeDays: Number(event.target.value) || 0 }))} />
              <input className="w-full rounded-2xl border border-border bg-brand-navy/5 px-4 py-3 text-sm outline-none focus:border-brand-gold" placeholder="Payment terms" value={draft.paymentTerms} onChange={(event) => setDraft((current) => ({ ...current, paymentTerms: event.target.value }))} />
            </div>
            <AdminButton className="w-full" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Supplier"}
            </AdminButton>
          </div>

          <div className="mt-8 rounded-2xl bg-brand-navy p-5 text-brand-gold">
            <div className="flex items-center gap-3">
              <Timer size={18} />
              <p className="text-sm font-bold">Supplier lead time is used in low-stock reorder planning.</p>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
