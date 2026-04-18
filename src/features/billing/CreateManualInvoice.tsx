/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { invoiceRepository, InvoiceLineItem } from "@/core/network/invoice-repository"
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  User, 
  Calendar, 
  FileText,
  Tag,
  DollarSign,
  Save,
  Send
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function CreateManualInvoice() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = React.useState("")
  const [customerType, setCustomerType] = React.useState<'individual' | 'corporate'>('individual')
  const [dueDate, setDueDate] = React.useState("")
  const [items, setItems] = React.useState<Partial<InvoiceLineItem>[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0, type: 'labor' }
  ])
  const [discount, setDiscount] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, total: 0, type: 'labor' }]);
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  }

  const updateItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = (updated.quantity || 0) * (updated.unitPrice || 0);
        }
        return updated;
      }
      return item;
    }));
  }

  const subtotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
  const tax = (subtotal - discount) * 0.18; // 18% GST
  const netPayable = subtotal - discount + tax;

  const handleSave = async (send: boolean) => {
    if (!customerName || !dueDate) {
      toast.error("Please fill in customer name and due date");
      return;
    }
    setIsSubmitting(true);
    try {
      await invoiceRepository.createInvoice({
        customerName,
        customerType,
        dueDate,
        items: items as InvoiceLineItem[],
        subtotal,
        discountTotal: discount,
        taxTotal: tax,
        netPayable,
        status: 'unpaid',
        technicianName: 'Admin (Manual)',
        srNumber: 'MANUAL-' + Date.now().toString().slice(-5)
      });
      toast.success(`Invoice created ${send ? 'and sent' : ''} successfully`);
      navigate('/billing/invoices');
    } catch (error) {
      toast.error("Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Create Manual Invoice</h1>
            <p className="text-sm text-brand-muted">Generate a new tax invoice for standalone services</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Save size={18} />} onClick={() => handleSave(false)} disabled={isSubmitting}>Save as Draft</AdminButton>
          <AdminButton icon={<Send size={18} />} onClick={() => handleSave(true)} disabled={isSubmitting}>Generate & Send</AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Settings */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Customer Details" icon={<User size={18} />} />
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-4 mb-1 block">Customer Name</label>
                <input 
                  type="text" 
                  placeholder="Enter full name..."
                  className="w-full px-4 py-3 bg-brand-navy/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-4 mb-1 block">Customer Type</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCustomerType('individual')}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all",
                      customerType === 'individual' ? "bg-brand-navy text-brand-gold" : "bg-brand-navy/5 text-brand-muted"
                    )}
                  >
                    Individual
                  </button>
                  <button 
                    onClick={() => setCustomerType('corporate')}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all",
                      customerType === 'corporate' ? "bg-brand-navy text-brand-gold" : "bg-brand-navy/5 text-brand-muted"
                    )}
                  >
                    Corporate
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-4 mb-1 block">Due Date</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 bg-brand-navy/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6 bg-brand-gold/5 border-2 border-brand-gold/20">
            <SectionHeader title="Billing Notes" icon={<FileText size={18} />} />
            <textarea 
              placeholder="Internal notes or customer instructions..."
              className="w-full mt-4 p-4 bg-white border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all min-h-[120px]"
            />
          </AdminCard>
        </div>

        {/* Right Column: Line Items */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <SectionHeader title="Invoice Line Items" icon={<FileText size={18} />} />
              <AdminButton variant="outline" size="sm" icon={<Plus size={14} />} onClick={addItem}>Add Item</AdminButton>
            </div>
            
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.id} className="flex flex-col md:flex-row gap-4 p-4 bg-brand-navy/5 rounded-2xl relative group">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-2 mb-1 block">Description</label>
                    <input 
                      type="text" 
                      placeholder="Service or part description..."
                      className="w-full px-3 py-2 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-gold outline-none"
                      value={item.description}
                      onChange={(e) => updateItem(item.id!, 'description', e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-24">
                    <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-2 mb-1 block">Qty</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-gold outline-none text-center"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id!, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-2 mb-1 block">Unit Price</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-gold outline-none text-right"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id!, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-full md:w-32 flex flex-col justify-end items-end pr-8">
                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Total</p>
                    <p className="text-sm font-bold text-brand-navy">₹{(item.total || 0).toLocaleString()}</p>
                  </div>
                  {items.length > 1 && (
                    <button 
                      onClick={() => removeItem(item.id!)}
                      className="absolute top-2 right-2 p-1 text-brand-muted hover:text-status-emergency transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <div className="w-full max-w-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-bold text-brand-navy">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-status-emergency">
                  <span className="text-xs font-bold uppercase tracking-widest">Discount</span>
                  <input 
                    type="number" 
                    className="w-24 px-2 py-1 bg-brand-navy/5 border-none rounded-lg text-sm text-right focus:ring-2 focus:ring-brand-gold outline-none"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">Tax (18% GST)</span>
                  <span className="text-sm font-bold text-brand-navy">₹{tax.toLocaleString()}</span>
                </div>
                <div className="h-px bg-border pt-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-brand-navy">Net Payable</span>
                  <span className="text-2xl font-bold text-brand-navy">₹{netPayable.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
