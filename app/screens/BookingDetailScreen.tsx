import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarClock, MapPin, Phone, UserRound, Wrench } from "lucide-react";
import { bookingService } from "../services/booking-service";
import type { BookingRecord } from "../domain/models/admin";
import { formatDate, formatDateTime } from "../utils/format";

export function BookingDetailScreen() {
  const { id = "" } = useParams();
  const [booking, setBooking] = React.useState<BookingRecord | null>(null);

  React.useEffect(() => {
    void bookingService.getById(id).then(setBooking);
  }, [id]);

  if (!booking) {
    return (
      <div className="rounded-3xl border border-border bg-brand-surface px-6 py-10 text-center text-sm text-brand-muted">
        Booking detail is unavailable for this record.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-3xl bg-brand-navy p-6 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">Booking Detail</p>
        <h1 className="mt-2 text-3xl font-bold">{booking.reference}</h1>
        <p className="mt-2 text-sm text-white/75">
          Linked service request:{" "}
          <Link className="font-bold text-brand-gold" to={`/service-requests/${booking.linkedServiceRequestId}`}>
            {booking.linkedServiceRequestId}
          </Link>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-brand-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-brand-muted">Customer</h2>
          <div className="mt-4 space-y-3 text-sm text-brand-navy">
            <p className="flex items-center gap-3"><UserRound size={16} /> {booking.customerName}</p>
            <p className="flex items-center gap-3"><Phone size={16} /> {booking.phone}</p>
            <p className="flex items-center gap-3"><MapPin size={16} /> {booking.address}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-brand-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-brand-muted">Service Window</h2>
          <div className="mt-4 space-y-3 text-sm text-brand-navy">
            <p className="flex items-center gap-3"><Wrench size={16} /> {booking.serviceType}</p>
            <p className="flex items-center gap-3"><CalendarClock size={16} /> {formatDate(booking.requestedDate)} | {booking.requestedSlot}</p>
            <p>Status: {booking.status}</p>
            <p>Technician: {booking.assignedTechnicianName || "Not assigned"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-brand-surface p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.24em] text-brand-muted">Operational Summary</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-brand-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted">Priority</p>
            <p className="mt-2 text-lg font-bold text-brand-navy">{booking.priority}</p>
          </div>
          <div className="rounded-2xl bg-brand-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted">Zone</p>
            <p className="mt-2 text-lg font-bold text-brand-navy">{booking.zoneId}</p>
          </div>
          <div className="rounded-2xl bg-brand-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted">Requested</p>
            <p className="mt-2 text-lg font-bold text-brand-navy">{formatDateTime(booking.requestedDate)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

