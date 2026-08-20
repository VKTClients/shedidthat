"use client";

import { useState, useEffect } from "react";
import { formatDateTime, formatCurrency, cn } from "@/lib/utils";
import { BOOKING_STATUSES } from "@/lib/constants";
import { adminFetch } from "@/lib/admin-fetch";
import {
  Loader2,
  RefreshCw,
  Users,
  DollarSign,
  CalendarCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import type { BookingStatus } from "@/lib/types/database";

interface ClientBooking {
  id: string;
  service: string;
  date: string;
  amount: number;
  status: BookingStatus;
  reference: string;
  short_hair: boolean;
  cluster_lashes: boolean;
}

interface Client {
  email: string;
  name: string;
  phone: string;
  bookings: ClientBooking[];
  totalSpent: number;
  confirmedBookings: number;
  lastBooking: string;
}

interface Stats {
  totalClients: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/clients");
      const data = await res.json();
      setClients(data.clients || []);
      setStats(data.stats || null);
    } catch {
      console.error("Failed to fetch clients");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <section className="py-8 bg-white min-h-[80vh]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl font-semibold text-brand-charcoal">
            Clients & Sales
          </h1>
          <button
            onClick={fetchClients}
            className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-rose transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-rose/10">
                  <Users className="h-4 w-4 text-brand-rose" />
                </div>
                <span className="text-xs text-brand-muted/60 uppercase tracking-wider">Clients</span>
              </div>
              <p className="font-display text-2xl font-semibold text-brand-charcoal">
                {stats.totalClients}
              </p>
            </div>
            <div className="glass p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-rose/10">
                  <DollarSign className="h-4 w-4 text-brand-rose" />
                </div>
                <span className="text-xs text-brand-muted/60 uppercase tracking-wider">Revenue</span>
              </div>
              <p className="font-display text-2xl font-semibold text-brand-rose">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="glass p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                  <CalendarCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs text-brand-muted/60 uppercase tracking-wider">Confirmed</span>
              </div>
              <p className="font-display text-2xl font-semibold text-brand-charcoal">
                {stats.confirmedBookings}
              </p>
            </div>
            <div className="glass p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs text-brand-muted/60 uppercase tracking-wider">Pending</span>
              </div>
              <p className="font-display text-2xl font-semibold text-brand-charcoal">
                {stats.pendingBookings}
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted/40" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand-rose" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass text-center py-16">
            <p className="text-brand-muted">No clients found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((client) => {
              const isExpanded = expandedClient === client.email;
              return (
                <div key={client.email} className="glass overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedClient(isExpanded ? null : client.email)
                    }
                    className="w-full text-left p-5 flex items-center justify-between hover:bg-brand-rose/[0.02] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-display text-lg font-semibold text-brand-charcoal truncate">
                          {client.name}
                        </h3>
                        <span className="text-xs text-brand-muted/60 bg-brand-charcoal/[0.04] px-2 py-0.5 rounded-full">
                          {client.bookings.length} booking{client.bookings.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-brand-muted">
                        <span>{client.email}</span>
                        <span>{client.phone}</span>
                        {client.totalSpent > 0 && (
                          <span className="text-brand-rose font-medium">
                            Total: {formatCurrency(client.totalSpent)}
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-brand-muted/40 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-brand-muted/40 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-brand-charcoal/[0.06] px-5 pb-5">
                      <div className="mt-4 space-y-2">
                        <h4 className="text-xs font-medium uppercase tracking-wider text-brand-muted/60 mb-3">
                          Booking History
                        </h4>
                        {client.bookings.map((b) => (
                          <div
                            key={b.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-brand-charcoal/[0.04] last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm text-brand-charcoal">
                                  {b.service}
                                </span>
                                <span
                                  className={cn(
                                    "px-2 py-0.5 text-xs font-medium",
                                    BOOKING_STATUSES[b.status]?.color
                                  )}
                                >
                                  {BOOKING_STATUSES[b.status]?.label}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 text-xs text-brand-muted/50">
                                <span>{formatDateTime(b.date)}</span>
                                <span>Ref: {b.reference}</span>
                                {b.short_hair && <span>Short hair · specialised preparation +R100</span>}
                                {b.cluster_lashes && <span>Cluster Lashes · +R150</span>}
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-brand-rose whitespace-nowrap">
                              {formatCurrency(b.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
