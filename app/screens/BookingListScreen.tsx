import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Filter, Search } from "lucide-react";
import { bookingService } from "../services/booking-service";
import type { BookingRecord } from "../domain/models/admin";
import { formatDate } from "../utils/format";

const STATUS_OPTIONS = ["all", "pending", "assigned", "in-progress", "completed", "closed", "cancelled"];

export function BookingListScreen() {
  const navigate = useNavigate();
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [status, setStatus] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await bookingService.list(status === "all" ? {} : { status });
        if (active) {
          setBookings(data);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [status]);

  const filtered = bookings.filter((booking) => {
    const haystack = `${booking.reference} ${booking.customerName} ${booking.serviceType} ${booking.phone}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl bg-brand-navy p-6 text-white shadow-xl md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">Booking Module</p>
          <h1 className="mt-2 text-3xl font-bold">Bookings</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            Review booking-linked service requests, apply queue filters, and open booking detail without leaving the admin shell.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Visible</p>
            <p className="mt-1 text-2xl font-bold">{filtered.length}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Active</p>
            <p className="mt-1 text-2xl font-bold">{filtered.filter((item) => item.status !== "closed" && item.status !== "cancelled").length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-3xl border border-border bg-brand-surface p-4 md:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3 rounded-2xl bg-brand-white px-4 py-3">
          <Search size={18} className="text-brand-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by reference, customer, service, or phone"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <label className="flex items-center gap-3 rounded-2xl bg-brand-white px-4 py-3">
          <Filter size={18} className="text-brand-muted" />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="bg-transparent text-sm outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All statuses" : option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((booking) => (
          <button
            key={booking.id}
            type="button"
            onClick={() => navigate(`/bookings/${booking.id}`)}
            className="rounded-3xl border border-border bg-brand-surface p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-muted">{booking.reference}</p>
                <h2 className="mt-2 text-lg font-bold text-brand-navy">{booking.customerName}</h2>
              </div>
              <span className="rounded-full bg-brand-navy/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-navy">
                {booking.status}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-brand-muted">
              <p>{booking.serviceType}</p>
              <p>{booking.address}</p>
              <p>
                {formatDate(booking.requestedDate)} | {booking.requestedSlot}
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
              <span>{booking.priority}</span>
              <span className="inline-flex items-center gap-2">
                <CalendarCheck size={14} />
                Open Detail
              </span>
            </div>
          </button>
        ))}
      </div>

      {!isLoading && filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-brand-surface px-6 py-10 text-center text-sm text-brand-muted">
          No bookings matched the current filters.
        </div>
      ) : null}
    </div>
  );
}

