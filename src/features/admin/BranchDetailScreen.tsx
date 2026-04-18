/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { branchRepository } from "@/core/network/branch-repository"
import { Branch, userRepository, User } from "@/core/network/user-repository"
import { FullPageLoader, SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Wrench, 
  Edit2, 
  Building2, 
  Map as MapIcon,
  Search,
  Plus
} from "lucide-react"
import { toast } from "sonner"
import { UserCard } from "@/components/shared/UserCard"

export default function BranchDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const [branch, setBranch] = React.useState<Branch | null>(null)
  const [staff, setStaff] = React.useState<User[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const navigate = useNavigate()

  React.useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      try {
        const [branchData, allUsers] = await Promise.all([
          branchRepository.getBranchById(id),
          userRepository.getUsers({})
        ])
        
        if (branchData) {
          setBranch(branchData)
          setStaff(allUsers.filter(u => u.branchId === branchData.id))
        } else {
          toast.error("Branch not found")
          navigate("/settings/branches")
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [id, navigate])

  if (isLoading) return <FullPageLoader label="Fetching branch operational data..." />
  if (!branch) return null

  // Mock zones for demonstration
  const assignedZones = [
    { id: 'Z1', pinCode: '500034', name: 'Banjara Hills' },
    { id: 'Z2', pinCode: '500081', name: 'Hitech City' },
    { id: 'Z3', pinCode: '500033', name: 'Jubilee Hills' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate("/settings/branches")}
          className="flex items-center gap-2 text-brand-muted hover:text-brand-navy transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">All Branches</span>
        </button>
        <AdminButton 
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/settings/branches/${branch.id}/edit`)}
          iconLeft={<Edit2 size={16} />}
        >
          Edit Configuration
        </AdminButton>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Branch Info */}
        <div className="flex-1 space-y-8">
          <div className="flex items-start gap-6">
            <div className="size-20 bg-brand-navy rounded-3xl flex items-center justify-center text-brand-gold shadow-xl">
              <Building2 size={40} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-brand-navy">{branch.name}</h1>
                <div className="px-2 py-0.5 bg-brand-gold text-brand-navy text-[10px] font-bold rounded-full uppercase tracking-tighter">
                  Branch ID: {branch.id}
                </div>
              </div>
              <p className="flex items-center gap-2 text-brand-muted mb-4">
                <MapPin size={16} />
                {branch.address}, {branch.city}
              </p>
              
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
                  <Users size={16} className="text-brand-gold" />
                  <span className="text-sm font-bold text-brand-navy">{branch.technicianCount} Field Staff</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-navy/5 rounded-xl border border-brand-navy/10">
                  <Wrench size={16} className="text-brand-gold" />
                  <span className="text-sm font-bold text-brand-navy">{branch.srCount} Active SRs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <SectionHeader title="Staff Assigned" className="mb-0 border-0 pt-0" />
              <div className="flex items-center gap-2 px-3 py-1 bg-brand-navy/5 rounded-lg border border-brand-navy/10">
                <Search size={14} className="text-brand-muted" />
                <input placeholder="Search staff..." className="bg-transparent text-xs outline-none w-32 border-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((member) => (
                <div key={member.id}>
                  <UserCard 
                    user={member} 
                    onClick={() => navigate(`/settings/users/${member.id}`)}
                  />
                </div>
              ))}
              {staff.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-border rounded-2xl p-8 text-center text-brand-muted">
                  No staff members currently assigned to this branch.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Zone Mapping */}
        <div className="w-full lg:w-96 space-y-6">
          <AdminCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapIcon size={20} className="text-brand-navy" />
                <h3 className="font-bold text-brand-navy">Service Zones</h3>
              </div>
              <button 
                onClick={() => toast.info("Radius mapping tool coming soon")}
                className="p-2 hover:bg-brand-navy/5 rounded-lg text-brand-gold transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {assignedZones.map((zone) => (
                <div key={zone.id} className="p-4 bg-brand-navy/5 rounded-xl border border-brand-navy/10 flex items-center justify-between group hover:border-brand-gold transition-colors">
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{zone.name}</p>
                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{zone.pinCode}</p>
                  </div>
                  <div className="px-2 py-1 bg-white border border-border rounded text-[10px] font-bold text-brand-muted group-hover:text-brand-gold transition-colors">
                    Active
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-brand-muted text-center mb-4">
                Zone configuration affects technician assignment and service availability for customers.
              </p>
              <AdminButton 
                variant="outline" 
                fullWidth 
                size="sm"
                className="border-brand-navy/10"
              >
                Manage All Zones
              </AdminButton>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
