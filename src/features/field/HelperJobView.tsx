/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { MockServiceRequestRepository, ServiceRequest } from "@/core/network/service-request-repository"
import { 
  MapPin, 
  Clock, 
  User, 
  CheckCircle2, 
  Camera, 
  ChevronLeft,
  Info,
  Wrench,
  Plus,
  Trash2
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

const srRepo = new MockServiceRequestRepository();

export default function HelperJobView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sr, setSr] = React.useState<ServiceRequest | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [photos, setPhotos] = React.useState<{id: string, url: string}[]>([]);

  React.useEffect(() => {
    const fetchSR = async () => {
      if (!id) return;
      try {
        const data = await srRepo.getSRById(id);
        if (data) setSr(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSR();
  }, [id])

  const addPhoto = () => {
    const newPhoto = {
      id: Date.now().toString(),
      url: `https://picsum.photos/seed/${Date.now()}/400/300`
    };
    setPhotos([...photos, newPhoto]);
    toast.success("Task photo uploaded");
  }

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!sr) return <div className="p-8 text-center">Job not found</div>;

  return (
    <div className="min-h-screen bg-brand-navy/[0.02] pb-24">
      <div className="sticky top-0 z-30 bg-white border-b border-border px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-brand-navy">Helper View: {sr.srNumber}</h2>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">Lead: {sr.scheduling.assignedTechnicianName}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Job Location */}
        <AdminCard className="p-6">
          <SectionHeader title="Job Location" icon={<MapPin size={18} />} />
          <p className="text-sm text-brand-navy font-bold mb-2">{sr.location.address}</p>
          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <Clock size={14} />
            <span>Scheduled: {sr.scheduling.requestedSlot}</span>
          </div>
        </AdminCard>

        {/* Assigned Tasks */}
        <AdminCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-brand-navy/[0.02]">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-widest">Your Tasks</h3>
          </div>
          <div className="divide-y divide-border">
            <TaskItem task="Assist in outdoor unit cleaning" isCompleted={false} />
            <TaskItem task="Carry tools and equipment to site" isCompleted={true} />
            <TaskItem task="Clean up work area post-service" isCompleted={false} />
          </div>
        </AdminCard>

        {/* Photo Upload for Helper */}
        <AdminCard className="p-6">
          <SectionHeader title="Task Photos" icon={<Camera size={18} />} />
          <div className="grid grid-cols-3 gap-3 mb-4">
            {photos.map(p => (
              <div key={p.id} className="aspect-square rounded-xl overflow-hidden relative group">
                <img src={p.url} alt="Task" className="size-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => setPhotos(photos.filter(ph => ph.id !== p.id))}
                  className="absolute top-1 right-1 p-1 bg-black/40 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button 
              onClick={addPhoto}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-brand-muted hover:border-brand-gold hover:text-brand-gold transition-all"
            >
              <Plus size={20} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Add Photo</span>
            </button>
          </div>
        </AdminCard>

        <div className="p-6 bg-brand-navy/5 rounded-3xl border border-border flex items-center gap-4">
          <Info size={20} className="text-brand-navy/40" />
          <p className="text-xs text-brand-navy/60 leading-relaxed">
            As a helper, you are assisting <strong>{sr.scheduling.assignedTechnicianName}</strong>. Please follow their instructions for on-site safety.
          </p>
        </div>
      </div>
    </div>
  )
}

function TaskItem({ task, isCompleted }: { task: string, isCompleted: boolean }) {
  const [done, setDone] = React.useState(isCompleted);
  return (
    <div 
      onClick={() => setDone(!done)}
      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-brand-navy/[0.01] transition-colors"
    >
      <div className={cn(
        "size-6 rounded-lg border-2 flex items-center justify-center transition-all",
        done ? "bg-status-completed border-status-completed text-white" : "border-border bg-white"
      )}>
        {done && <CheckCircle2 size={14} />}
      </div>
      <p className={cn("text-sm font-bold", done ? "text-brand-muted line-through" : "text-brand-navy")}>
        {task}
      </p>
    </div>
  )
}
