import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NEXT_PUBLIC_SUPABASE_URL_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      RESEND_API_KEY_set: !!process.env.RESEND_API_KEY,
      EMAIL_FROM_set: !!process.env.EMAIL_FROM?.trim(),
      NODE_ENV: process.env.NODE_ENV,
    },
    tests: {},
  };

  // Test 1: Try to fetch services count
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from("services")
      .select("*", { count: "exact", head: true });
    
    if (error) {
      diagnostics.tests.services = { success: false, error: error.message };
    } else {
      diagnostics.tests.services = { success: true, count: data?.length ?? "unknown" };
    }
  } catch (err: any) {
    diagnostics.tests.services = { success: false, error: err?.message || String(err) };
  }

  // Test 2: Try to fetch actual services
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from("services")
      .select("id, name, full_price")
      .limit(3);
    
    if (error) {
      diagnostics.tests.servicesList = { success: false, error: error.message };
    } else {
      diagnostics.tests.servicesList = { success: true, data };
    }
  } catch (err: any) {
    diagnostics.tests.servicesList = { success: false, error: err?.message || String(err) };
  }

  // Test 3: Check if the client is properly initialized
  diagnostics.tests.clientInitialized = !!supabaseAdmin;

  return NextResponse.json(diagnostics);
}
