export const BOOKING_REQUEST_HOLD_HOURS = 24;

export function getBookingRequestHoldCutoff(now = new Date()) {
  return new Date(now.getTime() - BOOKING_REQUEST_HOLD_HOURS * 60 * 60 * 1000).toISOString();
}

export function isBookingRequestExpired(createdAt: string, now = new Date()) {
  const createdAtMs = Date.parse(createdAt);
  return !Number.isFinite(createdAtMs) || now.getTime() - createdAtMs >= BOOKING_REQUEST_HOLD_HOURS * 60 * 60 * 1000;
}

export async function expireUnapprovedBookingRequests(db: any, now = new Date()) {
  return db
    .from("booking_requests")
    .update({ status: "CANCELLED" })
    .in("status", ["REQUESTED", "POP_UPLOADED"])
    .lte("created_at", getBookingRequestHoldCutoff(now));
}
