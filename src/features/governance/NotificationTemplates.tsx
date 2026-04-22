/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { toast } from "sonner"
import { Bell, Eye, History, Mail, MessageSquare, Save, Smartphone, Tag, Zap } from "lucide-react"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { InlineLoader } from "@/components/shared/Layout"
import {
  governanceRepository,
  NotificationChannel,
  NotificationSendLog,
  NotificationTemplate,
} from "@/core/network/governance-repository"
import { cn } from "@/lib/utils"

export default function NotificationTemplates() {
  const [templates, setTemplates] = React.useState<NotificationTemplate[]>([])
  const [sendLogs, setSendLogs] = React.useState<NotificationSendLog[]>([])
  const [selectedTemplate, setSelectedTemplate] = React.useState<NotificationTemplate | null>(null)
  const [editBody, setEditBody] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [templateData, logData] = await Promise.all([
          governanceRepository.getNotificationTemplates(),
          governanceRepository.getNotificationSendLogs(),
        ])
        setTemplates(templateData)
        setSendLogs(logData)
        setSelectedTemplate(templateData[0] ?? null)
        setEditBody(templateData[0]?.body ?? "")
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [])

  const selectTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setEditBody(template.body)
  }

  const handleSave = async () => {
    if (!selectedTemplate) return
    const updated = await governanceRepository.updateNotificationTemplate(selectedTemplate.id, {
      body: editBody,
      channelToggles: selectedTemplate.channelToggles,
      isEnabled: selectedTemplate.isEnabled,
    })
    setTemplates((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    setSelectedTemplate(updated)
    toast.success("Template updated")
  }

  const toggleChannel = (channel: NotificationChannel) => {
    if (!selectedTemplate) return
    setSelectedTemplate({
      ...selectedTemplate,
      channelToggles: {
        ...selectedTemplate.channelToggles,
        [channel]: !selectedTemplate.channelToggles[channel],
      },
    })
  }

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Notification Templates</h1>
        <p className="text-sm text-brand-muted">Trigger templates, channel toggles, previews, and delivery logs</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="space-y-4 xl:col-span-1">
          {templates.map((template) => (
            <AdminCard
              key={template.id}
              onClick={() => selectTemplate(template)}
              className={cn(
                "cursor-pointer p-4 transition-all border-2",
                selectedTemplate?.id === template.id ? "border-brand-gold bg-brand-gold/5" : "border-transparent hover:border-brand-navy/20",
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <ChannelIcon channel={template.channel} />
                <span className="text-xs font-bold uppercase tracking-widest text-brand-navy">{template.triggerEvent}</span>
              </div>
              <p className="line-clamp-2 text-xs text-brand-muted">{template.body}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className={cn("rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest", template.isEnabled ? "bg-status-completed/10 text-status-completed" : "bg-brand-muted/10 text-brand-muted")}>
                  {template.isEnabled ? "Enabled" : "Disabled"}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-brand-muted">v{template.version}</span>
              </div>
            </AdminCard>
          ))}
        </div>

        <div className="xl:col-span-2">
          {selectedTemplate ? (
            <AdminCard className="p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-brand-navy">{selectedTemplate.triggerEvent}</h2>
                  <p className="text-[10px] uppercase tracking-widest text-brand-muted">{selectedTemplate.recipientType.replace("_", " ")}</p>
                </div>
                <div className="flex gap-2">
                  <AdminButton variant="outline" size="sm" icon={<History size={14} />}>
                    History
                  </AdminButton>
                  <AdminButton size="sm" icon={<Save size={14} />} onClick={() => void handleSave()}>
                    Save
                  </AdminButton>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">Template Body</label>
                  <textarea
                    value={editBody}
                    onChange={(event) => setEditBody(event.target.value)}
                    className="h-64 w-full rounded-[32px] bg-brand-navy/5 p-6 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
                  />
                </div>

                <div>
                  <label className="mb-3 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">Merge Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.mergeTags.map((tag) => (
                      <button key={tag} onClick={() => setEditBody((current) => `${current}{${tag}}`)} className="flex items-center gap-1 rounded-xl border border-border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-navy">
                        <Tag size={10} />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-3 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">Channel Toggles</label>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {(Object.keys(selectedTemplate.channelToggles) as NotificationChannel[]).map((channel) => (
                      <button
                        key={channel}
                        onClick={() => toggleChannel(channel)}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all",
                          selectedTemplate.channelToggles[channel] ? "border-brand-gold bg-brand-gold/10 text-brand-navy" : "border-border bg-white text-brand-muted",
                        )}
                      >
                        {channel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] border border-brand-gold/20 bg-brand-gold/5 p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Eye size={16} className="text-brand-gold" />
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-navy">Preview</span>
                  </div>
                  <p className="text-sm italic leading-relaxed text-brand-navy">
                    {editBody.replace(/{(\w+)}/g, (_match, value) => {
                      const samples: Record<string, string> = {
                        CustomerName: "Aditi Sharma",
                        TechnicianName: "Suresh Kumar",
                        JobNo: "SR-99281",
                        ETATime: "2:00 PM",
                      }
                      return samples[value] ?? `{${value}}`
                    })}
                  </p>
                </div>

                <div>
                  <label className="mb-3 ml-4 block text-[10px] font-bold uppercase tracking-widest text-brand-muted">Version History</label>
                  <div className="space-y-2">
                    {selectedTemplate.versionHistory.slice(0, 10).map((version) => (
                      <div key={`${selectedTemplate.id}-${version.version}`} className="flex items-center justify-between rounded-2xl bg-brand-navy/5 px-4 py-3">
                        <span className="text-xs font-bold text-brand-navy">v{version.version}</span>
                        <span className="text-[10px] uppercase tracking-widest text-brand-muted">{version.updatedBy}</span>
                        <span className="text-[10px] uppercase tracking-widest text-brand-muted">{new Date(version.updatedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AdminCard>
          ) : null}
        </div>

        <AdminCard className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Zap size={18} className="text-brand-navy" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-navy">Send Log</h3>
          </div>
          <div className="space-y-3">
            {sendLogs.map((log) => (
              <div key={log.id} className="rounded-2xl bg-brand-navy/5 p-4">
                <p className="text-sm font-bold text-brand-navy">{log.triggerEvent}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-muted">{log.channel} • {log.recipient}</p>
                <p className={cn("mt-2 text-[10px] font-bold uppercase tracking-widest", log.status === "failed" ? "text-status-emergency" : "text-status-completed")}>
                  {log.status}
                </p>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}

function ChannelIcon({ channel }: { channel: NotificationChannel }) {
  switch (channel) {
    case "whatsapp":
      return <MessageSquare size={16} className="text-status-completed" />
    case "email":
      return <Mail size={16} className="text-brand-navy" />
    case "push":
      return <Smartphone size={16} className="text-brand-gold" />
    default:
      return <Bell size={16} className="text-brand-muted" />
  }
}
