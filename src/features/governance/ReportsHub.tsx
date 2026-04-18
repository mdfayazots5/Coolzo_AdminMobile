/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  Users, 
  Package, 
  ShieldCheck, 
  Download, 
  Calendar,
  ChevronRight,
  Clock,
  Search
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function ReportsHub() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("")

  const reportCategories = [
    {
      title: 'Operations Reports',
      icon: <ShieldCheck size={18} />,
      reports: [
        { id: 'daily-job-sheet', name: 'Daily Job Sheet', description: 'Technician-wise job schedule for the day' },
        { id: 'sla-compliance', name: 'SLA Compliance Report', description: 'Response and resolution time analysis' },
        { id: 'technician-performance', name: 'Technician Performance', description: 'Ratings, completion rates, and revenue' }
      ]
    },
    {
      title: 'Financial Reports',
      icon: <TrendingUp size={18} />,
      reports: [
        { id: 'revenue-summary', name: 'Financial Summary', description: 'Revenue, collections, and outstanding balance' },
        { id: 'tax-liability', name: 'Tax Liability Report', description: 'GST output tax summary for filing' },
        { id: 'discount-usage', name: 'Discount & Coupon ROI', description: 'Analysis of promotional costs vs revenue' }
      ]
    },
    {
      title: 'Customer & Inventory',
      icon: <Users size={18} />,
      reports: [
        { id: 'customer-retention', name: 'Customer Retention', description: 'Churn analysis and booking frequency' },
        { id: 'amc-performance', name: 'AMC Performance', description: 'Contract enrollment and renewal rates' },
        { id: 'parts-consumption', name: 'Parts Consumption', description: 'Inventory usage and cost analysis' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Reports Hub</h1>
          <p className="text-sm text-brand-muted">Centralized intelligence and operational reporting</p>
        </div>
        <div className="flex gap-2">
          <AdminButton 
            variant="outline" 
            icon={<Clock size={18} />}
            onClick={() => toast.info('Scheduled reports management coming soon')}
          >
            Scheduled Reports
          </AdminButton>
        </div>
      </div>

      <div className="relative mb-8">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input 
          type="text" 
          placeholder="Search for a report by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-[32px] text-sm focus:ring-2 focus:ring-brand-gold outline-none shadow-sm transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {reportCategories.map((cat, i) => (
          <div key={i} className="space-y-4">
            <div className="flex items-center gap-2 px-4">
              <div className="p-2 bg-brand-navy/5 rounded-xl text-brand-navy">
                {cat.icon}
              </div>
              <h2 className="font-bold text-brand-navy uppercase tracking-widest text-xs">{cat.title}</h2>
            </div>
            <div className="space-y-3">
              {cat.reports.filter(r => 
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                r.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((report, idx) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (i * 3 + idx) * 0.05 }}
                >
                  <AdminCard className="p-5 hover:border-brand-gold transition-all group cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-brand-navy group-hover:text-brand-gold transition-colors">{report.name}</h3>
                        <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">{report.description}</p>
                      </div>
                      <ChevronRight size={16} className="text-brand-gold group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success(`Generating ${report.name}...`);
                        }}
                        className="text-[10px] font-bold text-brand-navy uppercase tracking-widest flex items-center gap-1 hover:text-brand-gold"
                      >
                        <Calendar size={10} /> Run
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success(`Exporting ${report.name} as PDF...`);
                        }}
                        className="text-[10px] font-bold text-brand-navy uppercase tracking-widest flex items-center gap-1 hover:text-brand-gold"
                      >
                        <Download size={10} /> Export
                      </button>
                    </div>
                  </AdminCard>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AdminCard className="p-8 bg-brand-navy text-white mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="size-16 bg-brand-gold/20 rounded-[24px] flex items-center justify-center text-brand-gold">
              <BarChart3 size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Custom Report Builder</h2>
              <p className="text-sm text-white/60">Need something specific? Create a custom report with your own parameters.</p>
            </div>
          </div>
          <AdminButton 
            className="bg-brand-gold text-brand-navy hover:bg-white"
            onClick={() => toast.info('Custom Report Builder will be available in the next version.')}
          >
            Launch Builder
          </AdminButton>
        </div>
      </AdminCard>
    </div>
  )
}
