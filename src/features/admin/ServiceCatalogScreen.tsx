/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { StatusBadge } from "@/components/shared/Badges"
import { masterDataRepository, ServiceType } from "@/core/network/master-data-repository"
import { Wrench, Plus, ChevronRight, Clock, CreditCard } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"

export default function ServiceCatalogScreen() {
  const [services, setServices] = React.useState<ServiceType[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const navigate = useNavigate()

  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await masterDataRepository.getServiceTypes()
        setServices(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchServices()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Service Catalog</h1>
          <p className="text-sm text-brand-muted">Manage AC service types, pricing, and durations</p>
        </div>
        <AdminButton 
          onClick={() => {}}
          iconLeft={<Plus size={18} />}
        >
          Add Service Type
        </AdminButton>
      </div>

      <SectionHeader title="Active Service Types" />

      {isLoading ? (
        <InlineLoader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <AdminCard className="p-6 hover:border-brand-gold transition-all group h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-brand-navy/5 rounded-2xl text-brand-navy group-hover:bg-brand-navy group-hover:text-brand-gold transition-colors">
                    <Wrench size={24} />
                  </div>
                  <StatusBadge status={service.status === 'active' ? 'completed' : 'closed'}>
                    {service.status}
                  </StatusBadge>
                </div>
                
                <h3 className="text-lg font-bold text-brand-navy mb-1">{service.name}</h3>
                <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest mb-4">{service.category}</p>
                <p className="text-sm text-brand-muted mb-6 flex-1 leading-relaxed">{service.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-brand-muted" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Duration</span>
                    </div>
                    <p className="text-sm font-bold text-brand-navy">{service.duration} mins</p>
                  </div>
                  <div className="p-3 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard size={14} className="text-brand-muted" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Base Price</span>
                    </div>
                    <p className="text-sm font-bold text-brand-navy">₹{service.basePrice}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <button className="text-xs font-bold text-brand-navy hover:text-brand-gold transition-colors uppercase tracking-wider">
                    Edit Configuration
                  </button>
                  <div className="text-brand-muted group-hover:text-brand-gold transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
