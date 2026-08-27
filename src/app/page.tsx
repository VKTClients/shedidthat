"use client";

import Link from "next/link";
import {
  Sparkles,
  Shield,
  Heart,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle,
  Star,
  ArrowRight,
  Scissors,
} from "lucide-react";
import { useSiteMedia } from "@/hooks/use-site-media";

const services: Array<{
  name: string;
  description: string;
  price: string;
  duration: string;
  image: string;
  mediaKey: keyof ReturnType<typeof useSiteMedia>;
  href: string;
}> = [
  {
    name: "Ocean Curls Blondie",
    description: "Soft blonde curls with a bright, dimensional finish.",
    price: "R650",
    duration: "2h 30m",
    image: "/images/Ocean Curls Blondie.jpeg",
    mediaKey: "product.ocean-curls.blondie",
    href: "/services",
  },
  {
    name: "Ocean Curls Brownie",
    description: "Rich brown curls with natural warmth and effortless movement.",
    price: "R650",
    duration: "2h 30m",
    image: "/images/Ocean Curls Brownie.jpeg",
    mediaKey: "product.ocean-curls.brownie",
    href: "/services",
  },
  {
    name: "Ocean Curls Goldie",
    description: "Golden curls with luminous warmth and soft, flowing texture.",
    price: "R650",
    duration: "2h 30m",
    image: "/images/Ocean Curls Goldie.jpeg",
    mediaKey: "product.ocean-curls.goldie",
    href: "/services",
  },
  {
    name: "Ocean Curls Black",
    description: "Deep black curls with a classic, polished finish and natural movement.",
    price: "R650",
    duration: "2h 30m",
    image: "/images/Ocean Curls Black.jpeg",
    mediaKey: "product.ocean-curls.black",
    href: "/services",
  },
  {
    name: "Ocean Curls Ginger",
    description: "Warm copper curls for a vibrant, confident statement.",
    price: "R650",
    duration: "2h 30m",
    image: "/images/Ocean Curls Ginger.jpeg",
    mediaKey: "product.ocean-curls.ginger",
    href: "/services",
  },
  {
    name: "Ocean Curls Snowflake",
    description: "Light blonde curls with a soft, luminous finish.",
    price: "R650",
    duration: "2h 30m",
    image: "/images/Ocean Curls Snowflake.png",
    mediaKey: "product.ocean-curls.snowflake",
    href: "/services",
  },
  {
    name: "Brownie Afro",
    description: "Warm, rich brown tones that frame your face beautifully. A natural, confident look.",
    price: "R560",
    duration: "1h 30m",
    image: "/images/brownie.jpg",
    mediaKey: "product.crochet-afro.brownie",
    href: "/booking",
  },
  {
    name: "Black Afro",
    description: "Classic deep black for timeless elegance. Bold, sleek, and always in style.",
    price: "R560",
    duration: "1h 30m",
    image: "/images/black afro.jpg",
    mediaKey: "product.crochet-afro.black",
    href: "/booking",
  },
  {
    name: "Goldie Afro",
    description: "Golden honey blonde that catches the light. Radiant warmth for a standout look.",
    price: "R560",
    duration: "1h 30m",
    image: "/images/goldie.jpg",
    mediaKey: "product.crochet-afro.goldie",
    href: "/booking",
  },
];

const stats = [
  { value: "300+", label: "Happy Clients" },
  { value: "4.9", label: "Average Rating" },
  { value: "3+", label: "Years Experience" },
  { value: "100%", label: "Quality Products" },
];

const steps = [
  {
    icon: Calendar,
    title: "Choose Your Service",
    description: "Pick from Crochet Afros or Crochet Curls.",
  },
  {
    icon: Clock,
    title: "Select Date & Time",
    description: "Find an available slot that works with your schedule.",
  },
  {
    icon: CreditCard,
    title: "Make Payment",
    description: "Pay the fixed R175 deposit via EFT and upload your proof. It forms part of your total price.",
  },
  {
    icon: CheckCircle,
    title: "Get Confirmed",
    description: "We verify your payment and confirm your booking via email.",
  },
];

const testimonials = [
  {
    quote:
      "My Brownie Afro was absolutely stunning. The natural brown tones framed my face perfectly and I felt so confident. The quality is unmatched!",
    name: "Thandi M.",
    service: "Brownie Afro",
  },
  {
    quote:
      "She Did That is my go-to for afros. The Goldie Afro gave me such a radiant glow and I received so many compliments. Always professional!",
    name: "Naledi K.",
    service: "Goldie Afro",
  },
  {
    quote:
      "The Black Afro was exactly what I wanted: bold, sleek, and timeless. The installation was perfect and it lasted beautifully. Highly recommend!",
    name: "Amara J.",
    service: "Black Afro",
  },
];

export default function HomePage() {
  const media = useSiteMedia();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{background:'linear-gradient(145deg, #E8DDD6 0%, #D4C4BC 30%, #C9B8B0 60%, #DECFC6 100%)'}}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-rose/[0.12] via-transparent to-brand-gold/[0.1]" />
        <div className="absolute top-20 -left-40 w-96 h-96 rounded-full bg-brand-rose/[0.05] blur-3xl liquid-float" style={{animationDuration: '20s'}} />
        <div className="absolute bottom-20 -right-40 w-96 h-96 rounded-full bg-brand-gold/[0.05] blur-3xl liquid-float" style={{animationDuration: '25s', animationDirection: 'reverse'}} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-blue-200/[0.03] blur-3xl liquid-float" style={{animationDuration: '18s', animationDelay: '3s'}} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[85vh] items-center">
            {/* Left copy */}
            <div className="py-20 lg:py-32 lg:pr-16">
              <p className="section-label mb-6">Premium Hair Studio</p>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-brand-charcoal leading-[1.05]">
                Crochet hairstyles,{" "}
                <span className="rose-gradient-text">Crafted</span> With Care
              </h1>
              <p className="mt-8 text-base text-brand-muted max-w-lg leading-relaxed">
                From textured Crochet Afros to soft Crochet Curls and stunning
                protective styles, <em>SHEdidTHAT</em> is your go-to studio
                for effortless beauty. Every style is carefully installed to give
                you a natural, confident look you&apos;ll love. Book your appointment
                online and step out looking and feeling your absolute best. ✨
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/booking" className="btn-gold px-8 py-4">
                  Book Appointment
                </Link>
                <Link href="/services" className="btn-secondary px-8 py-4">
                  View Pricing
                </Link>
              </div>
              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full bg-white/60 backdrop-blur-xl border-2 border-white shadow-glass-inner flex items-center justify-center"
                    >
                      <span className="text-xs font-medium text-brand-rose">
                        {["T", "N", "A", "Z"][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-brand-rose text-brand-rose" />
                    ))}
                  </div>
                  <p className="text-xs text-brand-muted/60 mt-0.5">Loved by 300+ clients</p>
                </div>
              </div>
            </div>

            {/* Right hero image */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-brand-rose/[0.03] rounded-tl-[80px]" />
              <div className="relative h-full min-h-[600px] rounded-tl-[80px] overflow-hidden">
                <img
                  src={media["homepage.hero"]}
                  alt="Beautiful crochet hairstyle"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative border-y border-white/10 overflow-hidden" style={{background:'linear-gradient(90deg, rgba(150,100,100,0.15) 0%, rgba(183,140,130,0.2) 50%, rgba(160,120,100,0.15) 100%)',backdropFilter:'blur(40px) saturate(180%)'}}>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-rose/[0.1] via-transparent to-brand-gold/[0.1]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-14 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16">
            {stats.map((stat, i) => (
              <div key={i} className="text-center glass-sm p-6 liquid-glow">
                <p className="font-display text-3xl sm:text-4xl font-semibold rose-gradient-text">
                  {stat.value}
                </p>
                <p className="text-sm text-brand-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 lg:py-32 relative" style={{background:'linear-gradient(180deg, #D4C4BC 0%, #C9B8B0 50%, #DECFC6 100%)'}}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-rose/[0.1] via-transparent to-brand-gold/[0.08]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <p className="section-label mb-4">Our Services</p>
            <h2 className="section-heading">
              What We Offer
            </h2>
            <p className="section-subheading max-w-lg mx-auto">
              Crochet Afros and Ocean Curls, carefully installed for a confident, natural finish.
            </p>
          </div>
          <div className="space-y-14">
            <div>
              <h3 className="mb-6 text-center font-display text-2xl font-semibold text-brand-charcoal">Ocean Curls</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {services.slice(0, 5).map((svc, i) => (
              <div key={i} className="glass p-6 lg:p-8 group liquid-breathe hover:shadow-glass-rose transition-all duration-500">
                <div className="aspect-[3/4] mb-6 overflow-hidden rounded-xl bg-brand-cream">
                  <img
                    src={media[svc.mediaKey] || svc.image}
                    alt={svc.name}
                    className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-display text-xl font-semibold text-brand-charcoal group-hover:text-brand-rose transition-colors">
                    {svc.name}
                  </h3>
                  <span className="font-display text-xl font-semibold text-brand-rose whitespace-nowrap ml-4">
                    {svc.price}
                  </span>
                </div>
                <p className="text-sm text-brand-muted mb-6 leading-relaxed">
                  {svc.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-brand-muted/60">
                    <Clock className="h-3.5 w-3.5" />
                    {svc.duration}
                  </span>
                  <Link
                    href={svc.href}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-rose hover:text-brand-rose-light transition-colors"
                  >
                    Book Now <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
              </div>
            </div>
            <div className="mx-auto max-w-6xl">
              <h3 className="mb-6 text-center font-display text-2xl font-semibold text-brand-charcoal">Crochet Afros</h3>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {services.slice(5).map((svc, i) => (
                  <div key={i} className="glass p-6 lg:p-8 group liquid-breathe hover:shadow-glass-rose transition-all duration-500">
                    <div className="aspect-square mb-6 overflow-hidden rounded-xl bg-brand-cream"><img src={media[svc.mediaKey] || svc.image} alt={svc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                    <div className="flex items-start justify-between mb-4"><h3 className="font-display text-xl font-semibold text-brand-charcoal group-hover:text-brand-rose transition-colors">{svc.name}</h3><span className="font-display text-xl font-semibold text-brand-rose whitespace-nowrap ml-4">{svc.price}</span></div>
                    <p className="text-sm text-brand-muted mb-6 leading-relaxed">{svc.description}</p>
                    <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-xs text-brand-muted/60"><Clock className="h-3.5 w-3.5" />{svc.duration}</span><Link href={svc.href} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-rose hover:text-brand-rose-light transition-colors">Book Now <ArrowRight className="h-3.5 w-3.5" /></Link></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link href="/services" className="inline-flex items-center gap-2 text-sm font-medium text-brand-muted hover:text-brand-rose transition-colors">
              View full pricing details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* About / Story Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden" style={{background:'linear-gradient(160deg, #DECFC6 0%, #D4C4BC 40%, #C9B8B0 100%)'}}>
        <div className="absolute top-20 -right-32 w-80 h-80 rounded-full bg-brand-rose/[0.1] blur-3xl liquid-float" style={{animationDuration: '22s'}} />
        <div className="absolute bottom-10 -left-32 w-72 h-72 rounded-full bg-brand-gold/[0.08] blur-3xl liquid-float" style={{animationDuration: '18s', animationDirection: 'reverse'}} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Image */}
            <div className="relative">
              <div className="aspect-[4/5] rounded-tr-[60px] rounded-bl-[60px] overflow-hidden">
                <img
                  src={media["homepage.about"]}
                  alt="Blonde Ocean Curls hairstyle"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-cream/30 to-transparent" />
              </div>
            </div>

            {/* Copy */}
            <div>
              <p className="section-label mb-4">About Us</p>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-brand-charcoal leading-[1.1] mb-6">
                Where Passion Meets Precision
              </h2>
              <div className="divider mb-8" />
              <p className="text-brand-muted leading-relaxed mb-4">
                She Did That was born from a love for protective styling and a belief
                that every woman deserves to feel beautiful in her natural hair. What
                started as a passion project has grown into a trusted studio known for
                quality, consistency, and care.
              </p>
              <p className="text-brand-muted leading-relaxed mb-8">
                We use only premium products that protect and strengthen your hair.
                Every Crochet Afro and Crochet Curl style is installed with
                intention and precision. Your hair isn&apos;t just styled; it&apos;s cared for.
              </p>
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <Shield className="h-5 w-5 text-brand-rose mx-auto mb-2" />
                  <p className="text-xs font-medium text-brand-charcoal">Protective Styles</p>
                </div>
                <div className="text-center">
                  <Heart className="h-5 w-5 text-brand-rose mx-auto mb-2" />
                  <p className="text-xs font-medium text-brand-charcoal">Hair Health First</p>
                </div>
                <div className="text-center">
                  <Sparkles className="h-5 w-5 text-brand-rose mx-auto mb-2" />
                  <p className="text-xs font-medium text-brand-charcoal">Premium Products</p>
                </div>
              </div>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-rose hover:text-brand-rose-dark transition-colors"
              >
                See Our Services <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 lg:py-32 relative" style={{background:'linear-gradient(180deg, #C9B8B0 0%, #DECFC6 50%, #D4C4BC 100%)'}}>
        <div className="absolute inset-0 bg-gradient-to-tl from-brand-gold/[0.08] via-transparent to-brand-rose/[0.08]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <p className="section-label mb-4">How It Works</p>
            <h2 className="section-heading">
              Book in 4 Simple Steps
            </h2>
            <p className="section-subheading max-w-lg mx-auto">
              No DMs, no back-and-forth. Just pick your style, choose a time, and pay online.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, i) => (
              <div key={i} className="text-center group">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full glass-sm group-hover:shadow-glass-rose group-hover:scale-110 transition-all duration-500">
                  <step.icon className="h-6 w-6 text-brand-rose group-hover:text-brand-rose-dark transition-colors duration-300" />
                </div>
                <p className="text-xs font-medium uppercase tracking-editorial text-brand-rose mb-3">
                  Step {i + 1}
                </p>
                <h3 className="font-display text-xl font-semibold text-brand-charcoal mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-brand-muted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-14">
            <Link href="/booking" className="btn-gold px-8 py-4">
              Start Booking <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 lg:py-32 overflow-hidden" style={{background:'linear-gradient(200deg, #DECFC6 0%, #C9B8B0 50%, #D4C4BC 100%)'}}>
        <div className="absolute top-10 -left-24 w-72 h-72 rounded-full bg-brand-rose/[0.1] blur-3xl liquid-float" style={{animationDuration: '20s'}} />
        <div className="absolute bottom-20 -right-24 w-80 h-80 rounded-full bg-violet-300/[0.06] blur-3xl liquid-float" style={{animationDuration: '16s', animationDirection: 'reverse'}} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <p className="section-label mb-4">Client Love</p>
            <h2 className="section-heading">
              What Our Clients Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="glass p-8 text-center liquid-breathe hover:shadow-glass-rose transition-all duration-500">
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-brand-rose text-brand-rose" />
                  ))}
                </div>
                <p className="text-sm text-brand-muted leading-relaxed italic mb-8">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="divider mx-auto mb-6" />
                <p className="font-display text-lg font-semibold text-brand-charcoal">
                  {t.name}
                </p>
                <p className="text-xs text-brand-muted/60 mt-1">{t.service}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Maintenance Tips Preview */}
      <section className="py-24 lg:py-32 relative" style={{background:'linear-gradient(180deg, #D4C4BC 0%, #C9B8B0 50%, #DECFC6 100%)'}}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-rose/[0.08] via-transparent to-brand-gold/[0.08]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <p className="section-label mb-4">Aftercare</p>
            <h2 className="section-heading">
              Maintenance &amp; Care
            </h2>
            <p className="section-subheading max-w-lg mx-auto">
              Your crochet hairstyle needs love. Here are the essentials to keep it looking fresh.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="glass p-8 text-center group liquid-breathe hover:shadow-glass-rose transition-all duration-500">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full glass-sm text-brand-rose group-hover:scale-110 transition-all duration-500 liquid-glow">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-brand-charcoal mb-2">
                Bedtime Routine
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Spray, massage, puff, and cover. Protect your hair every night with a scarf or bonnet.
              </p>
            </div>
            <div className="glass p-8 text-center group liquid-breathe hover:shadow-glass-rose transition-all duration-500" style={{animationDelay: '1.3s'}}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full glass-sm text-brand-rose group-hover:scale-110 transition-all duration-500 liquid-glow">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-brand-charcoal mb-2">
                Morning Refresh
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Use mousse on Crochet Afros only. For Ocean Curls, skip mousse; spray with fabric softener (any brand) and gently detangle by hand.
              </p>
            </div>
            <div className="glass p-8 text-center group liquid-breathe hover:shadow-glass-rose transition-all duration-500" style={{animationDelay: '2.6s'}}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full glass-sm text-brand-rose group-hover:scale-110 transition-all duration-500 liquid-glow">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-brand-charcoal mb-2">
                Handle with Care
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Ocean Curls and Crochet Afros typically last 3-4 weeks. With good maintenance, they can last up to one month.
              </p>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link href="/tips" className="inline-flex items-center gap-2 text-sm font-medium text-brand-rose hover:text-brand-rose-dark transition-colors">
              Read full care guide <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 lg:py-32 overflow-hidden" style={{background:'linear-gradient(135deg, #C9B8B0 0%, #DECFC6 40%, #D4C4BC 100%)'}}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-rose/[0.12] via-transparent to-brand-gold/[0.1]" />
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-brand-rose/[0.08] blur-3xl liquid-float" style={{animationDuration: '22s'}} />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 rounded-full bg-brand-gold/[0.08] blur-3xl liquid-float" style={{animationDuration: '18s', animationDirection: 'reverse'}} />
        <div className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full bg-violet-300/[0.05] blur-3xl liquid-float" style={{animationDuration: '15s', animationDelay: '5s'}} />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center relative">
          <p className="text-xs font-medium uppercase tracking-editorial text-brand-rose mb-6">
            Ready?
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-brand-charcoal leading-[1.1] mb-6">
            Your Next Look Starts Here
          </h2>
          <p className="text-brand-muted max-w-md mx-auto mb-10 leading-relaxed">
            Don&apos;t wait. Book your appointment now and let us create
            something beautiful for you. A fixed R175 deposit secures your appointment and forms part of the total price.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/booking" className="btn-gold px-10 py-4">
              Book Your Appointment
            </Link>
            <Link href="/tips" className="inline-flex items-center gap-2 text-sm font-medium text-brand-muted hover:text-brand-rose transition-colors px-6 py-4">
              Maintenance &amp; Care <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
