"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { formatCurrency, generateTimeSlots, cn } from "@/lib/utils";
import { BANKING_DETAILS, BUSINESS_HOURS, BOOKING_DEPOSIT, CLUSTER_LASHES_PRICE, SHORT_HAIR_SURCHARGE, STUDIO_ADDRESS } from "@/lib/constants";
import { format, addDays, startOfDay, parseISO } from "date-fns";
import {
  ChevronLeft,
  Clock,
  Loader2,
  CheckCircle,
  Banknote,
  Copy,
  Upload,
  ArrowRight,
} from "lucide-react";
import type { Service, HairOption } from "@/lib/types/database";

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-brand-rose" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}

type Step = "service" | "hair" | "datetime" | "details" | "policy" | "payment" | "upload" | "done";

const oceanCurlImages: Record<string, string> = {
  Blondie: "/images/Ocean Curls Blondie.jpeg",
  Brownie: "/images/Ocean Curls Brownie.jpeg",
  Goldie: "/images/Ocean Curls Goldie.jpeg",
  Black: "/images/Ocean Curls Black.jpeg",
  Ginger: "/images/Ocean Curls Ginger.jpeg",
};

const oceanCurlColourOrder = ["Blondie", "Brownie", "Goldie", "Black", "Ginger"];

function isOceanCurls(serviceName?: string) {
  return serviceName?.toLowerCase().includes("ocean curl") ?? false;
}

function getOceanCurlImage(optionName: string) {
  const colour = oceanCurlColourOrder.find((name) =>
    optionName.toLowerCase().includes(name.toLowerCase())
  );
  return colour ? oceanCurlImages[colour] : undefined;
}

interface BookingState {
  service: Service | null;
  hairOption: HairOption | null;
  date: Date | null;
  timeSlot: { start: Date; end: Date; label: string } | null;
  name: string;
  email: string;
  phone: string;
  shortHair: boolean;
  clusterLashes: boolean;
  washedHairConfirmed: boolean;
}

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedServiceId = searchParams.get("service");
  const preselectedHairOptionId = searchParams.get("hair");

  const [step, setStep] = useState<Step>("service");
  const [services, setServices] = useState<Service[]>([]);
  const [allHairOptions, setAllHairOptions] = useState<Record<string, HairOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState<{ start: Date; end: Date; label: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [fullyBooked, setFullyBooked] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    id: string;
    reference: string;
    amountDue: number;
    durationMinutes: number;
  } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lashUpsellOpen, setLashUpsellOpen] = useState(false);

  const [booking, setBooking] = useState<BookingState>({
    service: null,
    hairOption: null,
    date: null,
    timeSlot: null,
    name: "",
    email: "",
    phone: "",
    shortHair: false,
    clusterLashes: false,
    washedHairConfirmed: false,
  });

  // Fetch services + all hair options in parallel on mount
  useEffect(() => {
    async function load() {
      try {
        const [svcRes, hairRes] = await Promise.all([
          supabase.from("services").select("*").eq("is_active", true).order("full_price", { ascending: true }),
          supabase.from("hair_options").select("*"),
        ]);
        const svcData = (svcRes.data as Service[]) || [];
        const hairData = (hairRes.data as HairOption[]) || [];

        // Group hair options by service_id for instant lookup
        const grouped: Record<string, HairOption[]> = {};
        for (const opt of hairData) {
          if (!grouped[opt.service_id]) grouped[opt.service_id] = [];
          grouped[opt.service_id].push(opt);
        }

        setServices(svcData);
        setAllHairOptions(grouped);

        if (preselectedServiceId && svcData.length > 0) {
          const found = svcData.find((s) => s.id === preselectedServiceId);
          if (found) {
            const selectedOption = hairData.find((option) => option.id === preselectedHairOptionId && option.service_id === found.id) || null;
            setBooking((prev) => ({ ...prev, service: found, hairOption: selectedOption }));
            if (selectedOption) {
              setStep("datetime");
            } else if (found.has_hair_options) {
              setStep("hair");
            } else {
              setStep("datetime");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load services:", err);
      }
      setLoading(false);
    }
    load();
  }, [preselectedServiceId, preselectedHairOptionId]);

  // Derive hair options for current service from cache (instant, no fetch)
  const hairOptions = booking.service
    ? [...(allHairOptions[booking.service.id] || [])].sort((a, b) => {
        if (!isOceanCurls(booking.service?.name)) return 0;
        const colourIndex = (optionName: string) => {
          const index = oceanCurlColourOrder.findIndex((colour) =>
            optionName.toLowerCase().includes(colour.toLowerCase())
          );
          return index === -1 ? oceanCurlColourOrder.length : index;
        };
        return colourIndex(a.name) - colourIndex(b.name);
      })
    : [];

  const serviceChoices = services.flatMap((service) => {
    if (!isOceanCurls(service.name)) return [{ service, option: null as HairOption | null }];
    const options = [...(allHairOptions[service.id] || [])].sort((a, b) => {
      const indexOf = (name: string) => oceanCurlColourOrder.findIndex((colour) => name.toLowerCase().includes(colour.toLowerCase()));
      return indexOf(a.name) - indexOf(b.name);
    });
    return options.map((option) => ({ service, option }));
  });

  // Fetch available slots when date changes
  const loadSlots = useCallback(async () => {
    if (!booking.date || !booking.service) return;
    setSlotsLoading(true);
    try {
      const dateStr = format(booking.date, "yyyy-MM-dd");
      const res = await fetch(
        `/api/availability?date=${dateStr}&duration=${booking.service.duration_minutes}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load availability");
      setFullyBooked(Boolean(data.fullyBooked));
      if (data.slots) {
        setSlots(
          data.slots.map((s: { start: string; end: string; label: string }) => ({
            start: parseISO(s.start),
            end: parseISO(s.end),
            label: s.label,
          }))
        );
      }
    } catch {
      setSlots([]);
      setFullyBooked(false);
    }
    setSlotsLoading(false);
  }, [booking.date, booking.service]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const selectService = (service: Service) => {
    setBooking((prev) => ({ ...prev, service, hairOption: null }));
    if (service.has_hair_options) {
      setStep("hair");
    } else {
      setLashUpsellOpen(true);
    }
  };

  const selectServiceChoice = (service: Service, option: HairOption | null) => {
    if (!option) {
      selectService(service);
      return;
    }
    setBooking((prev) => ({ ...prev, service, hairOption: option }));
    setLashUpsellOpen(true);
  };

  const selectHairOption = (option: HairOption) => {
    setBooking((prev) => ({ ...prev, hairOption: option }));
    setLashUpsellOpen(true);
  };

  const finishLashUpsell = (addLashes: boolean) => {
    setBooking((prev) => ({ ...prev, clusterLashes: addLashes }));
    setLashUpsellOpen(false);
    setStep("datetime");
  };

  const totalPrice =
    (booking.service?.full_price || 0) + (booking.hairOption?.price_delta || 0) +
    (booking.shortHair ? SHORT_HAIR_SURCHARGE : 0) +
    (booking.clusterLashes ? CLUSTER_LASHES_PRICE : 0);

  const selectedStyleImage = booking.hairOption
    ? getOceanCurlImage(booking.hairOption.name) || booking.service?.image_url
    : booking.service?.image_url;
  const selectedStyleName = booking.hairOption && isOceanCurls(booking.service?.name)
    ? `Ocean Curls ${booking.hairOption.name}`
    : booking.service?.name;

  const amountDue = booking.service ? BOOKING_DEPOSIT : 0;

  const handleSubmitBooking = async () => {
    if (!booking.service || !booking.timeSlot) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: booking.name,
          email: booking.email,
          phone: booking.phone,
          service_id: booking.service.id,
          hair_option_id: booking.hairOption?.id || null,
          start_time: booking.timeSlot.start.toISOString(),
          end_time: booking.timeSlot.end.toISOString(),
          short_hair: booking.shortHair,
          cluster_lashes: booking.clusterLashes,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBookingResult({
        id: data.id,
        reference: data.reference,
        amountDue: data.amountDue,
        durationMinutes: booking.service.duration_minutes,
      });
      setStep("payment");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Booking could not be created. Please try again.");
    }
    setSubmitting(false);
  };

  const handleUploadPOP = async () => {
    if (!uploadFile || !bookingResult) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("booking_id", bookingResult.id);
      formData.append("reference", bookingResult.reference);

      const res = await fetch("/api/upload-pop", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStep("done");
    } catch {
      alert("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  const copyRef = () => {
    if (bookingResult) {
      navigator.clipboard.writeText(bookingResult.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate calendar dates (next 30 days, excluding days off)
  const calendarDates = Array.from({ length: 30 }, (_, i) => addDays(startOfDay(new Date()), i + 1))
    .filter((d) => !BUSINESS_HOURS.daysOff.includes(d.getDay()));

  const stepIndex = ["service", "hair", "datetime", "details", "policy", "payment", "upload", "done"].indexOf(step);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-rose" />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <section className="relative py-12 lg:py-16 border-b border-white/10 overflow-hidden" style={{background:'linear-gradient(135deg, #E8DDD6 0%, #D4C4BC 30%, #C9B8B0 100%)'}}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-rose/[0.12] via-transparent to-brand-gold/[0.1]" />
        <div className="absolute top-5 -right-24 w-64 h-64 rounded-full bg-brand-rose/[0.04] blur-3xl" />
        <div className="absolute -bottom-16 -left-24 w-64 h-64 rounded-full bg-brand-gold/[0.04] blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center relative">
          <p className="section-label mb-3">Book Now</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-brand-charcoal">
            Schedule Your Appointment
          </h1>
        </div>
      </section>

      <section className="py-12 sm:py-16 relative" style={{background:'linear-gradient(180deg, #D4C4BC 0%, #C9B8B0 50%, #DECFC6 100%)'}}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Progress */}
          <div className="mb-12">
            <div className="flex items-center justify-between text-xs mb-3">
              {["Service", "Hair", "Date & Time", "Details", "Policy", "Payment", "Upload", "Done"].map(
                (label, i) => {
                  const isActive = stepIndex >= i;
                  const isCurrent = stepIndex === i;
                  return (
                    <span
                      key={label}
                      className={cn(
                        "hidden sm:block transition-colors",
                        isCurrent
                          ? "text-brand-rose font-semibold"
                          : isActive
                          ? "text-brand-rose/60"
                          : "text-brand-muted/30"
                      )}
                    >
                      {label}
                    </span>
                  );
                }
              )}
            </div>
            <div className="h-0.5 bg-brand-charcoal/[0.06] overflow-hidden rounded-full">
              <div
                className="h-full bg-gradient-to-r from-brand-rose to-brand-gold transition-all duration-500"
                style={{ width: `${((stepIndex + 1) / 8) * 100}%` }}
              />
            </div>
          </div>

          {/* Step: Service */}
          {step === "service" && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-brand-charcoal mb-2">
                Choose a Service
              </h2>
              <p className="text-sm text-brand-muted mb-8">
                Select the service you&apos;d like to book
              </p>
              <div className="space-y-3">
                {serviceChoices.map(({ service: s, option }) => {
                  const optionImage = option ? getOceanCurlImage(option.name) : undefined;
                  const displayName = option ? `Ocean Curls ${option.name}` : s.name;
                  const isSelected = booking.service?.id === s.id && booking.hairOption?.id === option?.id;
                  return (
                  <button
                    key={option ? `${s.id}-${option.id}` : s.id}
                    onClick={() => selectServiceChoice(s, option)}
                    className={cn(
                      "w-full rounded-2xl text-left p-5 border transition-all duration-200 cursor-pointer flex items-center justify-between group active:scale-[0.99]",
                      isSelected
                        ? "border-brand-rose bg-brand-rose/[0.06]"
                        : "border-brand-charcoal/[0.08] hover:border-brand-rose/30"
                    )}
                  >
                    {(optionImage || s.image_url) && (
                      <img src={optionImage || s.image_url || ""} alt={displayName} className="mr-4 h-16 w-16 shrink-0 rounded-xl bg-brand-cream object-cover object-[center_30%]" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold text-brand-charcoal group-hover:text-brand-rose transition-colors">
                        {displayName}
                      </h3>
                      <p className="text-sm text-brand-muted mt-1 line-clamp-1">{s.description}</p>
                      {isOceanCurls(s.name) && <p className="mt-1 text-xs font-medium text-brand-rose/80">Ocean Curls cannot be installed on locs.</p>}
                      <span className="flex items-center gap-1.5 mt-2 text-xs text-brand-muted/60">
                        <Clock className="h-3 w-3" />
                        {s.duration_minutes} min
                      </span>
                    </div>
                    <span className="font-display text-xl font-semibold text-brand-rose whitespace-nowrap ml-6">
                      {formatCurrency(s.full_price)}
                    </span>
                  </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step: Hair Options */}
          {step === "hair" && (
            <div>
              <button
                onClick={() => setStep("service")}
                className="flex items-center gap-1 text-sm text-brand-muted hover:text-brand-rose mb-8 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="font-display text-2xl font-semibold text-brand-charcoal mb-2">
                Hair Option
              </h2>
              <p className="text-sm text-brand-muted mb-8">Choose your preferred hair option</p>
              <div className={isOceanCurls(booking.service?.name) ? "grid grid-cols-2 gap-4 sm:grid-cols-3" : "space-y-3"}>
                {hairOptions.map((opt) => {
                  const oceanCurlImage = getOceanCurlImage(opt.name);
                  return (
                  <button
                    key={opt.id}
                    onClick={() => selectHairOption(opt)}
                    className={cn(
                      "w-full rounded-2xl text-left border transition-all duration-200 cursor-pointer overflow-hidden",
                      isOceanCurls(booking.service?.name) ? "group" : "p-5 flex items-center justify-between",
                      booking.hairOption?.id === opt.id
                        ? "border-brand-rose bg-brand-rose/[0.06]"
                        : "border-brand-charcoal/[0.08] hover:border-brand-rose/30"
                    )}
                  >
                    {isOceanCurls(booking.service?.name) && oceanCurlImage && (
                      <div className="aspect-[3/4] overflow-hidden bg-brand-cream"><img src={oceanCurlImage} alt={`Ocean Curls in ${opt.name}`} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]" /></div>
                    )}
                    <div className={isOceanCurls(booking.service?.name) ? "flex items-center justify-between gap-2 p-4" : "contents"}>
                    <span className="font-medium text-brand-charcoal/90">{opt.name}</span>
                    <span className="text-sm font-semibold text-brand-rose">
                      {opt.price_delta > 0
                        ? `+${formatCurrency(opt.price_delta)}`
                        : opt.price_delta === 0
                        ? "Included"
                        : formatCurrency(opt.price_delta)}
                    </span>
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step: Date & Time */}
          {step === "datetime" && (
            <div>
              <button
                onClick={() =>
                  setStep(booking.service?.has_hair_options ? "hair" : "service")
                }
                className="flex items-center gap-1 text-sm text-brand-muted hover:text-brand-rose mb-8 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="font-display text-2xl font-semibold text-brand-charcoal mb-2">
                Pick a Date &amp; Time
              </h2>
              <p className="text-sm text-brand-muted mb-8">
                {booking.service?.name} · {booking.service?.duration_minutes} minutes · appointments available 07:00–16:00
              </p>

              {/* Date picker */}
              <div className="mb-10">
                <h3 className="label mb-4">Select Date</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {calendarDates.slice(0, 14).map((d) => {
                    const isSelected =
                      booking.date &&
                      format(booking.date, "yyyy-MM-dd") === format(d, "yyyy-MM-dd");
                    return (
                      <button
                        key={d.toISOString()}
                        onClick={() => {
                          setBooking((prev) => ({ ...prev, date: d, timeSlot: null }));
                        }}
                        className={cn(
                          "flex-shrink-0 flex flex-col items-center border px-4 py-3 text-sm transition-all duration-200",
                          isSelected
                            ? "border-brand-rose bg-brand-rose text-white"
                            : "border-brand-charcoal/[0.08] hover:border-brand-rose/30"
                        )}
                      >
                        <span className="text-xs font-medium">{format(d, "EEE")}</span>
                        <span className="text-lg font-bold">{format(d, "d")}</span>
                        <span className="text-xs">{format(d, "MMM")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {booking.date && (
                <div>
                  <h3 className="label mb-4">Available Times</h3>
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-brand-rose" />
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-brand-muted/60 py-4">
                      {fullyBooked
                        ? "This date is completely booked out. Please choose another date."
                        : "No available slots for this date. Try another day."}
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map((slot) => {
                        const isSelected =
                          booking.timeSlot?.label === slot.label;
                        return (
                          <button
                            key={slot.label}
                            onClick={() =>
                              setBooking((prev) => ({ ...prev, timeSlot: slot }))
                            }
                            className={cn(
                              "border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                              isSelected
                                ? "border-brand-rose bg-brand-rose text-white"
                                : "border-brand-charcoal/[0.08] hover:border-brand-rose/30"
                            )}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {booking.timeSlot && (
                <button
                  onClick={() => setStep("details")}
                  className="btn-primary w-full mt-10"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Step: Customer Details */}
          {step === "details" && (
            <div>
              <button
                onClick={() => setStep("datetime")}
                className="flex items-center gap-1 text-sm text-brand-muted hover:text-brand-rose mb-8 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="font-display text-2xl font-semibold text-brand-charcoal mb-2">
                Your Details
              </h2>
              <p className="text-sm text-brand-muted mb-8">Tell us who you are</p>

              <div className="space-y-5">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Your full name"
                    value={booking.name}
                    onChange={(e) =>
                      setBooking((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="your@email.com"
                    value={booking.email}
                    onChange={(e) =>
                      setBooking((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="07X XXX XXXX"
                    value={booking.phone}
                    onChange={(e) =>
                      setBooking((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
                <label className={cn("block border p-5 cursor-pointer transition-colors", booking.shortHair ? "border-brand-rose bg-brand-rose/[0.06]" : "border-brand-charcoal/[0.08]") }>
                  <span className="flex items-start gap-3">
                    <input type="checkbox" checked={booking.shortHair} onChange={(event) => setBooking((prev) => ({ ...prev, shortHair: event.target.checked }))} className="mt-1 h-4 w-4 accent-brand-rose" />
                    <span><strong className="block text-sm text-brand-charcoal">I have short hair</strong><span className="mt-1 block text-xs leading-relaxed text-brand-muted">Select this if your hair is short. A R100 specialised cornrow surcharge will be added because extra preparation is required.</span></span>
                  </span>
                </label>

                <label className={cn("block border p-5 cursor-pointer transition-colors", booking.washedHairConfirmed ? "border-brand-rose bg-brand-rose/[0.06]" : "border-brand-charcoal/[0.08]") }>
                  <span className="flex items-start gap-3">
                    <input type="checkbox" checked={booking.washedHairConfirmed} onChange={(event) => setBooking((prev) => ({ ...prev, washedHairConfirmed: event.target.checked }))} className="mt-1 h-4 w-4 accent-brand-rose" />
                    <span><strong className="block text-sm text-brand-charcoal">I will arrive with washed hair</strong><span className="mt-1 block text-xs leading-relaxed text-brand-muted">Please arrive with clean, washed hair. Hair washing is not included in the appointment.</span></span>
                  </span>
                </label>

                <div className="glass p-5">
                  <div className="flex justify-between text-sm"><span className="text-brand-muted">Estimated total</span><strong>{formatCurrency(totalPrice)}</strong></div>
                  {booking.shortHair && <div className="mt-2 flex justify-between text-xs text-brand-muted"><span>Short-hair specialised cornrows</span><span>+{formatCurrency(SHORT_HAIR_SURCHARGE)}</span></div>}
                  {booking.clusterLashes && <div className="mt-2 flex justify-between text-xs text-brand-muted"><span>Cluster Lashes</span><span>+{formatCurrency(CLUSTER_LASHES_PRICE)}</span></div>}
                  <div className="mt-4 border-t border-brand-charcoal/[0.08] pt-4"><p className="font-medium text-brand-charcoal">R175 deposit required</p><p className="mt-1 text-xs leading-relaxed text-brand-muted">The deposit forms part of your total price and will be deducted from the remaining balance. Full payment is not accepted during booking.</p></div>
                </div>
              </div>

              <button
                onClick={() => setStep("policy")}
                disabled={!booking.name || !booking.email || !booking.phone || !booking.washedHairConfirmed}
                className="btn-primary w-full mt-10"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step: Booking Policy */}
          {step === "policy" && (
            <div>
              <button
                onClick={() => setStep("details")}
                className="flex items-center gap-1 text-sm text-brand-muted hover:text-brand-rose mb-8 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="font-display text-2xl font-semibold text-brand-charcoal mb-2">
                Booking Policy
              </h2>
              <p className="text-sm text-brand-muted mb-8">
                Please review our policy before confirming your booking
              </p>

              <div className="space-y-6">
                {/* Pre-Booking Requirements */}
                <div className="glass p-5">
                  <h3 className="font-display text-base font-semibold text-brand-charcoal mb-3">
                    Pre-Booking Requirements
                  </h3>
                  <ul className="space-y-2 text-sm text-brand-muted">
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      Please arrive with clean, washed hair. We do not provide hair washing services.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      If you have short hair, select the short-hair option during booking. A R100 surcharge applies for specialised cornrows and extra preparation.
                    </li>
                  </ul>
                </div>

                {/* Booking Terms */}
                <div className="glass p-5">
                  <h3 className="font-display text-base font-semibold text-brand-charcoal mb-3">
                    Booking Terms
                  </h3>
                  <ul className="space-y-2 text-sm text-brand-muted">
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      A non-refundable booking fee of R175 is required to secure your appointment. This fee is a deposit and is included in the total price.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      Refunds will not be issued for cancellations or changes made within 24 hours of the scheduled appointment.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      Due to limited sitting area, only one visitor is allowed per appointment.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      An after-hours fee of R100 applies to appointments requested after 17:00.
                    </li>
                  </ul>
                </div>

                {/* Important Notes */}
                <div className="glass p-5">
                  <h3 className="font-display text-base font-semibold text-brand-charcoal mb-3">
                    Important Notes
                  </h3>
                  <ul className="space-y-2 text-sm text-brand-muted">
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      The afro and curl fibre used is synthetic and cannot be reused.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      Any foundational preparation is done for stability and a smooth installation.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      Ocean Curls cannot be installed on locs.
                    </li>
                  </ul>
                </div>

                {/* Amendments and Cancellations */}
                <div className="glass p-5">
                  <h3 className="font-display text-base font-semibold text-brand-charcoal mb-3">
                    Amendments &amp; Cancellations
                  </h3>
                  <ul className="space-y-2 text-sm text-brand-muted">
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      Please notify us at least 24 hours in advance of any changes or cancellations.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      Changes or cancellations made within 24 hours of the appointment will incur a fee, as per our refund policy.
                    </li>
                  </ul>
                </div>

                {/* Late Arrival Policy */}
                <div className="glass p-5">
                  <h3 className="font-display text-base font-semibold text-brand-charcoal mb-3">
                    Late Arrival Policy
                  </h3>
                  <ul className="space-y-2 text-sm text-brand-muted">
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      A late fee of R100 applies if you arrive 30-45 minutes late for your appointment.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      If you arrive more than 1 hour late, you will forfeit your booking fee, and your appointment will be automatically cancelled.
                    </li>
                  </ul>
                </div>
              </div>

              <p className="text-xs text-brand-muted/60 text-center mt-6 mb-4">
                By confirming your booking, you acknowledge that you have read and understand our booking policy. If you have any questions or concerns, please don&apos;t hesitate to contact us.
              </p>

              <button
                onClick={handleSubmitBooking}
                disabled={submitting}
                className="btn-primary w-full mt-4"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "I Agree — Confirm & Get Payment Details"
                )}
              </button>
            </div>
          )}

          {/* Step: Payment Instructions */}
          {step === "payment" && bookingResult && (
            <div>
              <div className="text-center mb-10">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-rose/10">
                  <Banknote className="h-7 w-7 text-brand-rose" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-brand-charcoal">
                  Payment Instructions
                </h2>
                <p className="text-sm text-brand-muted mt-2">
                  Pay the fixed R175 deposit by EFT using the details below. This deposit is part of your total price.
                </p>
              </div>

              <div className="glass mb-6 overflow-hidden p-5">
                <p className="mb-4 text-xs font-medium uppercase tracking-editorial text-brand-rose">Confirm Your Hairstyle</p>
                <div className="flex items-center gap-4">
                  {selectedStyleImage && (
                    <img
                      src={selectedStyleImage}
                      alt={selectedStyleName || "Selected hairstyle"}
                      className="h-24 w-20 shrink-0 rounded-xl bg-brand-cream object-cover object-top"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xl font-semibold text-brand-charcoal">{selectedStyleName}</h3>
                    <div className="mt-2 space-y-1 text-sm text-brand-muted">
                      <p>Appointment length: {booking.service?.duration_minutes} minutes</p>
                      <p>Address: {STUDIO_ADDRESS}</p>
                      {booking.shortHair && <p>Short-hair preparation included: +R100</p>}
                      {booking.clusterLashes && <p>Cluster Lashes included: +R150</p>}
                      <p>Total hairstyle price: <strong className="text-brand-charcoal">{formatCurrency(totalPrice)}</strong></p>
                    </div>
                  </div>
                </div>
                <p className="mt-4 border-t border-brand-charcoal/[0.08] pt-4 text-xs leading-relaxed text-brand-muted">
                  Please confirm that this is the correct hairstyle and colour before paying the R175 deposit. The deposit is included in the total price.
                </p>
              </div>

              <div className="mb-6 border border-brand-rose/20 bg-brand-rose/[0.06] p-4 text-sm leading-relaxed text-brand-charcoal">
                Please make an immediate payment, especially when paying from another bank, to avoid payment delays or booking issues.
              </div>

              <div className="glass p-6 mb-6">
                <h3 className="text-xs font-medium uppercase tracking-editorial text-brand-rose mb-5">
                  Banking Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Bank</span>
                    <span className="font-medium text-brand-charcoal">{BANKING_DETAILS.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Account Name</span>
                    <span className="font-medium text-brand-charcoal">{BANKING_DETAILS.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Account Number</span>
                    <span className="font-medium text-brand-charcoal">{BANKING_DETAILS.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Branch Code</span>
                    <span className="font-medium text-brand-charcoal">{BANKING_DETAILS.branchCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Account Type</span>
                    <span className="font-medium text-brand-charcoal">{BANKING_DETAILS.accountType}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-brand-muted">Capitec Phone Number</span>
                    <span className="font-medium text-brand-charcoal">{BANKING_DETAILS.phoneNumber}</span>
                  </div>
                </div>
              </div>

              <div className="glass p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-editorial text-brand-muted/60">Deposit Due</span>
                  <span className="font-display text-2xl font-semibold text-brand-rose">
                    {formatCurrency(bookingResult.amountDue)}
                  </span>
                </div>
                <div className="h-px bg-brand-charcoal/[0.06] my-3" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-editorial text-brand-muted/60">Reference</span>
                  <button
                    onClick={copyRef}
                    className="flex items-center gap-2 text-sm font-mono font-bold text-brand-rose hover:text-brand-rose-light transition-colors"
                  >
                    {bookingResult.reference}
                    <Copy className="h-3.5 w-3.5" />
                    {copied && (
                      <span className="text-xs text-green-600">Copied!</span>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-sm text-brand-muted/60 text-center mb-8">
                After making payment, upload your Proof of Payment below.
              </p>

              <button onClick={() => setStep("upload")} className="btn-primary w-full">
                Upload Proof of Payment
              </button>
            </div>
          )}

          {/* Step: Upload POP */}
          {step === "upload" && bookingResult && (
            <div>
              <button
                onClick={() => setStep("payment")}
                className="flex items-center gap-1 text-sm text-brand-muted hover:text-brand-rose mb-8 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back to Payment Details
              </button>
              <div className="text-center mb-10">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-rose/10">
                  <Upload className="h-7 w-7 text-brand-rose" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-brand-charcoal">
                  Upload Proof of Payment
                </h2>
                <p className="text-sm text-brand-muted mt-2">
                  Accepted: PDF, JPG, PNG (max 10MB)
                </p>
                <p className="text-sm text-brand-rose mt-2">
                  A clear screenshot of your proof of payment will suffice.
                </p>
              </div>

              <div className="glass p-6">
                <label className="block">
                  <div className="flex flex-col items-center justify-center border border-dashed border-brand-charcoal/15 rounded-xl p-10 hover:border-brand-rose/40 transition-colors duration-200 cursor-pointer">
                    <Upload className="h-8 w-8 text-brand-muted/30 mb-3" />
                    <p className="text-sm text-brand-muted">
                      {uploadFile ? uploadFile.name : "Click to select file"}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <button
                onClick={handleUploadPOP}
                disabled={!uploadFile || uploading}
                className="btn-primary w-full mt-8"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit Proof of Payment"
                )}
              </button>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div className="text-center py-16">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="font-display text-3xl font-semibold text-brand-charcoal mb-4">
                Thank You!
              </h2>
              <p className="text-brand-muted max-w-md mx-auto mb-3 leading-relaxed">
                Your proof of payment has been submitted. We&apos;ll review it and
                send you a confirmation email once your booking is approved.
              </p>
              {bookingResult && (
                <div className="mx-auto mb-10 max-w-md rounded-2xl border border-brand-charcoal/[0.08] bg-white/35 p-5 text-left text-sm text-brand-muted">
                  <p>Reference: <strong className="text-brand-rose">{bookingResult.reference}</strong></p>
                  <p className="mt-2"><strong className="text-brand-charcoal">Appointment length:</strong> {bookingResult.durationMinutes} minutes</p>
                  <p className="mt-2"><strong className="text-brand-charcoal">Address:</strong> {STUDIO_ADDRESS}</p>
                </div>
              )}
              <button onClick={() => router.push("/")} className="btn-secondary">
                Back to Home
              </button>
            </div>
          )}
        </div>
      </section>

      {lashUpsellOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-charcoal/55 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="lash-upsell-title">
          <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/40 bg-[#f3e9e4] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="section-label mb-2">Complete Your Look</p>
                <h2 id="lash-upsell-title" className="font-display text-3xl font-semibold text-brand-charcoal">Add Cluster Lashes?</h2>
              </div>
              <span className="font-display text-2xl font-semibold text-brand-rose">R150</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">Professionally applied cluster lashes that last approximately 2-3 weeks with proper care.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <img src="/images/cluster-lashes-1.png" alt="Cluster lash application examples" className="aspect-square w-full rounded-2xl object-cover" />
              <img src="/images/cluster-lashes-2.png" alt="Cluster lash style examples" className="aspect-square w-full rounded-2xl object-cover" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => finishLashUpsell(false)} className="btn-secondary w-full active:scale-[0.98]">No Thanks</button>
              <button type="button" onClick={() => finishLashUpsell(true)} className="btn-primary w-full active:scale-[0.98]">Add Cluster Lashes +R150</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
