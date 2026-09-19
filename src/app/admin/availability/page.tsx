"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  Clock3,
  Loader2,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import {
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";
import { adminFetch } from "@/lib/admin-fetch";
import { APPOINTMENT_START_TIMES, BOOKING_WINDOW_END, BOOKING_WINDOW_START, BUSINESS_HOURS, DEFAULT_BOOKING_DISPLAY_MONTH } from "@/lib/constants";
import { studioDateKey, studioDateTime, studioTime } from "@/lib/studio-time";
import type { AvailabilityBlock } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const slotTimes = [...APPOINTMENT_START_TIMES];
const weekdays = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];

export default function AdminAvailabilityPage() {
  const viewedMonth = DEFAULT_BOOKING_DISPLAY_MONTH;
  const [selectedDate, setSelectedDate] = useState(DEFAULT_BOOKING_DISPLAY_MONTH);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminFetch(`/api/admin/availability?month=${viewedMonth.slice(0, 7)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load availability");
      setBlocks(data.blocks || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load availability");
    } finally {
      setLoading(false);
    }
  }, [viewedMonth]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const blockForSlot = useMemo(() => {
    const map = new Map<string, AvailabilityBlock>();
    blocks.forEach((block) => {
      const start = parseISO(block.start_time);
      map.set(`${studioDateKey(start)} ${studioTime(start)}`, block);
    });
    return map;
  }, [blocks]);

  const monthDate = parseISO(viewedMonth);
  const calendarDays = eachDayOfInterval({
    start: parseISO(BOOKING_WINDOW_START),
    end: parseISO(BOOKING_WINDOW_END),
  });

  const blockedCount = (dateKey: string) => slotTimes.filter((time) => blockForSlot.has(`${dateKey} ${time}`)).length;
  const selectedBlockedCount = blockedCount(selectedDate);
  const selectedDayClosed = BUSINESS_HOURS.daysOff.includes(parseISO(selectedDate).getDay());

  const toggleDay = async () => {
    const makeAvailable = selectedBlockedCount === slotTimes.length;
    setSaving("day");
    setError("");
    setNotice("");
    try {
      const response = await adminFetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, available: makeAvailable }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update this day");
      setNotice(`${format(parseISO(selectedDate), "d MMMM")} is now ${makeAvailable ? "available" : "unavailable"}.`);
      await fetchBlocks();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update this day");
    } finally {
      setSaving("");
    }
  };

  const toggleSlot = async (time: string) => {
    setSaving(time);
    setError("");
    setNotice("");
    try {
      const existing = blockForSlot.get(`${selectedDate} ${time}`);
      const start = studioDateTime(selectedDate, time);
      const response = existing
        ? await adminFetch(`/api/admin/availability?id=${existing.id}`, { method: "DELETE" })
        : await adminFetch("/api/admin/availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              start_time: start.toISOString(),
              end_time: new Date(start.getTime() + BUSINESS_HOURS.slotInterval * 60_000).toISOString(),
              reason: "Unavailable by studio",
            }),
          });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update availability");
      setNotice(existing ? `${time} restored.` : `${time} marked unavailable.`);
      await fetchBlocks();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update availability");
    } finally {
      setSaving("");
    }
  };

  return (
    <section>
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Studio calendar</p>
          <h1 className="admin-page-title">Availability</h1>
          <p className="admin-page-subtitle">Manage customer availability for the first two weeks of October, one day or appointment start at a time.</p>
        </div>
        <button onClick={fetchBlocks} className="admin-button admin-button-quiet"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>

      {notice && <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check className="h-4 w-4" /> {notice}</div>}
      {error && <div className="admin-error mb-5">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="calendar-card">
          <div className="calendar-toolbar">
            <div>
              <p className="admin-kicker">Edit availability</p>
              <h2 className="calendar-month-title mt-1">1–14 {format(monthDate, "MMMM yyyy")}</h2>
            </div>
          </div>

          <div className="calendar-grid">
            {weekdays.map((day) => <div key={day} className="calendar-weekday">{day}</div>)}
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const closed = BUSINESS_HOURS.daysOff.includes(day.getDay());
              const unavailable = blockedCount(dateKey);
              const isSelected = dateKey === selectedDate;
              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => !closed && setSelectedDate(dateKey)}
                  disabled={closed}
                  className={cn(
                    "min-h-[78px] border-b border-r border-[#eeeae5] p-2 text-left transition sm:min-h-[96px] sm:p-3",
                    closed && "cursor-not-allowed bg-[#fbfaf8] text-brand-muted/25",
                    "hover:bg-brand-rose/[0.035]",
                    !isSelected && (closed || unavailable === slotTimes.length) && "bg-[#fbfaf8]",
                    isSelected && "relative bg-brand-rose/[0.08] shadow-[inset_0_0_0_2px_rgba(183,110,121,0.55)]"
                  )}
                >
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold", isSelected ? "bg-brand-rose text-white" : closed || unavailable === slotTimes.length ? "text-brand-muted/35" : "text-brand-charcoal")}>{format(day, "d")}</span>
                  <span className={cn("mt-2 block text-[10px] font-medium sm:text-xs", closed || unavailable === slotTimes.length ? "text-brand-muted/45" : unavailable > 0 ? "text-brand-rose" : "text-emerald-700") }>
                      {closed ? <><span className="sm:hidden">Closed</span><span className="hidden sm:inline">Studio closed</span></>
                        : unavailable === slotTimes.length ? "Unavailable"
                        : unavailable > 0 ? <><span className="sm:hidden">{slotTimes.length - unavailable} open</span><span className="hidden sm:inline">{slotTimes.length - unavailable} of {slotTimes.length} open</span></>
                        : <><span className="sm:hidden">{slotTimes.length} open</span><span className="hidden sm:inline">All slots open</span></>}
                  </span>
                </button>
              );
            })}
          </div>
          {loading && <div className="flex items-center justify-center border-t border-[#eeeae5] py-4 text-sm text-brand-muted"><Loader2 className="mr-2 h-4 w-4 animate-spin text-brand-rose" /> Loading month</div>}
        </div>

        <aside className="calendar-side-card h-fit p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="admin-kicker">Selected day</p>
              <h2 className="calendar-side-title mt-2">{format(parseISO(selectedDate), "EEEE, d MMMM")}</h2>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-rose/10 text-brand-rose"><CalendarClock className="h-5 w-5" /></div>
          </div>

          {selectedDayClosed ? (
            <div className="mt-5 rounded-xl bg-[#f5f3f0] p-4 text-sm text-brand-muted">This is a regular studio closed day.</div>
          ) : (
            <>
              <button type="button" onClick={toggleDay} disabled={saving === "day"} className={cn("admin-button mt-5 w-full justify-center", selectedBlockedCount === slotTimes.length ? "admin-button-quiet" : "border border-brand-rose/25 bg-brand-rose/[0.08] text-brand-rose hover:bg-brand-rose/[0.13]") }>
                {saving === "day" ? <Loader2 className="h-4 w-4 animate-spin" /> : selectedBlockedCount === slotTimes.length ? <RotateCcw className="h-4 w-4" /> : <X className="h-4 w-4" />}
                {selectedBlockedCount === slotTimes.length ? "Restore the whole day" : "Make whole day unavailable"}
              </button>

              <div className="mt-6">
                <p className="admin-label">Appointment starts</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {slotTimes.map((time) => {
                    const blocked = blockForSlot.has(`${selectedDate} ${time}`);
                    return (
                      <button key={time} type="button" onClick={() => toggleSlot(time)} disabled={Boolean(saving)} className={cn("flex min-h-16 items-center justify-between rounded-xl border px-3 py-3 text-left transition disabled:cursor-wait disabled:opacity-60", blocked ? "border-brand-rose/30 bg-brand-rose/[0.08] text-brand-rose" : "border-[#e4e0da] bg-[#fcfbf9] text-brand-charcoal hover:border-brand-rose/40") }>
                        <span><span className="block text-sm font-semibold">{time}</span><span className="mt-1 block text-[10px] opacity-65">{blocked ? "Unavailable" : "Available"}</span></span>
                        {saving === time ? <Loader2 className="h-4 w-4 animate-spin" /> : blocked ? <RotateCcw className="h-4 w-4" /> : <Clock3 className="h-4 w-4 opacity-50" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <p className="admin-copy mt-6 border-t border-[#eeeae5] pt-5">Unavailable days and times appear faded to customers and remain protected by server-side booking checks.</p>
        </aside>
      </div>
    </section>
  );
}
