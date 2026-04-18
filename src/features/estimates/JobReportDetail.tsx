/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { jobReportRepository, JobReport } from "@/core/network/job-report-repository"
import { 
  ClipboardCheck, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  User, 
  Camera,
  Star,
  MessageSquare,
  AlertCircle,
  Download,
  Share2,
  Check,
  X,
  Wrench
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function JobReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = React.useState<JobReport | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [reviewNotes, setReviewNotes] = React.useState("")

  React.useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        const data = await jobReportRepository.getJobReportById(id);
        if (data) setReport(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [id])

  const handleReview = async (status: 'approved' | 'flagged') => {
    if (!report) return;
    try {
      await jobReportRepository.reviewJobReport(report.id, status, reviewNotes);
      toast.success(`Report ${status === 'approved' ? 'Approved' : 'Flagged'}`);
      const updated = await jobReportRepository.getJobReportById(report.id);
      setReport(updated);
    } catch (error) {
      toast.error("Failed to submit review");
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!report) return <div className="p-8 text-center">Report not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Job Report: {report.srNumber}</h1>
            <p className="text-sm text-brand-muted">Submitted by {report.technicianName} on {new Date(report.submissionTime).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-3 bg-white border border-border rounded-2xl text-brand-navy hover:border-brand-gold transition-all">
            <Download size={20} />
          </button>
          {report.status === 'pending_review' && (
            <>
              <AdminButton variant="outline" onClick={() => handleReview('flagged')}>Flag for Review</AdminButton>
              <AdminButton onClick={() => handleReview('approved')}>Approve Report</AdminButton>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary & Review */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCard className="p-6">
            <SectionHeader title="Quality Score" icon={<Star size={18} />} />
            <div className="flex items-center justify-center py-8">
              <div className="relative size-32">
                <svg className="size-full" viewBox="0 0 36 36">
                  <path className="text-brand-navy/5" strokeDasharray="100, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-brand-gold" strokeDasharray={`${report.qualityScore}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-brand-navy">{report.qualityScore}</span>
                  <span className="text-[8px] font-bold text-brand-muted uppercase tracking-widest">Score</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <QualityMetric label="Checklist Completion" value="100%" pass />
              <QualityMetric label="Photo Documentation" value={`${report.photos.length} Photos`} pass={report.photos.length >= 2} />
              <QualityMetric label="Customer Signature" value="Collected" pass />
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Review Notes" icon={<MessageSquare size={18} />} />
            {report.status === 'pending_review' ? (
              <textarea 
                className="w-full h-32 p-4 bg-brand-navy/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all resize-none"
                placeholder="Add internal notes or feedback for the technician..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            ) : (
              <div className="p-4 bg-brand-navy/5 rounded-2xl">
                <p className="text-xs text-brand-muted font-bold uppercase tracking-widest mb-1">Reviewed By {report.reviewedBy}</p>
                <p className="text-sm text-brand-navy">{report.reviewNotes || 'No notes provided.'}</p>
              </div>
            )}
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Parts Used" icon={<Wrench size={18} />} />
            <div className="space-y-3">
              {report.partsUsed.map((part, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-brand-navy/5 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{part.name}</p>
                    <p className="text-[10px] text-brand-muted uppercase tracking-widest">Qty: {part.qty}</p>
                  </div>
                  <span className="text-sm font-bold text-brand-navy">₹{part.cost.toLocaleString()}</span>
                </div>
              ))}
              {report.partsUsed.length === 0 && (
                <p className="text-xs text-brand-muted italic text-center py-4">No parts used in this job.</p>
              )}
            </div>
          </AdminCard>
        </div>

        {/* Right Column: Checklist & Photos */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard className="p-8">
            <SectionHeader title="Service Checklist" icon={<CheckCircle2 size={18} />} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-brand-navy/5 rounded-2xl">
                  <div className={cn(
                    "size-6 rounded-full flex items-center justify-center",
                    item.status === 'completed' ? "bg-status-completed text-white" : "bg-brand-muted text-white"
                  )}>
                    {item.status === 'completed' ? <Check size={14} /> : <X size={14} />}
                  </div>
                  <span className="text-sm font-bold text-brand-navy">{item.task}</span>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard className="p-8">
            <SectionHeader title="Photo Documentation" icon={<Camera size={18} />} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {report.photos.map((photo, i) => (
                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer">
                  <img src={photo.url} alt={photo.caption} className="size-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{photo.type}</span>
                    <p className="text-xs text-white/80 truncate">{photo.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard className="p-8">
            <SectionHeader title="Technician Observations" icon={<MessageSquare size={18} />} />
            <div className="p-6 bg-brand-navy/5 rounded-3xl border border-brand-navy/10">
              <p className="text-sm text-brand-navy leading-relaxed italic">"{report.observations}"</p>
            </div>
          </AdminCard>

          <div className="flex flex-col md:flex-row gap-6">
            <AdminCard className="flex-1 p-6">
              <SectionHeader title="Customer Signature" icon={<User size={18} />} />
              <div className="aspect-video bg-white border border-border rounded-2xl flex items-center justify-center">
                <img src={report.customerSignature} alt="Signature" className="max-h-full opacity-60" />
              </div>
            </AdminCard>
            <AdminCard className="flex-1 p-6">
              <SectionHeader title="Customer Feedback" icon={<Star size={18} />} />
              <div className="flex flex-col items-center justify-center h-full py-4">
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={24} className={cn(s <= (report.customerRating || 0) ? "text-brand-gold fill-brand-gold" : "text-brand-muted")} />
                  ))}
                </div>
                <p className="text-sm font-bold text-brand-navy">{report.customerRating ? `${report.customerRating} / 5 Rating` : 'No rating given yet'}</p>
              </div>
            </AdminCard>
          </div>
        </div>
      </div>
    </div>
  )
}

function QualityMetric({ label, value, pass }: { label: string, value: string, pass: boolean }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-brand-muted font-bold uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-brand-navy font-bold">{value}</span>
        {pass ? <CheckCircle2 size={14} className="text-status-completed" /> : <AlertCircle size={14} className="text-status-emergency" />}
      </div>
    </div>
  )
}
