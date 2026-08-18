import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";

const variants = [
  { name: "Brownie", serviceName: "Brownie Afro", image: "/images/brownie.jpg", rotate: "-6deg", left: "24%" },
  { name: "Black", serviceName: "Black Afro", image: "/images/black afro.jpg", rotate: "0deg", left: "50%" },
  { name: "Goldie", serviceName: "Goldie Afro", image: "/images/goldie.jpg", rotate: "6deg", left: "76%" },
];

export function AfroFolderCard({ services }: { services: Service[] }) {
  const baseService = services[0];
  const serviceFor = (name: string) => services.find((service) => service.name.toLowerCase() === name.toLowerCase()) || baseService;
  const lowestPrice = Math.min(...services.map((service) => Number(service.full_price) || 0).filter((price) => price > 0));

  return (
    <article className="ocean-folder group" aria-labelledby="afro-collection-title">
      <div className="ocean-folder-back" aria-hidden="true" />
      <div className="ocean-folder-gallery" aria-label="Crochet Afro styles">
        {variants.map((variant, index) => {
          const service = serviceFor(variant.serviceName);
          return (
            <Link
              key={variant.name}
              href={`/booking?service=${service.id}`}
              className="ocean-folder-photo"
              style={{ "--folder-left": variant.left, "--folder-r": variant.rotate, "--folder-i": index, zIndex: 10 - Math.abs(index - 1) } as React.CSSProperties}
              aria-label={`Book the ${variant.name} Afro`}
            >
              <img src={variant.image} alt={`${variant.name} Crochet Afro`} />
            </Link>
          );
        })}
      </div>

      <div className="ocean-folder-front">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label mb-2">The Crochet Afro collection</p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 id="afro-collection-title" className="font-display text-3xl font-semibold text-brand-charcoal">Crochet Afros</h2>
              {Number.isFinite(lowestPrice) && <span className="font-display text-2xl font-semibold text-brand-rose">From {formatCurrency(lowestPrice)}</span>}
            </div>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">Choose a rich natural tone, then continue to select your appointment time.</p>
          </div>
          <div className="grid grid-cols-3 gap-2" aria-label="Book a Crochet Afro style">
            {variants.map((variant) => {
              const service = serviceFor(variant.serviceName);
              return <Link key={variant.name} href={`/booking?service=${service.id}`} className="ocean-folder-colour">{variant.name}<ArrowRight className="h-3 w-3" /></Link>;
            })}
          </div>
        </div>
      </div>
    </article>
  );
}
