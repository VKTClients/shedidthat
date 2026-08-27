"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Upload } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { SITE_MEDIA_DEFINITIONS, type SiteMediaKey } from "@/lib/site-media";

type MediaRecord = { slot_key: SiteMediaKey; image_url: string; updated_at: string };

const mediaGroups = [
  { title: "Homepage", description: "The main images visitors see first.", keys: ["brand.logo", "homepage.hero", "homepage.about"] as SiteMediaKey[] },
  { title: "Ocean Curls products", description: "Change the photo for each colour.", keys: ["product.ocean-curls.blondie", "product.ocean-curls.brownie", "product.ocean-curls.goldie", "product.ocean-curls.black", "product.ocean-curls.ginger", "product.ocean-curls.snowflake"] as SiteMediaKey[] },
  { title: "Crochet Afros", description: "The three photos in the Afro collection.", keys: ["product.crochet-afro.brownie", "product.crochet-afro.black", "product.crochet-afro.goldie"] as SiteMediaKey[] },
  { title: "Booking add-on", description: "Photos shown when clients choose Cluster Lashes.", keys: ["booking.cluster-lashes-1", "booking.cluster-lashes-2"] as SiteMediaKey[] },
];

export default function AdminMediaPage() {
  const [media, setMedia] = useState<Record<string, MediaRecord>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedFile, setSelectedFile] = useState<Record<string, string>>({});

  const loadMedia = async () => {
    setLoading(true); setError("");
    try {
      const response = await adminFetch("/api/admin/media");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load website photos");
      setMedia(Object.fromEntries((result.media || []).map((item: MediaRecord) => [item.slot_key, item])));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load website photos"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadMedia(); }, []);

  const upload = async (slotKey: SiteMediaKey, file: File) => {
    setUploading(slotKey); setError(""); setNotice("");
    try {
      const formData = new FormData();
      formData.append("slot_key", slotKey);
      formData.append("file", file);
      const response = await adminFetch("/api/admin/media", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not upload image");
      setMedia((current) => ({ ...current, [slotKey]: result.media }));
      setSelectedFile((current) => ({ ...current, [slotKey]: "" }));
      setNotice("Photo updated. The public site will use it after refresh.");
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Could not upload image"); }
    finally { setUploading(null); }
  };

  return (
    <>
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Content control</p>
          <h1 className="admin-page-title">Photos</h1>
          <p className="admin-page-subtitle">Change any important photo on the website in a few clicks.</p>
        </div>
        <button type="button" onClick={loadMedia} className="admin-button admin-button-quiet"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>

      {error && <div className="admin-error mb-5">{error}</div>}
      {notice && <div className="mb-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
      <div className="mb-8 rounded-2xl border border-brand-rose/15 bg-brand-rose/[0.05] p-5 text-sm leading-6 text-brand-muted">
        <p className="font-semibold text-brand-charcoal">How to change a photo</p>
        <p className="mt-1">Find the photo below, click <strong className="text-brand-charcoal">Replace photo</strong>, choose the new picture, and wait for the green confirmation. JPG, PNG, or WebP images up to 8MB are supported.</p>
      </div>

      {loading ? <div className="admin-empty"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-rose" /><p className="mt-4 text-sm text-brand-muted">Loading photos</p></div> : (
        <div className="space-y-10">
          {mediaGroups.map((group) => (
            <section key={group.title}>
              <div className="mb-4"><h2 className="font-display text-2xl font-semibold text-brand-charcoal">{group.title}</h2><p className="mt-1 text-sm text-brand-muted">{group.description}</p></div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {group.keys.map((slotKey) => {
            const definition = SITE_MEDIA_DEFINITIONS.find((item) => item.key === slotKey)!;
            const currentUrl = media[definition.key]?.image_url || definition.defaultUrl;
            const isUploading = uploading === definition.key;
            return (
              <article key={definition.key} className="admin-booking-card overflow-hidden p-0">
                <label className="group relative block aspect-[4/3] cursor-pointer bg-[#f2ece8]">
                  <img src={currentUrl} alt={definition.label} className="h-full w-full object-contain transition-opacity group-hover:opacity-75" />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-brand-charcoal/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-brand-charcoal/25 group-hover:opacity-100">Click to replace</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isUploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) { setSelectedFile((current) => ({ ...current, [definition.key]: file.name })); upload(definition.key, file); } event.target.value = ""; }} />
                </label>
                <div className="p-5">
                  <h2 className="font-display text-xl font-semibold text-brand-charcoal">{definition.label}</h2>
                  <p className="mt-1 text-xs leading-5 text-brand-muted">{definition.description}</p>
                  {selectedFile[definition.key] && <p className="mt-3 truncate text-xs text-brand-muted">Selected: {selectedFile[definition.key]}</p>}
                  <label className="admin-button admin-button-primary mt-5 w-full cursor-pointer justify-center">
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {isUploading ? "Saving photo…" : "Replace photo"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isUploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(definition.key, file); event.target.value = ""; }} />
                  </label>
                  {!isUploading && media[definition.key] && <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Ready on the website</p>}
                </div>
              </article>
            );
          })}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 text-sm text-brand-muted">Need to change the image for a brand-new service? Open <a href="/admin/services" className="font-semibold text-brand-rose hover:underline">Services</a> and edit its image URL.</p>
    </>
  );
}
