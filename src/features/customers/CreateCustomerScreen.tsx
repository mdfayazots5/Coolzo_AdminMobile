/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { AdminButton } from "@/components/shared/AdminButton"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Save,
  Phone,
  Mail,
  Building2,
  Users,
  Plus
} from "lucide-react"
import { customerRepository, Customer } from "@/core/network/customer-repository"
import { toast } from "sonner"
import { useParams } from "react-router-dom"
import { cn } from "@/lib/utils"

export default function CreateCustomerScreen() {
  const { id } = useParams()
  const isEditMode = !!id
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(isEditMode)
  
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    email: '',
    type: 'residential',
    source: 'Call',
    address: '',
    city: 'Mumbai',
    pinCode: '',
    zoneId: 'z1'
  })

  React.useEffect(() => {
    if (isEditMode) {
      const fetchCustomer = async () => {
        try {
          const data = await customerRepository.getCustomerById(id!)
          if (data) {
            setFormData({
              name: data.name,
              phone: data.phone,
              email: data.email,
              type: data.type,
              source: 'Existing', // Source usually immutable or fetched from elsewhere
              address: data.addresses[0]?.addressLine || '',
              city: data.addresses[0]?.city || 'Mumbai',
              pinCode: data.addresses[0]?.pinCode || '',
              zoneId: data.addresses[0]?.zoneId || 'z1'
            })
          }
        } catch (error) {
          toast.error("Failed to fetch customer details")
        } finally {
          setIsFetching(false)
        }
      }
      fetchCustomer()
    }
  }, [id, isEditMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isEditMode) {
        await customerRepository.updateCustomer(id!, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          type: formData.type as any
        })
        toast.success(`Customer ${formData.name} updated successfully`);
        navigate(`/customers/${id}`);
      } else {
        const newCust = await customerRepository.createCustomer({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          type: formData.type as any,
          amcStatus: 'none',
          riskLevel: 'low',
          addresses: [{
            id: 'addr-init',
            label: 'Primary',
            addressLine: formData.address,
            city: formData.city,
            pinCode: formData.pinCode,
            zoneId: formData.zoneId,
            isDefault: true
          }]
        });
        toast.success(`Customer ${newCust.name} registered successfully`);
        navigate(`/customers/${newCust.id}`);
      }
    } catch (error) {
      toast.error(isEditMode ? "Failed to update customer" : "Failed to register customer");
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) return <InlineLoader className="h-screen" />

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-brand-navy" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{isEditMode ? 'Edit Customer' : 'Register New Customer'}</h1>
          <p className="text-sm text-brand-muted">{isEditMode ? 'Update customer identity and preferences' : 'Onboard a new customer to the Coolzo platform'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <AdminCard className="p-6">
          <SectionHeader title="Customer Identity" icon={<User size={18} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <AdminTextField 
              label="Full Name" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <AdminTextField 
              label="Mobile Number" 
              required
              placeholder="+91 XXXXX XXXXX"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <AdminTextField 
              label="Email Address" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <div>
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1 block">Customer Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'residential', icon: <User size={14} />, label: 'Resi' },
                  { id: 'commercial', icon: <Building2 size={14} />, label: 'Comm' },
                  { id: 'enterprise', icon: <Users size={14} />, label: 'Ent' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({...formData, type: t.id})}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 rounded-lg border transition-all",
                      formData.type === t.id 
                        ? "bg-brand-navy text-brand-gold border-brand-navy" 
                        : "bg-white text-brand-muted border-border hover:border-brand-navy"
                    )}
                  >
                    {t.icon}
                    <span className="text-[9px] font-bold uppercase tracking-widest">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Initial Address */}
        <AdminCard className="p-6">
          <SectionHeader title="Primary Service Address" icon={<MapPin size={18} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="md:col-span-2">
              <AdminTextField 
                label="Full Address" 
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <AdminTextField 
              label="PIN Code" 
              required
              value={formData.pinCode}
              onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
            />
            <div>
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1 block">Zone</label>
              <select 
                className="w-full p-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-sm focus:border-brand-gold outline-none"
                value={formData.zoneId}
                onChange={(e) => setFormData({...formData, zoneId: e.target.value})}
              >
                <option value="z1">Hyderabad Central</option>
                <option value="z2">Bandra West</option>
                <option value="z3">Andheri East</option>
              </select>
            </div>
          </div>
        </AdminCard>

        {/* Source & Preferences */}
        <AdminCard className="p-6">
          <SectionHeader title="Source & Preferences" icon={<Plus size={18} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1 block">Acquisition Source</label>
              <select 
                className="w-full p-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-sm focus:border-brand-gold outline-none"
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
              >
                <option>Call</option>
                <option>Website</option>
                <option>Walk-in</option>
                <option>Referral</option>
                <option>Marketing Campaign</option>
              </select>
            </div>
          </div>
        </AdminCard>

        <div className="flex items-center justify-end gap-4">
          <AdminButton variant="outline" onClick={() => navigate(-1)} type="button">
            Cancel
          </AdminButton>
          <AdminButton 
            type="submit"
            isLoading={isLoading}
            iconLeft={<Save size={18} />}
          >
            Register Customer
          </AdminButton>
        </div>
      </form>
    </div>
  )
}
