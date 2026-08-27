"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { GALLERY_DEFINITIONS, type GalleryKey } from "@/lib/gallery";

type GalleryImage = { id: string; gallery_key: GalleryKey; image_url: string; alt_text: string };

export function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<GalleryKey | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      const response = await adminFetch("/api/admin/gallery");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load galleries");
      setImages(result.images || []);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load galleries"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const upload = async (galleryKey: GalleryKey, file: File) => {
    setUploading(galleryKey); setError(""); setNotice("");
    try {
      const formData = new FormData(); formData.append("gallery_key", galleryKey); formData.append("file", file);
      const response = await adminFetch("/api/admin/gallery", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not upload image");
      setImages((current) => [...current, result.image]);
      setNotice(`${galleryKey === "reviews" ? "Review" : "Client Cam"} image added.`);
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Could not upload image"); }
    finally { setUploading(null); }
  };

  const remove = async (image: GalleryImage) => {
    if (!window.confirm("Remove this image from the website?")) return;
    setError("");
    const response = await adminFetch(`/api/admin/gallery?id=${image.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not remove image"); return; }
    setImages((current) => current.filter((item) => item.id !== image.id));
    setNotice("Image removed from the website.");
  };

  return <section className="mb-12">
    <div className="mb-4"><p className="admin-kicker">Client galleries</p><h2 className="font-display text-2xl font-semibold text-brand-charcoal">Reviews &amp; Client Cam</h2><p className="mt-1 text-sm text-brand-muted">Add client photos or review screenshots. They appear automatically on the matching page.</p></div>
    {error && <div className="admin-error mb-4">{error}</div>}
    {notice && <div className="mb-4 flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
    {loading ? <div className="admin-empty"><Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-rose" /><p className="mt-3 text-sm text-brand-muted">Loading galleries</p></div> : <div className="grid gap-5 lg:grid-cols-2">{GALLERY_DEFINITIONS.map((gallery) => { const galleryImages = images.filter((image) => image.gallery_key === gallery.key); const isUploading = uploading === gallery.key; return <article key={gallery.key} className="admin-booking-card p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-xl font-semibold text-brand-charcoal">{gallery.label}</h3><p className="mt-1 text-xs text-brand-muted">{gallery.description}</p></div><span className="admin-badge bg-brand-rose/10 text-brand-rose">{galleryImages.length} image{galleryImages.length === 1 ? "" : "s"}</span></div><label className="admin-button admin-button-primary mt-5 w-full cursor-pointer justify-center"><ImagePlus className="h-4 w-4" />{isUploading ? "Uploading…" : `Add to ${gallery.label}`}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isUploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(gallery.key, file); event.target.value = ""; }} /></label>{galleryImages.length > 0 ? <div className="mt-5 grid grid-cols-3 gap-2">{galleryImages.map((image) => <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl bg-[#f2ece8]"><img src={image.image_url} alt={image.alt_text} className="h-full w-full object-cover" /><button type="button" onClick={() => remove(image)} className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-red-600 opacity-0 shadow transition group-hover:opacity-100 focus:opacity-100" aria-label="Remove image"><Trash2 className="h-4 w-4" /></button></div>)}</div> : <p className="mt-5 rounded-xl border border-dashed border-[#d8d3cd] bg-[#fbfaf8] px-4 py-6 text-center text-xs text-brand-muted">No images yet. Add the first one above.</p>}</article>; })}</div>}
  </section>;
}

