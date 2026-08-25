import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

const db = supabaseAdmin as any;

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  try {
    // Get all booking requests with service info
    const { data: bookings, error } = await db
      .from("booking_requests")
      .select(`*, services:service_id (name, full_price)`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin clients error:", error);
      return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
    }

    // Group by email to build client profiles
    const clientMap: Record<string, any> = {};
    let totalRevenue = 0;
    let confirmedCount = 0;
    let pendingCount = 0;

    for (const b of bookings || []) {
      const key = b.email?.toLowerCase() || "unknown";
      if (!clientMap[key]) {
        clientMap[key] = {
          email: b.email,
          name: b.customer_name,
          phone: b.phone,
          bookings: [],
          totalSpent: 0,
          confirmedBookings: 0,
          lastBooking: b.created_at,
        };
      }
      clientMap[key].bookings.push({
        id: b.id,
        service: b.services?.name || "—",
        date: b.start_time,
        amount: b.total_price || b.amount_due,
        status: b.status,
        reference: b.reference,
        short_hair: Boolean(b.short_hair),
        cluster_lashes: Boolean(b.cluster_lashes),
        own_fibre: Boolean(b.own_fibre),
      });
      if (b.status === "CONFIRMED") {
        clientMap[key].totalSpent += Number(b.total_price || b.amount_due) || 0;
        clientMap[key].confirmedBookings += 1;
        totalRevenue += Number(b.total_price || b.amount_due) || 0;
        confirmedCount++;
      }
      if (b.status === "REQUESTED" || b.status === "POP_UPLOADED") {
        pendingCount++;
      }
      // Update name/phone to most recent
      if (b.created_at > clientMap[key].lastBooking) {
        clientMap[key].name = b.customer_name;
        clientMap[key].phone = b.phone;
        clientMap[key].lastBooking = b.created_at;
      }
    }

    const clients = Object.values(clientMap).sort(
      (a: any, b: any) => new Date(b.lastBooking).getTime() - new Date(a.lastBooking).getTime()
    );

    return NextResponse.json({
      clients,
      stats: {
        totalClients: clients.length,
        totalBookings: (bookings || []).length,
        confirmedBookings: confirmedCount,
        pendingBookings: pendingCount,
        totalRevenue,
      },
    });
  } catch (err) {
    console.error("Admin clients error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
