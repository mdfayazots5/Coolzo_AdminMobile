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
  ChevronLeft, 
  Star, 
  User, 
  Wrench, 
  MessageSquare, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2,
  Send,
  Eye,
  EyeOff,
  Flag
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [response, setResponse] = React.useState("")

  React.useEffect(() => {
    const fetchFeedback = async () => {
      if (!id) return;
      try {
        const data = await supportRepository.getFeedbackById(id);
        setFeedback(data);
        if (data?.adminResponse) setResponse(data.adminResponse);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeedback();
  }, [id])

  const handleRespond = async () => {
    if (!feedback || !response.trim()) return;
    try {
      await supportRepository.respondToFeedback(feedback.id, response);
      setFeedback({ ...feedback, adminResponse: response });
      toast.success("Response saved and published");
    } catch (error) {
      toast.error("Failed to save response");
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!feedback) return <div className="p-8 text-center">Feedback not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Feedback Detail</h1>
            <p className="text-sm text-brand-muted">Review from {feedback.customerName} for {feedback.srNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={feedback.status === 'published' ? <EyeOff size={18} /> : <Eye size={18} />}>
            {feedback.status === 'published' ? 'Unpublish' : 'Publish'}
          </AdminButton>
          <AdminButton variant="outline" className="text-status-emergency border-status-emergency/20" icon={<Flag size={18} />}>Flag for Quality Review</AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Service Context" icon={<ExternalLink size={18} />} />
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-1">Service Request</p>
                <AdminButton variant="ghost" size="sm" className="w-full justify-start px-0 text-brand-navy font-bold">
                  {feedback.srNumber} <ExternalLink size={14} className="ml-2" />
                </AdminButton>
              </div>
              <div>
                <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-1">Technician</p>
                <AdminButton variant="ghost" size="sm" className="w-full justify-start px-0 text-brand-navy font-bold">
                  <Wrench size={14} className="mr-2" /> {feedback.technicianName} <ExternalLink size={14} className="ml-2" />
                </AdminButton>
              </div>
              <div>
                <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-1">Date</p>
                <p className="text-sm font-bold text-brand-navy">{new Date(feedback.date).toLocaleDateString()}</p>
              </div>
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Sub-Ratings" icon={<Star size={18} />} />
            <div className="mt-4 space-y-4">
              <RatingRow label="Punctuality" rating={feedback.subRatings.punctuality} />
              <RatingRow label="Professionalism" rating={feedback.subRatings.professionalism} />
              <RatingRow label="Work Quality" rating={feedback.subRatings.workQuality} />
            </div>
          </AdminCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={24} className={cn(s <= feedback.rating ? "text-brand-gold fill-brand-gold" : "text-border")} />
                ))}
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase",
                feedback.isNegative ? "bg-status-emergency/10 text-status-emergency" : "bg-status-completed/10 text-status-completed"
              )}>
                {feedback.rating} / 5 Rating
              </span>
            </div>
            <div className="p-6 bg-brand-navy/5 rounded-3xl italic text-brand-navy leading-relaxed">
              "{feedback.reviewText}"
            </div>
          </AdminCard>

          <AdminCard className="p-8">
            <SectionHeader title="Admin Response" icon={<MessageSquare size={18} />} />
            <p className="text-xs text-brand-muted mt-2 mb-6">This response will be visible to the customer and on the public website.</p>
            <div className="space-y-4">
              <textarea 
                placeholder="Type your response to the customer..."
                className="w-full p-4 bg-brand-navy/5 border-none rounded-3xl text-sm focus:ring-2 focus:ring-brand-gold outline-none min-h-[150px] resize-none"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
              <div className="flex justify-end">
                <AdminButton 
                  onClick={handleRespond}
                  disabled={!response.trim() || response === feedback.adminResponse}
                  icon={<Send size={18} />}
                >
                  Save & Publish Response
                </AdminButton>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}

function RatingRow({ label, rating }: { label: string, rating: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-brand-muted font-bold uppercase tracking-widest">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} size={10} className={cn(s <= rating ? "text-brand-gold fill-brand-gold" : "text-border")} />
        ))}
      </div>
    </div>
  )
}
