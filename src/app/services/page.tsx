"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import type { HairOption, Service } from "@/lib/types/database";
import { OceanCurlsFolderCard } from "@/components/services/OceanCurlsFolderCard";
import { AfroFolderCard } from "@/components/services/AfroFolderCard";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [hairOptions, setHairOptions] = useState<HairOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("services").select("*").eq("is_active", true).order("full_price", { ascending: true }),
      supabase.from("hair_options").select("*"),
    ]).then(([serviceResult, optionResult]) => {
        if (serviceResult.error) console.error("Error fetching services:", serviceResult.error);
        if (optionResult.error) console.error("Error fetching hair options:", optionResult.error);
        setServices((serviceResult.data as Service[]) || []);
        setHairOptions((optionResult.data as HairOption[]) || []);
        setLoading(false);
      });
  }, []);

  const oceanCurls = services.find((service) => service.name.toLowerCase() === "ocean curls");
  const afroServices = services.filter((service) => service.name.toLowerCase().includes("afro"));
  const afroIds = new Set(afroServices.map((service) => service.id));
  const otherServices = services.filter((service) => service.id !== oceanCurls?.id && !afroIds.has(service.id));

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
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand-rose" /></div>
          ) : services.length === 0 ? (
            <div className="glass text-center py-16">
              <p className="text-brand-muted">
                Services are being updated. Please check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {oceanCurls && <OceanCurlsFolderCard service={oceanCurls} options={hairOptions} />}
              {afroServices.length > 0 && <AfroFolderCard services={afroServices} />}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {otherServices.map((service) => {
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
                            R175 deposit · included in total
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
