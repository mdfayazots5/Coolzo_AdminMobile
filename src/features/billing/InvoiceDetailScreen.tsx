/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { invoiceRepository, Invoice, InvoiceStatus, PaymentMethod } from "@/core/network/invoice-repository"
import { 
  ChevronLeft, 
  Download, 
  Send, 
  Printer, 
  CreditCard, 
  User, 
  Calendar, 
  FileText,
  Tag,
  Plus,
  History,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Mail
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function InvoiceDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = React.useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false)
  const [paymentAmount, setPaymentAmount] = React.useState(0)
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('cash')
  const [paymentRef, setPaymentRef] = React.useState("")

  React.useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      try {
        const data = await invoiceRepository.getInvoiceById(id);
        if (data) {
          setInvoice(data);
          setPaymentAmount(data.balanceDue);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoice();
  }, [id])

  const handleRecordPayment = async () => {
    if (!invoice || paymentAmount <= 0) return;
    try {
      const updated = await invoiceRepository.recordPayment(invoice.id, {
        amount: paymentAmount,
        method: paymentMethod,
        reference: paymentRef
      });
      setInvoice(updated);
      setIsPaymentModalOpen(false);
      toast.success("Payment recorded successfully");
    } catch (error) {
      toast.error("Failed to record payment");
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!invoice) return <div className="p-8 text-center">Invoice not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-brand-muted">Issued on {new Date(invoice.issueDate).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-3 bg-white border border-border rounded-2xl text-brand-navy hover:border-brand-gold transition-all">
            <Printer size={20} />
          </button>
          <button className="p-3 bg-white border border-border rounded-2xl text-brand-navy hover:border-brand-gold transition-all">
            <Download size={20} />
          </button>
          <AdminButton variant="outline" icon={<Send size={18} />}>Send Invoice</AdminButton>
          {invoice.status !== 'paid' && (
            <AdminButton icon={<Plus size={18} />} onClick={() => setIsPaymentModalOpen(true)}>Record Payment</AdminButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary & Customer */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Payment Status" icon={<CreditCard size={18} />} />
            <div className="flex flex-col items-center py-6">
              <div className={cn(
                "size-24 rounded-3xl flex flex-col items-center justify-center mb-4",
                invoice.status === 'paid' ? "bg-status-completed/10 text-status-completed" : 
                invoice.status === 'overdue' ? "bg-status-emergency/10 text-status-emergency" : "bg-brand-navy/5 text-brand-navy"
              )}>
                <span className="text-2xl font-bold">₹{(invoice.balanceDue / 1000).toFixed(1)}k</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Balance</span>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="space-y-4 border-t border-border pt-6">
              <InfoRow label="Net Payable" value={`₹${invoice.netPayable.toLocaleString()}`} />
              <InfoRow label="Amount Paid" value={`₹${invoice.amountPaid.toLocaleString()}`} />
              <InfoRow label="Due Date" value={new Date(invoice.dueDate).toLocaleDateString()} />
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Customer Info" icon={<User size={18} />} />
            <div className="mt-4 space-y-3">
              <p className="text-sm font-bold text-brand-navy">{invoice.customerName}</p>
              <p className="text-xs text-brand-muted uppercase tracking-widest">{invoice.customerType} Account</p>
              <div className="flex gap-2 pt-2">
                <button className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy hover:bg-brand-navy/10 transition-colors">
                  <Mail size={16} />
                </button>
                <button className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy hover:bg-brand-navy/10 transition-colors">
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Service Context" icon={<FileText size={18} />} />
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">SR Number</span>
                <span className="text-sm font-bold text-brand-navy">{invoice.srNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">Technician</span>
                <span className="text-sm font-bold text-brand-navy">{invoice.technicianName}</span>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Right Column: Line Items & History */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-8">
            <SectionHeader title="Invoice Line Items" icon={<FileText size={18} />} />
            <div className="overflow-x-auto mt-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Description</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Qty</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Unit Price</th>
                    <th className="pb-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-4">
                        <span className="text-sm font-bold text-brand-navy">{item.description}</span>
                        <p className="text-[10px] text-brand-muted uppercase tracking-widest">{item.type}</p>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-sm text-brand-navy">{item.quantity}</span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm text-brand-muted">₹{item.unitPrice.toLocaleString()}</span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm font-bold text-brand-navy">₹{item.total.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-end">
              <div className="w-full max-w-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-bold text-brand-navy">₹{invoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-status-emergency">
                  <span className="text-xs font-bold uppercase tracking-widest">Discount</span>
                  <span className="text-sm font-bold">-₹{invoice.discountTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">Tax (GST)</span>
                  <span className="text-sm font-bold text-brand-navy">₹{invoice.taxTotal.toLocaleString()}</span>
                </div>
                <div className="h-px bg-border pt-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-brand-navy">Net Payable</span>
                  <span className="text-2xl font-bold text-brand-navy">₹{invoice.netPayable.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-8">
            <SectionHeader title="Payment History" icon={<History size={18} />} />
            <div className="mt-6 space-y-4">
              {invoice.paymentHistory.map((payment, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-brand-navy/5 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="size-10 bg-white rounded-xl flex items-center justify-center text-status-completed shadow-sm">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-navy">₹{payment.amount.toLocaleString()} Received</p>
                      <p className="text-[10px] text-brand-muted uppercase tracking-widest">
                        via {payment.method.replace('_', ' ')} • Ref: {payment.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-brand-navy">{new Date(payment.date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">{new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
              {invoice.paymentHistory.length === 0 && (
                <p className="text-center py-10 text-brand-muted italic">No payments recorded yet.</p>
              )}
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-xl font-bold text-brand-navy mb-2">Record Payment</h2>
            <p className="text-sm text-brand-muted mb-6">Manually record a payment for invoice {invoice.invoiceNumber}.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-4 mb-1 block">Amount Received</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-brand-navy/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-4 mb-1 block">Payment Method</label>
                <select 
                  className="w-full px-4 py-3 bg-brand-navy/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online Gateway</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-4 mb-1 block">Reference Number</label>
                <input 
                  type="text" 
                  placeholder="TXN ID, Cheque #, etc."
                  className="w-full px-4 py-3 bg-brand-navy/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <AdminButton variant="outline" className="flex-1" onClick={() => setIsPaymentModalOpen(false)}>Cancel</AdminButton>
                <AdminButton className="flex-1" onClick={handleRecordPayment}>Record Payment</AdminButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const statusMap: any = {
    unpaid: { color: 'bg-brand-navy/5 text-brand-navy', text: 'Unpaid' },
    partially_paid: { color: 'bg-brand-gold/10 text-brand-gold', text: 'Partial' },
    paid: { color: 'bg-status-completed/10 text-status-completed', text: 'Paid' },
    overdue: { color: 'bg-status-emergency/10 text-status-emergency', text: 'Overdue' },
    cancelled: { color: 'bg-brand-muted/10 text-brand-muted', text: 'Cancelled' },
  };
  const config = statusMap[status];
  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest", config.color)}>
      {config.text}
    </span>
  )
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-brand-navy">{value}</span>
    </div>
  )
}
