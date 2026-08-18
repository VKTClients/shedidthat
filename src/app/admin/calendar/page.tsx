"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Clock3, Loader2, MapPin, RefreshCw, UserRound } from "lucide-react";
import { AddToCalendarButton } from "@/components/admin/AddToCalendarButton";
import { BOOKING_STATUSES } from "@/lib/constants";
import { formatCurrency, formatTime, cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/types/database";
import { adminFetch } from "@/lib/admin-fetch";

interface CalendarBooking {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  start_time: string;
  end_time: string;
  amount_due: number;
  status: BookingStatus;
  reference: string;
  services: { name: string; duration_minutes: number } | null;
}

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function eventTone(status: BookingStatus) {
  if (status === "CONFIRMED") return "calendar-event-confirmed";
  if (status === "REQUESTED" || status === "POP_UPLOADED") return "calendar-event-pending";
  return "calendar-event-other";
}

export default function AdminCalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminFetch("/api/admin/bookings");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load calendar");
      setBookings(data.bookings || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const days = useMemo(() => eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) }), [month]);
  const selectedBooking = bookings.find((booking) => booking.id === selectedId) || null;
  const upcoming = useMemo(() => bookings.filter((booking) => parseISO(booking.end_time) >= new Date()).sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()).slice(0, 5), [bookings]);
  const monthBookings = bookings.filter((booking) => isSameMonth(parseISO(booking.start_time), month));

  return (
    <section>
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Studio operations</p>
          <h1 className="admin-page-title">Calendar</h1>
          <p className="admin-page-subtitle">A calm, month-at-a-glance view for planning your chair, your time, and your next client.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Link href="/admin" className="admin-button admin-button-quiet"><ArrowLeft className="h-4 w-4" /> Bookings</Link><button onClick={fetchBookings} className="admin-button admin-button-primary"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
      </header>

      <div className="calendar-layout">
        <div className="calendar-card">
          <div className="calendar-toolbar">
            <div className="flex items-center gap-3"><button onClick={() => setMonth(subMonths(month, 1))} className="admin-icon-button" aria-label="Previous month"><ChevronLeft className="h-5 w-5" /></button><h2 className="calendar-month-title">{format(month, "MMMM yyyy")}</h2><button onClick={() => setMonth(addMonths(month, 1))} className="admin-icon-button" aria-label="Next month"><ChevronRight className="h-5 w-5" /></button></div>
            <div className="flex items-center gap-2"><button onClick={() => setMonth(new Date())} className="admin-button admin-button-quiet admin-button-compact">Today</button><span className="hidden items-center gap-2 text-xs text-brand-muted sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Confirmed <span className="ml-2 h-2 w-2 rounded-full bg-amber-500" /> Awaiting review</span></div>
          </div>
          {loading ? <div className="admin-empty m-5"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-rose" /><p className="mt-4 text-sm text-brand-muted">Loading calendar</p></div> : error ? <div className="admin-empty m-5"><p className="text-sm font-semibold">Could not load calendar</p><p className="mt-2 text-sm text-brand-muted">{error}</p><button onClick={fetchBookings} className="admin-button admin-button-quiet mt-5">Try again</button></div> : <>
            <div className="calendar-grid">{weekdays.map((day) => <div key={day} className="calendar-weekday">{day}</div>)}</div>
            <div className="calendar-grid">
              {days.map((day) => {
                const dayBookings = bookings.filter((booking) => isSameDay(parseISO(booking.start_time), day)).sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
                return <div key={day.toISOString()} className={cn("calendar-day", !isSameMonth(day, month) && "calendar-day-muted", isToday(day) && "calendar-day-today")}><div className={cn("calendar-day-number", isToday(day) && "calendar-day-number-today")}>{format(day, "d")}</div>{dayBookings.slice(0, 3).map((booking) => <button key={booking.id} onClick={() => setSelectedId(booking.id)} className={cn("calendar-event", eventTone(booking.status), selectedId === booking.id && "ring-2 ring-brand-rose/40")}><span className="font-semibold">{formatTime(booking.start_time)}</span> {booking.customer_name}</button>)}{dayBookings.length > 3 && <button onClick={() => setSelectedId(dayBookings[3].id)} className="px-1.5 text-[10px] font-semibold text-brand-rose">+{dayBookings.length - 3} more</button>}</div>;
              })}
            </div>
          </>}
        </div>

        <aside className="space-y-5">
          {selectedBooking ? <div className="calendar-side-card"><div className="flex items-start justify-between gap-4"><div><p className="admin-kicker">Selected appointment</p><h2 className="calendar-side-title mt-2">{selectedBooking.customer_name}</h2></div><span className={cn("admin-badge", BOOKING_STATUSES[selectedBooking.status]?.color)}>{BOOKING_STATUSES[selectedBooking.status]?.label}</span></div><div className="mt-5 space-y-3 text-sm"><div className="flex gap-3"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" /><div><p className="font-medium text-brand-charcoal">{format(parseISO(selectedBooking.start_time), "EEE, d MMM")}</p><p className="text-brand-muted">{formatTime(selectedBooking.start_time)} to {formatTime(selectedBooking.end_time)}</p></div></div><div className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" /><div><p className="font-medium text-brand-charcoal">{selectedBooking.services?.name || "Service not set"}</p><p className="text-brand-muted">{selectedBooking.services?.duration_minutes || 0} minute appointment</p></div></div><div className="flex gap-3"><UserRound className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" /><div><p className="font-medium text-brand-charcoal">{selectedBooking.email}</p><p className="text-brand-muted">{selectedBooking.phone}</p></div></div><div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose" /><p className="font-medium text-brand-charcoal">SheDidThat Hair Studio</p></div></div><p className="mt-5 border-t border-[#eeeae5] pt-4 text-sm text-brand-muted">Booking value <strong className="float-right text-brand-charcoal">{formatCurrency(selectedBooking.amount_due)}</strong></p><div className="mt-5"><AddToCalendarButton appointment={{ id: selectedBooking.id, customer_name: selectedBooking.customer_name, email: selectedBooking.email, phone: selectedBooking.phone, start_time: selectedBooking.start_time, end_time: selectedBooking.end_time, reference: selectedBooking.reference, service_name: selectedBooking.services?.name }} /></div></div> : <div className="calendar-side-card"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-rose/10 text-brand-rose"><CalendarDays className="h-5 w-5" /></div><h2 className="calendar-side-title mt-5">Select an appointment</h2><p className="admin-copy mt-2">Choose an event from the calendar to see the client details and add it to your personal calendar.</p></div>}
          <div className="calendar-side-card"><div className="flex items-center justify-between"><div><p className="admin-kicker">Coming up</p><h2 className="calendar-side-title mt-2">Next appointments</h2></div><span className="text-xs text-brand-muted">{monthBookings.length} this month</span></div>{upcoming.length === 0 ? <p className="admin-copy mt-5">Your upcoming appointments will appear here.</p> : <div className="mt-2">{upcoming.map((booking) => <button key={booking.id} onClick={() => { setSelectedId(booking.id); setMonth(parseISO(booking.start_time)); }} className="calendar-upcoming-item block w-full text-left"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-brand-charcoal">{booking.customer_name}</p><p className="mt-1 text-xs text-brand-muted">{format(parseISO(booking.start_time), "EEE, d MMM")}, {formatTime(booking.start_time)}</p></div><ChevronRight className="h-4 w-4 shrink-0 text-brand-muted" /></div></button>)}</div>}</div>
        </aside>
      </div>
    </section>
  );
}
