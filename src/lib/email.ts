import { Resend } from "resend";
import { BANKING_DETAILS, STUDIO_ADDRESS } from "./constants";
import { formatCurrency, formatDateTime } from "./utils";

let resendClient: Resend | null = null;
const EMAIL_TIMEOUT_MS = 12_000;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("Email delivery is not configured: RESEND_API_KEY is missing.");
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

function getFromAddress() {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) throw new Error("Email delivery is not configured: EMAIL_FROM is missing.");
  if (!from.includes("@")) throw new Error("Email delivery is not configured: EMAIL_FROM is invalid.");
  return from;
}

function validateRecipient(email: string) {
  const recipient = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error("Email delivery skipped: recipient address is invalid.");
  }
  return recipient;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendEmail(to: string, subject: string, html: string) {
  let result: { data: { id: string } | null; error: { message?: string } | null };
  try {
    result = await Promise.race([
      getResend().emails.send({ from: getFromAddress(), to: validateRecipient(to), subject, html }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Resend email delivery timed out.")), EMAIL_TIMEOUT_MS)
      ),
    ]);
  } catch (error) {
    throw new Error(`Resend email delivery failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (result.error || !result.data?.id) {
    throw new Error(`Resend email delivery failed: ${result.error?.message || "no message id returned"}`);
  }
  return { id: result.data.id };
}

interface BookingEmailData {
  customerName: string;
  email: string;
  serviceName: string;
  dateTime: string;
  amountDue: number;
  reference: string;
  bookingId: string;
  durationMinutes: number;
}

export async function sendPaymentInstructionsEmail(data: BookingEmailData) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return sendEmail(data.email, "Payment Instructions — SheDidThat", `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #7C3AED; font-size: 24px;">SheDidThat</h1>
      <p>Hi ${escapeHtml(data.customerName)},</p>
      <p>Thank you for your booking request! Here are your payment details:</p>
      <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p><strong>Service:</strong> ${escapeHtml(data.serviceName)}</p>
        <p><strong>Date &amp; Time:</strong> ${escapeHtml(formatDateTime(data.dateTime))}</p>
        <p><strong>Appointment length:</strong> ${escapeHtml(data.durationMinutes)} minutes</p>
        <p><strong>Address:</strong> ${escapeHtml(STUDIO_ADDRESS)}</p>
        <p><strong>Deposit Due:</strong> ${escapeHtml(formatCurrency(data.amountDue))}</p>
        <p>This deposit forms part of your total price and will be deducted from the remaining balance.</p>
        <p><strong>Reference:</strong> ${escapeHtml(data.reference)}</p>
      </div>
      <div style="background: #FEF3C7; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <h3 style="margin-top: 0;">Banking Details</h3>
        <p><strong>Bank:</strong> ${escapeHtml(BANKING_DETAILS.bankName)}</p>
        <p><strong>Account Name:</strong> ${escapeHtml(BANKING_DETAILS.accountName)}</p>
        <p><strong>Account Number:</strong> ${escapeHtml(BANKING_DETAILS.accountNumber)}</p>
        <p><strong>Branch Code:</strong> ${escapeHtml(BANKING_DETAILS.branchCode)}</p>
        <p><strong>Account Type:</strong> ${escapeHtml(BANKING_DETAILS.accountType)}</p>
        <p><strong>Capitec Phone Number:</strong> ${escapeHtml(BANKING_DETAILS.phoneNumber)}</p>
        <p style="color: #92400E;"><strong>Use reference:</strong> ${escapeHtml(data.reference)}</p>
      </div>
      <p><strong>Please make an immediate payment, especially when paying from another bank, to avoid payment delays or booking issues.</strong></p>
      <p>After making payment, please upload your Proof of Payment. A clear screenshot of the proof will suffice.</p>
      <a href="${escapeHtml(appUrl)}/booking/${encodeURIComponent(data.bookingId)}/upload?reference=${encodeURIComponent(data.reference)}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Upload POP</a>
      <p style="margin-top: 24px;"><strong>After booking, please contact SheDidThat on 082 441 8297 or hello@shedidthat.co.za for further confirmation and details.</strong></p>
      <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">Your booking will be confirmed once we verify your payment.</p>
    </div>`);
}

export async function sendPOPReceivedEmail(email: string, customerName: string) {
  return sendEmail(email, "Proof of Payment Received — SheDidThat", `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #7C3AED; font-size: 24px;">SheDidThat</h1>
      <p>Hi ${escapeHtml(customerName)},</p>
      <p>We've received your Proof of Payment and it's being reviewed.</p>
      <p>You'll receive a confirmation email once your booking is approved.</p>
      <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">Thank you for choosing SheDidThat!</p>
    </div>`);
}

export async function sendBookingConfirmedEmail(data: BookingEmailData) {
  return sendEmail(data.email, "Booking Confirmed ✅ — SheDidThat", `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #7C3AED; font-size: 24px;">SheDidThat</h1>
      <p>Hi ${escapeHtml(data.customerName)},</p>
      <p style="font-size: 18px; color: #059669;"><strong>Your booking is confirmed!</strong></p>
      <div style="background: #ECFDF5; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p><strong>Service:</strong> ${escapeHtml(data.serviceName)}</p>
        <p><strong>Date &amp; Time:</strong> ${escapeHtml(formatDateTime(data.dateTime))}</p>
        <p><strong>Appointment length:</strong> ${escapeHtml(data.durationMinutes)} minutes</p>
        <p><strong>Address:</strong> ${escapeHtml(STUDIO_ADDRESS)}</p>
        <p><strong>Amount Paid:</strong> ${escapeHtml(formatCurrency(data.amountDue))}</p>
        <p><strong>Reference:</strong> ${escapeHtml(data.reference)}</p>
      </div>
      <p><strong>For further confirmation and details after booking, please contact SheDidThat on 082 441 8297 or hello@shedidthat.co.za.</strong></p>
      <p>We look forward to seeing you!</p>
      <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">SheDidThat Hair Studio</p>
    </div>`);
}

export async function sendBookingRejectedEmail(email: string, customerName: string, reason?: string) {
  return sendEmail(email, "POP Rejected — SheDidThat", `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #7C3AED; font-size: 24px;">SheDidThat</h1>
      <p>Hi ${escapeHtml(customerName)},</p>
      <p>Unfortunately, your Proof of Payment could not be verified.</p>
      ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}
      <p>Please contact us or submit a new booking request.</p>
      <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">SheDidThat Hair Studio</p>
    </div>`);
}
