/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { equipmentRepository, WarrantyRecord } from "@/core/network/equipment-repository"
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar, 
  Wrench, 
  User, 
  ChevronRight,
  AlertTriangle,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function WarrantyManagement() {
  const navigate = useNavigate();
  const [warranties, setWarranties] = React.useState<WarrantyRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchWarranties = async () => {
      try {
        const data = await equipmentRepository.getWarrantyRecords({});
        setWarranties(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWarranties();
  }, [])

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Warranty Management</h1>
        <p className="text-sm text-brand-muted">Track parts replacement warranties and equipment coverage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-brand-navy text-brand-gold rounded-[32px] flex flex-col justify-between">
          <ShieldCheck size={32} className="mb-4 opacity-50" />
          <div>
            <p className="text-3xl font-bold">42</p>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Active Warranties</p>
          </div>
        </div>
        <div className="p-6 bg-status-pending text-white rounded-[32px] flex flex-col justify-between">
          <Clock size={32} className="mb-4 opacity-50" />
          <div>
            <p className="text-3xl font-bold">8</p>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Expiring Soon</p>
          </div>
        </div>
        <div className="p-6 bg-white border border-border rounded-[32px] flex flex-col justify-between">
          <AlertTriangle size={32} className="mb-4 text-status-emergency opacity-50" />
          <div>
            <p className="text-3xl font-bold text-brand-navy">15</p>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">Expired Recently</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by Equipment ID or Part..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-brand-navy text-brand-gold rounded-xl text-xs font-bold uppercase tracking-widest">Active</button>
          <button className="px-4 py-2 bg-white text-brand-muted border border-border rounded-xl text-xs font-bold uppercase tracking-widest">Expiring</button>
        </div>
      </div>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border bg-brand-navy/[0.02]">
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Equipment ID</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Part Replaced</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Replacement Date</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Warranty Expiry</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Technician</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {warranties.map(w => (
                <tr key={w.id} className="hover:bg-brand-navy/[0.01] transition-colors group">
                  <td className="p-6">
                    <button onClick={() => navigate(`/equipment/${w.equipmentId}`)} className="text-sm font-bold text-brand-navy hover:text-brand-gold transition-colors">
                      {w.equipmentDisplayId}
                    </button>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-bold text-brand-navy">{w.partName}</span>
                  </td>
                  <td className="p-6 text-sm text-brand-muted">{w.replacementDate}</td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-brand-navy">{w.expiryDate}</span>
                      <span className="text-[10px] text-status-completed font-bold uppercase tracking-widest">60 Days Left</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="size-6 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy">
                        <User size={12} />
                      </div>
                      <span className="text-xs font-bold text-brand-navy">{w.technicianName}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <button onClick={() => navigate(`/jobs/${w.srId}`)} className="p-2 text-brand-muted hover:text-brand-gold transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  )
}
