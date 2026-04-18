/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { governanceRepository, Coupon } from "@/core/network/governance-repository"
import { 
  Plus, 
  Tag, 
  Calendar, 
  Users, 
  TrendingUp, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  Search,
  DollarSign,
  Percent
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function CouponManager() {
  const [coupons, setCoupons] = React.useState<Coupon[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const data = await governanceRepository.getCoupons();
        setCoupons(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCoupons();
  }, [])

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Coupons & Discounts</h1>
          <p className="text-sm text-brand-muted">Manage promotional codes and marketing campaigns</p>
        </div>
        <div className="flex gap-2">
          <AdminButton icon={<Plus size={18} />}>Create New Coupon</AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard label="Total Active Coupons" value={coupons.filter(c => c.status === 'active').length} icon={<Tag size={20} />} />
        <MetricCard label="Total Usage" value={coupons.reduce((acc, c) => acc + c.currentUsage, 0)} icon={<Users size={20} />} />
        <MetricCard label="Revenue from Coupons" value="₹1.2L" icon={<TrendingUp size={20} />} />
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input 
          type="text" 
          placeholder="Search by coupon code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCoupons.map((coupon, idx) => (
          <motion.div
            key={coupon.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <AdminCard className="p-6 relative overflow-hidden group">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-brand-navy text-brand-gold rounded-2xl flex items-center justify-center font-bold text-lg">
                    {coupon.discountType === 'percentage' ? <Percent size={24} /> : <DollarSign size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-navy tracking-tight">{coupon.code}</h3>
                    <p className="text-xs text-brand-muted font-medium">
                      {coupon.discountType === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-brand-muted hover:text-brand-gold transition-colors">
                    <Edit3 size={18} />
                  </button>
                  <button className="p-2 text-brand-muted hover:text-status-emergency transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Usage</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-brand-navy/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-gold" 
                        style={{ width: `${(coupon.currentUsage / coupon.usageLimit) * 100}%` }} 
                      />
                    </div>
                    <span className="text-[10px] font-bold text-brand-navy">{coupon.currentUsage}/{coupon.usageLimit}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Expiry Date</p>
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-navy">
                    <Calendar size={14} className="text-brand-muted" />
                    {new Date(coupon.expiryDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1",
                  coupon.status === 'active' ? "bg-status-completed/10 text-status-completed" : "bg-brand-muted/10 text-brand-muted"
                )}>
                  {coupon.status === 'active' ? <CheckCircle2 size={10} /> : <XCircle size={10} />} {coupon.status}
                </span>
                <AdminButton variant="ghost" size="sm" className="text-brand-gold">View Analytics</AdminButton>
              </div>
            </AdminCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon }: any) {
  return (
    <AdminCard className="p-6 flex items-center gap-6">
      <div className="p-3 bg-brand-navy/5 rounded-2xl text-brand-navy">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-bold text-brand-navy">{value}</p>
      </div>
    </AdminCard>
  )
}
