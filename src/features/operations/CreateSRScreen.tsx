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
  Wrench, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Search,
  Plus,
  Save
} from "lucide-react"
import { serviceRequestRepository, ServiceRequest } from "@/core/network/service-request-repository"
import { toast } from "sonner"
import { useParams, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

export default function CreateSRScreen() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isEditMode = !!id
  const searchParams = new URLSearchParams(location.search)
  const initialCustomerId = searchParams.get('customerId')

  const [isLoading, setIsLoading] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(isEditMode)
  
  const [formData, setFormData] = React.useState({
    customerId: initialCustomerId || '',
    customerName: '',
    phone: '',
    email: '',
    address: '',
    zoneId: 'z1',
    serviceType: 'AC Deep Cleaning',
    priority: 'normal',
    requestedDate: '',
    requestedSlot: '10:00 AM - 12:00 PM',
    equipmentBrand: '',
    equipmentModel: '',
    notes: ''
  })

  React.useEffect(() => {
    if (isEditMode) {
      const fetchSR = async () => {
        try {
          const data = await serviceRequestRepository.getSRById(id!)
          if (data) {
            setFormData({
              customerId: data.customer.id,
              customerName: data.customer.name,
              phone: data.customer.phone,
              email: data.customer.email,
              address: data.location.address,
              zoneId: data.location.zoneId,
              serviceType: data.serviceType,
              priority: data.priority,
              requestedDate: data.scheduling.requestedDate,
              requestedSlot: data.scheduling.requestedSlot,
              equipmentBrand: data.equipment.brand,
              equipmentModel: data.equipment.model,
              notes: data.internalNotes[0]?.content || ''
            })
          }
        } catch (error) {
          toast.error("Failed to fetch SR details")
        } finally {
          setIsFetching(false)
        }
      }
      fetchSR()
    }
  }, [id, isEditMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isEditMode) {
        await serviceRequestRepository.updateSR(id!, {
          priority: formData.priority as any,
          serviceType: formData.serviceType,
          location: {
            ...formData, // Simplified for mock, usually we'd merge
            address: formData.address,
            zoneId: formData.zoneId,
            city: 'Mumbai'
          },
          equipment: {
            brand: formData.equipmentBrand,
            model: formData.equipmentModel,
            type: 'Split AC',
            tonnage: '1.5 Ton'
          },
          scheduling: {
            requestedDate: formData.requestedDate,
            requestedSlot: formData.requestedSlot
          }
        })
        toast.success("Service Request updated successfully")
        navigate(`/service-requests/${id}`)
      } else {
        const newSR = await serviceRequestRepository.createSR({
          srNumber: 'SR-' + Math.floor(Math.random() * 100000),
          priority: formData.priority as any,
          serviceType: formData.serviceType,
          customer: {
            id: formData.customerId || 'temp',
            name: formData.customerName,
            phone: formData.phone,
            email: formData.email,
            type: 'residential',
            isAMC: false
          },
          location: {
            address: formData.address,
            zoneId: formData.zoneId,
            city: 'Mumbai'
          },
          equipment: {
            brand: formData.equipmentBrand,
            model: formData.equipmentModel,
            type: 'Split AC',
            tonnage: '1.5 Ton'
          },
          scheduling: {
            requestedDate: formData.requestedDate,
            requestedSlot: formData.requestedSlot
          }
        });
        toast.success(`Service Request ${newSR.srNumber} created successfully`);
        navigate(`/service-requests/${newSR.id}`);
      }
    } catch (error) {
      toast.error(isEditMode ? "Failed to update SR" : "Failed to create SR");
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
          <h1 className="text-2xl font-bold text-brand-navy">{isEditMode ? 'Edit Service Request' : 'Create Service Request'}</h1>
          <p className="text-sm text-brand-muted">{isEditMode ? 'Update job details and scheduling' : 'Manual SR entry for inbound calls'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Info */}
        <AdminCard className="p-6">
          <SectionHeader title="Customer Information" icon={<User size={18} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                <input 
                  type="text"
                  placeholder="Search existing customer by name or phone..."
                  className="w-full pl-10 pr-4 py-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-sm focus:border-brand-gold outline-none"
                />
              </div>
            </div>
            <AdminTextField 
              label="Customer Name" 
              required
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            />
            <AdminTextField 
              label="Phone Number" 
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <AdminTextField 
              label="Email Address" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
        </AdminCard>

        {/* Service & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminCard className="p-6">
            <SectionHeader title="Service Details" icon={<Wrench size={18} />} />
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1 block">Service Type</label>
                <select 
                  className="w-full p-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-sm focus:border-brand-gold outline-none"
                  value={formData.serviceType}
                  onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                >
                  <option>AC Deep Cleaning</option>
                  <option>Gas Charging</option>
                  <option>Installation</option>
                  <option>Repair</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1 block">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {['normal', 'urgent', 'emergency'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({...formData, priority: p})}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                        formData.priority === p 
                          ? "bg-brand-navy text-brand-gold border-brand-navy" 
                          : "bg-white text-brand-muted border-border hover:border-brand-navy"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Location" icon={<MapPin size={18} />} />
            <div className="space-y-4 mt-4">
              <AdminTextField 
                label="Full Address" 
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
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
        </div>

        {/* Scheduling & Equipment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminCard className="p-6">
            <SectionHeader title="Scheduling" icon={<Calendar size={18} />} />
            <div className="space-y-4 mt-4">
              <AdminTextField 
                label="Requested Date" 
                type="date"
                required
                value={formData.requestedDate}
                onChange={(e) => setFormData({...formData, requestedDate: e.target.value})}
              />
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1 block">Preferred Slot</label>
                <select 
                  className="w-full p-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-sm focus:border-brand-gold outline-none"
                  value={formData.requestedSlot}
                  onChange={(e) => setFormData({...formData, requestedSlot: e.target.value})}
                >
                  <option>10:00 AM - 12:00 PM</option>
                  <option>12:00 PM - 02:00 PM</option>
                  <option>02:00 PM - 04:00 PM</option>
                  <option>04:00 PM - 06:00 PM</option>
                </select>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Equipment Details" icon={<AlertTriangle size={18} />} />
            <div className="space-y-4 mt-4">
              <AdminTextField 
                label="Brand" 
                placeholder="e.g. Daikin, LG"
                value={formData.equipmentBrand}
                onChange={(e) => setFormData({...formData, equipmentBrand: e.target.value})}
              />
              <AdminTextField 
                label="Model / Type" 
                placeholder="e.g. Split AC 1.5 Ton"
                value={formData.equipmentModel}
                onChange={(e) => setFormData({...formData, equipmentModel: e.target.value})}
              />
            </div>
          </AdminCard>
        </div>

        <div className="flex items-center justify-end gap-4">
          <AdminButton variant="outline" onClick={() => navigate(-1)} type="button">
            Cancel
          </AdminButton>
          <AdminButton 
            type="submit"
            isLoading={isLoading}
            iconLeft={<Save size={18} />}
          >
            Create Service Request
          </AdminButton>
        </div>
      </form>
    </div>
  )
}
