/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { amcRepository } from "@/core/network/amc-repository"
import { equipmentRepository, Equipment } from "@/core/network/equipment-repository"
import { customerRepository, Customer } from "@/core/network/customer-repository"
import { 
  User, 
  Search, 
  CheckCircle2, 
  Wrench, 
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Info,
  Plus,
  ArrowRight
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

const AMC_PLANS = [
  { id: 'basic', name: 'Basic', price: 2500, visits: 2, features: ['2 Maintenance Visits', 'Emergency Support', '10% Discount on Parts'] },
  { id: 'standard', name: 'Standard', price: 4500, visits: 4, features: ['4 Maintenance Visits', 'Priority Support', '15% Discount on Parts', 'Free Gas Top-up'] },
  { id: 'premium', name: 'Premium', price: 8500, visits: 6, features: ['6 Maintenance Visits', '24/7 Priority Support', '25% Discount on Parts', 'Free Gas Top-up', 'Chemical Wash Included'] },
];

export default function AMCEnrollmentForm() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1)
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null)
  const [selectedPlan, setSelectedPlan] = React.useState<any>(null)
  const [customerEquipment, setCustomerEquipment] = React.useState<Equipment[]>([])
  const [selectedEquipmentIds, setSelectedEquipmentIds] = React.useState<string[]>([])
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [isCustomersLoading, setIsCustomersLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerRepository.getCustomers({ pageNumber: 1, pageSize: 20 });
        setCustomers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsCustomersLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleCustomerSelect = async (customer: Customer) => {
    setSelectedCustomer(customer);
    const eq = await equipmentRepository.getEquipmentByCustomerId(customer.id);
    setCustomerEquipment(eq);
    setStep(2);
  }

  const toggleEquipment = (id: string) => {
    setSelectedEquipmentIds(prev => 
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  }

  const handleSubmit = async () => {
    if (!selectedCustomer || !selectedPlan) {
      return;
    }

    setIsSubmitting(true);
    try {
      await amcRepository.enrollContract({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        planType: selectedPlan.id,
        startDate,
        endDate: new Date(new Date(startDate).setFullYear(new Date(startDate).getFullYear() + 1)).toISOString().split('T')[0],
        equipmentIds: selectedEquipmentIds,
        fee: selectedPlan.price * selectedEquipmentIds.length,
        status: 'active',
        totalVisits: selectedPlan.visits,
        paymentStatus: 'paid'
      });
      toast.success("AMC Contract Created Successfully", {
        description: "Digital contract has been sent to the customer."
      });
      navigate('/amc/contracts');
    } catch (error) {
      toast.error("Failed to create contract");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
          <ChevronLeft size={20} className="text-brand-navy" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Enroll Customer in AMC</h1>
          <p className="text-sm text-brand-muted">Step {step} of 4: {step === 1 ? 'Select Customer' : step === 2 ? 'Choose Plan' : step === 3 ? 'Select Equipment' : 'Review & Pay'}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={cn(
            "h-1.5 flex-1 rounded-full transition-all duration-500",
            s <= step ? "bg-brand-gold" : "bg-brand-navy/5"
          )} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <AdminCard className="p-8">
              <SectionHeader title="Find Customer" icon={<User size={18} />} />
              <div className="relative mb-8">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input 
                  type="text" 
                  placeholder="Search by name, phone or email..."
                  className="w-full pl-12 pr-4 py-4 bg-brand-navy/5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-gold outline-none transition-all"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {isCustomersLoading ? (
                  <InlineLoader className="h-40" />
                ) : customers
                  .filter((customer) =>
                    [customer.name, customer.phone, customer.email]
                      .filter(Boolean)
                      .some((value) => value.toLowerCase().includes(customerSearch.toLowerCase()))
                  )
                  .map((customer) => (
                  <div 
                    key={customer.id} 
                    onClick={() => handleCustomerSelect(customer)}
                    className="p-4 bg-white border border-border rounded-2xl flex items-center justify-between hover:border-brand-gold cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-brand-navy/5 text-brand-navy rounded-xl flex items-center justify-center">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-navy">{customer.name}</p>
                        <p className="text-[10px] text-brand-muted uppercase tracking-widest">{customer.phone}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-brand-muted group-hover:text-brand-gold" />
                  </div>
                ))}
              </div>
            </AdminCard>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {AMC_PLANS.map(plan => (
                <AdminCard 
                  key={plan.id}
                  onClick={() => { setSelectedPlan(plan); setStep(3); }}
                  className={cn(
                    "p-8 cursor-pointer transition-all border-2 flex flex-col h-full",
                    selectedPlan?.id === plan.id ? "border-brand-gold bg-brand-gold/5" : "border-transparent hover:border-brand-gold/30"
                  )}
                >
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-brand-navy mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-brand-navy">₹{plan.price}</span>
                      <span className="text-xs text-brand-muted">/ unit / yr</span>
                    </div>
                  </div>
                  <div className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-brand-navy/80">
                        <CheckCircle2 size={14} className="text-status-completed shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <AdminButton className="w-full" variant={selectedPlan?.id === plan.id ? 'primary' : 'outline'}>
                    Select Plan
                  </AdminButton>
                </AdminCard>
              ))}
            </div>
            <div className="mt-8 flex justify-start">
              <button onClick={() => setStep(1)} className="text-sm font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2">
                <ChevronLeft size={16} /> Back to Customer
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <AdminCard className="p-8">
              <SectionHeader title="Select Equipment to Cover" icon={<Wrench size={18} />} />
              <p className="text-sm text-brand-muted mb-8">Choose which AC units will be covered under this AMC plan.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {customerEquipment.map(eq => (
                  <div 
                    key={eq.id}
                    onClick={() => toggleEquipment(eq.id)}
                    className={cn(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4",
                      selectedEquipmentIds.includes(eq.id) ? "border-brand-gold bg-brand-gold/5" : "border-border bg-white hover:border-brand-gold/30"
                    )}
                  >
                    <div className={cn(
                      "size-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      selectedEquipmentIds.includes(eq.id) ? "bg-brand-gold border-brand-gold text-brand-navy" : "border-border"
                    )}>
                      {selectedEquipmentIds.includes(eq.id) && <CheckCircle2 size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-navy">{eq.locationLabel}</p>
                      <p className="text-[10px] text-brand-muted uppercase tracking-widest">{eq.brand} - {eq.model}</p>
                    </div>
                  </div>
                ))}
                {customerEquipment.length === 0 && (
                  <div className="col-span-2 p-8 text-center bg-brand-navy/5 rounded-3xl border border-dashed border-border">
                    <p className="text-sm text-brand-muted mb-4">No equipment registered for this customer.</p>
                    <AdminButton variant="outline" size="sm" icon={<Plus size={16} />}>Register New Equipment</AdminButton>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setStep(2)} className="text-sm font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2">
                  <ChevronLeft size={16} /> Back to Plans
                </button>
                <AdminButton 
                  disabled={selectedEquipmentIds.length === 0}
                  onClick={() => setStep(4)}
                  icon={<ArrowRight size={18} />}
                >
                  Review Enrollment
                </AdminButton>
              </div>
            </AdminCard>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <AdminCard className="p-8">
                  <SectionHeader title="Enrollment Summary" icon={<Info size={18} />} />
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Customer</p>
                      <p className="text-sm font-bold text-brand-navy">{selectedCustomer?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Plan Selected</p>
                      <p className="text-sm font-bold text-brand-navy">{selectedPlan?.name} Plan</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Start Date</p>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-sm font-bold text-brand-navy bg-brand-navy/5 border-none rounded-lg px-2 py-1"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Units Covered</p>
                      <p className="text-sm font-bold text-brand-navy">{selectedEquipmentIds.length} AC Units</p>
                    </div>
                  </div>

                  <div className="p-4 bg-brand-navy/5 rounded-2xl">
                    <h4 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-3">Equipment List</h4>
                    <div className="space-y-2">
                      {selectedEquipmentIds.map(id => {
                        const eq = customerEquipment.find(e => e.id === id);
                        return (
                          <div key={id} className="flex justify-between text-xs">
                            <span className="text-brand-navy font-bold">{eq?.locationLabel}</span>
                            <span className="text-brand-muted">{eq?.brand} {eq?.model}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </AdminCard>
              </div>

              <div className="lg:col-span-1">
                <AdminCard className="p-8 bg-brand-navy text-brand-gold sticky top-24">
                  <SectionHeader title="Order Total" icon={<CreditCard size={18} />} />
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Plan Price</span>
                      <span>₹{selectedPlan.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-60">Units</span>
                      <span>x {selectedEquipmentIds.length}</span>
                    </div>
                    <div className="h-px bg-brand-gold/20" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Total Amount</span>
                      <span className="text-2xl font-bold">₹{(selectedPlan.price * selectedEquipmentIds.length).toLocaleString()}</span>
                    </div>
                  </div>
                  <AdminButton 
                    className="w-full bg-brand-gold text-brand-navy hover:bg-brand-gold/90"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enrolling..." : "Confirm & Pay"}
                  </AdminButton>
                  <button onClick={() => setStep(3)} className="w-full mt-4 text-[10px] font-bold text-brand-gold/60 uppercase tracking-widest hover:text-brand-gold transition-colors">
                    Edit Details
                  </button>
                </AdminCard>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
