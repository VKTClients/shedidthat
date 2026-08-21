import { Resend } from "resend";
import { BANKING_DETAILS, STUDIO_ADDRESS } from "./constants";
import { formatCurrency, formatDateTime } from "./utils";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      // Return a stub that won't crash — emails just won't send
      return { emails: { send: async () => { console.warn("RESEND_API_KEY not set, skipping email"); return { data: null, error: null }; } } } as any;
    }
    _resend = new Resend(key);
  }
  return _resend;
}
const FROM = process.env.EMAIL_FROM || "anotida@virtukey.co.za";

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return getResend().emails.send({
    from: FROM,
    to: data.email,
    subject: "Payment Instructions — SheDidThat",
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #7C3AED; font-size: 24px;">SheDidThat</h1>
        <p>Hi ${data.customerName},</p>
        <p>Thank you for your booking request! Here are your payment details:</p>
        <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date & Time:</strong> ${formatDateTime(data.dateTime)}</p>
          <p><strong>Appointment length:</strong> ${data.durationMinutes} minutes</p>
          <p><strong>Address:</strong> ${STUDIO_ADDRESS}</p>
          <p><strong>Deposit Due:</strong> ${formatCurrency(data.amountDue)}</p>
          <p>This deposit forms part of your total price and will be deducted from the remaining balance.</p>
          <p><strong>Reference:</strong> ${data.reference}</p>
        </div>
        <div style="background: #FEF3C7; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="margin-top: 0;">Banking Details</h3>
          <p><strong>Bank:</strong> ${BANKING_DETAILS.bankName}</p>
          <p><strong>Account Name:</strong> ${BANKING_DETAILS.accountName}</p>
          <p><strong>Account Number:</strong> ${BANKING_DETAILS.accountNumber}</p>
          <p><strong>Branch Code:</strong> ${BANKING_DETAILS.branchCode}</p>
          <p><strong>Account Type:</strong> ${BANKING_DETAILS.accountType}</p>
          <p><strong>Capitec Phone Number:</strong> ${BANKING_DETAILS.phoneNumber}</p>
          <p style="color: #92400E;"><strong>Use reference:</strong> ${data.reference}</p>
        </div>
        <p><strong>Please make an immediate payment, especially when paying from another bank, to avoid payment delays or booking issues.</strong></p>
        <p>After making payment, please upload your Proof of Payment. A clear screenshot of the proof will suffice.</p>
        <a href="${appUrl}/booking/${data.bookingId}/upload" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Upload POP</a>
        <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">Your booking will be confirmed once we verify your payment.</p>
      </div>
    `,
  });
}

export async function sendPOPReceivedEmail(email: string, customerName: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Proof of Payment Received — SheDidThat",
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #7C3AED; font-size: 24px;">SheDidThat</h1>
        <p>Hi ${customerName},</p>
        <p>We've received your Proof of Payment and it's being reviewed.</p>
        <p>You'll receive a confirmation email once your booking is approved.</p>
        <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">Thank you for choosing SheDidThat!</p>
      </div>
    `,
  });
}

export async function sendBookingConfirmedEmail(data: BookingEmailData) {
  return getResend().emails.send({
    from: FROM,
    to: data.email,
    subject: "Booking Confirmed \u2705 — SheDidThat",
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #7C3AED; font-size: 24px;">SheDidThat</h1>
        <p>Hi ${data.customerName},</p>
        <p style="font-size: 18px; color: #059669;"><strong>Your booking is confirmed!</strong></p>
        <div style="background: #ECFDF5; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p><strong>Service:</strong> ${data.serviceName}</p>
          <p><strong>Date & Time:</strong> ${formatDateTime(data.dateTime)}</p>
          <p><strong>Appointment length:</strong> ${data.durationMinutes} minutes</p>
          <p><strong>Address:</strong> ${STUDIO_ADDRESS}</p>
          <p><strong>Amount Paid:</strong> ${formatCurrency(data.amountDue)}</p>
          <p><strong>Reference:</strong> ${data.reference}</p>
        </div>
        <p>We look forward to seeing you!</p>
        <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">SheDidThat Hair Studio</p>
      </div>
    `,
  });
}

export async function sendBookingRejectedEmail(
  email: string,
  customerName: string,
  reason?: string
) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: "POP Rejected — SheDidThat",
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #7C3AED; font-size: 24px;">SheDidThat</h1>
        <p>Hi ${customerName},</p>
        <p>Unfortunately, your Proof of Payment could not be verified.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>Please contact us or submit a new booking request.</p>
        <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">SheDidThat Hair Studio</p>
      </div>
    `,
  });
}
