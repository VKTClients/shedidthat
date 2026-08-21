"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, Clock3, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { format, addMinutes, parseISO } from "date-fns";
import { adminFetch } from "@/lib/admin-fetch";
import { BUSINESS_HOURS } from "@/lib/constants";
import type { AvailabilityBlock } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const slotTimes = Array.from({ length: (BUSINESS_HOURS.end - BUSINESS_HOURS.start) * 2 }, (_, index) => {
  const minutes = BUSINESS_HOURS.start * 60 + index * BUSINESS_HOURS.slotInterval;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

const today = format(new Date(), "yyyy-MM-dd");

export default function AdminAvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState(today);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTime, setSavingTime] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchBlocks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminFetch(`/api/admin/availability?date=${selectedDate}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load availability");
      setBlocks(data.blocks || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlocks(); }, [selectedDate]);

  const blockForSlot = useMemo(() => new Map(
    blocks.map((block) => [format(parseISO(block.start_time), "HH:mm"), block])
  ), [blocks]);

  const toggleSlot = async (time: string) => {
    setSavingTime(time);
    setError("");
    setNotice("");
    try {
      const existing = blockForSlot.get(time);
      const response = existing
        ? await adminFetch(`/api/admin/availability?id=${existing.id}`, { method: "DELETE" })
        : await adminFetch("/api/admin/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              start_time: new Date(`${selectedDate}T${time}:00`).toISOString(),
              end_time: addMinutes(new Date(`${selectedDate}T${time}:00`), BUSINESS_HOURS.slotInterval).toISOString(),
              reason: "Unavailable by studio",
            }),
          });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update availability");
      setNotice(existing ? `${time} restored.` : `${time} marked unavailable.`);
      await fetchBlocks();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unable to update availability");
    } finally {
      setSavingTime("");
    }
  };

  return (
    <section>
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Studio calendar</p>
          <h1 className="admin-page-title">Availability</h1>
          <p className="admin-page-subtitle">Choose a date, then tap any 30-minute slot to make it unavailable or restore it for customers.</p>
        </div>
        <button onClick={fetchBlocks} className="admin-button admin-button-quiet"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>

      {notice && <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check className="h-4 w-4" /> {notice}</div>}
      {error && <div className="admin-error mb-5">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-[#e4e0da] bg-white p-5 shadow-[0_8px_24px_rgba(45,41,38,0.04)] sm:p-6">
          <div className="flex flex-col gap-4 border-b border-[#eeeae5] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="admin-kicker">Selected day</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-brand-charcoal">Block appointment times</h2>
            </div>
            <label className="max-w-xs flex-1">
              <span className="admin-label">Date</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="admin-input" />
            </label>
          </div>

          {loading ? (
            <div className="admin-empty mt-5"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-rose" /><p className="mt-4 text-sm text-brand-muted">Loading availability</p></div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {slotTimes.map((time) => {
                const blocked = blockForSlot.has(time);
                const saving = savingTime === time;
                return (
                  <button key={time} type="button" onClick={() => toggleSlot(time)} disabled={saving} className={cn("flex min-h-16 items-center justify-between rounded-xl border px-3 py-3 text-left transition", blocked ? "border-brand-rose/30 bg-brand-rose/[0.08] text-brand-rose" : "border-[#e4e0da] bg-[#fcfbf9] text-brand-charcoal hover:border-brand-rose/40")}>
                    <span><span className="block text-sm font-semibold">{time}</span><span className="mt-1 block text-[10px] uppercase tracking-[0.12em] opacity-65">{blocked ? "Unavailable" : "Available"}</span></span>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : blocked ? <RotateCcw className="h-4 w-4" /> : <Clock3 className="h-4 w-4 opacity-50" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="calendar-side-card h-fit p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-rose/10 text-brand-rose"><CalendarClock className="h-5 w-5" /></div>
          <h2 className="calendar-side-title mt-5">How it works</h2>
          <p className="admin-copy mt-2">Unavailable blocks are removed from the public booking flow immediately. They also prevent a booking if someone submits an old or manually edited request.</p>
          <div className="mt-5 space-y-3 text-sm text-brand-muted">
            <p><strong className="text-brand-charcoal">07:00–16:00</strong> booking window</p>
            <p><strong className="text-brand-charcoal">30 minutes</strong> per control</p>
            <p><strong className="text-brand-charcoal">Tap again</strong> to restore a slot</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
