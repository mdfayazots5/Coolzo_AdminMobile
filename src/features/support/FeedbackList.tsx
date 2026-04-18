/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { supportRepository, Feedback } from "@/core/network/support-repository"
import { 
  Star, 
  Search, 
  Filter, 
  ChevronRight, 
  User, 
  Wrench, 
  MessageSquare, 
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function FeedbackList() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = React.useState<Feedback[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const data = await supportRepository.getFeedback({});
        setFeedbacks(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeedback();
  }, [])

  const filteredFeedback = feedbacks.filter(f => {
    const matchesFilter = filter === 'all' || f.rating === filter;
    const matchesSearch = f.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.technicianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.srNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a, b) => a.rating - b.rating); // Lowest rating first

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Customer Feedback</h1>
          <p className="text-sm text-brand-muted">Monitor post-service reviews and ratings</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<AlertCircle size={18} />}>Negative Feedback Queue</AdminButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by Customer, Technician or SR #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
          {[5, 4, 3, 2, 1].map(r => (
            <FilterButton 
              key={r} 
              active={filter === r} 
              onClick={() => setFilter(r)} 
              label={`${r} Stars`} 
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredFeedback.map((feedback, idx) => (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <FeedbackCard feedback={feedback} onClick={() => navigate(`/support/feedback/${feedback.id}`)} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function FilterButton({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
        active ? "bg-brand-navy text-brand-gold" : "bg-white text-brand-muted border border-border hover:border-brand-gold"
      )}
    >
      {label}
    </button>
  )
}

function FeedbackCard({ feedback, onClick }: { feedback: Feedback, onClick: () => void }) {
  return (
    <AdminCard 
      onClick={onClick}
      className={cn(
        "p-6 hover:shadow-xl transition-all cursor-pointer group border-l-4",
        feedback.isNegative ? "border-l-status-emergency" : "border-l-transparent"
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4 flex-1">
          <div className={cn(
            "size-12 rounded-2xl flex items-center justify-center shrink-0",
            feedback.isNegative ? "bg-status-emergency/10 text-status-emergency" : "bg-status-completed/10 text-status-completed"
          )}>
            <Star size={24} fill={feedback.rating >= 4 ? "currentColor" : "none"} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={12} className={cn(s <= feedback.rating ? "text-brand-gold fill-brand-gold" : "text-border")} />
                ))}
              </div>
              <h3 className="font-bold text-brand-navy">{feedback.srNumber}</h3>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1",
                feedback.status === 'published' ? "bg-status-completed/10 text-status-completed" : "bg-brand-muted/10 text-brand-muted"
              )}>
                {feedback.status === 'published' ? <Eye size={10} /> : <EyeOff size={10} />} {feedback.status}
              </span>
            </div>
            <p className="text-sm text-brand-navy mb-2 line-clamp-1 italic">"{feedback.reviewText}"</p>
            <div className="flex items-center gap-4 text-xs text-brand-muted">
              <span className="flex items-center gap-1 font-bold text-brand-navy"><User size={12} /> {feedback.customerName}</span>
              <span className="size-1 bg-border rounded-full" />
              <span className="flex items-center gap-1"><Wrench size={12} /> {feedback.technicianName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-8">
          <div className="text-right">
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-1">Date Received</p>
            <p className="text-xs font-bold text-brand-navy">{new Date(feedback.date).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            {feedback.adminResponse && <MessageSquare size={16} className="text-brand-gold" />}
            <ChevronRight size={20} className="text-brand-gold group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </AdminCard>
  )
}
