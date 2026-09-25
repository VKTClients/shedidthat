"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { ArrowLeft, CalendarDays, ChevronRight, Clock3, Loader2, MapPin, RefreshCw, UserRound, X } from "lucide-react";
import { AddToCalendarButton } from "@/components/admin/AddToCalendarButton";
import { BOOKING_STATUSES, BOOKING_WINDOW_END, BOOKING_WINDOW_START } from "@/lib/constants";
import { formatCurrency, cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/types/database";
import { adminFetch } from "@/lib/admin-fetch";
import { studioDateKey, studioDateLabel, studioDateTime, studioDateTimeLabel, studioTime } from "@/lib/studio-time";

interface CalendarBooking {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  start_time: string;
  end_time: string;
  amount_due: number;
  total_price: number;
  own_fibre: boolean;
  short_hair: boolean;
  cluster_lashes: boolean;
  status: BookingStatus;
  reference: string;
  services: { name: string; duration_minutes: number } | null;
  hair_options: { name: string } | null;
  secondary_hair_options: { name: string } | null;
}

const weekdays = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];

function eventTone(status: BookingStatus) {
  if (status === "CONFIRMED") return "calendar-event-confirmed";
  if (status === "REQUESTED" || status === "POP_UPLOADED") return "calendar-event-pending";
  return "calendar-event-other";
}

function bookingCardTone(status: BookingStatus) {
  if (status === "CONFIRMED") return "border-emerald-200 bg-emerald-50/80";
  if (status === "REQUESTED" || status === "POP_UPLOADED") return "border-amber-200 bg-amber-50/70";
  return "";
}

function bookingSelection(booking: CalendarBooking) {
  if (!booking.hair_options?.name) return null;
  const label = booking.services?.name === "Ocean Curls" ? "Colour" : "Selection";
  return `${label}: ${booking.hair_options.name}${booking.secondary_hair_options?.name ? ` · Backup: ${booking.secondary_hair_options.name}` : ""}`;
}

function bookingAddOns(booking: CalendarBooking) {
  return [
    booking.cluster_lashes ? "Cluster lashes · +R150" : null,
    booking.short_hair ? "Short hair fee · +R100" : null,
  ].filter(Boolean) as string[];
}

export default function AdminCalendarPage() {
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await adminFetch("/api/admin/bookings?view=calendar");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load calendar");
      setBookings(data.bookings || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load calendar");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCalendarAction = async (bookingId: string, action: "APPROVE" | "REJECT" | "CANCEL") => {
    setActionLoading(true);
    setActionError("");
    try {
      const response = await adminFetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, action }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Booking action failed");
      if (data.status) {
        setBookings((current) => current.map((booking) =>
          booking.id === bookingId ? { ...booking, status: data.status as BookingStatus } : booking
        ));
      }
      await fetchBookings(true);
    } catch (actionFailure) {
      setActionError(actionFailure instanceof Error ? actionFailure.message : "Booking action failed");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const refreshWhenActive = () => {
      if (document.visibilityState === "visible") fetchBookings();
    };
    window.addEventListener("focus", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);
    return () => {
      window.removeEventListener("focus", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, []);

  const days = useMemo(() => eachDayOfInterval({ start: parseISO(BOOKING_WINDOW_START), end: parseISO(BOOKING_WINDOW_END) }), []);
  const windowBookings = useMemo(() => bookings.filter((booking) => {
    const dateKey = studioDateKey(parseISO(booking.start_time));
    return dateKey >= BOOKING_WINDOW_START && dateKey <= BOOKING_WINDOW_END;
  }), [bookings]);
  const selectedBooking = bookings.find((booking) => booking.id === selectedId) || null;
  const selectedDayBookings = useMemo(() => selectedDayKey
    ? bookings
      .filter((booking) => studioDateKey(parseISO(booking.start_time)) === selectedDayKey)
      .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
    : [], [bookings, selectedDayKey]);
  const upcoming = useMemo(() => windowBookings.filter((booking) => parseISO(booking.end_time) >= new Date()).sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()).slice(0, 5), [windowBookings]);
  const todayKey = studioDateKey(new Date());

  return (
    <section>
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Studio operations</p>
          <h1 className="admin-page-title">Calendar</h1>
          <p className="admin-page-subtitle">A calm, month-at-a-glance view for planning your chair, your time, and your next client.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Link href="/admin" className="admin-button admin-button-quiet"><ArrowLeft className="h-4 w-4" /> Bookings</Link><button onClick={() => fetchBookings()} className="admin-button admin-button-primary"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
      </header>

      <div className="calendar-layout">
        <div className="calendar-card">
          <div className="calendar-toolbar">
            <h2 className="calendar-month-title">September – 14 October 2026</h2>
            <span className="hidden items-center gap-2 text-xs text-brand-muted sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Confirmed <span className="ml-2 h-2 w-2 rounded-full bg-amber-500" /> Awaiting review</span>
          </div>
          {loading ? <div className="admin-empty m-5"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-rose" /><p className="mt-4 text-sm text-brand-muted">Loading calendar</p></div> : error ? <div className="admin-empty m-5"><p className="text-sm font-semibold">Could not load calendar</p><p className="mt-2 text-sm text-brand-muted">{error}</p><button onClick={() => fetchBookings()} className="admin-button admin-button-quiet mt-5">Try again</button></div> : <>
            <div className="calendar-grid">{weekdays.map((day) => <div key={day} className="calendar-weekday">{day}</div>)}</div>
            <div className="calendar-grid">
              {days.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayBookings = windowBookings.filter((booking) => studioDateKey(parseISO(booking.start_time)) === dayKey).sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
                return <div key={day.toISOString()} className={cn("calendar-day", dayKey === todayKey && "calendar-day-today", selectedDayKey === dayKey && "calendar-day-selected")} role="button" tabIndex={0} onClick={() => setSelectedDayKey(dayKey)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedDayKey(dayKey); } }} aria-label={`View all bookings for ${format(day, "d MMMM yyyy")}`}><div className="flex items-center justify-between gap-1"><div className={cn("calendar-day-number", dayKey === todayKey && "calendar-day-number-today")}>{format(day, "d")}</div>{dayBookings.length > 0 && <span className="calendar-day-count">{dayBookings.length}</span>}</div>{dayBookings.slice(0, 3).map((booking) => <button key={booking.id} onClick={(event) => { event.stopPropagation(); setSelectedId(booking.id); }} title={`${studioTime(parseISO(booking.start_time))} — ${booking.customer_name}`} aria-label={`View booking for ${booking.customer_name} at ${studioTime(parseISO(booking.start_time))}`} className={cn("calendar-event", eventTone(booking.status), selectedId === booking.id && "ring-2 ring-brand-rose/40")}><span className="font-semibold">{studioTime(parseISO(booking.start_time))}</span><span className="calendar-event-client">{booking.customer_name}</span></button>)}{dayBookings.length > 3 && <button onClick={(event) => { event.stopPropagation(); setSelectedDayKey(dayKey); }} className="px-1.5 text-[10px] font-semibold text-brand-rose" aria-label={`View all bookings on ${format(day, "d MMMM")}`}>View all {dayBookings.length}</button>}</div>;
              })}
            </div>
          </>}
        </div>

        <aside className="space-y-5">
          {selectedBooking ? <div className={cn("calendar-side-card", bookingCardTone(selectedBooking.status))}><div className="flex items-start justify-between gap-4"><div><p className="admin-kicker">Selected appointment</p><h2 className="calendar-side-title mt-2">{selectedBooking.customer_name}</h2></div><span className={cn("admin-badge", BOOKING_STATUSES[selectedBooking.status]?.color)}>{BOOKING_STATUSES[selectedBooking.status]?.label}</span></div><div className="mt-5 space-y-3 text-sm"><div className="flex gap-3"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" /><div><p className="font-medium text-brand-charcoal">{studioDateTimeLabel(parseISO(selectedBooking.start_time))}</p><p className="text-brand-muted">{studioTime(parseISO(selectedBooking.start_time))} to {studioTime(parseISO(selectedBooking.end_time))}</p></div></div><div className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" /><div><p className="font-medium text-brand-charcoal">{selectedBooking.services?.name || "Service not set"}</p><p className="text-brand-muted">{selectedBooking.services?.duration_minutes || 0} minute appointment</p>{bookingSelection(selectedBooking) && <p className="mt-1 font-medium text-brand-rose">{bookingSelection(selectedBooking)}</p>}{bookingAddOns(selectedBooking).map((addOn) => <p key={addOn} className="mt-1 font-medium text-brand-charcoal">{addOn}</p>)}</div></div><div className="flex gap-3"><UserRound className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" /><div><p className="font-medium text-brand-charcoal">{selectedBooking.email}</p><p className="text-brand-muted">{selectedBooking.phone}</p></div></div><div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" /><p className="font-medium text-brand-charcoal">SheDidThat Hair Studio</p></div></div><p className="mt-5 border-t border-[#eeeae5] pt-4 text-sm text-brand-muted">Booking value <strong className="float-right text-brand-charcoal">{formatCurrency(selectedBooking.total_price || selectedBooking.amount_due)}</strong></p>{actionError && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">{actionError}</p>}{(selectedBooking.status === "REQUESTED" || selectedBooking.status === "POP_UPLOADED") && <button onClick={() => handleCalendarAction(selectedBooking.id, "APPROVE")} disabled={actionLoading} className="admin-button mt-5 w-full bg-emerald-600 text-white hover:bg-emerald-700">{actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve booking"}</button>}{selectedBooking.status === "CONFIRMED" && <button onClick={() => { if (window.confirm("Cancel this appointment and release its time slot?")) handleCalendarAction(selectedBooking.id, "CANCEL"); }} disabled={actionLoading} className="admin-button mt-3 w-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100">Cancel appointment</button>}<div className="mt-3"><AddToCalendarButton appointment={{ id: selectedBooking.id, customer_name: selectedBooking.customer_name, email: selectedBooking.email, phone: selectedBooking.phone, start_time: selectedBooking.start_time, end_time: selectedBooking.end_time, reference: selectedBooking.reference, service_name: selectedBooking.services?.name }} /></div></div> : <div className="calendar-side-card"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-rose/10 text-brand-rose"><CalendarDays className="h-5 w-5" /></div><h2 className="calendar-side-title mt-5">Select an appointment</h2><p className="admin-copy mt-2">Choose an event from the calendar to see the client details and add it to your personal calendar.</p></div>}
          <div className="calendar-side-card"><div className="flex items-center justify-between"><div><p className="admin-kicker">Coming up</p><h2 className="calendar-side-title mt-2">Next appointments</h2></div><span className="text-xs text-brand-muted">{windowBookings.length} in this window</span></div>{upcoming.length === 0 ? <p className="admin-copy mt-5">Your upcoming appointments will appear here.</p> : <div className="mt-2">{upcoming.map((booking) => <button key={booking.id} onClick={() => setSelectedId(booking.id)} className="calendar-upcoming-item block w-full text-left"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-brand-charcoal">{booking.customer_name}</p><p className="mt-1 text-xs text-brand-muted">{studioDateTimeLabel(parseISO(booking.start_time))}, {studioTime(parseISO(booking.start_time))}</p>{bookingSelection(booking) && <p className="mt-1 text-xs font-medium text-brand-rose">{bookingSelection(booking)}</p>}</div><ChevronRight className="h-4 w-4 shrink-0 text-brand-muted" /></div></button>)}</div>}</div>
        </aside>
      </div>

      {selectedBooking && <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="calendar-booking-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
        <div className="admin-modal">
          <div className="flex items-start justify-between gap-4">
            <div><p className="admin-kicker">Full booking</p><h2 id="calendar-booking-title" className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-brand-charcoal">{selectedBooking.customer_name}</h2></div>
            <button onClick={() => setSelectedId(null)} className="admin-icon-button" aria-label="Close booking details"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-6 space-y-4 text-sm">
            <div className="flex items-start justify-between gap-4 border-b border-[#eeeae5] pb-4"><span className="text-brand-muted">Status</span><span className={cn("admin-badge", BOOKING_STATUSES[selectedBooking.status]?.color)}>{BOOKING_STATUSES[selectedBooking.status]?.label}</span></div>
            <div className="flex items-start justify-between gap-4"><span className="text-brand-muted">Date and time</span><strong className="text-right text-brand-charcoal">{studioDateLabel(parseISO(selectedBooking.start_time), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}<br />{studioTime(parseISO(selectedBooking.start_time))} – {studioTime(parseISO(selectedBooking.end_time))}</strong></div>
            <div className="flex items-start justify-between gap-4"><span className="text-brand-muted">Service</span><strong className="text-right text-brand-charcoal">{selectedBooking.services?.name || "Service not set"}<br /><span className="font-normal text-brand-muted">{selectedBooking.services?.duration_minutes || 0} minute appointment</span></strong></div>
            {bookingSelection(selectedBooking) && <div className="flex items-start justify-between gap-4"><span className="text-brand-muted">{selectedBooking.services?.name === "Ocean Curls" ? "Colour" : "Selection"}</span><strong className="text-right text-brand-charcoal">{selectedBooking.hair_options?.name}{selectedBooking.secondary_hair_options?.name && <><br /><span className="font-normal text-brand-muted">Backup: {selectedBooking.secondary_hair_options.name}</span></>}</strong></div>}
            {bookingAddOns(selectedBooking).map((addOn) => <div key={addOn} className="flex items-start justify-between gap-4"><span className="text-brand-muted">Add-on</span><strong className="text-right text-brand-charcoal">{addOn}</strong></div>)}
            {selectedBooking.own_fibre && <div className="flex items-start justify-between gap-4"><span className="text-brand-muted">Fibre</span><strong className="text-right text-brand-charcoal">Customer-supplied<br /><span className="font-normal text-brand-muted">R100 discount · confirm specifics</span></strong></div>}
            <div className="flex items-start justify-between gap-4"><span className="text-brand-muted">Contact</span><strong className="text-right text-brand-charcoal">{selectedBooking.email}<br />{selectedBooking.phone}</strong></div>
            <div className="flex items-start justify-between gap-4"><span className="text-brand-muted">Booking reference</span><strong className="font-mono text-brand-charcoal">{selectedBooking.reference}</strong></div>
            <div className="flex items-start justify-between gap-4 border-t border-[#eeeae5] pt-4"><span className="text-brand-muted">Booking value</span><strong className="text-brand-rose">{formatCurrency(selectedBooking.total_price || selectedBooking.amount_due)}</strong></div>
          </div>
          {actionError && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">{actionError}</p>}
          {(selectedBooking.status === "REQUESTED" || selectedBooking.status === "POP_UPLOADED") && <button onClick={() => handleCalendarAction(selectedBooking.id, "APPROVE")} disabled={actionLoading} className="admin-button mt-6 w-full bg-emerald-600 text-white hover:bg-emerald-700">{actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve booking"}</button>}
          <div className="mt-3"><AddToCalendarButton appointment={{ id: selectedBooking.id, customer_name: selectedBooking.customer_name, email: selectedBooking.email, phone: selectedBooking.phone, start_time: selectedBooking.start_time, end_time: selectedBooking.end_time, reference: selectedBooking.reference, service_name: selectedBooking.services?.name }} /></div>
        </div>
      </div>}

      {selectedDayKey && <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="calendar-day-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedDayKey(null); }}>
        <div className="admin-modal max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div><p className="admin-kicker">Full day</p><h2 id="calendar-day-title" className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-brand-charcoal">{studioDateLabel(studioDateTime(selectedDayKey, "12:00"), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h2><p className="admin-copy mt-2">{selectedDayBookings.length} booking{selectedDayBookings.length === 1 ? "" : "s"} scheduled</p></div>
            <button onClick={() => setSelectedDayKey(null)} className="admin-icon-button" aria-label="Close full day"><X className="h-5 w-5" /></button>
          </div>
          {selectedDayBookings.length === 0 ? <div className="admin-empty mt-6 px-5 py-12"><CalendarDays className="mx-auto h-6 w-6 text-brand-muted" /><p className="mt-4 text-sm text-brand-muted">No bookings on this day.</p></div> : <div className="mt-6 space-y-3">{selectedDayBookings.map((booking) => <button key={booking.id} onClick={() => { setSelectedDayKey(null); setSelectedId(booking.id); }} className={cn("admin-booking-card block w-full text-left", bookingCardTone(booking.status))}><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-brand-charcoal">{studioTime(parseISO(booking.start_time))} – {studioTime(parseISO(booking.end_time))}</p><p className="mt-1 text-sm text-brand-muted">{booking.customer_name} · {booking.services?.name || "Service not set"}</p>{bookingSelection(booking) && <p className="mt-1 text-xs font-medium text-brand-rose">{bookingSelection(booking)}</p>}{bookingAddOns(booking).map((addOn) => <p key={addOn} className="mt-1 text-xs font-medium text-brand-charcoal">{addOn}</p>)}<p className="mt-2 text-xs text-brand-muted">{booking.reference}</p></div><span className={cn("admin-badge", BOOKING_STATUSES[booking.status]?.color)}>{BOOKING_STATUSES[booking.status]?.label}</span></div></button>)}</div>}
        </div>
      </div>}
    </section>
  );
}
