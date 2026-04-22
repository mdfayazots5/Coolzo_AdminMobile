/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader } from "@/components/shared/Layout"
import { Clock, CreditCard, FileText, History, MapPin, Settings, ShieldCheck, Users, Wrench } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { LocalStorage, StorageKey } from "@/core/storage/local-storage"

interface ConfigCategory {
  title: string
  items: {
    id: string
    label: string
    icon: React.ReactNode
    path: string
    description: string
  }[]
}

const formatRelativeConfigTimestamp = () => {
  const timestamps = [
    LocalStorage.get<string>(StorageKey.CONFIGURATION_LOADED_AT),
    LocalStorage.get<string>(StorageKey.MASTER_DATA_LOADED_AT),
  ].filter(Boolean) as string[]

  if (timestamps.length === 0) {
    return "Not synced yet"
  }

  const latest = timestamps.sort().reverse()[0]
  const diffMs = Date.now() - new Date(latest).getTime()

  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "Recently synced"
  }

  const diffMinutes = Math.round(diffMs / 60000)
  if (diffMinutes < 1) {
    return "Just now"
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

export default function SystemConfigHomeScreen() {
  const navigate = useNavigate()
  const [lastUpdated, setLastUpdated] = React.useState(formatRelativeConfigTimestamp)

  React.useEffect(() => {
    setLastUpdated(formatRelativeConfigTimestamp())
  }, [])

  const categories: ConfigCategory[] = [
    {
      title: "Master Catalogs",
      items: [
        {
          id: "catalog",
          label: "Service & Equipment",
          icon: <Wrench size={20} />,
          path: "/settings/master/services",
          description: "Service types, subtypes, brands, and model mappings",
        },
        {
          id: "zones",
          label: "Zone Management",
          icon: <MapPin size={20} />,
          path: "/settings/master/zones",
          description: "Service areas, PIN code coverage, and branch ownership",
        },
      ],
    },
    {
      title: "Operations Rules",
      items: [
        {
          id: "hours",
          label: "Business Hours",
          icon: <Clock size={20} />,
          path: "/settings/master/hours",
          description: "Working days, holidays, and slot-generation controls",
        },
        {
          id: "workflow",
          label: "Workflow & SLA",
          icon: <ShieldCheck size={20} />,
          path: "/settings/master/workflow",
          description: "Statuses, urgency levels, skill tags, and escalation policies",
        },
      ],
    },
    {
      title: "Commercial Controls",
      items: [
        {
          id: "pricing",
          label: "Pricing & Warranty",
          icon: <CreditCard size={20} />,
          path: "/settings/master/pricing",
          description: "Pricing matrix, AMC plans, payment terms, and warranty periods",
        },
        {
          id: "tax",
          label: "Tax & Invoice",
          icon: <FileText size={20} />,
          path: "/settings/master/tax",
          description: "Tax categories, invoice prefixes, and numbering rules",
        },
      ],
    },
    {
      title: "Access & People",
      items: [
        {
          id: "users",
          label: "User Management",
          icon: <Users size={20} />,
          path: "/settings/users",
          description: "Internal staff onboarding, access state, and credentials",
        },
        {
          id: "roles",
          label: "Role Permissions",
          icon: <Settings size={20} />,
          path: "/settings/roles",
          description: "RBAC matrix and module-level permission policies",
        },
      ],
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">System Configuration</h1>
          <p className="text-sm text-brand-muted">Manage core business rules, master data, and operational defaults.</p>
        </div>
        <div className="flex items-center gap-2 bg-brand-gold/10 px-4 py-2 rounded-full border border-brand-gold/20">
          <History size={16} className="text-brand-gold" />
          <span className="text-[10px] font-bold text-brand-navy uppercase tracking-widest">
            Config Sync: {lastUpdated}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {categories.map((category, categoryIndex) => (
          <div key={category.title} className="space-y-4">
            <SectionHeader title={category.title} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.items.map((item, itemIndex) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (categoryIndex * 0.1) + (itemIndex * 0.05) }}
                >
                  <AdminCard
                    onClick={() => navigate(item.path)}
                    className="p-5 hover:border-brand-gold transition-all cursor-pointer group h-full flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-brand-navy/5 rounded-xl text-brand-navy group-hover:bg-brand-navy group-hover:text-brand-gold transition-colors">
                        {item.icon}
                      </div>
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
