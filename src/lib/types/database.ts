export type BookingStatus =
  | "REQUESTED"
  | "POP_UPLOADED"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED";

export type DepositType = "PERCENTAGE" | "FIXED";

export type PaymentChoice = "DEPOSIT";

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  full_price: number;
  deposit_type: DepositType;
  deposit_value: number;
  has_hair_options: boolean;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
}

export interface HairOption {
  id: string;
  service_id: string;
  name: string;
  price_delta: number;
}

export interface BookingRequest {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  service_id: string;
  hair_option_id: string | null;
  secondary_hair_option_id: string | null;
  start_time: string;
  end_time: string;
  payment_choice: PaymentChoice;
  amount_due: number;
  total_price: number;
  short_hair: boolean;
  cluster_lashes: boolean;
  own_fibre: boolean;
  status: BookingStatus;
  reference: string;
  created_at: string;
}

export interface PaymentProof {
  id: string;
  booking_request_id: string;
  file_url: string;
  reference_used: string;
  uploaded_at: string;
  verification_status: VerificationStatus;
  review_note: string | null;
}

export interface ConfirmedBooking {
  id: string;
  booking_request_id: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface AvailabilityBlock {
  id: string;
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
}

export interface BookingSettings {
  singleton_id: number;
  display_month: string;
  updated_at: string;
}

export interface SiteMedia {
  slot_key: string;
  image_url: string;
  alt_text: string;
  updated_at: string;
}

// Supabase Database type helper
export interface Database {
  public: {
    Tables: {
      services: {
        Row: Service;
        Insert: Omit<Service, "id" | "created_at">;
        Update: Partial<Omit<Service, "id" | "created_at">>;
      };
      hair_options: {
        Row: HairOption;
        Insert: Omit<HairOption, "id">;
        Update: Partial<Omit<HairOption, "id">>;
      };
      booking_requests: {
        Row: BookingRequest;
        Insert: Omit<BookingRequest, "id" | "created_at" | "reference">;
        Update: Partial<Omit<BookingRequest, "id" | "created_at">>;
      };
      payment_proofs: {
        Row: PaymentProof;
        Insert: Omit<PaymentProof, "id" | "uploaded_at">;
        Update: Partial<Omit<PaymentProof, "id" | "uploaded_at">>;
      };
      confirmed_bookings: {
        Row: ConfirmedBooking;
        Insert: Omit<ConfirmedBooking, "id" | "created_at">;
        Update: Partial<Omit<ConfirmedBooking, "id" | "created_at">>;
      };
      availability_blocks: {
        Row: AvailabilityBlock;
        Insert: Omit<AvailabilityBlock, "id" | "created_at">;
        Update: Partial<Omit<AvailabilityBlock, "id" | "created_at">>;
      };
      booking_settings: {
        Row: BookingSettings;
        Insert: Omit<BookingSettings, "updated_at"> & { updated_at?: string };
        Update: Partial<Omit<BookingSettings, "singleton_id">>;
      };
      site_media: {
        Row: SiteMedia;
        Insert: Omit<SiteMedia, "updated_at"> & { updated_at?: string };
        Update: Partial<Omit<SiteMedia, "slot_key">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
