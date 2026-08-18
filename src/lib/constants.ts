export const BUSINESS_HOURS = {
  start: 8, // 8 AM
  end: 18, // 6 PM
  slotInterval: 30, // 30-minute intervals
  daysOff: [0] as number[], // Sunday = 0
};

export const BANKING_DETAILS = {
  bankName: "Capitec Bank",
  accountName: "Miss Ol Seema",
  accountNumber: "2103320030",
  branchCode: "470010",
  accountType: "Savings Account",
  phoneNumber: "082 441 8297",
};

export const MAX_POP_SIZE_MB = 10;
export const ACCEPTED_POP_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const BOOKING_DEPOSIT = 175;
export const SHORT_HAIR_SURCHARGE = 100;

export const BOOKING_STATUSES = {
  REQUESTED: { label: "Requested", color: "bg-amber-50 text-amber-700" },
  POP_UPLOADED: { label: "POP Uploaded", color: "bg-blue-50 text-blue-700" },
  CONFIRMED: { label: "Confirmed", color: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Rejected", color: "bg-red-50 text-red-700" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500" },
} as const;
