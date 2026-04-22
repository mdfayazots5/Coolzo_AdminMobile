/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { FilterBar } from "@/components/shared/FilterBar"
import { SRCard } from "@/components/shared/SRCard"
import { serviceRequestRepository, ServiceRequest } from "@/core/network/service-request-repository"
import { Plus, Search, Filter, LayoutGrid, List } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AdminButton } from "@/components/shared/AdminButton"
import { toast } from "sonner"

export default function SRListScreen() {
  const [srs, setSrs] = React.useState<ServiceRequest[]>([])
  const [filteredSrs, setFilteredSrs] = React.useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  React.useEffect(() => {
    const fetchSRs = async () => {
      try {
        const statusFilter = searchParams.get('status') || undefined
        const data = await serviceRequestRepository.getSRs({
          status: statusFilter,
        });
        setSrs(data);
        setFilteredSrs(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSRs();
  }, [searchParams])

  const handleSearch = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const filtered = srs.filter(sr => 
      sr.srNumber.toLowerCase().includes(lowerQuery) || 
      sr.customer.name.toLowerCase().includes(lowerQuery) ||
      sr.customer.phone.includes(query)
    );
    setFilteredSrs(filtered);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Service Requests</h1>
          <p className="text-sm text-brand-muted">Manage and track all customer service jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-brand-navy/5 p-1 rounded-lg border border-brand-navy/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'grid' ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted hover:text-brand-navy"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'list' ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted hover:text-brand-navy"
              )}
            >
              <List size={18} />
            </button>
          </div>
          <AdminButton 
            onClick={() => navigate('/service-requests/create')}
            iconLeft={<Plus size={18} />}
          >
            Create SR
          </AdminButton>
        </div>
      </div>

      <FilterBar 
        onSearch={handleSearch}
        onFilter={() => toast.info("Advanced filters coming soon")}
        placeholder="Search SR#, Customer, Phone..."
      />

      {isLoading ? (
        <InlineLoader />
      ) : (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          <AnimatePresence mode="popLayout">
            {filteredSrs.map((sr, index) => (
              <motion.div
                key={sr.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <SRCard 
                  sr={sr} 
                  onClick={() => navigate(`/service-requests/${sr.id}`)}
                  className={viewMode === 'list' ? "flex flex-row items-center gap-6" : ""}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
