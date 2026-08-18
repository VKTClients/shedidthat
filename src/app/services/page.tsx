import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import type { Service } from "@/lib/types/database";

export const dynamic = "force-dynamic";

async function getServices(): Promise<Service[]> {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from("services")
      .select("*")
      .order("full_price", { ascending: true });

    if (error) {
      console.error("Error fetching services:", error);
      return [];
    }
    return (data as Service[]) || [];
  } catch (err) {
    console.error("Failed to fetch services:", err);
    return [];
  }
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      {/* Header */}
      <section className="relative py-20 lg:py-28 overflow-hidden" style={{background:'linear-gradient(135deg, #E8DDD6 0%, #D4C4BC 30%, #C9B8B0 100%)'}}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-rose/[0.12] via-transparent to-brand-gold/[0.1]" />
        <div className="absolute top-10 -right-32 w-80 h-80 rounded-full bg-brand-rose/[0.04] blur-3xl liquid-float" style={{animationDuration: '20s'}} />
        <div className="absolute -bottom-20 -left-32 w-80 h-80 rounded-full bg-brand-gold/[0.04] blur-3xl liquid-float" style={{animationDuration: '16s', animationDirection: 'reverse'}} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
          <p className="section-label mb-4">Our Menu</p>
          <h1 className="section-heading mb-4">
            Price Guide
          </h1>
          <p className="section-subheading max-w-lg mx-auto">
            Premium styling for every occasion. Choose the service you&apos;d love to try.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 lg:py-28 relative" style={{background:'linear-gradient(180deg, #D4C4BC 0%, #C9B8B0 50%, #DECFC6 100%)'}}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {services.length === 0 ? (
            <div className="glass text-center py-16">
              <p className="text-brand-muted">
                Services are being updated. Please check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => {
                const depositAmount =
                  service.deposit_type === "PERCENTAGE"
                    ? Math.ceil((service.full_price * service.deposit_value) / 100)
                    : service.deposit_value;

                return (
                  <div
                    key={service.id}
                    className="glass group overflow-hidden p-0 liquid-breathe hover:shadow-glass-rose transition-all duration-500"
                  >
                    {service.image_url && (
                      <div className="aspect-[16/7] overflow-hidden bg-brand-cream">
                        <img src={service.image_url} alt={service.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                      </div>
                    )}
                    <div className="p-8 lg:p-10">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-display text-2xl font-semibold text-brand-charcoal group-hover:text-brand-rose transition-colors duration-200">
                          {service.name}
                        </h3>
                        <span className="font-display text-2xl font-semibold text-brand-rose whitespace-nowrap ml-4">
                          {formatCurrency(service.full_price)}
                        </span>
                      </div>
                      <div className="divider mb-4" />
                      <p className="text-sm text-brand-muted mb-5 leading-relaxed line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-brand-muted/60">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {service.duration_minutes} min
                          </span>
                          <span>
                            Deposit from {formatCurrency(depositAmount)}
                          </span>
                        </div>
                        <Link
                          href={`/booking?service=${service.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-rose hover:text-brand-rose-dark transition-colors"
                        >
                          Book <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-16">
            <Link href="/booking" className="btn-gold px-10 py-4">
              Book an Appointment
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
