export const BOOKING_REQUEST_HOLD_HOURS = 24;

export function getBookingRequestHoldExpiry(now = new Date()) {
  return new Date(now.getTime() + BOOKING_REQUEST_HOLD_HOURS * 60 * 60 * 1000).toISOString();
}

export function isBookingRequestExpired(holdExpiresAt: string, now = new Date()) {
  const holdExpiresAtMs = Date.parse(holdExpiresAt);
  return !Number.isFinite(holdExpiresAtMs) || holdExpiresAtMs <= now.getTime();
}

export async function expireUnapprovedBookingRequests(db: any, now = new Date()) {
  return db
    .from("booking_requests")
    .update({ status: "CANCELLED" })
    .in("status", ["REQUESTED", "POP_UPLOADED"])
    .lte("hold_expires_at", now.toISOString());
}
