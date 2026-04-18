/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader } from "@/components/shared/Layout"
import { 
  Settings, 
  Wrench, 
  MapPin, 
  CreditCard, 
  Clock, 
  ShieldCheck, 
  Bell, 
  FileText,
  ChevronRight,
  History,
  Users
} from "lucide-react"
import { useNavigate } from "react-router-dom"

interface ConfigCategory {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    description: string;
  }[];
}

export default function SystemConfigHomeScreen() {
  const navigate = useNavigate()

  const categories: ConfigCategory[] = [
    {
      title: "Service Catalog",
      items: [
        { id: 'st', label: 'Service Types', icon: <Wrench size={20} />, path: '/settings/master/services', description: 'Manage AC services, repairs, and AMC plans' },
        { id: 'eb', label: 'Equipment Brands', icon: <Settings size={20} />, path: '/settings/master/brands', description: 'AC brands and model catalog' },
      ]
    },
    {
      title: "Geography & Operations",
      items: [
        { id: 'zm', label: 'Zone Management', icon: <MapPin size={20} />, path: '/settings/branches', description: 'Service zones and PIN code mapping' },
        { id: 'bh', label: 'Business Hours', icon: <Clock size={20} />, path: '/settings/master/hours', description: 'Working days, slots, and holidays' },
        { id: 'sla', label: 'SLA Targets', icon: <ShieldCheck size={20} />, path: '/settings/master/sla', description: 'Response and resolution time targets' },
      ]
    },
    {
      title: "Pricing & Finance",
      items: [
        { id: 'pr', label: 'Pricing Rules', icon: <CreditCard size={20} />, path: '/settings/master/pricing', description: 'Service price matrix and surcharges' },
        { id: 'tax', label: 'Tax Configuration', icon: <FileText size={20} />, path: '/settings/master/tax', description: 'GST/VAT rates and HSN codes' },
      ]
    },
    {
      title: "Communication & Workflow",
      items: [
        { id: 'notif', label: 'Notifications', icon: <Bell size={20} />, path: '/settings/master/notifications', description: 'Trigger settings and escalation rules' },
        { id: 'wf', label: 'Job Workflow', icon: <History size={20} />, path: '/settings/master/workflow', description: 'Status transitions and automation' },
      ]
    },
    {
      title: "Team & Access Control",
      items: [
        { id: 'um', label: 'User Management', icon: <Users size={20} />, path: '/settings/users', description: 'Internal staff onboard, access, and status' },
        { id: 'rm', label: 'Role Permissions', icon: <ShieldCheck size={20} />, path: '/settings/roles', description: 'RBAC matrix and module access rules' },
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">System Configuration</h1>
          <p className="text-sm text-brand-muted">Manage the core business rules and master data</p>
        </div>
        <div className="flex items-center gap-2 bg-brand-gold/10 px-4 py-2 rounded-full border border-brand-gold/20">
          <History size={16} className="text-brand-gold" />
          <span className="text-[10px] font-bold text-brand-navy uppercase tracking-widest">Last Update: 2h ago</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {categories.map((category, catIndex) => (
          <div key={category.title} className="space-y-4">
            <SectionHeader title={category.title} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((item, itemIndex) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (catIndex * 0.1) + (itemIndex * 0.05) }}
                >
                  <AdminCard 
                    onClick={() => navigate(item.path)}
                    className="p-5 hover:border-brand-gold transition-all cursor-pointer group h-full flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-brand-navy/5 rounded-xl text-brand-navy group-hover:bg-brand-navy group-hover:text-brand-gold transition-colors">
                        {item.icon}
                      </div>
                      <ChevronRight size={18} className="text-brand-muted group-hover:text-brand-gold transition-transform group-hover:translate-x-1" />
                    </div>
                    <h3 className="font-bold text-brand-navy mb-1">{item.label}</h3>
                    <p className="text-xs text-brand-muted leading-relaxed">{item.description}</p>
                  </AdminCard>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
