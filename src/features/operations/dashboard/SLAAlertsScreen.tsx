/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { StatusBadge } from "@/components/shared/Badges"
import { serviceRequestRepository, ServiceRequest } from "@/core/network/service-request-repository"
import { 
  ArrowLeft, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  User, 
  Zap,
  ShieldAlert,
  Search,
  Filter,
  MoreVertical,
  Flag,
  ChevronRight
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function SLAAlertsScreen() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = React.useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await serviceRequestRepository.getSLAAlerts();
        setAlerts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAlerts();
  }, [])

  const filteredAlerts = alerts.filter(sr => 
    sr.srNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sr.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEscalate = (sr: ServiceRequest) => {
    toast.error(`SLA Escalation Level 2 triggered for ${sr.srNumber}`, {
      description: "Regional Operations Manager has been notified via priority SMS."
    });
  };

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-brand-navy" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
            SLA Breach Queue
            <span className="px-2 py-0.5 bg-status-emergency/10 text-status-emergency text-[10px] font-bold rounded-full uppercase tracking-widest">
              {alerts.length} Active Breaches
            </span>
          </h1>
          <p className="text-sm text-brand-muted">Critical monitoring of service level agreements and priority response</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by SR# or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-sm focus:border-brand-gold outline-none transition-all"
          />
        </div>
        <button className="p-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-brand-navy hover:bg-brand-navy/10 transition-all flex items-center gap-2">
          <Filter size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.map((sr) => (
            <motion.div
              key={sr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <AdminCard className="p-0 overflow-hidden border-l-4 border-l-status-emergency hover:border-brand-gold transition-all group">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex gap-4">
                    <div className="size-12 bg-status-emergency/10 text-status-emergency rounded-2xl flex items-center justify-center shrink-0">
                      <Zap size={24} className="animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-brand-navy">{sr.srNumber}</h4>
                        <span className="px-2 py-0.5 bg-brand-navy/5 text-brand-navy text-[8px] font-bold rounded uppercase tracking-widest">
                          {sr.priority}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-brand-navy mb-1">{sr.customer.name}</p>
                      <p className="text-xs text-brand-muted flex items-center gap-2">
                        <MapPin size={12} /> {sr.location.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-status-emergency mb-1 flex items-center gap-1">
                        <Clock size={12} />
                        MISSED BY 15m
                      </p>
                      <p className="text-[9px] text-brand-muted font-bold uppercase tracking-widest leading-none">
                        Breach Type: First Response
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminButton 
                        variant="outline" 
                        size="sm" 
                        className="text-[10px] font-bold border-status-emergency text-status-emergency hover:bg-status-emergency/5"
                        onClick={() => handleEscalate(sr)}
                      >
                        <Flag size={14} className="mr-1" />
                        Escalate
                      </AdminButton>
                      <AdminButton 
                        size="sm" 
                        className="text-[10px] font-bold"
                        onClick={() => navigate(`/service-requests/${sr.id}`)}
                      >
                        Details
                        <ChevronRight size={14} className="ml-1" />
                      </AdminButton>
                    </div>
                  </div>
                </div>
                
                {/* Audit mini-trail */}
                <div className="px-5 py-3 bg-status-emergency/[0.02] border-top border-border flex items-center gap-4 border-t">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-brand-muted">
                    <AlertTriangle size={12} />
                    <span className="uppercase tracking-widest">Reason:</span>
                    <span className="text-status-emergency">No technician assigned within 30m</span>
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAlerts.length === 0 && (
          <div className="p-20 text-center">
            <ShieldAlert size={48} className="mx-auto mb-4 text-brand-muted/20" />
            <p className="text-sm font-bold text-brand-muted uppercase tracking-widest">No active SLA breaches found</p>
            <p className="text-xs text-brand-muted mt-1 underline cursor-pointer" onClick={() => setSearchQuery("")}>Clear search</p>
          </div>
        )}
      </div>
    </div>
  )
}
