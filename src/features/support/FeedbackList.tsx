/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { AlertCircle, ChevronRight, Search, Star } from "lucide-react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { AdminButton } from "@/components/shared/AdminButton"
import { InlineLoader } from "@/components/shared/Layout"
import { Feedback, supportRepository } from "@/core/network/support-repository"
import { cn } from "@/lib/utils"

export default function FeedbackList() {
  const navigate = useNavigate()
  const [feedbacks, setFeedbacks] = React.useState<Feedback[]>([])
  const [negativeFeedback, setNegativeFeedback] = React.useState<Feedback[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [lowestFirst, setLowestFirst] = React.useState(true)

  React.useEffect(() => {
    const loadFeedback = async () => {
      try {
        const [allFeedback, negativeQueue] = await Promise.all([
          supportRepository.getFeedback({}),
          supportRepository.getNegativeFeedbackQueue(),
        ])
        setFeedbacks(allFeedback)
        setNegativeFeedback(negativeQueue)
      } finally {
        setIsLoading(false)
      }
    }

    void loadFeedback()
  }, [])

  const filtered = [...feedbacks]
    .filter((feedback) => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) {
        return true
      }
      return (
        feedback.customerName.toLowerCase().includes(query) ||
        feedback.technicianName.toLowerCase().includes(query) ||
        feedback.srNumber.toLowerCase().includes(query)
      )
    })
    .sort((left, right) => (lowestFirst ? left.rating - right.rating : right.rating - left.rating))

  if (isLoading) {
    return <InlineLoader className="h-screen" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Customer Feedback</h1>
          <p className="text-sm text-brand-muted">Review response, negative queue follow-up, and publish/flag control</p>
        </div>
        <div className="flex gap-2">
          <AdminButton variant="outline" icon={<AlertCircle size={18} />}>
            Negative Queue: {negativeFeedback.length}
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <AdminCard className="p-6 xl:col-span-1 border-status-emergency/20 bg-status-emergency/5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-status-emergency">1-2 Star Follow-up</h2>
          <div className="mt-4 space-y-3">
            {negativeFeedback.map((feedback) => (
              <button key={feedback.id} onClick={() => navigate(`/support/feedback/${feedback.id}`)} className="w-full rounded-2xl bg-white p-4 text-left">
                <p className="text-sm font-bold text-brand-navy">{feedback.customerName}</p>
                <p className="text-[10px] uppercase tracking-widest text-brand-muted">{feedback.srNumber} • {feedback.rating} stars</p>
              </button>
            ))}
          </div>
        </AdminCard>

        <div className="space-y-4 xl:col-span-3">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by customer, technician, or SR..."
                className="w-full rounded-2xl border border-border bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <button
              onClick={() => setLowestFirst((current) => !current)}
              className="rounded-2xl border border-border bg-white px-4 py-3 text-xs font-bold uppercase tracking-widest text-brand-navy"
            >
              {lowestFirst ? "Lowest Rating First" : "Highest Rating First"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filtered.map((feedback, index) => (
              <motion.div key={feedback.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <FeedbackCard feedback={feedback} onClick={() => navigate(`/support/feedback/${feedback.id}`)} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeedbackCard({ feedback, onClick }: { feedback: Feedback; onClick: () => void }) {
  return (
    <AdminCard onClick={onClick} className={cn("cursor-pointer p-6 transition-all hover:shadow-xl", feedback.isNegative && "border-l-4 border-l-status-emergency")}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn("flex size-12 items-center justify-center rounded-2xl", feedback.isNegative ? "bg-status-emergency/10 text-status-emergency" : "bg-status-completed/10 text-status-completed")}>
            <Star size={22} className={feedback.rating >= 4 ? "fill-current" : ""} />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={12} className={cn(star <= feedback.rating ? "fill-brand-gold text-brand-gold" : "text-border")} />
                ))}
              </div>
              <span className="text-sm font-bold text-brand-navy">{feedback.srNumber}</span>
            </div>
            <p className="text-sm italic text-brand-navy">"{feedback.reviewText}"</p>
            <p className="mt-2 text-xs text-brand-muted">{feedback.customerName} • {feedback.technicianName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{feedback.status}</span>
          <ChevronRight size={20} className="text-brand-gold" />
        </div>
      </div>
    </AdminCard>
  )
}
