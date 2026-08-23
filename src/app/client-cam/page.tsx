"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Camera, Star, X } from "lucide-react";

const reviews = [
  ["029544b5-8fd1-41e0-b591-117694ebb124.JPG", 736, 1600],
  ["0b243dd0-e729-464b-953e-38db8a788767.JPG", 736, 1600],
  ["1316d5f7-8407-4721-8336-d46f28a48b08.JPG", 736, 1600],
  ["1bf04f2c-c963-435e-9f94-e57c36ce23db.JPG", 1320, 1310],
  ["4bbc36f6-a9a6-4df9-9283-a76821df782e.JPG", 782, 1600],
  ["5f02d06e-954f-4039-be3c-93673c8d21ae.JPG", 736, 1600],
  ["6f027ca0-e0d1-49f4-80ec-b08094143308.JPG", 736, 1600],
  ["844194c4-e1a8-4350-98bc-b5f39d5e2180.JPG", 736, 1600],
  ["8862a4ec-cc77-42fc-b2e7-5077ca96c8ad.JPG", 962, 1600],
  ["8dba76c9-a940-4f3c-8437-92850db10084.JPG", 736, 1600],
  ["8e822936-b3f1-451d-acaa-e1dfdbc1eaa6.JPG", 736, 1600],
  ["98fc23de-7afd-44ad-b5d4-5c5b517bc6fb.JPG", 1320, 448],
  ["a2b525ea-8dcd-4ea9-97ce-dafe255f5bbf.JPG", 736, 1600],
  ["a6c31d2c-c5fa-4da2-956e-cec36aa542d4.JPG", 736, 1600],
  ["b0e1aeca-47ba-4123-97ba-8a5a19bb1097.JPG", 1320, 630],
  ["b7858256-574d-424b-8567-e8ed6823b123.JPG", 736, 1600],
  ["bb0c24f3-c044-4f02-8cbd-53ef2b03b6c0.JPG", 944, 1600],
  ["bd955ff3-57c7-42cb-bd15-08fa9fd0f17e.JPG", 736, 1600],
  ["c1341571-47f5-4781-9b18-7adde0183aef.JPG", 1320, 834],
  ["c9a69330-973f-4e99-8e37-943308f10b67.JPG", 736, 1600],
  ["ddf69451-a6da-42e4-8532-a386d433c7fd.JPG", 736, 1600],
  ["e2d5c3b8-a9a4-4c21-b632-134147f92f5d.JPG", 736, 1600],
  ["e6d7b29b-4173-492a-888d-4671ccbfd616.JPG", 736, 1600],
  ["f4d4148b-2434-4d1a-9f17-dda2f4b1bb30.JPG", 736, 1600],
] as const;

const reviewSrc = (name: string) => `/Reviews page/${name}`;

export default function ClientCamPage() {
  const [activeReview, setActiveReview] = useState<(typeof reviews)[number] | null>(null);

  useEffect(() => {
    if (!activeReview) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setActiveReview(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", close);
    };
  }, [activeReview]);

  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(145deg,#E8DDD6_0%,#D4C4BC_48%,#C9B8B0_100%)] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-brand-rose/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-brand-rose shadow-[0_14px_35px_rgba(94,61,58,0.1)]"><Camera className="h-5 w-5" /></div>
            <p className="section-label mb-4">Real messages, real results</p>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-brand-charcoal sm:text-6xl lg:text-7xl">Reviews</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-brand-muted sm:text-lg">A look inside the messages clients send after their appointments. Tap any review to read it in full.</p>
            <div className="mt-7 flex items-center gap-3 text-sm text-brand-muted"><span className="flex gap-1" aria-label="Five star client feedback">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-brand-rose text-brand-rose" />)}</span><span>Shared with love by our clients</span></div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#D4C4BC_0%,#C9B8B0_55%,#DECFC6_100%)] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
          {reviews.map((review, index) => (
            <button key={`${review[0]}-${index}`} type="button" onClick={() => setActiveReview(review)} className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/45 bg-white/28 p-2 text-left shadow-[0_18px_45px_rgba(94,61,58,0.11)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(94,61,58,0.17)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose focus-visible:ring-offset-2 focus-visible:ring-offset-[#d4c4bc] active:translate-y-0">
              <Image src={reviewSrc(review[0])} alt={`Client review screenshot ${index + 1}`} width={review[1]} height={review[2]} sizes="(max-width: 640px) 94vw, (max-width: 1024px) 46vw, 24vw" className="h-auto w-full rounded-xl" />
            </button>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-white/45 bg-white/25 p-8 text-center shadow-[0_20px_50px_rgba(94,61,58,0.1)] backdrop-blur-xl sm:p-10">
          <h2 className="font-display text-3xl font-semibold text-brand-charcoal">Ready for your own reveal?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-brand-muted">Choose your Crochet Afro or Ocean Curls colour and reserve your appointment online.</p>
          <Link href="/booking" className="btn-primary mt-7 inline-flex min-h-12 px-6">Book Appointment <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {activeReview && (
        <div role="dialog" aria-modal="true" aria-label="Expanded client review" className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-charcoal/75 p-4 backdrop-blur-md" onClick={() => setActiveReview(null)}>
          <button type="button" onClick={() => setActiveReview(null)} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-charcoal shadow-xl transition hover:bg-brand-cream active:scale-[0.98] sm:right-6 sm:top-6" aria-label="Close review"><X className="h-5 w-5" /></button>
          <div className="max-h-[90dvh] max-w-3xl overflow-auto rounded-2xl bg-white p-2 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <Image src={reviewSrc(activeReview[0])} alt="Expanded client review screenshot" width={activeReview[1]} height={activeReview[2]} sizes="90vw" className="h-auto max-h-[86dvh] w-auto rounded-xl object-contain" priority />
          </div>
        </div>
      )}
    </>
  );
}
