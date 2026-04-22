/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ChevronLeft, ExternalLink, Flag, Send, Star } from "lucide-react"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { InlineLoader, SectionHeader } from "@/components/shared/Layout"
import { Feedback, supportRepository } from "@/core/network/support-repository"
import { cn } from "@/lib/utils"

export default function FeedbackDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [feedback, setFeedback] = React.useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [response, setResponse] = React.useState("")

  React.useEffect(() => {
    const loadFeedback = async () => {
      if (!id) {
        return
      }
      try {
        const data = await supportRepository.getFeedbackById(id)
        setFeedback(data)
        setResponse(data?.adminResponse ?? "")
      } catch (error) {
        console.error(error)
        toast.error("Unable to load feedback")
      } finally {
        setIsLoading(false)
      }
    }

    void loadFeedback()
  }, [id])

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  if (!feedback) {
    return <div className="p-8 text-center">Feedback not found</div>
  }

  const handleSaveResponse = async () => {
    const updated = await supportRepository.respondToFeedback(feedback.id, response)
    setFeedback(updated)
    toast.success("Admin response saved")
  }

  const handlePublishToggle = async () => {
    const updated = await supportRepository.publishFeedback(feedback.id, feedback.status !== "published")
    setFeedback(updated)
    toast.success(updated.status === "published" ? "Review published" : "Review unpublished")
  }

  const handleFlag = async () => {
    const updated = await supportRepository.flagFeedback(feedback.id, "Flagged from admin mobile")
    setFeedback(updated)
    toast.success("Review flagged")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="rounded-xl p-2 transition-colors hover:bg-brand-navy/5">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Feedback Detail</h1>
            <p className="text-sm text-brand-muted">{feedback.customerName} • {feedback.srNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" onClick={handlePublishToggle}>
            {feedback.status === "published" ? "Unpublish" : "Publish"}
          </AdminButton>
          <AdminButton variant="outline" className="border-status-emergency/20 text-status-emergency" icon={<Flag size={18} />} onClick={handleFlag}>
            Flag
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Service Context" icon={<ExternalLink size={18} />} />
            <div className="mt-4 space-y-4">
              <InfoRow label="SR" value={feedback.srNumber} />
              <InfoRow label="Technician" value={feedback.technicianName} />
              <InfoRow label="Date" value={new Date(feedback.date).toLocaleDateString()} />
              <InfoRow label="Status" value={feedback.status} />
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Sub Ratings" icon={<Star size={18} />} />
            <div className="mt-4 space-y-4">
              <RatingRow label="Punctuality" rating={feedback.subRatings.punctuality} />
              <RatingRow label="Professionalism" rating={feedback.subRatings.professionalism} />
              <RatingRow label="Work Quality" rating={feedback.subRatings.workQuality} />
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <AdminCard className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={24} className={cn(star <= feedback.rating ? "fill-brand-gold text-brand-gold" : "text-border")} />
                ))}
              </div>
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest", feedback.isNegative ? "bg-status-emergency/10 text-status-emergency" : "bg-status-completed/10 text-status-completed")}>
                {feedback.rating} / 5
              </span>
            </div>
            <div className="rounded-3xl bg-brand-navy/5 p-6 italic text-brand-navy">"{feedback.reviewText}"</div>
          </AdminCard>

          <AdminCard className="p-8">
            <SectionHeader title="Admin Response" icon={<Send size={18} />} />
            <textarea
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              placeholder="Type your response to the customer..."
              className="mt-6 min-h-[180px] w-full rounded-3xl bg-brand-navy/5 p-4 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
            />
            <div className="mt-4 flex justify-end">
              <AdminButton icon={<Send size={18} />} onClick={handleSaveResponse}>
                Save Response
              </AdminButton>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-bold uppercase tracking-widest text-brand-muted">{label}</span>
      <span className="text-right text-sm font-bold capitalize text-brand-navy">{value}</span>
    </div>
  )
}

function RatingRow({ label, rating }: { label: string; rating: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-widest text-brand-muted">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={10} className={cn(star <= rating ? "fill-brand-gold text-brand-gold" : "text-border")} />
        ))}
      </div>
    </div>
  )
}
