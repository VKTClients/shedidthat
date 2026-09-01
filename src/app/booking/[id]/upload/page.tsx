"use client";

import { FormEvent, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function UploadProofPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [reference, setReference] = useState(searchParams.get("reference") || "");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || !reference.trim()) return;
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("booking_id", params.id);
      body.append("reference", reference.trim());
      const response = await fetch("/api/upload-pop", { method: "POST", body });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Upload failed.");
      setMessage(data.emailSent === false
        ? "Your proof was received, but the acknowledgement email could not be sent."
        : "Your proof of payment was submitted. We’ll email you once it has been reviewed.");
      setFile(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-16 sm:px-8">
      <p className="text-xs font-medium uppercase tracking-editorial text-brand-rose">SheDidThat Hair Studio</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-brand-charcoal">Submit proof of payment</h1>
      <p className="mt-3 leading-relaxed text-brand-muted">Upload a clear PDF, JPG, or PNG of your deposit payment.</p>
      <form onSubmit={submit} className="glass mt-8 space-y-5 p-6">
        <label className="block text-sm font-medium text-brand-charcoal">
          Booking reference
          <input value={reference} onChange={(event) => setReference(event.target.value)} required className="admin-input mt-2" />
        </label>
        <label className="block text-sm font-medium text-brand-charcoal">
          Proof of payment
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setFile(event.target.files?.[0] || null)} required className="mt-2 block w-full text-sm text-brand-muted" />
        </label>
        {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        <button type="submit" disabled={!file || !reference.trim() || submitting} className="btn-primary w-full">
          {submitting ? "Submitting…" : "Submit proof of payment"}
        </button>
      </form>
    </main>
  );
}
