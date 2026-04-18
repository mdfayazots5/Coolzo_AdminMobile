/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { paymentRepository, Payment, PaymentStatus, PaymentMethod } from "@/core/network/payment-repository"
import { 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  CreditCard, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function PaymentListScreen() {
  const navigate = useNavigate();
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<PaymentStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await paymentRepository.getPayments({});
        setPayments(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPayments();
  }, [])

  const filteredPayments = payments.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = p.paymentId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Payment Transactions</h1>
          <p className="text-sm text-brand-muted">Track and reconcile all incoming revenue</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Download size={18} />}>Export Payments</AdminButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by Payment ID, Invoice # or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
          <FilterButton active={filter === 'confirmed'} onClick={() => setFilter('confirmed')} label="Confirmed" />
          <FilterButton active={filter === 'pending_verification'} onClick={() => setFilter('pending_verification')} label="Pending" />
          <FilterButton active={filter === 'failed'} onClick={() => setFilter('failed')} label="Failed" />
        </div>
      </div>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border bg-brand-navy/[0.02]">
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Payment Info</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Customer</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Method</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Amount</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Status</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.map((p, idx) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group hover:bg-brand-navy/[0.01] transition-colors"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-brand-navy/5 rounded-xl flex items-center justify-center text-brand-navy shrink-0">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-navy">{p.paymentId}</p>
                        <p className="text-[10px] text-brand-muted uppercase tracking-widest">Inv: {p.invoiceNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-brand-muted" />
                      <p className="text-xs font-bold text-brand-navy">{p.customerName}</p>
                    </div>
                  </td>
                  <td className="p-6">
                    <MethodBadge method={p.method} />
                  </td>
                  <td className="p-6 text-right">
                    <p className="text-sm font-bold text-brand-navy">₹{p.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">{new Date(p.date).toLocaleDateString()}</p>
                  </td>
                  <td className="p-6">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/finance/payments/${p.id}`)} className="p-2 text-brand-muted hover:text-brand-gold transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  )
}

function FilterButton({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
        active ? "bg-brand-navy text-brand-gold" : "bg-white text-brand-muted border border-border hover:border-brand-gold"
      )}
    >
      {label}
    </button>
  )
}

function MethodBadge({ method }: { method: PaymentMethod }) {
  const methodMap: Record<PaymentMethod, { text: string, color: string }> = {
    online: { text: 'Online', color: 'bg-brand-navy/5 text-brand-navy' },
    cod: { text: 'COD', color: 'bg-brand-gold/10 text-brand-gold' },
    bank_transfer: { text: 'Bank Transfer', color: 'bg-status-completed/10 text-status-completed' },
    cheque: { text: 'Cheque', color: 'bg-brand-muted/10 text-brand-muted' },
    corporate_credit: { text: 'Corp Credit', color: 'bg-brand-navy text-white' },
  };
  const config = methodMap[method];
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", config.color)}>
      {config.text}
    </span>
  )
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const statusMap: Record<PaymentStatus, { color: string, text: string, icon: any }> = {
    confirmed: { color: 'bg-status-completed/10 text-status-completed', text: 'Confirmed', icon: <CheckCircle2 size={10} /> },
    pending_verification: { color: 'bg-brand-gold/10 text-brand-gold', text: 'Pending', icon: <Clock size={10} /> },
    failed: { color: 'bg-status-emergency/10 text-status-emergency', text: 'Failed', icon: <AlertCircle size={10} /> },
    refunded: { color: 'bg-brand-navy/10 text-brand-navy', text: 'Refunded', icon: <AlertCircle size={10} /> },
    disputed: { color: 'bg-brand-navy text-white', text: 'Disputed', icon: <AlertCircle size={10} /> },
  };
  const config = statusMap[status];
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit", config.color)}>
      {config.icon} {config.text}
    </span>
  )
}
