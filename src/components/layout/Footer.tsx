import Link from "next/link";
import Image from "next/image";
import { Instagram, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 overflow-hidden" style={{background:'linear-gradient(180deg, #C9B8B0 0%, #B8A89E 50%, #A8988E 100%)'}}>
      <div className="absolute inset-0 bg-gradient-to-t from-brand-rose/[0.1] via-transparent to-transparent" />
      <div className="absolute bottom-10 left-1/4 w-72 h-72 rounded-full bg-brand-rose/[0.03] blur-3xl" />
      <div className="absolute top-10 right-1/4 w-72 h-72 rounded-full bg-brand-gold/[0.03] blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/images/logo.png"
                alt="She Did That"
                width={300}
                height={112}
                className="h-28 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-brand-muted max-w-xs leading-relaxed">
              Premium Crochet Afros and Crochet Curls, carefully installed to
              make you feel confident and beautiful.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-medium uppercase tracking-editorial text-brand-rose mb-6">
              Explore
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/services" className="text-sm text-brand-muted hover:text-brand-rose transition-colors duration-200">
                  Services &amp; Pricing
                </Link>
              </li>
              <li>
                <Link href="/booking" className="text-sm text-brand-muted hover:text-brand-rose transition-colors duration-200">
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link href="/tips" className="text-sm text-brand-muted hover:text-brand-rose transition-colors duration-200">
                  Maintenance &amp; Care
                </Link>
              </li>
              <li>
                <Link href="/client-cam" className="text-sm text-brand-muted hover:text-brand-rose transition-colors duration-200">
                  Reviews
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-medium uppercase tracking-editorial text-brand-rose mb-6">
              Get in Touch
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-brand-muted">
                <Phone className="h-4 w-4 text-brand-rose/60" />
                <a href="tel:+27824418297" className="hover:text-brand-rose transition-colors">082 441 8297</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-brand-muted">
                <Mail className="h-4 w-4 text-brand-rose/60" />
                <span>hello@shedidthat.co.za</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-brand-muted">
                <Instagram className="h-4 w-4 text-brand-rose/60" />
                <span>@shedidthat</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-brand-charcoal/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-muted/60">
            &copy; {new Date().getFullYear()} She Did That. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-brand-muted/40">
              Crafted with care in South Africa
            </p>
            <Link href="/admin" className="text-xs text-brand-muted/30 hover:text-brand-muted/60 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
