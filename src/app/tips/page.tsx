import { Moon, Sun, Sparkles, Wind, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";

export default function TipsPage() {
  return (
    <>
      {/* Header */}
      <section className="relative py-20 lg:py-28 overflow-hidden" style={{background:'linear-gradient(135deg, #E8DDD6 0%, #D4C4BC 30%, #C9B8B0 100%)'}}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-rose/[0.12] via-transparent to-brand-gold/[0.1]" />
        <div className="absolute top-10 -left-32 w-80 h-80 rounded-full bg-brand-rose/[0.04] blur-3xl liquid-float" style={{animationDuration: '20s'}} />
        <div className="absolute -bottom-20 -right-32 w-80 h-80 rounded-full bg-brand-gold/[0.04] blur-3xl liquid-float" style={{animationDuration: '16s', animationDirection: 'reverse'}} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
          <p className="section-label mb-4">Hair Education</p>
          <h1 className="section-heading mb-4">
            Maintenance &amp; Care
          </h1>
          <p className="section-subheading max-w-xl mx-auto">
            Everything you need to know about caring for your crochet hairstyle
          </p>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 border-b border-white/10" style={{background:'linear-gradient(180deg, #D4C4BC 0%, #C9B8B0 100%)'}}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="glass-rose p-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-brand-rose flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-base font-semibold text-brand-charcoal mb-2">
                  Important Disclaimer
                </h3>
                <p className="text-sm text-brand-muted leading-relaxed">
                  This hairstyle requires high maintenance and commitment. If you&apos;re unsure about
                  dedicating time to care for your hair, we recommend exploring alternative styles to
                  avoid damage or complications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Maintenance Instructions */}
      <section className="py-20 lg:py-28 relative" style={{background:'linear-gradient(180deg, #C9B8B0 0%, #DECFC6 50%, #D4C4BC 100%)'}}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-label mb-4">Daily Routine</p>
            <h2 className="section-heading">
              Maintenance Instructions
            </h2>
            <p className="section-subheading max-w-lg mx-auto">
              Follow these steps to keep your crochet hairstyle looking its best
            </p>
          </div>

          <div className="space-y-12">
            {/* Pre-Bedtime Routine */}
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex h-14 w-14 items-center justify-center rounded-full glass-sm text-brand-rose flex-shrink-0 liquid-glow">
                <Moon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-brand-charcoal mb-1">
                  1. Pre-Bedtime Routine
                </h3>
                <div className="divider mb-4" />
                <ul className="space-y-3 text-sm text-brand-muted leading-relaxed">
                  <li className="flex gap-3">
                    <span className="text-brand-rose font-bold mt-0.5">&bull;</span>
                    Lightly spray the hair with fabric softener (any brand).
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand-rose font-bold mt-0.5">&bull;</span>
                    Massage the product through the hair gently with your hands.
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand-rose font-bold mt-0.5">&bull;</span>
                    Tie your hair into a high or low puff, keeping it simple for easy untie in the morning.
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand-rose font-bold mt-0.5">&bull;</span>
                    Wear a scarf, bonnet, or other sleep cover to protect your hair.
                  </li>
                </ul>
              </div>
            </div>

            {/* Morning Routine */}
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex h-14 w-14 items-center justify-center rounded-full glass-sm text-brand-rose flex-shrink-0 liquid-glow">
                <Sun className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-brand-charcoal mb-1">
                  2. Morning Routine
                </h3>
                <div className="divider mb-4" />
                <ul className="space-y-3 text-sm text-brand-muted leading-relaxed">
                  <li className="flex gap-3">
                    <span className="text-brand-rose font-bold mt-0.5">&bull;</span>
                    For Crochet Afros, use mousse to enhance shape and definition.
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand-rose font-bold mt-0.5">&bull;</span>
                    For Ocean Curls, do not use mousse. Spray with fabric softener (any brand), then gently fluff the curls.
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand-rose font-bold mt-0.5">&bull;</span>
                    Gently detangle the hair with your hands, avoiding combs or brushes.
                  </li>
                </ul>
              </div>
            </div>

            {/* Styling Tips */}
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex h-14 w-14 items-center justify-center rounded-full glass-sm text-brand-rose flex-shrink-0 liquid-glow">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-brand-charcoal mb-1">
                  3. Styling Tips
                </h3>
                <div className="divider mb-4" />
                <ul className="space-y-3 text-sm text-brand-muted leading-relaxed">
                  <li className="flex gap-3">
                    <span className="text-brand-rose font-bold mt-0.5">&bull;</span>
                    Use a hair dryer on low heat to puff out the hair and add softness.
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand-rose font-bold mt-0.5">&bull;</span>
                    Avoid using combs or brushes; instead, use your hands to detangle and style.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Care Notes */}
      <section className="py-20 lg:py-28 relative" style={{background:'linear-gradient(180deg, #DECFC6 0%, #C9B8B0 50%, #D4C4BC 100%)'}}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="section-label mb-4">Good to Know</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-brand-charcoal">
              Important Care Notes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 text-center liquid-breathe">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-rose/10 liquid-glow">
                <Wind className="h-5 w-5 text-brand-rose" />
              </div>
              <h3 className="font-display text-lg font-semibold text-brand-charcoal mb-2">
                Avoid Water Submersion
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Avoid submerging your head in water, such as swimming, as it can damage the synthetic fibre.
              </p>
            </div>
            <div className="glass p-6 text-center liquid-breathe" style={{animationDelay: '1.3s'}}>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-rose/10 liquid-glow">
                <Sparkles className="h-5 w-5 text-brand-rose" />
              </div>
              <h3 className="font-display text-lg font-semibold text-brand-charcoal mb-2">
                Handle with Care
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Be gentle when handling the hair to prevent tangling or breakage.
              </p>
            </div>
            <div className="glass p-6 text-center liquid-breathe" style={{animationDelay: '2.6s'}}>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-rose/10 liquid-glow">
                <Clock className="h-5 w-5 text-brand-rose" />
              </div>
              <h3 className="font-display text-lg font-semibold text-brand-charcoal mb-2">
                Longevity
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                Ocean Curls and Crochet Afros typically last 3-4 weeks. With good maintenance, they can last up to one month.
              </p>
            </div>
          </div>

          <p className="text-sm text-brand-muted text-center mt-10 max-w-lg mx-auto leading-relaxed">
            By following these instructions, you&apos;ll be able to enjoy your crochet hairstyle while
            maintaining its quality and longevity. If you have any questions or concerns, please
            don&apos;t hesitate to contact us.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 lg:py-32 overflow-hidden" style={{background:'linear-gradient(135deg, #C9B8B0 0%, #DECFC6 40%, #D4C4BC 100%)'}}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-rose/[0.1] via-transparent to-brand-gold/[0.08]" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center relative">
          <p className="text-xs font-medium uppercase tracking-editorial text-brand-rose mb-6">
            Ready?
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-brand-charcoal leading-[1.1] mb-4">
            Book Your Appointment
          </h2>
          <p className="text-brand-muted max-w-md mx-auto mb-10 leading-relaxed">
            Now that you know how to care for your hair, book your next appointment with us.
          </p>
          <Link href="/booking" className="btn-gold px-10 py-4">
            Book Now
          </Link>
        </div>
      </section>
    </>
  );
}
