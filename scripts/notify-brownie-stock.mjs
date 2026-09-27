import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const args = new Set(process.argv.slice(2));
const envArg = process.argv.find((value) => value.startsWith("--env="));
if (envArg) process.loadEnvFile(envArg.slice("--env=".length));

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required.`);
}

const shouldSend = args.has("--send");
if (shouldSend && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) {
  throw new Error("RESEND_API_KEY and EMAIL_FROM are required when using --send.");
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await db
  .from("booking_requests")
  .select("id, customer_name, email, start_time, reference, status, services:service_id(name), hair_options:hair_option_id(name), secondary_hair_options:secondary_hair_option_id(name)")
  .gte("start_time", new Date().toISOString())
  .order("start_time", { ascending: true });

if (error) throw new Error(`Could not load upcoming bookings: ${error.message}`);

const relatedName = (relation) => Array.isArray(relation) ? relation[0]?.name : relation?.name;
const brownieRelated = (booking) => {
  const names = [
    relatedName(booking.services),
    relatedName(booking.hair_options),
    relatedName(booking.secondary_hair_options),
  ].filter(Boolean).map((value) => value.toLowerCase());
  return names.some((name) => name.includes("brownie") || name.includes("ruby curls"));
};

const affected = (data || []).filter((booking) =>
  !["REJECTED", "CANCELLED"].includes(booking.status) && brownieRelated(booking)
);

const clients = new Map();
for (const booking of affected) {
  const key = booking.email.trim().toLowerCase();
  if (!clients.has(key)) clients.set(key, { name: booking.customer_name, email: booking.email.trim(), bookings: [] });
  clients.get(key).bookings.push(booking);
}

console.log(JSON.stringify({ mode: shouldSend ? "send" : "dry-run", affectedBookings: affected.length, recipients: clients.size }));

if (!shouldSend || clients.size === 0) process.exit(0);

const resend = new Resend(process.env.RESEND_API_KEY);
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");
const formatAppointment = (value) => new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Africa/Johannesburg",
}).format(new Date(value));

let sent = 0;
for (const client of clients.values()) {
  const appointmentItems = client.bookings.map((booking) => `
    <li style="margin-bottom: 10px;">
      ${escapeHtml(formatAppointment(booking.start_time))}
      ${booking.reference ? ` — reference ${escapeHtml(booking.reference)}` : ""}
    </li>`).join("");
  const { data: result, error: sendError } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: client.email,
    subject: "Brownie colour stock update — SheDidThat",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 36px 20px; color: #3f302f;">
        <h1 style="color: #7c3aed; font-size: 24px;">SheDidThat</h1>
        <p>Hi ${escapeHtml(client.name)},</p>
        <p>We’re sorry, but Brownie is now sold out and is no longer available for your upcoming appointment${client.bookings.length > 1 ? "s" : ""}:</p>
        <ul style="padding-left: 22px;">${appointmentItems}</ul>
        <p>Please contact us on <strong>082 441 8297</strong> or <strong>hello@shedidthat.co.za</strong> so we can help you choose another available colour or style. Your appointment has not been cancelled.</p>
        <p>We apologise for the inconvenience and appreciate your understanding.</p>
        <p style="margin-top: 28px; color: #6b7280; font-size: 14px;">SheDidThat Hair Studio</p>
      </div>`,
  });
  if (sendError || !result?.id) throw new Error(`Email delivery failed after ${sent} successful send(s): ${sendError?.message || "No message id returned"}`);
  sent += 1;
}

console.log(JSON.stringify({ sent }));
