"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { formatCurrency, generateTimeSlots, cn } from "@/lib/utils";
import { APPOINTMENT_START_TIMES, BANKING_DETAILS, BOOKING_DEPOSIT, CLUSTER_LASHES_PRICE, DEFAULT_BOOKING_DISPLAY_MONTH, OWN_FIBRE_DISCOUNT, SHORT_HAIR_SURCHARGE, STUDIO_ADDRESS } from "@/lib/constants";
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from "date-fns";
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
import { useSiteMedia } from "@/hooks/use-site-media";

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
  Snowflake: "/images/Ocean Curls Snowflake.png",
};

const oceanCurlColourOrder = ["Blondie", "Brownie", "Goldie", "Black", "Ginger", "Snowflake"];

function isOceanCurls(serviceName?: string) {
  return serviceName?.toLowerCase().includes("ocean curl") ?? false;
}

function getOceanCurlImage(optionName: string, media = oceanCurlImages) {
  const colour = oceanCurlColourOrder.find((name) =>
    optionName.toLowerCase().includes(name.toLowerCase())
  );
  if (!colour) return undefined;

  // Site media uses slot keys, while the local fallback map uses colour names.
  // Support both so a missing/slow media response cannot hide the client preview.
  return media[colour] || media[`product.ocean-curls.${colour.toLowerCase()}` as keyof typeof media];
}

interface BookingState {
  service: Service | null;
  hairOption: HairOption | null;
  secondaryHairOption: HairOption | null;
  date: Date | null;
  timeSlot: { start: Date; end: Date; label: string } | null;
  name: string;
  email: string;
  phone: string;
  shortHair: boolean;
  clusterLashes: boolean;
  ownFibre: boolean;
  washedHairConfirmed: boolean;
}

function BookingContent() {
  const media = useSiteMedia();
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
  const [slotsError, setSlotsError] = useState("");
  const [displayMonth, setDisplayMonth] = useState(DEFAULT_BOOKING_DISPLAY_MONTH);
  const [monthAvailability, setMonthAvailability] = useState<Record<string, string[]>>({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [bookingResult, setBookingResult] = useState<{
    id: string;
    reference: string;
    amountDue: number;
    durationMinutes: number;
    emailSent: boolean;
  } | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lashUpsellOpen, setLashUpsellOpen] = useState(false);
  const [secondaryChoiceOpen, setSecondaryChoiceOpen] = useState(false);

  const [booking, setBooking] = useState<BookingState>({
    service: null,
    hairOption: null,
    secondaryHairOption: null,
    date: null,
    timeSlot: null,
    name: "",
    email: "",
    phone: "",
    shortHair: false,
    clusterLashes: false,
    ownFibre: false,
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
            const selectedOptionCandidate = hairData.find((option) => option.id === preselectedHairOptionId && option.service_id === found.id) || null;
            const selectedOption = selectedOptionCandidate || null;
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
    setSlotsError("");
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
    } catch (error) {
      setSlots([]);
      setFullyBooked(false);
      setSlotsError(error instanceof Error ? error.message : "Unable to load availability");
    }
    setSlotsLoading(false);
  }, [booking.date, booking.service]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const loadCalendar = useCallback(async () => {
    if (!booking.service) return;
    setCalendarLoading(true);
    setCalendarError("");
    try {
      const response = await fetch(`/api/availability?duration=${booking.service.duration_minutes}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load the booking calendar");
      setDisplayMonth(data.displayMonth || DEFAULT_BOOKING_DISPLAY_MONTH);
      setMonthAvailability(data.availability || {});
      setBooking((current) => {
        if (!current.date) return current;
        const dateKey = format(current.date, "yyyy-MM-dd");
        if ((data.availability?.[dateKey] || []).length > 0) return current;
        return { ...current, date: null, timeSlot: null };
      });
    } catch (error) {
      setMonthAvailability({});
      setCalendarError(error instanceof Error ? error.message : "Unable to load the booking calendar");
    } finally {
      setCalendarLoading(false);
    }
  }, [booking.service]);

  useEffect(() => {
    if (step === "datetime") loadCalendar();
  }, [loadCalendar, step]);

  const selectService = (service: Service) => {
    setBooking((prev) => ({ ...prev, service, hairOption: null, secondaryHairOption: null }));
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
    setBooking((prev) => ({ ...prev, service, hairOption: option, secondaryHairOption: null }));
    if (isOceanCurls(service.name)) {
      setSecondaryChoiceOpen(true);
    } else {
      setLashUpsellOpen(true);
    }
  };

  const selectHairOption = (option: HairOption) => {
    setBooking((prev) => ({ ...prev, hairOption: option }));
    if (isOceanCurls(booking.service?.name)) {
      setSecondaryChoiceOpen(true);
    } else {
      setLashUpsellOpen(true);
    }
  };

  const finishSecondaryChoice = (secondaryHairOption: HairOption | null) => {
    setBooking((prev) => ({ ...prev, secondaryHairOption }));
    setSecondaryChoiceOpen(false);
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
    (booking.clusterLashes ? CLUSTER_LASHES_PRICE : 0) -
    (booking.ownFibre ? OWN_FIBRE_DISCOUNT : 0);

  const selectedStyleImage = booking.hairOption
    ? getOceanCurlImage(booking.hairOption.name, media) || booking.service?.image_url
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
          secondary_hair_option_id: booking.secondaryHairOption?.id || null,
          start_time: booking.timeSlot.start.toISOString(),
          end_time: booking.timeSlot.end.toISOString(),
          short_hair: booking.shortHair,
          cluster_lashes: booking.clusterLashes,
          own_fibre: booking.ownFibre,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBookingResult({
        id: data.id,
        reference: data.reference,
        amountDue: data.amountDue,
        durationMinutes: booking.service.duration_minutes,
        emailSent: data.emailSent === true,
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

  const displayMonthDate = parseISO(displayMonth);
  const calendarDates = eachDayOfInterval({
    start: startOfWeek(startOfMonth(displayMonthDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(displayMonthDate), { weekStartsOn: 1 }),
  });

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
              <blockquote className="mb-8 rounded-2xl border border-brand-rose/20 bg-white/30 px-5 py-5 text-center shadow-[0_12px_32px_rgba(94,61,58,0.05)] sm:px-8">
                <p className="font-display text-lg leading-relaxed text-brand-charcoal sm:text-xl">
                  &ldquo;Be strong and courageous. Do not be afraid or terrified... for the Lord your God goes with you; he will never leave you nor forsake you.&rdquo;
                </p>
                <cite className="mt-3 block text-xs font-semibold not-italic uppercase tracking-[0.16em] text-brand-rose">
                  Deuteronomy 31:6
                </cite>
              </blockquote>
              <h2 className="font-display text-2xl font-semibold text-brand-charcoal mb-2">
                Choose a Service
              </h2>
              <p className="text-sm text-brand-muted mb-8">
                Select the service you&apos;d like to book
              </p>
              <div className="space-y-3">
                {serviceChoices.map(({ service: s, option }) => {
                  const optionImage = option ? getOceanCurlImage(option.name, media) : undefined;
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
                        : "border-brand-charcoal/[0.08] hover:border-brand-rose/30",
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
              <p className="text-sm text-brand-muted mb-2">
                {booking.service?.name}, {booking.service?.duration_minutes} minutes
              </p>
              <p className="mb-8 text-sm font-medium text-brand-rose">Bookings are open for {format(displayMonthDate, "MMMM yyyy")}.</p>

              {/* Date picker */}
              <div className="mb-10">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="label">Select Date</h3>
                    <p className="mt-2 text-xs text-brand-muted/70">Unavailable dates stay visible in a lighter shade.</p>
                  </div>
                  <p className="whitespace-nowrap font-display text-xl font-semibold text-brand-charcoal">{format(displayMonthDate, "MMMM yyyy")}</p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-brand-charcoal/[0.1] bg-white/20 shadow-[0_12px_32px_rgba(94,61,58,0.06)]">
                  <div className="grid grid-cols-7 border-b border-brand-charcoal/[0.08] bg-white/15">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <div key={day} className="py-3 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-muted sm:text-[10px]">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {calendarDates.map((date) => {
                      const dateKey = format(date, "yyyy-MM-dd");
                      const inMonth = isSameMonth(date, displayMonthDate);
                      const availableCount = monthAvailability[dateKey]?.length || 0;
                      const unavailable = !inMonth || availableCount === 0;
                      const isSelected = booking.date && format(booking.date, "yyyy-MM-dd") === dateKey;
                      return (
                        <button
                          key={dateKey}
                          type="button"
                          disabled={unavailable || calendarLoading}
                          aria-label={`${format(date, "EEEE, d MMMM")}${unavailable ? ", unavailable" : `, ${availableCount} ${availableCount === 1 ? "time" : "times"} available`}`}
                          onClick={() => setBooking((current) => ({ ...current, date, timeSlot: null }))}
                          className={cn(
                            "relative min-h-[54px] border-b border-r border-brand-charcoal/[0.07] p-1.5 text-left transition sm:min-h-[72px] sm:p-2.5",
                            unavailable ? "cursor-not-allowed bg-white/[0.08] text-brand-muted/25" : "text-brand-charcoal hover:bg-brand-rose/[0.07]",
                            isSelected && "bg-brand-rose text-white hover:bg-brand-rose"
                          )}
                        >
                          <span className="text-xs font-semibold sm:text-sm">{format(date, "d")}</span>
                          {inMonth && !unavailable && !isSelected && <span className="mt-2 hidden text-[9px] font-medium text-brand-rose sm:block">{availableCount} open</span>}
                          {isSelected && <span className="mt-2 hidden text-[9px] font-medium text-white/80 sm:block">Selected</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {calendarLoading && <div className="flex items-center justify-center py-5 text-sm text-brand-muted"><Loader2 className="mr-2 h-4 w-4 animate-spin text-brand-rose" /> Loading calendar</div>}
                {calendarError && <p className="mt-4 text-sm font-medium text-red-700">{calendarError}</p>}
              </div>

              {/* Time slots */}
              {booking.date && (
                <div>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="label">Select Time</h3>
                      <p className="mt-2 text-xs text-brand-muted/70">Unavailable times remain visible but cannot be selected.</p>
                    </div>
                    <p className="text-sm font-semibold text-brand-charcoal">{format(booking.date, "EEEE, d MMMM")}</p>
                  </div>
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-brand-rose" />
                    </div>
                  ) : (
                    <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {APPOINTMENT_START_TIMES.map((time) => {
                        const slot = slots.find((candidate) => candidate.label === time);
                        const isSelected = booking.timeSlot?.label === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={!slot}
                            onClick={() => slot && setBooking((prev) => ({ ...prev, timeSlot: slot }))}
                            className={cn(
                              "border px-3 py-3 text-sm font-medium transition-all duration-200",
                              isSelected
                                ? "border-brand-rose bg-brand-rose text-white"
                                : slot
                                ? "border-brand-charcoal/[0.08] bg-white/10 text-brand-charcoal hover:border-brand-rose/30"
                                : "cursor-not-allowed border-brand-charcoal/[0.05] bg-white/[0.06] text-brand-muted/25"
                            )}
                          >
                            <span className="block">{time}</span>
                            <span className="mt-1 block text-[10px] font-normal opacity-70">{slot ? "Available" : "Unavailable"}</span>
                          </button>
                        );
                      })}
                    </div>
                    {fullyBooked && <p className="mt-4 text-sm text-brand-muted/60">This date is completely booked out. Please choose another date.</p>}
                    {slotsError && <p className="mt-4 text-sm font-medium text-red-700">{slotsError}</p>}
                    </>
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

                <label className={cn("block border p-5 cursor-pointer transition-colors", booking.ownFibre ? "border-brand-rose bg-brand-rose/[0.06]" : "border-brand-charcoal/[0.08]") }>
                  <span className="flex items-start gap-3">
                    <input type="checkbox" checked={booking.ownFibre} onChange={(event) => setBooking((prev) => ({ ...prev, ownFibre: event.target.checked }))} className="mt-1 h-4 w-4 accent-brand-rose" />
                    <span><strong className="block text-sm text-brand-charcoal">I will bring my own fibre</strong><span className="mt-1 block text-xs leading-relaxed text-brand-muted">You&apos;ll receive R100 off the total. Please contact us before booking to confirm the fibre type, colour, quantity, and suitability for your style.</span></span>
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
                  {booking.ownFibre && <div className="mt-2 flex justify-between text-xs text-brand-muted"><span>Bring your own fibre</span><span>-{formatCurrency(OWN_FIBRE_DISCOUNT)}</span></div>}
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
                    <li className="flex gap-2">
                      <span className="text-brand-rose mt-0.5">&bull;</span>
                      If you bring your own fibre, please contact us before booking so we can confirm the specifics. The R100 discount applies only when the fibre is approved for your selected style.
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
                  "I Agree - Confirm & Get Payment Details"
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
                      {booking.ownFibre && <p>Customer-supplied fibre: -R100 · specifics to be confirmed with the studio</p>}
                      <p>Total hairstyle price: <strong className="text-brand-charcoal">{formatCurrency(totalPrice)}</strong></p>
                    </div>
                  </div>
                </div>
                <p className="mt-4 border-t border-brand-charcoal/[0.08] pt-4 text-xs leading-relaxed text-brand-muted">
                  Please confirm that this is the correct hairstyle and colour before paying the R175 deposit. Your selected time is held immediately while the studio reviews your booking; it will only reopen if the studio declines the request. The deposit is included in the total price.
                </p>
              </div>

              <div className="mb-6 border border-brand-rose/20 bg-brand-rose/[0.06] p-4 text-sm leading-relaxed text-brand-charcoal">
                Please make an immediate payment, especially when paying from another bank, to avoid payment delays or booking issues.
              </div>

              <div className="mb-6 border border-emerald-700/15 bg-emerald-700/[0.06] p-4 text-sm leading-relaxed text-brand-charcoal">
                Your appointment time is reserved while we review your booking. The slot will only be reopened if the studio declines the request.
              </div>

              {!bookingResult.emailSent && (
                <div className="mb-6 border border-amber-700/20 bg-amber-700/[0.06] p-4 text-sm leading-relaxed text-brand-charcoal">
                  We could not send the email confirmation right now. Keep this page open and save your reference; your booking was still recorded successfully.
                </div>
              )}

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
              <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-brand-rose">
                After booking, please contact SheDidThat on 082 441 8297 or
                hello@shedidthat.co.za for further confirmation and details.
              </p>
              {bookingResult && (
                <div className="mx-auto mb-10 max-w-md rounded-2xl border border-brand-charcoal/[0.08] bg-white/35 p-5 text-left text-sm text-brand-muted">
                  <p>Reference: <strong className="text-brand-rose">{bookingResult.reference}</strong></p>
                  <p className="mt-2"><strong className="text-brand-charcoal">Appointment length:</strong> {bookingResult.durationMinutes} minutes</p>
                  <p className="mt-2"><strong className="text-brand-charcoal">Address:</strong> {STUDIO_ADDRESS}</p>
                </div>
              )}
              <blockquote className="mx-auto mb-10 max-w-2xl rounded-2xl border border-brand-rose/20 bg-white/30 px-5 py-5 shadow-[0_12px_32px_rgba(94,61,58,0.05)] sm:px-8">
                <p className="font-display text-lg leading-relaxed text-brand-charcoal sm:text-xl">
                  &ldquo;Remain in me, as I also remain in you. No branch can bear fruit by itself; it must remain in the vine.&rdquo;
                </p>
                <cite className="mt-3 block text-xs font-semibold uppercase tracking-[0.16em] text-brand-rose">
                  John 15:4
                </cite>
                <p className="mt-5 text-base italic leading-relaxed text-brand-muted">
                  Stay connected to Him daily, that&apos;s where your life comes from.
                </p>
              </blockquote>
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
              <img src={media["booking.cluster-lashes-1"]} alt="Cluster lash application examples" className="aspect-square w-full rounded-2xl object-cover" />
              <img src={media["booking.cluster-lashes-2"]} alt="Cluster lash style examples" className="aspect-square w-full rounded-2xl object-cover" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => finishLashUpsell(false)} className="btn-secondary w-full active:scale-[0.98]">No Thanks</button>
              <button type="button" onClick={() => finishLashUpsell(true)} className="btn-primary w-full active:scale-[0.98]">Add Cluster Lashes +R150</button>
            </div>
          </div>
        </div>
      )}

      {secondaryChoiceOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-charcoal/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="secondary-colour-title">
          <div className="w-full max-w-md rounded-3xl border border-white/40 bg-[#f3e9e4] p-6 shadow-2xl sm:p-8">
            <p className="section-label mb-2">Colour availability</p>
            <h2 id="secondary-colour-title" className="font-display text-3xl font-semibold text-brand-charcoal">Choose a backup colour</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">Select a secondary colour in case your first choice is unavailable on the day.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {hairOptions.filter((option) => option.id !== booking.hairOption?.id).map((option) => (
                <button key={option.id} type="button" onClick={() => finishSecondaryChoice(option)} className="rounded-xl border border-brand-charcoal/[0.1] bg-white/45 px-4 py-3 text-left text-sm font-medium text-brand-charcoal transition-colors hover:border-brand-rose/40 hover:bg-white/70">
                  {option.name}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => finishSecondaryChoice(null)} className="btn-secondary mt-3 w-full">I don&apos;t need a backup colour</button>
          </div>
        </div>
      )}

    </>
  );
}
