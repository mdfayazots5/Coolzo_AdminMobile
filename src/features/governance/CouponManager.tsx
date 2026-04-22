/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader } from "@/components/shared/Layout"
import { governanceRepository, Coupon, CouponAnalytics } from "@/core/network/governance-repository"
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
  Percent,
  ShieldAlert
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function CouponManager() {
  const [coupons, setCoupons] = React.useState<Coupon[]>([])
  const [analytics, setAnalytics] = React.useState<CouponAnalytics | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [form, setForm] = React.useState({
    id: "",
    code: "",
    discountType: "percentage" as Coupon["discountType"],
    value: "0",
    expiryDate: "",
    usageLimit: "100",
    minOrderValue: "0",
    newCustomerOnly: false,
  })

  React.useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const [couponData, analyticsData] = await Promise.all([
          governanceRepository.getCoupons(),
          governanceRepository.getCouponAnalytics(),
        ])
        setCoupons(couponData);
        setAnalytics(analyticsData);
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

  const startCreate = () => {
    setForm({
      id: "",
      code: "",
      discountType: "percentage",
      value: "0",
      expiryDate: "",
      usageLimit: "100",
      minOrderValue: "0",
      newCustomerOnly: false,
    })
  }

  const startEdit = (coupon: Coupon) => {
    setForm({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      value: String(coupon.value),
      expiryDate: coupon.expiryDate,
      usageLimit: String(coupon.usageLimit),
      minOrderValue: String(coupon.minOrderValue ?? 0),
      newCustomerOnly: Boolean(coupon.newCustomerOnly),
    })
  }

  const handleSave = async () => {
    const payload: Partial<Coupon> = {
      code: form.code.trim(),
      discountType: form.discountType,
      value: Number(form.value),
      expiryDate: form.expiryDate,
      usageLimit: Number(form.usageLimit),
      minOrderValue: Number(form.minOrderValue),
      newCustomerOnly: form.newCustomerOnly,
    }

    try {
      if (form.id) {
        const updated = await governanceRepository.updateCoupon(form.id, payload)
        setCoupons((current) => current.map((item) => (item.id === updated.id ? updated : item)))
        toast.success("Coupon updated")
      } else {
        const created = await governanceRepository.createCoupon(payload)
        setCoupons((current) => [created, ...current])
        toast.success("Coupon created")
      }
      startCreate()
    } catch (error) {
      console.error(error)
      toast.error("Unable to save coupon")
    }
  }

  const handleDisable = async (couponId: string) => {
    try {
      const updated = await governanceRepository.disableCoupon(couponId)
      setCoupons((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      toast.success("Coupon disabled")
    } catch (error) {
      console.error(error)
      toast.error("Unable to disable coupon")
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Coupons & Discounts</h1>
          <p className="text-sm text-brand-muted">Manage promotional codes and marketing campaigns</p>
        </div>
        <div className="flex gap-2">
          <AdminButton icon={<Plus size={18} />} onClick={startCreate}>Create New Coupon</AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard label="Total Active Coupons" value={coupons.filter(c => c.status === 'active').length} icon={<Tag size={20} />} />
        <MetricCard label="Total Usage" value={coupons.reduce((acc, c) => acc + c.currentUsage, 0)} icon={<Users size={20} />} />
        <MetricCard label="Revenue from Coupons" value={`₹${analytics?.associatedRevenue ?? 0}`} icon={<TrendingUp size={20} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-6">
        <div className="space-y-6">
          <div className="relative">
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
            {filteredCoupons.map((coupon) => (
              <AdminCard key={coupon.id} className="p-6 relative overflow-hidden group">
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
                    <button
                      type="button"
                      className="p-2 text-brand-muted hover:text-brand-gold transition-colors"
                      onClick={() => startEdit(coupon)}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      type="button"
                      className="p-2 text-brand-muted hover:text-status-emergency transition-colors"
                      onClick={() => void handleDisable(coupon.id)}
                    >
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
                          style={{ width: `${Math.min((coupon.currentUsage / Math.max(coupon.usageLimit, 1)) * 100, 100)}%` }} 
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
                    coupon.status === 'active'
                      ? "bg-status-completed/10 text-status-completed"
                      : "bg-brand-muted/10 text-brand-muted"
                  )}>
                    {coupon.status === 'active' ? <CheckCircle2 size={10} /> : <XCircle size={10} />} {coupon.status}
                  </span>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted">Min Order</p>
                    <p className="text-xs font-semibold text-brand-navy">₹{coupon.minOrderValue ?? 0}</p>
                  </div>
                </div>
              </AdminCard>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <AdminCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-brand-navy">{form.id ? "Edit Coupon" : "Create Coupon"}</h2>
                <p className="text-xs text-brand-muted">Keep coupon rules aligned with backend constraints.</p>
              </div>
              <Plus size={18} className="text-brand-navy" />
            </div>

            <label className="space-y-1 block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Coupon Code</span>
              <input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-1 block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Type</span>
                <select
                  value={form.discountType}
                  onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value as Coupon["discountType"] }))}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                >
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat</option>
                </select>
              </label>
              <label className="space-y-1 block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Value</span>
                <input
                  value={form.value}
                  onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-1 block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Usage Limit</span>
                <input
                  value={form.usageLimit}
                  onChange={(event) => setForm((current) => ({ ...current, usageLimit: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Min Order Value</span>
                <input
                  value={form.minOrderValue}
                  onChange={(event) => setForm((current) => ({ ...current, minOrderValue: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </label>
            </div>

            <label className="space-y-1 block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Expiry Date</span>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-border bg-brand-navy/[0.02] px-4 py-3">
              <input
                type="checkbox"
                checked={form.newCustomerOnly}
                onChange={(event) => setForm((current) => ({ ...current, newCustomerOnly: event.target.checked }))}
              />
              <span className="text-sm text-brand-navy">New customer only</span>
            </label>

            <AdminButton onClick={() => void handleSave()}>{form.id ? "Update Coupon" : "Create Coupon"}</AdminButton>
          </AdminCard>

          <AdminCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-brand-navy">Coupon Analytics</h2>
                <p className="text-xs text-brand-muted">Redemption value, revenue impact, and abuse flags.</p>
              </div>
              <ShieldAlert size={18} className="text-brand-navy" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-brand-navy/[0.03] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Discount Value</p>
                <p className="mt-2 text-lg font-bold text-brand-navy">₹{analytics?.totalDiscountValue ?? 0}</p>
              </div>
              <div className="rounded-3xl bg-brand-navy/[0.03] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Associated Revenue</p>
                <p className="mt-2 text-lg font-bold text-brand-navy">₹{analytics?.associatedRevenue ?? 0}</p>
              </div>
            </div>
            <div className="space-y-2">
              {(analytics?.abuseSignals ?? []).map((signal) => (
                <div key={signal} className="rounded-2xl border border-border px-4 py-3 text-sm text-brand-navy">
                  {signal}
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
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
