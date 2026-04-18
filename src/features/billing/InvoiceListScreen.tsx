/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { invoiceRepository, Invoice, InvoiceStatus } from "@/core/network/invoice-repository"
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  FileText, 
  Download,
  Calendar,
  User,
  CreditCard,
  AlertCircle,
  MoreVertical,
  Mail,
  MessageSquare
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function InvoiceListScreen() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<InvoiceStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await invoiceRepository.getInvoices({});
        setInvoices(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoices();
  }, [])

  const filteredInvoices = invoices.filter(inv => {
    const matchesFilter = filter === 'all' || inv.status === filter;
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.srNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Invoices & Billing</h1>
          <p className="text-sm text-brand-muted">Manage all customer invoices and payment statuses</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Download size={18} />}>Export Financials</AdminButton>
          <AdminButton icon={<Plus size={18} />} onClick={() => navigate('/billing/new')}>Create Manual Invoice</AdminButton>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="Total Outstanding" value="₹1.2L" trend="+12% vs last month" color="navy" />
        <MetricCard label="Paid This Month" value="₹4.8L" trend="+5% vs last month" color="gold" />
        <MetricCard label="Overdue Amount" value="₹28.5k" trend="8 Invoices" color="red" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by Invoice #, Customer or SR #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
          <FilterButton active={filter === 'unpaid'} onClick={() => setFilter('unpaid')} label="Unpaid" />
          <FilterButton active={filter === 'paid'} onClick={() => setFilter('paid')} label="Paid" />
          <FilterButton active={filter === 'overdue'} onClick={() => setFilter('overdue')} label="Overdue" />
        </div>
      </div>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border bg-brand-navy/[0.02]">
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Invoice Info</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Customer</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Amount</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Status</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Due Date</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((inv, idx) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group hover:bg-brand-navy/[0.01] transition-colors"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-brand-navy/5 rounded-xl flex items-center justify-center text-brand-navy shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-navy">{inv.invoiceNumber}</p>
                        <p className="text-[10px] text-brand-muted uppercase tracking-widest">SR: {inv.srNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-brand-muted" />
                      <div>
                        <p className="text-xs font-bold text-brand-navy">{inv.customerName}</p>
                        <p className="text-[10px] text-brand-muted uppercase tracking-widest">{inv.customerType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-sm font-bold text-brand-navy">₹{inv.netPayable.toLocaleString()}</p>
                    {inv.amountPaid > 0 && (
                      <p className="text-[10px] text-status-completed font-bold uppercase tracking-widest">Paid: ₹{inv.amountPaid.toLocaleString()}</p>
                    )}
                  </td>
                  <td className="p-6">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-brand-muted" />
                      <span className={cn(
                        "text-xs font-bold",
                        inv.status === 'overdue' ? "text-status-emergency" : "text-brand-navy"
                      )}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/billing/invoices/${inv.id}`)} className="p-2 text-brand-muted hover:text-brand-gold transition-colors">
                        <ChevronRight size={20} />
                      </button>
                      <button className="p-2 text-brand-muted hover:bg-brand-navy/5 rounded-lg">
                        <MoreVertical size={18} />
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

function MetricCard({ label, value, trend, color }: any) {
  const colors: any = {
    navy: "bg-brand-navy text-white",
    gold: "bg-brand-gold text-brand-navy",
    red: "bg-status-emergency text-white"
  };
  return (
    <AdminCard className={cn("p-6", colors[color])}>
      <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <p className="text-[10px] font-medium opacity-80">{trend}</p>
    </AdminCard>
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

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const statusMap: Record<InvoiceStatus, { color: string, text: string, icon: any }> = {
    unpaid: { color: 'bg-brand-navy/5 text-brand-navy', text: 'Unpaid', icon: <CreditCard size={10} /> },
    partially_paid: { color: 'bg-brand-gold/10 text-brand-gold', text: 'Partial', icon: <CreditCard size={10} /> },
    paid: { color: 'bg-status-completed/10 text-status-completed', text: 'Paid', icon: <CreditCard size={10} /> },
    overdue: { color: 'bg-status-emergency/10 text-status-emergency', text: 'Overdue', icon: <AlertCircle size={10} /> },
    cancelled: { color: 'bg-brand-muted/10 text-brand-muted', text: 'Cancelled', icon: <AlertCircle size={10} /> },
    bad_debt: { color: 'bg-brand-navy text-white', text: 'Bad Debt', icon: <AlertCircle size={10} /> },
  };

  const config = statusMap[status];

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit",
      config.color
    )}>
      {config.icon} {config.text}
    </span>
  )
}
