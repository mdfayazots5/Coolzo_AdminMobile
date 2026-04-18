/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { StatusBadge } from "@/components/shared/Badges"
import { customerRepository, Customer } from "@/core/network/customer-repository"
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Wrench, 
  ShieldCheck, 
  CreditCard, 
  History, 
  MessageSquare, 
  AlertTriangle,
  Plus,
  Edit2,
  ChevronRight,
  ExternalLink,
  Calendar,
  MoreVertical,
  Send
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function Customer360ViewScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = React.useState<Customer | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<'history' | 'equipment' | 'addresses' | 'billing'>('history')

  React.useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      try {
        const data = await customerRepository.getCustomerById(id);
        setCustomer(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomer();
  }, [id])

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!customer) return <div className="p-8 text-center">Customer not found</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-brand-navy">{customer.name}</h1>
              <div className="px-2 py-0.5 bg-brand-navy/5 text-brand-navy text-[10px] font-bold rounded uppercase tracking-widest border border-brand-navy/10">
                {customer.type}
              </div>
              {customer.riskLevel !== 'low' && (
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-widest",
                  customer.riskLevel === 'high' ? "bg-status-emergency/10 text-status-emergency" : "bg-status-urgent/10 text-status-urgent"
                )}>
                  <AlertTriangle size={12} />
                  {customer.riskLevel} Risk
                </div>
              )}
            </div>
            <p className="text-xs text-brand-muted">Customer ID: {customer.id} • Since {customer.customerSince}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdminButton 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
          >
            <Edit2 size={16} className="mr-2" />
            Edit Profile
          </AdminButton>
          <AdminButton 
            size="sm" 
            onClick={() => navigate(`/service-requests/create?customerId=${customer.id}`)}
          >
            <Plus size={16} className="mr-2" />
            Book Service
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Quick Stats & Identity */}
        <div className="space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Contact Info" icon={<User size={18} />} />
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 text-brand-navy">
                <Phone size={16} className="text-brand-muted" />
                <span className="text-sm font-medium">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-brand-navy">
                <Mail size={16} className="text-brand-muted" />
                <span className="text-sm font-medium">{customer.email}</span>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Account Manager</p>
                <p className="text-sm font-bold text-brand-navy">{customer.accountManagerName || 'Unassigned'}</p>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="AMC Status" icon={<ShieldCheck size={18} />} />
            <div className="mt-4">
              <StatusBadge status={customer.amcStatus === 'active' ? 'completed' : 'closed'} className="w-full justify-center py-2 text-xs">
                {customer.amcStatus === 'active' ? 'ACTIVE CONTRACT' : 'NO ACTIVE AMC'}
              </StatusBadge>
              {customer.amcStatus === 'active' && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-brand-muted uppercase tracking-widest">
                    <span>Visit Progress</span>
                    <span>2/4 Visits</span>
                  </div>
                  <div className="w-full h-1.5 bg-brand-navy/5 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-brand-gold" />
                  </div>
                  <p className="text-[10px] text-brand-muted text-center mt-2">Expires on 15 Dec 2024</p>
                </div>
              )}
              {customer.amcStatus !== 'active' && (
                <AdminButton 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => toast.info("Presenting AMC plans to customer...")}
                >
                  Upsell AMC Plan
                </AdminButton>
              )}
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Financials" icon={<CreditCard size={18} />} />
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-muted">Total Revenue</span>
                <span className="text-sm font-bold text-brand-navy">₹{customer.totalRevenue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-brand-muted">Outstanding</span>
                <span className={cn(
                  "text-sm font-bold",
                  customer.outstandingAmount > 0 ? "text-status-emergency" : "text-status-completed"
                )}>
                  ₹{customer.outstandingAmount}
                </span>
              </div>
              {customer.outstandingAmount > 0 && (
                <AdminButton variant="outline" size="sm" className="w-full text-status-emergency border-status-emergency/20 hover:bg-status-emergency/5">
                  Send Payment Link
                </AdminButton>
              )}
            </div>
          </AdminCard>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {[
              { id: 'history', label: 'Service History', icon: <History size={16} /> },
              { id: 'equipment', label: 'Equipment Register', icon: <Wrench size={16} /> },
              { id: 'addresses', label: 'Address Book', icon: <MapPin size={16} /> },
              { id: 'billing', label: 'Invoices & Payments', icon: <CreditCard size={16} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2",
                  activeTab === tab.id 
                    ? "border-brand-gold text-brand-navy" 
                    : "border-transparent text-brand-muted hover:text-brand-navy"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionHeader title="Recent Service Requests" className="mb-0" />
                    <AdminButton 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/service-requests')}
                    >
                      View All
                    </AdminButton>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mock SR Cards */}
                    {[1, 2].map(i => (
                      <AdminCard key={i} className="p-4 hover:border-brand-gold transition-all cursor-pointer group">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold text-brand-navy">SR-9928{i}</span>
                          <StatusBadge status={i === 1 ? 'completed' : 'processing'}>
                            {i === 1 ? 'Completed' : 'Assigned'}
                          </StatusBadge>
                        </div>
                        <h4 className="text-sm font-bold text-brand-navy mb-1">AC Deep Cleaning</h4>
                        <p className="text-[10px] text-brand-muted uppercase tracking-widest mb-3">12 Apr 2024 • Split AC</p>
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">₹1,500</span>
                          <ChevronRight size={14} className="text-brand-muted group-hover:text-brand-gold transition-transform group-hover:translate-x-1" />
                        </div>
                      </AdminCard>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'equipment' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionHeader title="Registered AC Units" className="mb-0" />
                    <AdminButton 
                      size="sm" 
                      iconLeft={<Plus size={16} />}
                      onClick={() => toast.info("Opening Add Equipment form...")}
                    >
                      Add New Unit
                    </AdminButton>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {customer.equipment.map(eq => (
                      <AdminCard key={eq.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-brand-navy/5 rounded-xl text-brand-navy">
                            <Wrench size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-brand-navy">{eq.brand} {eq.model}</h4>
                            <p className="text-xs text-brand-muted">{eq.type} • {eq.tonnage} • {eq.locationLabel}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Last Service</p>
                            <p className="text-xs font-bold text-brand-navy">{eq.lastServiceDate || 'Never'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <AdminButton variant="outline" size="sm">History</AdminButton>
                            <AdminButton size="sm">Book</AdminButton>
                          </div>
                        </div>
                      </AdminCard>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionHeader title="Service Addresses" className="mb-0" />
                    <AdminButton 
                      size="sm" 
                      iconLeft={<Plus size={16} />}
                      onClick={() => toast.info("Opening Add Address form...")}
                    >
                      Add Address
                    </AdminButton>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.addresses.map(addr => (
                      <AdminCard key={addr.id} className="p-5 relative group">
                        {addr.isDefault && (
                          <div className="absolute top-4 right-4 px-2 py-0.5 bg-status-completed/10 text-status-completed text-[8px] font-bold rounded uppercase tracking-widest">
                            Default
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <MapPin size={18} className="text-brand-gold shrink-0 mt-1" />
                          <div>
                            <h4 className="font-bold text-brand-navy">{addr.label}</h4>
                            <p className="text-xs text-brand-muted leading-relaxed mt-1">{addr.addressLine}</p>
                            <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest mt-2">
                              {addr.city} • {addr.pinCode} • Zone: {addr.zoneId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-[10px] font-bold text-brand-navy uppercase tracking-widest hover:text-brand-gold">Edit</button>
                          <span className="text-border">|</span>
                          <button className="text-[10px] font-bold text-status-emergency uppercase tracking-widest hover:opacity-80">Archive</button>
                        </div>
                      </AdminCard>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionHeader title="Invoices & Payments" className="mb-0" />
                    <AdminButton variant="outline" size="sm">Statement of Account</AdminButton>
                  </div>
                  <AdminCard className="p-0 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-navy/5">
                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Invoice #</th>
                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Date</th>
                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Amount</th>
                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Status</th>
                          <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-brand-muted text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 'INV-1001', date: '12 Apr 2024', amount: '1,500', status: 'Paid' },
                          { id: 'INV-1002', date: '15 Apr 2024', amount: '3,000', status: 'Unpaid' },
                        ].map(inv => (
                          <tr key={inv.id} className="border-t border-border hover:bg-brand-navy/[0.02] transition-colors">
                            <td className="p-4 text-xs font-bold text-brand-navy">{inv.id}</td>
                            <td className="p-4 text-xs text-brand-muted">{inv.date}</td>
                            <td className="p-4 text-xs font-bold text-brand-navy">₹{inv.amount}</td>
                            <td className="p-4">
                              <StatusBadge status={inv.status === 'Paid' ? 'completed' : 'urgent'}>
                                {inv.status}
                              </StatusBadge>
                            </td>
                            <td className="p-4 text-right">
                              <button className="p-2 hover:bg-brand-navy/5 rounded-lg text-brand-muted hover:text-brand-navy">
                                <ExternalLink size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </AdminCard>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Internal Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminCard className="p-6">
              <SectionHeader title="Internal Notes" icon={<MessageSquare size={18} />} />
              <div className="space-y-4 mt-4">
                <div className="max-h-60 overflow-y-auto space-y-4 pr-2">
                  {customer.notes.map(note => (
                    <div key={note.id} className="p-3 bg-brand-navy/5 rounded-xl text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-brand-navy">{note.author}</span>
                        <span className="text-[10px] text-brand-muted">{new Date(note.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-brand-navy leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Add a private note..."
                    className="flex-1 p-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-xs focus:border-brand-gold outline-none"
                  />
                  <AdminButton size="sm">Add</AdminButton>
                </div>
              </div>
            </AdminCard>

            <AdminCard className="p-6">
              <SectionHeader title="Communication Preferences" icon={<Send size={18} />} />
              <div className="space-y-4 mt-4">
                {[
                  { id: 'wa', label: 'WhatsApp Notifications', active: true },
                  { id: 'em', label: 'Email Updates', active: true },
                  { id: 'sms', label: 'SMS Alerts', active: false },
                ].map(pref => (
                  <div key={pref.id} className="flex items-center justify-between p-3 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
                    <span className="text-xs font-bold text-brand-navy">{pref.label}</span>
                    <div className={cn(
                      "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                      pref.active ? "bg-status-completed" : "bg-brand-muted/30"
                    )}>
                      <div className={cn(
                        "absolute top-1 size-3 bg-white rounded-full transition-all",
                        pref.active ? "right-1" : "left-1"
                      )} />
                    </div>
                  </div>
                ))}
                <AdminButton variant="outline" size="sm" className="w-full mt-2">
                  Send Manual Message
                </AdminButton>
              </div>
            </AdminCard>
          </div>
        </div>
      </div>
    </div>
  )
}
