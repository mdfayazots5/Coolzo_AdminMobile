/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminCard } from "@/components/shared/Cards";
import { AdminTextField } from "@/components/shared/AdminTextField";
import { AdminButton } from "@/components/shared/AdminButton";
import { SectionHeader, InlineLoader } from "@/components/shared/Layout";
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Clock,
  ClipboardList,
  MapPin,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  bookingLookupRepository,
  BookingAcTypeLookup,
  BookingBrandLookup,
  BookingServiceLookup,
  BookingSlotLookup,
  BookingTonnageLookup,
  BookingZoneLookup,
} from "@/core/network/booking-lookup-repository";
import {
  CreateServiceRequestInput,
  serviceRequestRepository,
  SRPriority,
} from "@/core/network/service-request-repository";
import { technicianRepository, Technician } from "@/core/network/technician-repository";

interface CreateSRFormState {
  customerName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  cityName: string;
  pincode: string;
  addressLabel: string;
  serviceId: string;
  acTypeId: string;
  tonnageId: string;
  brandId: string;
  requestedDate: string;
  slotAvailabilityId: string;
  modelName: string;
  issueNotes: string;
  internalNote: string;
  assignedTechnicianId: string;
  priority: SRPriority;
}

const initialFormState: CreateSRFormState = {
  customerName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  cityName: "",
  pincode: "",
  addressLabel: "Service Address",
  serviceId: "",
  acTypeId: "",
  tonnageId: "",
  brandId: "",
  requestedDate: "",
  slotAvailabilityId: "",
  modelName: "",
  issueNotes: "",
  internalNote: "",
  assignedTechnicianId: "",
  priority: "normal",
};

const matchLookupId = (options: Array<{ id: string; name: string }>, value?: string) => {
  if (!value) {
    return "";
  }

  const match = options.find((option) => option.name.toLowerCase() === value.toLowerCase());
  return match?.id ?? "";
};

export default function CreateSRScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isTemplateMode = Boolean(id);

  const [formData, setFormData] = React.useState<CreateSRFormState>(initialFormState);
  const [services, setServices] = React.useState<BookingServiceLookup[]>([]);
  const [acTypes, setAcTypes] = React.useState<BookingAcTypeLookup[]>([]);
  const [tonnages, setTonnages] = React.useState<BookingTonnageLookup[]>([]);
  const [brands, setBrands] = React.useState<BookingBrandLookup[]>([]);
  const [technicians, setTechnicians] = React.useState<Technician[]>([]);
  const [zone, setZone] = React.useState<BookingZoneLookup | null>(null);
  const [slots, setSlots] = React.useState<BookingSlotLookup[]>([]);
  const [templateSRNumber, setTemplateSRNumber] = React.useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = React.useState(true);
  const [isResolvingZone, setIsResolvingZone] = React.useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const [serviceData, acTypeData, tonnageData, brandData, technicianData] = await Promise.all([
          bookingLookupRepository.getServices(),
          bookingLookupRepository.getAcTypes(),
          bookingLookupRepository.getTonnages(),
          bookingLookupRepository.getBrands(),
          technicianRepository.getTechnicians({ activeOnly: true }),
        ]);

        if (!isMounted) {
          return;
        }

        setServices(serviceData);
        setAcTypes(acTypeData);
        setTonnages(tonnageData);
        setBrands(brandData);
        setTechnicians(technicianData);

        if (!id) {
          return;
        }

        const existing = await serviceRequestRepository.getSRById(id);
        if (!existing || !isMounted) {
          return;
        }

        setTemplateSRNumber(existing.srNumber);
        setFormData((current) => ({
          ...current,
          customerName: existing.customer.name,
          phone: existing.customer.phone,
          email: existing.customer.email,
          addressLine1: existing.location.address,
          cityName: existing.location.city,
          serviceId: matchLookupId(serviceData, existing.serviceType),
          acTypeId: matchLookupId(acTypeData, existing.equipment.type),
          tonnageId: matchLookupId(tonnageData, existing.equipment.tonnage),
          brandId: matchLookupId(brandData, existing.equipment.brand),
          modelName: existing.equipment.model,
          issueNotes: existing.internalNotes[0]?.content || "",
          priority: existing.priority,
          internalNote: `Follow-up for ${existing.srNumber}`,
        }));

        toast.info("Direct SR editing is not available in the current backend API. This form uses the existing SR as a follow-up template.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load service request setup data");
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [id]);

  React.useEffect(() => {
    let isMounted = true;

    const loadSlots = async () => {
      if (!zone?.id || !formData.requestedDate) {
        setSlots([]);
        setFormData((current) =>
          current.slotAvailabilityId
            ? { ...current, slotAvailabilityId: "" }
            : current,
        );
        return;
      }

      setIsLoadingSlots(true);
      try {
        const slotData = await bookingLookupRepository.getSlots(zone.id, formData.requestedDate);
        if (!isMounted) {
          return;
        }

        const availableSlots = slotData.filter((slot) => slot.isAvailable);
        setSlots(availableSlots);

        setFormData((current) => {
          if (availableSlots.some((slot) => slot.id === current.slotAvailabilityId)) {
            return current;
          }

          return {
            ...current,
            slotAvailabilityId: availableSlots[0]?.id ?? "",
          };
        });
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setSlots([]);
          toast.error("Failed to load slot availability");
        }
      } finally {
        if (isMounted) {
          setIsLoadingSlots(false);
        }
      }
    };

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, [formData.requestedDate, zone?.id]);

  const updateField = <K extends keyof CreateSRFormState>(field: K, value: CreateSRFormState[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const resolveZone = async () => {
    const trimmedPincode = formData.pincode.trim();
    if (!trimmedPincode) {
      toast.error("Enter a service pincode first");
      return;
    }

    setIsResolvingZone(true);
    try {
      const zoneLookup = await bookingLookupRepository.getZoneByPincode(trimmedPincode);
      if (!zoneLookup) {
        setZone(null);
        toast.error("This pincode is not serviceable");
        return;
      }

      setZone(zoneLookup);
      setFormData((current) => ({
        ...current,
        cityName: current.cityName || zoneLookup.cityName,
      }));
      toast.success(`Zone resolved: ${zoneLookup.name}`);
    } catch (error) {
      console.error(error);
      setZone(null);
      toast.error("Unable to resolve service zone");
    } finally {
      setIsResolvingZone(false);
    }
  };

  const validateForm = () => {
    const missingFields: string[] = [];

    if (!formData.customerName.trim()) missingFields.push("customer name");
    if (!formData.phone.trim()) missingFields.push("phone number");
    if (!formData.addressLine1.trim()) missingFields.push("address");
    if (!formData.cityName.trim()) missingFields.push("city");
    if (!formData.pincode.trim()) missingFields.push("pincode");
    if (!zone?.id) missingFields.push("service zone");
    if (!formData.serviceId) missingFields.push("service type");
    if (!formData.acTypeId) missingFields.push("AC type");
    if (!formData.tonnageId) missingFields.push("tonnage");
    if (!formData.brandId) missingFields.push("brand");
    if (!formData.requestedDate) missingFields.push("requested date");
    if (!formData.slotAvailabilityId) missingFields.push("preferred slot");

    if (missingFields.length > 0) {
      toast.error(`Complete the required fields: ${missingFields.join(", ")}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateServiceRequestInput = {
        customerName: formData.customerName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        landmark: formData.landmark.trim() || undefined,
        cityName: formData.cityName.trim(),
        pincode: formData.pincode.trim(),
        addressLabel: formData.addressLabel.trim() || undefined,
        serviceId: formData.serviceId,
        acTypeId: formData.acTypeId,
        tonnageId: formData.tonnageId,
        brandId: formData.brandId,
        slotAvailabilityId: formData.slotAvailabilityId,
        modelName: formData.modelName.trim() || undefined,
        issueNotes: formData.issueNotes.trim() || undefined,
        internalNote: [
          formData.internalNote.trim(),
          templateSRNumber ? `Follow-up created from ${templateSRNumber}` : "",
        ]
          .filter(Boolean)
          .join(" | ") || undefined,
        assignedTechnicianId: formData.assignedTechnicianId || undefined,
        priority: formData.priority,
      };

      const created = await serviceRequestRepository.createSR(payload);
      toast.success(`Service Request ${created.srNumber} created successfully`);
      navigate(`/service-requests/${created.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create service request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSlot = slots.find((slot) => slot.id === formData.slotAvailabilityId);

  if (isBootstrapping) {
    return <InlineLoader className="h-screen" />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-brand-navy/5 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-brand-navy" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">
            {isTemplateMode ? "Create Follow-up Service Request" : "Create Service Request"}
          </h1>
          <p className="text-sm text-brand-muted">
            {isTemplateMode
              ? "Build a new request from the existing SR context"
              : "Create a live service request through booking lookup and slot allocation"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminCard className="p-6">
          <SectionHeader title="Customer Information" icon={<User size={18} />} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <AdminTextField
              label="Customer Name"
              required
              value={formData.customerName}
              onChange={(event) => updateField("customerName", event.target.value)}
            />
            <AdminTextField
              label="Phone Number"
              required
              value={formData.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
            <AdminTextField
              label="Email Address"
              value={formData.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
            <AdminTextField
              label="Address Label"
              value={formData.addressLabel}
              onChange={(event) => updateField("addressLabel", event.target.value)}
            />
          </div>
        </AdminCard>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AdminCard className="p-6">
            <SectionHeader title="Service & Equipment" icon={<Wrench size={18} />} />
            <div className="space-y-4 mt-4">
              <SelectField
                label="Service Type"
                value={formData.serviceId}
                onChange={(value) => updateField("serviceId", value)}
                options={services.map((item) => ({
                  value: item.id,
                  label: `${item.name} ${item.basePrice ? `Rs ${item.basePrice}` : ""}`.trim(),
                }))}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectField
                  label="AC Type"
                  value={formData.acTypeId}
                  onChange={(value) => updateField("acTypeId", value)}
                  options={acTypes.map((item) => ({ value: item.id, label: item.name }))}
                  required
                />
                <SelectField
                  label="Tonnage"
                  value={formData.tonnageId}
                  onChange={(value) => updateField("tonnageId", value)}
                  options={tonnages.map((item) => ({ value: item.id, label: item.name }))}
                  required
                />
                <SelectField
                  label="Brand"
                  value={formData.brandId}
                  onChange={(value) => updateField("brandId", value)}
                  options={brands.map((item) => ({ value: item.id, label: item.name }))}
                  required
                />
              </div>
              <AdminTextField
                label="Model Name"
                value={formData.modelName}
                onChange={(event) => updateField("modelName", event.target.value)}
              />
              <div>
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-2 block">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["normal", "urgent", "emergency"] as SRPriority[]).map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => updateField("priority", priority)}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                        formData.priority === priority
                          ? "bg-brand-navy text-brand-gold border-brand-navy"
                          : "bg-white text-brand-muted border-border hover:border-brand-navy",
                      )}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
              <TextAreaField
                label="Issue Notes"
                value={formData.issueNotes}
                onChange={(value) => updateField("issueNotes", value)}
                placeholder="Describe the customer complaint or service context"
              />
            </div>
          </AdminCard>

          <AdminCard className="p-6">
            <SectionHeader title="Location & Scheduling" icon={<MapPin size={18} />} />
            <div className="space-y-4 mt-4">
              <AdminTextField
                label="Address Line 1"
                required
                value={formData.addressLine1}
                onChange={(event) => updateField("addressLine1", event.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminTextField
                  label="Address Line 2"
                  value={formData.addressLine2}
                  onChange={(event) => updateField("addressLine2", event.target.value)}
                />
                <AdminTextField
                  label="Landmark"
                  value={formData.landmark}
                  onChange={(event) => updateField("landmark", event.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
                <AdminTextField
                  label="Pincode"
                  required
                  value={formData.pincode}
                  onChange={(event) => updateField("pincode", event.target.value)}
                  onBlur={resolveZone}
                />
                <AdminButton
                  type="button"
                  variant="outline"
                  disabled={isResolvingZone}
                  onClick={resolveZone}
                >
                  {isResolvingZone ? "Detecting..." : "Detect Zone"}
                </AdminButton>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminTextField
                  label="City"
                  required
                  value={formData.cityName}
                  onChange={(event) => updateField("cityName", event.target.value)}
                />
                <div className="rounded-xl border border-brand-navy/10 bg-brand-navy/5 px-4 py-3">
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1">Resolved Zone</p>
                  <p className="text-sm font-bold text-brand-navy">{zone?.name || "Pending pincode lookup"}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminTextField
                  label="Requested Date"
                  type="date"
                  required
                  value={formData.requestedDate}
                  onChange={(event) => updateField("requestedDate", event.target.value)}
                />
                <SelectField
                  label="Preferred Slot"
                  value={formData.slotAvailabilityId}
                  onChange={(value) => updateField("slotAvailabilityId", value)}
                  options={slots.map((slot) => ({
                    value: slot.id,
                    label: `${slot.slotLabel} (${slot.availableCapacity - slot.reservedCapacity} free)`,
                  }))}
                  required
                  disabled={isLoadingSlots || slots.length === 0}
                  placeholder={isLoadingSlots ? "Loading slots..." : "Select a slot"}
                />
              </div>
              {selectedSlot && (
                <div className="p-4 rounded-xl border border-brand-gold/20 bg-brand-gold/5">
                  <div className="flex items-center gap-2 text-brand-navy mb-1">
                    <Clock size={16} className="text-brand-gold" />
                    <span className="text-sm font-bold">{selectedSlot.slotLabel}</span>
                  </div>
                  <p className="text-xs text-brand-muted">
                    {selectedSlot.startTime} - {selectedSlot.endTime} • Capacity left:{" "}
                    {selectedSlot.availableCapacity - selectedSlot.reservedCapacity}
                  </p>
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        <AdminCard className="p-6">
          <SectionHeader title="Operations Notes" icon={<ClipboardList size={18} />} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
            <SelectField
              label="Assign Technician"
              value={formData.assignedTechnicianId}
              onChange={(value) => updateField("assignedTechnicianId", value)}
              options={technicians.map((item) => ({
                value: item.id,
                label: `${item.name} • ${item.branch}`,
              }))}
              placeholder="Leave unassigned"
            />
            <TextAreaField
              label="Internal Note"
              value={formData.internalNote}
              onChange={(value) => updateField("internalNote", value)}
              placeholder="Optional dispatch or call-center context"
            />
          </div>
        </AdminCard>

        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-brand-muted flex items-center gap-2">
            <AlertTriangle size={14} />
            <span>Zone and slot must resolve before the SR can be created.</span>
          </div>
          <div className="flex items-center gap-3">
            <AdminButton type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Creating..."
                : isTemplateMode
                  ? "Create Follow-up SR"
                  : "Create Service Request"}
            </AdminButton>
          </div>
        </div>
      </form>
    </div>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const { label, value, onChange, options, placeholder = "Select an option", required, disabled } = props;

  return (
    <div>
      <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1 block">
        {label}
        {required ? " *" : ""}
      </label>
      <select
        className="w-full p-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-sm focus:border-brand-gold outline-none disabled:opacity-60"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1 block">
        {props.label}
      </label>
      <textarea
        className="w-full min-h-[110px] p-3 bg-brand-navy/5 border border-brand-navy/10 rounded-xl text-sm focus:border-brand-gold outline-none resize-y"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
      />
    </div>
  );
}
