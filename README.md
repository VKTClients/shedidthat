# SheDidThat — Premium Hair Studio Booking

A modern, scalable salon booking website built with Next.js, Supabase, and Tailwind CSS.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (custom brand theme)
- **Supabase** (PostgreSQL, Auth, Storage)
- **Resend** (transactional emails)
- **Lucide React** (icons)
- **date-fns** (date utilities)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema in `supabase/schema.sql` via the SQL Editor
3. Create a storage bucket called `payment-proofs` (set to public)
4. Create an admin user via Supabase Auth dashboard

### 3. Configure Environment

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase service role key (server-side only)
- `RESEND_API_KEY` — Your Resend API key
- `EMAIL_FROM` — Sender address from a domain verified in Resend (do not use a personal/unverified address)
- `NEXT_PUBLIC_APP_URL` — Your app URL (e.g. `http://localhost:3000`)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── availability/   # GET available time slots
│   │   ├── bookings/       # POST create booking
│   │   ├── upload-pop/     # POST upload proof of payment
│   │   └── admin/
│   │       ├── bookings/   # GET admin booking list
│   │       └── review/     # POST approve/reject booking
│   ├── admin/              # Admin dashboard (auth-protected)
│   ├── booking/            # Multi-step booking flow
│   ├── services/           # Services & pricing page
│   ├── tips/               # Hair care tips page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser Supabase client
│   │   └── server.ts       # Server Supabase client (service role)
│   ├── types/
│   │   └── database.ts     # TypeScript types
│   ├── constants.ts        # Business hours, banking details
│   ├── email.ts            # Resend email templates
│   └── utils.ts            # Helpers (slots, currency, etc.)
supabase/
└── schema.sql              # Full database schema + seed data
```

## Booking Flow

1. **Select Service** — Browse and pick a service
2. **Hair Option** — Choose hair type (if applicable)
3. **Date & Time** — Pick from available slots
4. **Your Details** — Name, email, phone, payment choice
5. **Payment Instructions** — Banking details + unique reference
6. **Upload POP** — Upload proof of payment (PDF/JPG/PNG)
7. **Done** — Await admin verification

## Admin Panel

Access at `/admin`. Login with Supabase Auth credentials.

- View all bookings with status filters
- Review proof of payment uploads
- Approve or reject with notes
- Automatic confirmation emails on approval

## Booking States

| Status | Description |
|---|---|
| `REQUESTED` | Booking created, awaiting payment |
| `POP_UPLOADED` | Proof of payment submitted |
| `CONFIRMED` | Payment verified, slot confirmed |
| `REJECTED` | Payment rejected by admin |
| `CANCELLED` | Booking cancelled |

## Deployment

Optimized for **Vercel**:

```bash
npm run build
```

Set environment variables in Vercel dashboard.

### Resend delivery checklist

The booking, POP received, approval, and rejection routes all wait for Resend and report delivery failures in server logs. Configure `RESEND_API_KEY`, `EMAIL_FROM`, and the production `NEXT_PUBLIC_APP_URL` in the same Vercel environment as the deployment, verify the sender domain in Resend, and redeploy after changing either value. A booking is retained if an email provider call fails; the admin can select the booking and use **Resend client email** without creating a duplicate booking. The payment email's **Upload POP** link opens the standalone upload page and requires the booking reference.

## Customization

- **Banking details** — Edit `src/lib/constants.ts`
- **Business hours** — Edit `src/lib/constants.ts`
- **Brand colors** — Edit `tailwind.config.ts`
- **Email templates** — Edit `src/lib/email.ts`
- **Services** — Manage via Supabase dashboard or seed SQL
# shedidthat
