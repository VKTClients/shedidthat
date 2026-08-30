"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Save,
  Scissors,
  Trash2,
  X,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { DepositType, HairOption, Service } from "@/lib/types/database";
import { adminFetch } from "@/lib/admin-fetch";

interface ServiceForm {
  name: string;
  description: string;
  duration_minutes: string;
  full_price: string;
  deposit_type: DepositType;
  deposit_value: string;
  has_hair_options: boolean;
  image_url: string;
}

interface VariantForm {
  id?: string;
  name: string;
  price_delta: string;
}

interface EditorState {
  mode: "create" | "edit";
  serviceId?: string;
  form: ServiceForm;
  variants: VariantForm[];
  deletedVariantIds: string[];
}

const emptyServiceForm: ServiceForm = {
  name: "",
  description: "",
  duration_minutes: "180",
  full_price: "",
  deposit_type: "FIXED",
  deposit_value: "175",
  has_hair_options: false,
  image_url: "",
};

const serviceToForm = (service: Service): ServiceForm => ({
  name: service.name,
  description: service.description,
  duration_minutes: String(service.duration_minutes),
  full_price: String(service.full_price),
  deposit_type: service.deposit_type,
  deposit_value: String(service.deposit_value),
  has_hair_options: service.has_hair_options,
  image_url: service.image_url || "",
});

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [hairOptions, setHairOptions] = useState<Record<string, HairOption[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [servicesResponse, optionsResponse] = await Promise.all([
        adminFetch("/api/admin/services"),
        adminFetch("/api/admin/hair-options"),
      ]);
      const servicesData = await servicesResponse.json();
      const optionsData = await optionsResponse.json();
      if (!servicesResponse.ok) throw new Error(servicesData.error || "Unable to load hairstyles");
      if (!optionsResponse.ok) throw new Error(optionsData.error || "Unable to load variants");

      const grouped: Record<string, HairOption[]> = {};
      for (const option of optionsData.hairOptions || []) {
        if (!grouped[option.service_id]) grouped[option.service_id] = [];
        grouped[option.service_id].push(option);
      }
      setServices(servicesData.services || []);
      setHairOptions(grouped);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load hairstyles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateEditor = () => {
    setNotice("");
    setError("");
    setEditor({ mode: "create", form: { ...emptyServiceForm }, variants: [], deletedVariantIds: [] });
  };

  const openEditEditor = (service: Service) => {
    setNotice("");
    setError("");
    setEditor({
      mode: "edit",
      serviceId: service.id,
      form: serviceToForm(service),
      variants: (hairOptions[service.id] || []).map((option) => ({
        id: option.id,
        name: option.name,
        price_delta: String(option.price_delta),
      })),
      deletedVariantIds: [],
    });
  };

  const updateForm = <K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) => {
    setEditor((current) => current ? { ...current, form: { ...current.form, [key]: value } } : current);
  };

  const addVariant = () => {
    setEditor((current) => current ? {
      ...current,
      form: { ...current.form, has_hair_options: true },
      variants: [...current.variants, { name: "", price_delta: "0" }],
    } : current);
  };

  const updateVariant = (index: number, key: "name" | "price_delta", value: string) => {
    setEditor((current) => {
      if (!current) return current;
      const variants = [...current.variants];
      variants[index] = { ...variants[index], [key]: value };
      return { ...current, variants };
    });
  };

  const removeVariant = (index: number) => {
    setEditor((current) => {
      if (!current) return current;
      const removed = current.variants[index];
      const variants = current.variants.filter((_, variantIndex) => variantIndex !== index);
      return {
        ...current,
        variants,
        form: { ...current.form, has_hair_options: variants.length > 0 ? true : current.form.has_hair_options },
        deletedVariantIds: removed.id ? [...current.deletedVariantIds, removed.id] : current.deletedVariantIds,
      };
    });
  };

  const validationError = useMemo(() => {
    if (!editor) return "";
    const price = Number(editor.form.full_price);
    const duration = Number(editor.form.duration_minutes);
    const deposit = Number(editor.form.deposit_value);
    if (!editor.form.name.trim()) return "Add a hairstyle name.";
    if (!Number.isFinite(price) || price < 0) return "Enter a valid base price.";
    if (!Number.isFinite(duration) || duration <= 0) return "Duration must be greater than zero.";
    if (!Number.isFinite(deposit) || deposit < 0) return "Enter a valid deposit value.";
    if (editor.form.deposit_type === "PERCENTAGE" && deposit > 100) return "Percentage deposits cannot exceed 100%.";
    if (editor.form.has_hair_options && editor.variants.some((variant) => !variant.name.trim())) return "Every variant needs a name.";
    if (editor.variants.some((variant) => !Number.isFinite(Number(variant.price_delta)))) return "Every variant needs a valid price adjustment.";
    const variantNames = editor.variants.map((variant) => variant.name.trim().toLowerCase()).filter(Boolean);
    if (new Set(variantNames).size !== variantNames.length) return "Variant names must be unique for this hairstyle.";
    return "";
  }, [editor]);

  const saveEditor = async () => {
    if (!editor || validationError) return;
    setSaving(true);
    setError("");
    try {
      const servicePayload = {
        ...editor.form,
        has_hair_options: editor.form.has_hair_options && editor.variants.length > 0,
        image_url: editor.form.image_url.trim() || null,
      };

      const serviceResponse = await adminFetch("/api/admin/services", {
        method: editor.mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editor.mode === "create" ? servicePayload : { id: editor.serviceId, ...servicePayload }),
      });
      const serviceData = await serviceResponse.json();
      if (!serviceResponse.ok) throw new Error(serviceData.error || "Unable to save hairstyle");
      const serviceId = editor.mode === "create" ? serviceData.service.id : editor.serviceId;

      const variantRequests = editor.variants.map((variant) => adminFetch("/api/admin/hair-options", {
        method: variant.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variant.id
          ? { id: variant.id, name: variant.name.trim(), price_delta: variant.price_delta }
          : { service_id: serviceId, name: variant.name.trim(), price_delta: variant.price_delta }),
      }));
      const deleteRequests = editor.deletedVariantIds.map((id) => adminFetch(`/api/admin/hair-options?id=${id}`, { method: "DELETE" }));
      const responses = await Promise.all([...variantRequests, ...deleteRequests]);
      const failedResponse = responses.find((response) => !response.ok);
      if (failedResponse) {
        const failedData = await failedResponse.json();
        throw new Error(failedData.error || "The hairstyle saved, but a variant could not be updated");
      }

      setEditor(null);
      setNotice(editor.mode === "create" ? "Hairstyle added successfully." : "Hairstyle updated successfully.");
      await fetchData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save hairstyle");
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (service: Service) => {
    if (!window.confirm(`Delete ${service.name} and all of its variants?`)) return;
    setError("");
    try {
      const response = await adminFetch(`/api/admin/services?id=${service.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete hairstyle");
      setNotice("Hairstyle deleted.");
      await fetchData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete hairstyle");
    }
  };

  if (loading) {
    return <div className="admin-empty"><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-rose" /><p className="mt-4 text-sm text-brand-muted">Loading hairstyles</p></div>;
  }

  return (
    <section>
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Service catalogue</p>
          <h1 className="admin-page-title">Hairstyles</h1>
          <p className="admin-page-subtitle">Update the base price for each hairstyle, then manage its duration, description, and client-selectable variants. Price changes appear in the booking flow.</p>
        </div>
        <button onClick={openCreateEditor} className="admin-button admin-button-primary"><Plus className="h-4 w-4" /> Add hairstyle</button>
      </header>

      {notice && <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check className="h-4 w-4" /> {notice}</div>}
      {error && <div className="admin-error mb-5">{error}</div>}

      {services.length === 0 ? (
        <div className="admin-empty"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-rose/10 text-brand-rose"><Scissors className="h-5 w-5" /></div><h2 className="mt-5 font-display text-2xl font-semibold text-brand-charcoal">Build your hairstyle menu</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-muted">Add the first hairstyle, then create variants for length, size, colour, hair supply, or any other client choice.</p><button onClick={openCreateEditor} className="admin-button admin-button-primary mt-6"><Plus className="h-4 w-4" /> Add first hairstyle</button></div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => {
            const variants = hairOptions[service.id] || [];
            const expanded = expandedId === service.id;
            return (
              <article key={service.id} className="admin-booking-card overflow-hidden p-0">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <button onClick={() => setExpandedId(expanded ? null : service.id)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e4e0da] bg-[#f7f5f2]">
                      {service.image_url ? <img src={service.image_url} alt="" className="h-full w-full object-cover" /> : <Scissors className="h-5 w-5 text-brand-rose" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-display text-xl font-semibold tracking-[-0.025em] text-brand-charcoal">{service.name}</h2>{variants.length > 0 && <span className="admin-badge bg-brand-rose/10 text-brand-rose">{variants.length} variant{variants.length === 1 ? "" : "s"}</span>}</div>
                      <p className="mt-1 line-clamp-1 text-sm text-brand-muted">{service.description || "No description yet"}</p>
                      <p className="mt-2 text-xs text-brand-muted">{service.duration_minutes} min · {service.deposit_type === "PERCENTAGE" ? `${service.deposit_value}% deposit` : `${formatCurrency(service.deposit_value)} deposit`}</p>
                    </div>
                    {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-brand-muted" /> : <ChevronRight className="h-4 w-4 shrink-0 text-brand-muted" />}
                  </button>
                  <div className="flex items-center justify-between gap-3 border-t border-[#eeeae5] pt-4 sm:justify-end sm:border-0 sm:pt-0">
                    <span className="mr-2 font-display text-2xl font-semibold tracking-[-0.03em] text-brand-rose">{formatCurrency(service.full_price)}</span>
                    <button onClick={() => openEditEditor(service)} className="admin-button admin-button-quiet admin-button-compact"><Pencil className="h-4 w-4" /> Edit</button>
                    <button onClick={() => deleteService(service)} className="admin-icon-button text-red-600 hover:bg-red-50" aria-label={`Delete ${service.name}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {expanded && (
                  <div className="border-t border-[#eeeae5] bg-[#fbfaf8] px-5 py-4">
                    {variants.length === 0 ? <p className="text-sm text-brand-muted">No variants. Edit this hairstyle to add length, size, colour, or hair-supply options.</p> : <div className="grid gap-2 sm:grid-cols-2">{variants.map((variant) => <div key={variant.id} className="flex items-center justify-between rounded-xl border border-[#e4e0da] bg-white px-4 py-3"><span className="text-sm font-medium text-brand-charcoal">{variant.name}</span><span className="text-xs font-semibold text-brand-rose">{variant.price_delta === 0 ? "Base price" : `${variant.price_delta > 0 ? "+" : ""}${formatCurrency(variant.price_delta)}`}</span></div>)}</div>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {editor && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="hairstyle-editor-title">
          <div className="admin-modal max-w-4xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="admin-kicker">{editor.mode === "create" ? "New catalogue item" : "Catalogue editor"}</p><h2 id="hairstyle-editor-title" className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-brand-charcoal">{editor.mode === "create" ? "Add hairstyle" : `Edit ${editor.form.name}`}</h2></div>
              <button onClick={() => setEditor(null)} className="admin-icon-button" aria-label="Close hairstyle editor"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-5">
                <div><label className="admin-label" htmlFor="service-name">Hairstyle name</label><input id="service-name" className="admin-input" value={editor.form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Crochet Curls" /></div>
                <div><label className="admin-label" htmlFor="service-description">Description</label><textarea id="service-description" className="admin-input min-h-24 resize-y" value={editor.form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Describe the finish, what is included, and anything clients should know." /></div>
                <div className="grid gap-4 sm:grid-cols-2"><div><label className="admin-label" htmlFor="service-price">Base price (ZAR)</label><input id="service-price" type="number" min="0" step="1" className="admin-input" value={editor.form.full_price} onChange={(event) => updateForm("full_price", event.target.value)} /></div><div><label className="admin-label" htmlFor="service-duration">Duration (minutes)</label><input id="service-duration" type="number" min="1" step="15" className="admin-input" value={editor.form.duration_minutes} onChange={(event) => updateForm("duration_minutes", event.target.value)} /></div></div>
                <div className="admin-info-card"><p className="admin-label">Booking deposit</p><p className="mt-1 font-medium text-brand-charcoal">R175 fixed deposit</p><p className="admin-copy mt-1 text-xs">This forms part of the customer&apos;s total price.</p></div>
                <div><label className="admin-label" htmlFor="service-image">Image URL</label><div className="relative"><ImageIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" /><input id="service-image" type="url" className="admin-input pl-11" value={editor.form.image_url} onChange={(event) => updateForm("image_url", event.target.value)} placeholder="https://.../hairstyle.jpg" /></div><p className="mt-2 text-xs leading-5 text-brand-muted">Use a public Supabase Storage URL or another secure image URL.</p></div>
              </div>

              <aside className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-[#e4e0da] bg-[#f7f5f2]">
                  <div className="aspect-[4/3] flex items-center justify-center overflow-hidden bg-[#eeebe7]">{editor.form.image_url ? <img src={editor.form.image_url} alt="Hairstyle preview" className="h-full w-full object-cover" /> : <div className="text-center text-brand-muted"><ImageIcon className="mx-auto h-6 w-6" /><p className="mt-2 text-xs">Image preview</p></div>}</div>
                  <div className="p-4"><p className="font-display text-lg font-semibold text-brand-charcoal">{editor.form.name || "Hairstyle name"}</p><p className="mt-1 text-xs text-brand-muted">{editor.form.duration_minutes || "0"} min</p><p className="mt-3 font-display text-xl font-semibold text-brand-rose">{Number.isFinite(Number(editor.form.full_price)) ? formatCurrency(Number(editor.form.full_price || 0)) : "R0"}</p></div>
                </div>
              </aside>
            </div>

            <div className="mt-8 border-t border-[#eeeae5] pt-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-display text-2xl font-semibold tracking-[-0.03em] text-brand-charcoal">Variants</h3><p className="mt-1 text-sm text-brand-muted">Add choices such as shoulder length, waist length, small, medium, colour, or salon-supplied hair.</p></div><button onClick={addVariant} className="admin-button admin-button-quiet"><Plus className="h-4 w-4" /> Add variant</button></div>
              {editor.variants.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-[#d8d3cd] bg-[#fbfaf8] p-6 text-center text-sm text-brand-muted">This hairstyle currently has one standard option at the base price.</div> : <div className="mt-5 space-y-3">{editor.variants.map((variant, index) => <div key={variant.id || `new-${index}`} className="grid gap-3 rounded-2xl border border-[#e4e0da] bg-[#fbfaf8] p-4 sm:grid-cols-[minmax(0,1fr)_180px_40px] sm:items-end"><div><label className="admin-label" htmlFor={`variant-name-${index}`}>Variant name</label><input id={`variant-name-${index}`} className="admin-input" value={variant.name} onChange={(event) => updateVariant(index, "name", event.target.value)} placeholder="Waist length" /></div><div><label className="admin-label" htmlFor={`variant-price-${index}`}>Price adjustment</label><input id={`variant-price-${index}`} type="number" step="1" className="admin-input" value={variant.price_delta} onChange={(event) => updateVariant(index, "price_delta", event.target.value)} /><p className="mt-1.5 text-[10px] text-brand-muted">Final: {formatCurrency(Number(editor.form.full_price || 0) + Number(variant.price_delta || 0))}</p></div><button onClick={() => removeVariant(index)} className="admin-icon-button mb-4 text-red-600 hover:bg-red-50" aria-label={`Remove ${variant.name || "variant"}`}><Trash2 className="h-4 w-4" /></button></div>)}</div>}
            </div>

            {validationError && <p className="admin-error mt-6">{validationError}</p>}
            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#eeeae5] pt-6 sm:flex-row sm:justify-end"><button onClick={() => setEditor(null)} className="admin-button admin-button-quiet">Cancel</button><button onClick={saveEditor} disabled={saving || Boolean(validationError)} className="admin-button admin-button-primary min-w-36">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> {editor.mode === "create" ? "Add hairstyle" : "Save changes"}</>}</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
