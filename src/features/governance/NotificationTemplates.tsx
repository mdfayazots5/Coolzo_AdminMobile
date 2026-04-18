/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { governanceRepository, NotificationTemplate } from "@/core/network/governance-repository"
import { 
  Bell, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  Edit3, 
  History, 
  Eye, 
  Save,
  CheckCircle2,
  XCircle,
  Tag
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function NotificationTemplates() {
  const [templates, setTemplates] = React.useState<NotificationTemplate[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedTemplate, setSelectedTemplate] = React.useState<NotificationTemplate | null>(null)
  const [editBody, setEditBody] = React.useState("")

  React.useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await governanceRepository.getNotificationTemplates();
        setTemplates(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, [])

  const handleSelect = (t: NotificationTemplate) => {
    setSelectedTemplate(t);
    setEditBody(t.body);
  }

  const handleSave = async () => {
    if (!selectedTemplate) return;
    try {
      await governanceRepository.updateNotificationTemplate(selectedTemplate.id, { body: editBody });
      setTemplates(templates.map(t => t.id === selectedTemplate.id ? { ...t, body: editBody } : t));
      toast.success("Template updated successfully");
    } catch (error) {
      toast.error("Failed to update template");
    }
  }

  const insertTag = (tag: string) => {
    setEditBody(prev => prev + `{${tag}}`);
  }

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Notification Templates</h1>
          <p className="text-sm text-brand-muted">Manage automated customer and staff communications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1 space-y-4">
          {templates.map((t) => (
            <AdminCard 
              key={t.id} 
              onClick={() => handleSelect(t)}
              className={cn(
                "p-4 cursor-pointer transition-all border-2",
                selectedTemplate?.id === t.id ? "border-brand-gold bg-brand-gold/5" : "border-transparent hover:border-brand-navy/20"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <ChannelIcon channel={t.channel} />
                <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">{t.triggerEvent}</span>
              </div>
              <p className="text-xs text-brand-muted line-clamp-2 mb-2">{t.body}</p>
              <div className="flex items-center justify-between">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase",
                  t.isEnabled ? "bg-status-completed/10 text-status-completed" : "bg-brand-muted/10 text-brand-muted"
                )}>
                  {t.isEnabled ? "Active" : "Disabled"}
                </span>
                <span className="text-[8px] text-brand-muted font-bold uppercase">v{t.version}</span>
              </div>
            </AdminCard>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <AdminCard className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <ChannelIcon channel={selectedTemplate.channel} />
                  <div>
                    <h2 className="text-lg font-bold text-brand-navy">{selectedTemplate.triggerEvent}</h2>
                    <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Recipient: {selectedTemplate.recipientType.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <AdminButton variant="outline" size="sm" icon={<History size={14} />}>History</AdminButton>
                  <AdminButton size="sm" icon={<Save size={14} />} onClick={handleSave}>Save Changes</AdminButton>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-4 mb-2 block">Template Body</label>
                  <textarea 
                    className="w-full h-64 p-6 bg-brand-navy/5 border-none rounded-[32px] text-sm leading-relaxed focus:ring-2 focus:ring-brand-gold outline-none resize-none"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest ml-4 mb-3 block">Available Merge Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {['CustomerName', 'JobNo', 'ETATime', 'TechnicianName', 'InvoiceAmount', 'BookingDate'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => insertTag(tag)}
                        className="px-3 py-1.5 bg-white border border-border rounded-xl text-[10px] font-bold text-brand-navy hover:border-brand-gold hover:text-brand-gold transition-all flex items-center gap-1"
                      >
                        <Tag size={10} /> {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-brand-gold/5 rounded-[32px] border border-brand-gold/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye size={16} className="text-brand-gold" />
                    <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">Live Preview</span>
                  </div>
                  <p className="text-sm text-brand-navy leading-relaxed italic">
                    {editBody.replace(/{(\w+)}/g, (match, p1) => {
                      const samples: any = { CustomerName: 'Aditi Sharma', JobNo: 'SR-99281', ETATime: '2:00 PM', TechnicianName: 'Suresh Kumar' };
                      return samples[p1] || match;
                    })}
                  </p>
                </div>
              </div>
            </AdminCard>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-brand-navy/5 rounded-[40px] border border-dashed border-border p-12 text-center">
              <Bell size={48} className="text-brand-muted mb-4 opacity-20" />
              <p className="text-brand-muted font-medium">Select a template from the left to start editing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ChannelIcon({ channel }: { channel: string }) {
  switch (channel) {
    case 'whatsapp': return <MessageSquare size={16} className="text-status-completed" />;
    case 'email': return <Mail size={16} className="text-brand-navy" />;
    case 'push': return <Smartphone size={16} className="text-brand-gold" />;
    default: return <Bell size={16} />;
  }
}
