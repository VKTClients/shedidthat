"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/tips", label: "Hair Care" },
  { href: "/client-cam", label: "Reviews" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-charcoal/[0.07] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[76px] items-center justify-between">
          <Link href="/" className="group flex items-center gap-3" aria-label="She Did That home">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-brand-charcoal/[0.07] bg-brand-cream shadow-[0_8px_24px_rgba(45,41,38,0.07)] transition-transform duration-300 group-hover:-translate-y-0.5">
              <Image
                src="/images/logo.png"
                alt=""
                width={43}
                height={56}
                className="h-[46px] w-auto object-contain"
                priority
              />
            </span>
            <span className="leading-none">
              <span className="block font-display text-xl font-semibold tracking-[-0.035em] text-brand-charcoal">
                She Did That
              </span>
              <span className="mt-1.5 block text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-rose">
                Premium Hair Studio
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-cream text-brand-charcoal"
                      : "text-brand-muted hover:bg-brand-cream/70 hover:text-brand-charcoal"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link href="/booking" className="btn-primary ml-3 min-h-11 whitespace-nowrap px-5 py-2.5 text-xs shadow-[0_8px_20px_rgba(183,110,121,0.18)]">
              <CalendarDays className="h-4 w-4" />
              Book Appointment
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-charcoal/[0.08] bg-brand-cream text-brand-charcoal transition active:scale-[0.98] md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="border-t border-brand-charcoal/[0.07] pb-5 pt-3 md:hidden" aria-label="Mobile navigation">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    pathname === link.href ? "bg-brand-cream text-brand-charcoal" : "text-brand-muted hover:bg-brand-cream"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <Link href="/booking" onClick={() => setMobileOpen(false)} className="btn-primary mt-3 min-h-12 w-full whitespace-nowrap px-5 py-3 text-sm">
              <CalendarDays className="h-4 w-4" />
              Book Appointment
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
