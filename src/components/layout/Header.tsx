"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/tips", label: "Hair Care" },
  { href: "/booking", label: "Book Now" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/15" style={{background:'rgba(255, 255, 255, 0.08)',boxShadow:'0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.12)'}}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="She Did That"
              width={280}
              height={105}
              className="h-24 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-brand-muted transition-colors duration-200 hover:text-brand-rose"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/booking" className="btn-gold text-xs py-3 px-6">
              Book Appointment
            </Link>
          </nav>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-brand-rose"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-6 pt-2 space-y-1 border-t border-brand-charcoal/[0.06]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-brand-muted py-3 px-2 hover:text-brand-rose transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3">
              <Link
                href="/booking"
                onClick={() => setMobileOpen(false)}
                className="btn-gold w-full text-center text-xs py-3"
              >
                Book Appointment
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
