import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HairOption, Service } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import type { SiteMediaKey } from "@/lib/site-media";

const variants: Array<{ name: string; image: string; mediaKey: SiteMediaKey; rotate: string; left: string }> = [
  { name: "Blondie", image: "/images/Ocean Curls Blondie.jpeg", mediaKey: "product.ocean-curls.blondie", rotate: "-10deg", left: "10%" },
  { name: "Brownie", image: "/images/Ocean Curls Brownie.jpeg", mediaKey: "product.ocean-curls.brownie", rotate: "-6deg", left: "26%" },
  { name: "Goldie", image: "/images/Ocean Curls Goldie.jpeg", mediaKey: "product.ocean-curls.goldie", rotate: "-2deg", left: "42%" },
  { name: "Black", image: "/images/Ocean Curls Black.jpeg", mediaKey: "product.ocean-curls.black", rotate: "2deg", left: "58%" },
  { name: "Ginger", image: "/images/Ocean Curls Ginger.jpeg", mediaKey: "product.ocean-curls.ginger", rotate: "6deg", left: "74%" },
  { name: "Snowflake", image: "/images/Ocean Curls Snowflake.png", mediaKey: "product.ocean-curls.snowflake", rotate: "10deg", left: "90%" },
];

export function OceanCurlsFolderCard({ service, options, media }: { service: Service; options: HairOption[]; media: Record<SiteMediaKey, string> }) {
  const bookingUrl = (name: string) => {
    const option = options.find((item) => item.service_id === service.id && item.name.toLowerCase() === name.toLowerCase());
    return `/booking?service=${service.id}${option ? `&hair=${option.id}` : ""}`;
  };

  return (
    <article className="ocean-folder group" aria-labelledby="ocean-curls-title">
      <div className="ocean-folder-back" aria-hidden="true" />
      <div className="ocean-folder-gallery" aria-label="Ocean Curls colours">
        {variants.map((variant, index) => (
          <Link
            key={variant.name}
            href={bookingUrl(variant.name)}
            className="ocean-folder-photo"
            style={{ "--folder-left": variant.left, "--folder-r": variant.rotate, "--folder-i": index, zIndex: 10 - Math.abs(index - 2) } as React.CSSProperties}
            aria-label={`Book Ocean Curls in ${variant.name}`}
          >
            <img src={media[variant.mediaKey] || variant.image} alt={`Ocean Curls in ${variant.name}`} />
          </Link>
        ))}
      </div>

      <div className="ocean-folder-front">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label mb-2">The Ocean Curls collection</p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 id="ocean-curls-title" className="font-display text-3xl font-semibold text-brand-charcoal">Ocean Curls</h2>
              <span className="font-display text-2xl font-semibold text-brand-rose">{formatCurrency(service.full_price)}</span>
            </div>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">Choose your colour, then continue with your appointment date and fixed R175 deposit.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Book an Ocean Curls colour">
            {variants.map((variant) => (
              <Link key={variant.name} href={bookingUrl(variant.name)} className="ocean-folder-colour">
                {variant.name}<ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
