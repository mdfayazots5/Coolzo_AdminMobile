/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { serviceRequestRepository, ServiceRequest, SRStatus } from "@/core/network/service-request-repository"
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  Camera, 
  PenTool, 
  CreditCard,
  ChevronLeft,
  AlertTriangle,
  Info,
  Wrench,
  ChevronRight,
  Plus,
  Trash2
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

type WorkflowStepId = 'info' | 'en-route' | 'arrived' | 'in-progress' | 'report' | 'signature' | 'payment' | 'complete';

export default function JobWorkflowContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sr, setSr] = React.useState<ServiceRequest | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentStep, setCurrentStep] = React.useState<WorkflowStepId>('info')

  React.useEffect(() => {
    const fetchSR = async () => {
      if (!id) return;
      try {
        const data = await serviceRequestRepository.getSRById(id);
        if (data) {
          setSr(data);
          // Sync current step with SR status if needed
          if (data.status === 'en-route') setCurrentStep('en-route');
          if (data.status === 'arrived') setCurrentStep('arrived');
          if (data.status === 'in-progress') setCurrentStep('in-progress');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSR();
  }, [id])

  const updateStatus = async (newStatus: SRStatus, nextStep: WorkflowStepId, location?: { lat: number, lng: number }) => {
    if (!sr) return;
    try {
      await serviceRequestRepository.updateJobStatus(sr.id, newStatus, location);
      setSr({ ...sr, status: newStatus });
      setCurrentStep(nextStep);
    } catch (error) {
      toast.error("Failed to update status");
    }
  }

  const submitReport = async (reportData: any) => {
    if (!sr) return;
    try {
      await serviceRequestRepository.submitServiceReport(sr.id, reportData);
      setCurrentStep('signature');
    } catch (error) {
      toast.error("Failed to submit report");
    }
  }

  const submitSignature = async (signatureData: { customerName: string, signatureUrl: string }) => {
    if (!sr) return;
    try {
      await serviceRequestRepository.submitSignature(sr.id, signatureData);
      setCurrentStep('payment');
    } catch (error) {
      toast.error("Failed to submit signature");
    }
  }

  if (isLoading) return <InlineLoader className="h-screen" />;
  if (!sr) return <div className="p-8 text-center">Job not found</div>;

  return (
    <div className="min-h-screen bg-brand-navy/[0.02] pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-border px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-brand-navy/5 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-brand-navy" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-brand-navy">{sr.srNumber}</h2>
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest">{sr.serviceType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
            sr.priority === 'emergency' ? "bg-status-emergency text-white" : "bg-brand-gold/10 text-brand-gold"
          )}>
            {sr.priority}
          </span>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-8 overflow-x-auto no-scrollbar pb-2">
          <StepIndicator id="info" label="Info" current={currentStep} />
          <StepLine />
          <StepIndicator id="en-route" label="Route" current={currentStep} />
          <StepLine />
          <StepIndicator id="arrived" label="Arrived" current={currentStep} />
          <StepLine />
          <StepIndicator id="in-progress" label="Work" current={currentStep} />
          <StepLine />
          <StepIndicator id="report" label="Report" current={currentStep} />
          <StepLine />
          <StepIndicator id="signature" label="Sign" current={currentStep} />
          <StepLine />
          <StepIndicator id="payment" label="Pay" current={currentStep} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 'info' && <JobInfoStep sr={sr} onNext={() => setCurrentStep('en-route')} />}
            {currentStep === 'en-route' && (
              <EnRouteStep 
                sr={sr} 
                onNext={(loc) => updateStatus('en-route', 'arrived', loc)} 
              />
            )}
            {currentStep === 'arrived' && <ArrivedStep sr={sr} onNext={() => updateStatus('arrived', 'in-progress')} />}
            {currentStep === 'in-progress' && <InProgressStep sr={sr} onNext={() => updateStatus('in-progress', 'report')} />}
            {currentStep === 'report' && <ReportStep sr={sr} onNext={submitReport} />}
            {currentStep === 'signature' && <SignatureStep sr={sr} onNext={submitSignature} />}
            {currentStep === 'payment' && <PaymentStep sr={sr} onNext={() => updateStatus('completed', 'complete')} />}
            {currentStep === 'complete' && <CompleteStep sr={sr} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function StepIndicator({ id, label, current }: { id: WorkflowStepId, label: string, current: WorkflowStepId }) {
  const steps: WorkflowStepId[] = ['info', 'en-route', 'arrived', 'in-progress', 'report', 'signature', 'payment', 'complete'];
  const currentIndex = steps.indexOf(current);
  const thisIndex = steps.indexOf(id);
  const isCompleted = thisIndex < currentIndex;
  const isCurrent = thisIndex === currentIndex;

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className={cn(
        "size-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border-2",
        isCompleted ? "bg-status-completed border-status-completed text-white" :
        isCurrent ? "bg-brand-gold border-brand-gold text-brand-navy" : "bg-white border-border text-brand-muted"
      )}>
        {isCompleted ? <CheckCircle2 size={14} /> : thisIndex + 1}
      </div>
      <span className={cn(
        "text-[8px] font-bold uppercase tracking-widest",
        isCurrent ? "text-brand-navy" : "text-brand-muted"
      )}>{label}</span>
    </div>
  )
}

function StepLine() {
  return <div className="h-px w-4 bg-border mt-4 shrink-0" />
}

// --- Step Components ---

function JobInfoStep({ sr, onNext }: { sr: ServiceRequest, onNext: () => void }) {
  return (
    <div className="space-y-6">
      <AdminCard className="p-6">
        <SectionHeader title="Customer Details" icon={<User size={18} />} />
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-brand-navy">{sr.customer.name}</h3>
            <p className="text-xs text-brand-muted">{sr.customer.type} Customer</p>
          </div>
          <button className="size-10 bg-brand-navy/5 text-brand-navy rounded-xl flex items-center justify-center">
            <Phone size={20} />
          </button>
        </div>
        <div className="flex items-start gap-2 text-sm text-brand-navy/80">
          <MapPin size={16} className="shrink-0 mt-0.5 text-brand-gold" />
          <span>{sr.location.address}</span>
        </div>
      </AdminCard>

      <AdminCard className="p-6">
        <SectionHeader title="Equipment & Service" icon={<Wrench size={18} />} />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Brand</p>
            <p className="text-sm font-bold text-brand-navy">{sr.equipment.brand}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Model</p>
            <p className="text-sm font-bold text-brand-navy">{sr.equipment.model}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Type</p>
            <p className="text-sm font-bold text-brand-navy">{sr.equipment.type}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Tonnage</p>
            <p className="text-sm font-bold text-brand-navy">{sr.equipment.tonnage}</p>
          </div>
        </div>
        <div className="p-3 bg-brand-navy/5 rounded-xl">
          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Instructions</p>
          <p className="text-xs text-brand-navy/80 italic">"Customer reports cooling issues in the master bedroom. Please check the outdoor unit fan."</p>
        </div>
      </AdminCard>

      <AdminButton className="w-full py-4" onClick={onNext}>Start Journey</AdminButton>
    </div>
  )
}

function EnRouteStep({ sr, onNext }: { sr: ServiceRequest, onNext: (loc?: {lat: number, lng: number}) => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="size-24 bg-brand-navy text-brand-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
        <Navigation size={40} className="animate-pulse" />
      </div>
      <h2 className="text-xl font-bold text-brand-navy">Heading to Customer</h2>
      <p className="text-sm text-brand-muted px-8">Tap below to open navigation. Your status will be updated to 'En Route'.</p>
      
      <AdminCard className="p-6 text-left">
        <div className="flex items-start gap-4">
          <div className="size-10 bg-brand-gold/10 text-brand-gold rounded-xl flex items-center justify-center shrink-0">
            <MapPin size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-brand-navy mb-1">Destination</h4>
            <p className="text-xs text-brand-muted leading-relaxed">{sr.location.address}</p>
          </div>
        </div>
      </AdminCard>
 
      <div className="grid grid-cols-1 gap-3">
        <AdminButton 
          className="w-full py-4 bg-brand-navy text-brand-gold"
          onClick={() => {
            navigator.geolocation.getCurrentPosition((pos) => {
              const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              onNext(location);
            }, () => {
              onNext(); // Fallback
            });
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(sr.location.address)}`, '_blank');
          }}
        >
          Open in Maps
        </AdminButton>
        <button className="text-xs font-bold text-brand-muted uppercase tracking-widest py-2" onClick={() => onNext()}>
          Already Arrived? Skip to Check-In
        </button>
      </div>
    </div>
  )
}

function ArrivedStep({ sr, onNext }: { sr: ServiceRequest, onNext: () => void }) {
  const [isVerifying, setIsVerifying] = React.useState(false);

  const handleCheckIn = () => {
    setIsVerifying(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      setTimeout(() => {
        setIsVerifying(false);
        toast.success("GPS Verified", { description: `Location match: 12m precision.` });
        onNext();
      }, 1500);
    }, () => {
      // Fallback for demo
      setTimeout(() => {
        setIsVerifying(false);
        toast.success("GPS Verified", { description: "You are within 150m of the customer location." });
        onNext();
      }, 1500);
    });
  }

  return (
    <div className="space-y-6 text-center">
      <div className="size-24 bg-status-pending/10 text-status-pending rounded-full flex items-center justify-center mx-auto mb-6">
        <MapPin size={40} />
      </div>
      <h2 className="text-xl font-bold text-brand-navy">Arrived at Location?</h2>
      <p className="text-sm text-brand-muted px-8">We need to verify your GPS coordinates before you can start the work.</p>

      <AdminCard className="p-6 bg-white border-2 border-brand-gold/20">
        <div className="flex items-center gap-3 text-left">
          <Info size={20} className="text-brand-gold" />
          <p className="text-xs text-brand-navy/70">Ensure you are standing near the customer's entrance for accurate verification.</p>
        </div>
      </AdminCard>

      <AdminButton 
        className="w-full py-4" 
        onClick={handleCheckIn}
        disabled={isVerifying}
      >
        {isVerifying ? "Verifying GPS..." : "Confirm Arrival"}
      </AdminButton>
    </div>
  )
}

function InProgressStep({ sr, onNext }: { sr: ServiceRequest, onNext: () => void }) {
  const [checklist, setChecklist] = React.useState(sr.fieldWorkflow?.checklist || []);
  const [showParts, setShowParts] = React.useState(false);
  const [showEstimate, setShowEstimate] = React.useState(false);

  const toggleItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ));
  }

  const allMandatoryDone = checklist.filter(i => i.isMandatory).every(i => i.isCompleted);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-brand-navy">Work in Progress</h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-status-pending/10 text-status-pending rounded-full">
          <span className="size-2 bg-status-pending rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Live</span>
        </div>
      </div>

      <AdminCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-brand-navy/[0.02]">
          <h3 className="text-xs font-bold text-brand-navy uppercase tracking-widest">Service Checklist</h3>
        </div>
        <div className="divide-y divide-border">
          {checklist.map(item => (
            <div 
              key={item.id} 
              onClick={() => toggleItem(item.id)}
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-brand-navy/[0.01] transition-colors"
            >
              <div className={cn(
                "size-6 rounded-lg border-2 flex items-center justify-center transition-all",
                item.isCompleted ? "bg-status-completed border-status-completed text-white" : "border-border bg-white"
              )}>
                {item.isCompleted && <CheckCircle2 size={14} />}
              </div>
              <div className="flex-1">
                <p className={cn("text-sm font-bold", item.isCompleted ? "text-brand-muted line-through" : "text-brand-navy")}>
                  {item.task}
                </p>
                {item.isMandatory && <span className="text-[8px] text-status-emergency font-bold uppercase tracking-widest">Mandatory</span>}
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setShowParts(true)}
          className="p-4 bg-white border border-border rounded-2xl flex flex-col items-center gap-2 text-brand-navy hover:border-brand-gold transition-all"
        >
          <Plus size={20} className="text-brand-gold" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Add Parts</span>
        </button>
        <button 
          onClick={() => setShowEstimate(true)}
          className="p-4 bg-white border border-border rounded-2xl flex flex-col items-center gap-2 text-brand-navy hover:border-brand-gold transition-all"
        >
          <AlertTriangle size={20} className="text-status-emergency" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Estimate</span>
        </button>
      </div>

      <AdminButton 
        className="w-full py-4" 
        onClick={onNext}
        disabled={!allMandatoryDone}
      >
        Complete Work
      </AdminButton>

      {/* Parts Request Modal */}
      <AnimatePresence>
        {showParts && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-bold text-brand-navy">Request Parts</h3>
                <button onClick={() => setShowParts(false)} className="p-2 hover:bg-brand-navy/5 rounded-xl">
                  <ChevronLeft size={20} className="rotate-90" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="relative">
                  <Plus size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type="text" placeholder="Search parts catalog..." className="w-full bg-brand-navy/5 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold" />
                </div>
                <div className="p-4 bg-brand-navy/5 rounded-2xl border border-dashed border-border text-center">
                  <p className="text-xs text-brand-muted">No parts added yet.</p>
                </div>
                <AdminButton className="w-full" onClick={() => {
                  toast.success("Parts request submitted");
                  setShowParts(false);
                }}>Submit Request</AdminButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Estimate Modal */}
      <AnimatePresence>
        {showEstimate && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-bold text-brand-navy">Create Estimate</h3>
                <button onClick={() => setShowEstimate(false)} className="p-2 hover:bg-brand-navy/5 rounded-xl">
                  <ChevronLeft size={20} className="rotate-90" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center p-4 bg-brand-gold/10 rounded-2xl">
                  <span className="text-xs font-bold text-brand-navy uppercase tracking-widest">Total Estimate</span>
                  <span className="text-xl font-bold text-brand-navy">₹0.00</span>
                </div>
                <button className="w-full py-3 border-2 border-dashed border-border rounded-xl text-xs font-bold text-brand-muted uppercase tracking-widest flex items-center justify-center gap-2">
                  <Plus size={14} /> Add Line Item
                </button>
                <AdminButton className="w-full" onClick={() => {
                  toast.success("Estimate sent to customer");
                  setShowEstimate(false);
                }}>Send to Customer</AdminButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ReportStep({ sr, onNext }: { sr: ServiceRequest, onNext: (data: any) => void }) {
  const [photos, setPhotos] = React.useState<{id: string, url: string, type: string}[]>([]);
  const [condition, setCondition] = React.useState('good');
  const [actionTaken, setActionTaken] = React.useState('');

  const addPhoto = () => {
    const newPhoto = {
      id: Date.now().toString(),
      url: `https://picsum.photos/seed/${Date.now()}/400/300`,
      type: photos.length === 0 ? 'before' : 'after'
    };
    setPhotos([...photos, newPhoto]);
    toast.success("Photo uploaded successfully");
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-brand-navy">Service Report</h2>

      <AdminCard className="p-6">
        <SectionHeader title="Photo Documentation" icon={<Camera size={18} />} />
        <div className="grid grid-cols-3 gap-3 mb-4">
          {photos.map(p => (
            <div key={p.id} className="aspect-square rounded-xl overflow-hidden relative group">
              <img src={p.url} alt="Job" className="size-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setPhotos(photos.filter(ph => ph.id !== p.id))} className="text-white">
                  <Trash2 size={16} />
                </button>
              </div>
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-brand-navy/80 text-white text-[8px] font-bold rounded uppercase">
                {p.type}
              </span>
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
        <p className="text-[10px] text-brand-muted italic">Min. 2 photos required (Before & After)</p>
      </AdminCard>

      <AdminCard className="p-6">
        <SectionHeader title="Diagnosis & Action" icon={<Info size={18} />} />
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-2 block">Equipment Condition</label>
            <select 
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-brand-navy/5 border-none rounded-xl px-4 py-3 text-sm font-bold text-brand-navy focus:ring-1 focus:ring-brand-gold"
            >
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-2 block">Action Taken</label>
            <textarea 
              placeholder="Describe what you did..."
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full bg-brand-navy/5 border-none rounded-xl px-4 py-3 text-sm font-bold text-brand-navy focus:ring-1 focus:ring-brand-gold h-24"
            />
          </div>
        </div>
      </AdminCard>

      <AdminButton 
        className="w-full py-4" 
        onClick={() => onNext({ photos, condition, actionTaken })}
        disabled={photos.length < 2 || !actionTaken}
      >
        Submit Report
      </AdminButton>
    </div>
  )
}

function SignatureStep({ sr, onNext }: { sr: ServiceRequest, onNext: (data: any) => void }) {
  const [isSigned, setIsSigned] = React.useState(false);

  return (
    <div className="space-y-6 text-center">
      <h2 className="text-xl font-bold text-brand-navy">Customer Sign-off</h2>
      <p className="text-sm text-brand-muted px-8">Please ask the customer to sign below to confirm service completion.</p>

      <AdminCard className="p-0 overflow-hidden border-2 border-brand-navy/10">
        <div className="h-64 bg-white relative flex items-center justify-center cursor-crosshair" onClick={() => setIsSigned(true)}>
          {!isSigned ? (
            <div className="text-brand-muted/30 flex flex-col items-center gap-2">
              <PenTool size={48} />
              <span className="text-xs font-bold uppercase tracking-widest">Sign Here</span>
            </div>
          ) : (
            <div className="w-full h-full p-8 flex items-center justify-center">
              <div className="w-full h-px bg-brand-navy/20 absolute bottom-12" />
              <span className="text-4xl font-signature text-brand-navy italic">Customer Signature</span>
            </div>
          )}
        </div>
        <div className="p-4 bg-brand-navy/[0.02] border-t border-border flex justify-between items-center">
          <button className="text-xs font-bold text-brand-muted uppercase tracking-widest" onClick={() => setIsSigned(false)}>Clear</button>
          <div className="flex items-center gap-2">
            <User size={14} className="text-brand-muted" />
            <span className="text-xs font-bold text-brand-navy">{sr.customer.name}</span>
          </div>
        </div>
      </AdminCard>

      <AdminButton 
        className="w-full py-4" 
        onClick={() => onNext({ customerName: sr.customer.name, signatureUrl: 'data:image/png;base64,mock_signature' })}
        disabled={!isSigned}
      >
        Confirm Signature
      </AdminButton>
    </div>
  )
}

function PaymentStep({ sr, onNext }: { sr: ServiceRequest, onNext: () => void }) {
  const [method, setMethod] = React.useState<'cash' | 'online'>('cash');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-brand-navy">Payment Collection</h2>

      <AdminCard className="p-6 bg-brand-navy text-brand-gold">
        <div className="flex justify-between items-center mb-6">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60">Total Amount</p>
          <p className="text-3xl font-bold">₹1,450.00</p>
        </div>
        <div className="space-y-2 text-xs opacity-80">
          <div className="flex justify-between">
            <span>Service Charge</span>
            <span>₹450.00</span>
          </div>
          <div className="flex justify-between">
            <span>Parts (Capacitor)</span>
            <span>₹1,000.00</span>
          </div>
        </div>
      </AdminCard>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setMethod('cash')}
          className={cn(
            "p-4 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all",
            method === 'cash' ? "bg-brand-gold/10 border-brand-gold text-brand-navy" : "bg-white border-border text-brand-muted"
          )}
        >
          <div className={cn("size-10 rounded-xl flex items-center justify-center", method === 'cash' ? "bg-brand-gold" : "bg-brand-navy/5")}>
            <span className="font-bold text-lg">₹</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Cash / COD</span>
        </button>
        <button 
          onClick={() => setMethod('online')}
          className={cn(
            "p-4 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all",
            method === 'online' ? "bg-brand-gold/10 border-brand-gold text-brand-navy" : "bg-white border-border text-brand-muted"
          )}
        >
          <div className={cn("size-10 rounded-xl flex items-center justify-center", method === 'online' ? "bg-brand-gold" : "bg-brand-navy/5")}>
            <CreditCard size={20} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Online Link</span>
        </button>
      </div>

      <AdminButton className="w-full py-4" onClick={onNext}>
        {method === 'cash' ? "Confirm Collection" : "Send Payment Link"}
      </AdminButton>
    </div>
  )
}

function CompleteStep({ sr }: { sr: ServiceRequest }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-8 text-center py-12">
      <div className="size-32 bg-status-completed/10 text-status-completed rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-status-completed/20">
        <CheckCircle2 size={64} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-brand-navy mb-2">Job Completed!</h2>
        <p className="text-sm text-brand-muted px-8">The service report and invoice have been sent to the customer.</p>
      </div>
      
      <div className="flex flex-col gap-3 px-4">
        <AdminButton className="w-full py-4" onClick={() => navigate('/field/dashboard')}>Back to Dashboard</AdminButton>
        <button className="text-xs font-bold text-brand-gold uppercase tracking-widest py-2">View Service Report</button>
      </div>
    </div>
  )
}
