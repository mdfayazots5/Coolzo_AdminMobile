/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { toast } from "sonner"
import { Clock, FileText, Globe, HelpCircle, Image as ImageIcon, Layout, MessageSquare, Plus } from "lucide-react"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { InlineLoader } from "@/components/shared/Layout"
import { CMSContent, governanceRepository } from "@/core/network/governance-repository"
import { cn } from "@/lib/utils"

const tabs: Array<{ type: CMSContent["type"]; label: string; icon: React.ReactNode }> = [
  { type: "banner", label: "Banners", icon: <ImageIcon size={16} /> },
  { type: "service_description", label: "Services", icon: <FileText size={16} /> },
  { type: "faq", label: "FAQs", icon: <HelpCircle size={16} /> },
  { type: "article", label: "Articles", icon: <MessageSquare size={16} /> },
  { type: "footer", label: "Footer", icon: <Layout size={16} /> },
]

export default function CMSManager() {
  const [content, setContent] = React.useState<CMSContent[]>([])
  const [activeTab, setActiveTab] = React.useState<CMSContent["type"]>("banner")
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const loadContent = async () => {
      try {
        setContent(await governanceRepository.getCMSContent())
      } finally {
        setIsLoading(false)
      }
    }

    void loadContent()
  }, [])

  const filtered = content.filter((item) => item.type === activeTab)

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Website CMS</h1>
          <p className="text-sm text-brand-muted">Blocks, banners, FAQ, content pages, and footer controls</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<Globe size={18} />} onClick={() => toast.success("Live site preview link ready")}>
            View Live Site
          </AdminButton>
          <AdminButton icon={<Plus size={18} />} onClick={async () => {
            const created = await governanceRepository.createCMSContent({ type: activeTab, title: `New ${activeTab}`, content: {}, status: "draft" })
            setContent((current) => [created, ...current])
            toast.success(`New ${activeTab} content created`)
          }}>
            Add New
          </AdminButton>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === tab.type ? "bg-brand-navy text-brand-gold" : "border border-border bg-white text-brand-muted",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <CMSCard
            key={item.id}
            item={item}
            onSave={async (next) => {
              const updated = await governanceRepository.updateCMSContent(item.id, next)
              setContent((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)))
              toast.success("CMS content updated")
            }}
          />
        ))}
      </div>
    </div>
  )
}

function CMSCard({ item, onSave }: { key?: React.Key; item: CMSContent; onSave: (next: Partial<CMSContent>) => Promise<void> }) {
  const [title, setTitle] = React.useState(item.title)
  const [payload, setPayload] = React.useState(JSON.stringify(item.content, null, 2))

  return (
    <AdminCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", item.status === "published" ? "bg-status-completed/10 text-status-completed" : "bg-brand-muted/10 text-brand-muted")}>
          {item.status}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-brand-muted">
          <Clock size={10} />
          {new Date(item.lastUpdated).toLocaleDateString()}
        </span>
      </div>
      <div className="space-y-4">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-2xl bg-brand-navy/5 px-4 py-3 text-sm font-bold text-brand-navy outline-none focus:ring-2 focus:ring-brand-gold"
        />
        <textarea
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
          className="min-h-[220px] w-full rounded-3xl bg-brand-navy/5 p-4 text-xs font-mono text-brand-navy outline-none focus:ring-2 focus:ring-brand-gold"
        />
        <AdminButton className="w-full" onClick={() => void onSave({ title, content: safeJsonParse(payload) })}>
          Save Content
        </AdminButton>
      </div>
    </AdminCard>
  )
}

function safeJsonParse(payload: string) {
  try {
    return JSON.parse(payload)
  } catch {
    return { raw: payload }
  }
}
