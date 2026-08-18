"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle, ChevronRight, ExternalLink, Eye, FileText, Loader2, RefreshCw, XCircle } from "lucide-react";
import { AddToCalendarButton } from "@/components/admin/AddToCalendarButton";
import { BOOKING_STATUSES } from "@/lib/constants";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/types/database";
import { adminFetch } from "@/lib/admin-fetch";

interface AdminBooking {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  start_time: string;
  end_time: string;
  payment_choice: string;
  amount_due: number;
  status: BookingStatus;
  reference: string;
  created_at: string;
  short_hair: boolean;
  total_price: number;
  services: { name: string; duration_minutes: number } | null;
  hair_options: { name: string } | null;
  payment_proofs: { id: string; file_url: string; reference_used: string; verification_status: string; review_note: string | null }[];
}

const statusFilters = ["all", "REQUESTED", "POP_UPLOADED", "CONFIRMED", "REJECTED", "CANCELLED"];

export default function AdminPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const url = filter === "all" ? "/api/admin/bookings" : `/api/admin/bookings?status=${filter}`;
      const response = await adminFetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load bookings");
      setBookings(data.bookings || []);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Unable to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const stats = useMemo(() => ({
    total: bookings.length,
    awaiting: bookings.filter((booking) => booking.status === "REQUESTED" || booking.status === "POP_UPLOADED").length,
    confirmed: bookings.filter((booking) => booking.status === "CONFIRMED").length,
    revenue: bookings.filter((booking) => booking.status === "CONFIRMED").reduce((sum, booking) => sum + Number(booking.total_price || booking.amount_due || 0), 0),
  }), [bookings]);

  const handleAction = async (bookingId: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(true);
    try {
      const response = await adminFetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, action, note: reviewNote }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setSelectedBooking(null);
      setReviewNote("");
      await fetchBookings();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section>
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Studio operations</p>
          <h1 className="admin-page-title">Bookings</h1>
          <p className="admin-page-subtitle">Keep the day moving with a clean view of every request, payment, and confirmed appointment.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/calendar" className="admin-button admin-button-quiet"><CalendarDays className="h-4 w-4" /> Open calendar</Link>
          <button onClick={fetchBookings} className="admin-button admin-button-primary"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>
      </header>

      <div className="admin-stat-grid">
        <div className="admin-stat-card"><p className="admin-stat-label">Visible bookings</p><p className="admin-stat-value">{stats.total}</p><p className="admin-stat-note">Across every status</p></div>
        <div className="admin-stat-card"><p className="admin-stat-label">Needs attention</p><p className="admin-stat-value">{stats.awaiting}</p><p className="admin-stat-note">Requests and POP uploads</p></div>
        <div className="admin-stat-card"><p className="admin-stat-label">Confirmed</p><p className="admin-stat-value">{stats.confirmed}</p><p className="admin-stat-note">Ready for the calendar</p></div>
        <div className="admin-stat-card"><p className="admin-stat-label">Confirmed value</p><p className="admin-stat-value text-2xl sm:text-3xl">{formatCurrency(stats.revenue)}</p><p className="admin-stat-note">Based on visible bookings</p></div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-filter-row" role="group" aria-label="Filter bookings by status">
          {statusFilters.map((status) => <button key={status} onClick={() => setFilter(status)} className={cn("admin-filter", filter === status && "admin-filter-active")}>{status === "all" ? "All bookings" : BOOKING_STATUSES[status as BookingStatus]?.label || status}</button>)}
        </div>
        <p className="hidden text-xs text-brand-muted sm:block">{bookings.length} result{bookings.length === 1 ? "" : "s"}</p>
      </div>

      {loading ? (
        <div className="admin-empty"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-rose" /><p className="mt-4 text-sm text-brand-muted">Loading bookings</p></div>
      ) : fetchError ? (
        <div className="admin-empty"><p className="text-sm font-semibold text-brand-charcoal">Could not load bookings</p><p className="mt-2 text-sm text-brand-muted">{fetchError}</p><button onClick={fetchBookings} className="admin-button admin-button-quiet mt-5">Try again</button></div>
      ) : bookings.length === 0 ? (
        <div className="admin-empty"><p className="text-sm font-semibold text-brand-charcoal">No bookings in this view</p><p className="mt-2 text-sm text-brand-muted">New requests will appear here as clients book online.</p></div>
      ) : (
        <div className="admin-booking-list">
          {bookings.map((booking) => (
            <article key={booking.id} className="admin-booking-card">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h2 className="truncate font-display text-xl font-semibold tracking-[-0.025em] text-brand-charcoal">{booking.customer_name}</h2>
                    <span className={cn("admin-badge", BOOKING_STATUSES[booking.status]?.color)}>{BOOKING_STATUSES[booking.status]?.label}</span>
                  </div>
                  <div className="admin-booking-meta">
                    <span><strong className="font-medium text-brand-charcoal">{booking.services?.name || "Service not set"}</strong><br /><span className="text-xs">{booking.services?.duration_minutes || 0} min appointment</span></span>
                    <span>{formatDateTime(booking.start_time)}<br /><span className="text-xs">R175 deposit{booking.short_hair ? " · Short hair +R100" : ""}</span></span>
                    <span><strong className="font-medium text-brand-charcoal">{formatCurrency(booking.total_price || booking.amount_due)}</strong><br /><span className="text-xs">Ref {booking.reference}</span></span>
                  </div>
                  <p className="mt-3 truncate text-xs text-brand-muted">{booking.email} · {booking.phone}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {booking.payment_proofs?.length > 0 && <a href={booking.payment_proofs[0].file_url} target="_blank" rel="noopener noreferrer" className="admin-button admin-button-quiet admin-button-compact"><FileText className="h-4 w-4" /> View POP <ExternalLink className="h-3 w-3" /></a>}
                  <AddToCalendarButton compact appointment={{ id: booking.id, customer_name: booking.customer_name, email: booking.email, phone: booking.phone, start_time: booking.start_time, end_time: booking.end_time, reference: booking.reference, service_name: booking.services?.name }} />
                  {(booking.status === "POP_UPLOADED" || booking.status === "REQUESTED") && <button onClick={() => { setSelectedBooking(booking); setReviewNote(""); }} className="admin-button admin-button-primary admin-button-compact"><Eye className="h-4 w-4" /> Review</button>}
                  <Link href="/admin/calendar" className="admin-icon-button" aria-label={`View ${booking.customer_name} on calendar`}><ChevronRight className="h-4 w-4" /></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedBooking && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="review-booking-title">
          <div className="admin-modal">
            <div className="flex items-start justify-between gap-4"><div><p className="admin-kicker">Payment review</p><h2 id="review-booking-title" className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-brand-charcoal">Review booking</h2></div><button onClick={() => setSelectedBooking(null)} className="admin-icon-button" aria-label="Close review"><XCircle className="h-5 w-5" /></button></div>
            <div className="mt-7 space-y-4 rounded-2xl bg-[#f5f3f0] p-4 text-sm">
              <div className="flex justify-between gap-4"><span className="text-brand-muted">Customer</span><strong>{selectedBooking.customer_name}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-brand-muted">Service</span><strong>{selectedBooking.services?.name || "Service not set"}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-brand-muted">Appointment</span><strong className="text-right">{formatDateTime(selectedBooking.start_time)}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-brand-muted">Total price</span><strong className="text-brand-rose">{formatCurrency(selectedBooking.total_price || selectedBooking.amount_due)}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-brand-muted">Deposit due</span><strong>{formatCurrency(selectedBooking.amount_due)}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-brand-muted">Reference</span><strong className="font-mono">{selectedBooking.reference}</strong></div>
            </div>
            <div className="mt-6"><label className="admin-label" htmlFor="review-note">Admin note</label><textarea id="review-note" className="admin-input min-h-24 resize-y" placeholder="Add context for the client or your team" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} /></div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button onClick={() => handleAction(selectedBooking.id, "APPROVE")} disabled={actionLoading} className="admin-button flex-1 bg-emerald-600 text-white hover:bg-emerald-700">{actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4" /> Approve booking</>}</button><button onClick={() => handleAction(selectedBooking.id, "REJECT")} disabled={actionLoading} className="admin-button flex-1 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100">{actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4" /> Reject</>}</button></div>
            <div className="mt-3"><AddToCalendarButton appointment={{ id: selectedBooking.id, customer_name: selectedBooking.customer_name, email: selectedBooking.email, phone: selectedBooking.phone, start_time: selectedBooking.start_time, end_time: selectedBooking.end_time, reference: selectedBooking.reference, service_name: selectedBooking.services?.name }} /></div>
          </div>
        </div>
      )}
    </section>
  );
}
