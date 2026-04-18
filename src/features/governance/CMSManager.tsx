/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { governanceRepository, CMSContent } from "@/core/network/governance-repository"
import { 
  Layout, 
  Image as ImageIcon, 
  FileText, 
  HelpCircle, 
  MessageSquare, 
  Edit3, 
  Eye, 
  Save,
  Plus,
  Trash2,
  Globe,
  Clock
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function CMSManager() {
  const [content, setContent] = React.useState<CMSContent[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<CMSContent['type']>('banner')

  React.useEffect(() => {
    const fetchCMS = async () => {
      try {
        const data = await governanceRepository.getCMSContent();
        setContent(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCMS();
  }, [])

  const filteredContent = content.filter(c => c.type === activeTab);

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Website CMS</h1>
          <p className="text-sm text-brand-muted">Control frontend content, banners, and promotions</p>
        </div>
        <div className="flex gap-2">
          <AdminButton 
            variant="outline" 
            icon={<Globe size={18} />}
            onClick={() => window.open('https://coolzo.com', '_blank')}
          >
            View Live Site
          </AdminButton>
          <AdminButton 
            icon={<Plus size={18} />}
            onClick={() => toast.info(`CMS Creation Wizard for ${activeTab} launching...`)}
          >
            Add New {activeTab}
          </AdminButton>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <TabButton active={activeTab === 'banner'} onClick={() => setActiveTab('banner')} icon={<ImageIcon size={16} />} label="Banners" />
        <TabButton active={activeTab === 'service_description'} onClick={() => setActiveTab('service_description')} icon={<FileText size={16} />} label="Services" />
        <TabButton active={activeTab === 'faq'} onClick={() => setActiveTab('faq')} icon={<HelpCircle size={16} />} label="FAQs" />
        <TabButton active={activeTab === 'testimonial'} onClick={() => setActiveTab('testimonial')} icon={<MessageSquare size={16} />} label="Testimonials" />
        <TabButton active={activeTab === 'article'} onClick={() => setActiveTab('article')} icon={<FileText size={16} />} label="Articles" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContent.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <AdminCard className="overflow-hidden group">
              {item.type === 'banner' && item.content.image && (
                <div className="h-40 overflow-hidden relative">
                  <img src={item.content.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-brand-navy/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <AdminButton variant="outline" size="sm" className="bg-white text-brand-navy border-none">Change Image</AdminButton>
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase",
                    item.status === 'published' ? "bg-status-completed/10 text-status-completed" : "bg-brand-muted/10 text-brand-muted"
                  )}>
                    {item.status}
                  </span>
                  <span className="text-[8px] text-brand-muted font-bold flex items-center gap-1">
                    <Clock size={10} /> {new Date(item.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-brand-navy mb-2">{item.title}</h3>
                <p className="text-xs text-brand-muted line-clamp-2 mb-6">
                  {typeof item.content === 'string' ? item.content : item.content.headline || 'No description available'}
                </p>
                <div className="flex gap-2">
                  <AdminButton 
                    variant="outline" 
                    size="sm" 
                    className="flex-1" 
                    icon={<Edit3 size={14} />}
                    onClick={() => toast.info(`Direct Editor for ${item.title} active`)}
                  >
                    Edit
                  </AdminButton>
                  <AdminButton 
                    variant="outline" 
                    size="sm" 
                    className="flex-1" 
                    icon={<Eye size={14} />}
                    onClick={() => alert(`Previewing ${item.title}:\n${JSON.stringify(item.content)}`)}
                  >
                    Preview
                  </AdminButton>
                  <button 
                    onClick={async () => {
                      if (confirm("Delete this content?")) {
                        await governanceRepository.deleteCMSContent(item.id);
                        setContent(prev => prev.filter(c => c.id !== item.id));
                        toast.success("Content deleted");
                      }
                    }}
                    className="p-2 text-brand-muted hover:text-status-emergency transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </AdminCard>
          </motion.div>
        ))}
        {filteredContent.length === 0 && (
          <div className="col-span-full py-20 text-center bg-brand-navy/5 rounded-[40px] border border-dashed border-border">
            <Layout size={48} className="mx-auto text-brand-muted mb-4 opacity-20" />
            <p className="text-brand-muted">No {activeTab}s found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
        active ? "bg-brand-navy text-brand-gold" : "bg-white text-brand-muted border border-border hover:border-brand-gold"
      )}
    >
      {icon} {label}
    </button>
  )
}
