"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, Check, Eye, EyeOff, ImagePlus, Loader2, Plus, Star, Trash2, X } from "lucide-react";
import { createPackageAction, savePackage } from "@/app/admin/(panel)/packages/actions";
import type { AdvancePayment, Category, DepartureRule, Difficulty, ItineraryDay, PackageImage, PackageStatus, PriceOption } from "@/lib/types";
import { m } from "@/components/ui/motion";
import { Switch } from "@/components/ui/switch";
import { categories } from "@/lib/config/categories";
import { describeDepartures, getDepartures } from "@/lib/utils/departures";
import { difficultyOptions } from "@/lib/utils/filters";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { advanceAmount, describeAdvance } from "@/lib/utils/pricing";
import { adminButton } from "./admin-ui";
import { MediaPickerDialog, type MediaOption } from "./media-picker";
import { cn } from "@/lib/utils";

export interface EditablePackage {
  slug: string;
  title: string;
  tagline: string;
  category: Category;
  region: string;
  durationDays: number;
  nights: number;
  difficulty: Difficulty;
  startingPoint: string;
  endingPoint: string;
  groupSize: string;
  priceOptions: PriceOption[];
  advancePayment: AdvancePayment;
  originalPrice?: number;
  images: PackageImage[];
  description: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  departureRule: DepartureRule;
  featured: boolean;
  status: PackageStatus;
  badge?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const inputClass = "h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10";
const textareaClass = "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10";

function Field({ label, children, className, hint }: { label: string; children: ReactNode; className?: string; hint?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Card({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-sans text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ListEditor({ label, items, onChange, className }: { label: string; items: string[]; onChange: (items: string[]) => void; className?: string }) {
  const [draft, setDraft] = useState("");
  const noun = label.toLowerCase().replace(/s$/, "");
  return (
    <div className={className}>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <input className={inputClass} value={item} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`${label.replace(/s$/, "")} ${i + 1}`} />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-sand-100 hover:text-destructive" aria-label={`Remove ${noun}`}>
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) onChange([...items, draft.trim()]);
          setDraft("");
        }}
        className="mt-2 flex gap-2"
      >
        <input className={inputClass} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Add ${noun}`} aria-label={`New ${noun}`} />
        <button type="submit" className={cn(adminButton.secondary, "h-11 shrink-0")}><Plus className="size-4" /> Add</button>
      </form>
    </div>
  );
}

export function PackageEditor({ initial, isNew, media }: { initial: EditablePackage; isNew: boolean; media: MediaOption[] }) {
  const router = useRouter();
  const [pkg, setPkg] = useState(initial);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savedStatus, setSavedStatus] = useState(initial.status);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const [newDate, setNewDate] = useState("");
  const [newBlackout, setNewBlackout] = useState("");
  const [openDay, setOpenDay] = useState<number | null>(0);

  const set = <K extends keyof EditablePackage>(k: K, v: EditablePackage[K]) => setPkg((p) => ({ ...p, [k]: v }));
  const rule = pkg.departureRule;
  const setRule = (r: DepartureRule) => set("departureRule", r);
  const preview = useMemo(() => getDepartures({ departureRule: rule }, 8), [rule]);
  const departureLabel = useMemo(() => describeDepartures(rule), [rule]);
  const options = pkg.priceOptions;
  const pricedOptions = options.filter((o) => o.price > 0);
  const fromPrice = pricedOptions.length ? Math.min(...pricedOptions.map((o) => o.price)) : 0;
  const discount = pkg.originalPrice && fromPrice && pkg.originalPrice > fromPrice ? Math.round((1 - fromPrice / pkg.originalPrice) * 100) : 0;
  const advance = pkg.advancePayment;
  const setAdvance = (patch: Partial<AdvancePayment>) => set("advancePayment", { ...advance, ...patch });
  const updateOption = (i: number, patch: Partial<PriceOption>) =>
    set("priceOptions", options.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const makeDefault = (i: number) => set("priceOptions", options.map((o, j) => ({ ...o, isDefault: j === i })));
  const removeOption = (i: number) => {
    const rest = options.filter((_, j) => j !== i);
    set("priceOptions", options[i].isDefault ? rest.map((o, j) => ({ ...o, isDefault: j === 0 })) : rest);
  };

  const changeRuleType = (type: DepartureRule["type"]) => {
    if (type === rule.type) return;
    const start = "2026-10-15";
    const end = "2027-03-31";
    if (type === "daily") setRule({ type, startDate: start, endDate: end, blackoutDates: [] });
    if (type === "weekly") setRule({ type, weekdays: [5], startDate: start, endDate: end });
    if (type === "fixed") setRule({ type, dates: preview.map((d) => d.date).slice(0, 4) });
  };

  const updateDay = (i: number, patch: Partial<ItineraryDay>) =>
    set("itinerary", pkg.itinerary.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const moveDay = (i: number, dir: -1 | 1) => {
    const list = [...pkg.itinerary];
    [list[i], list[i + dir]] = [list[i + dir], list[i]];
    set("itinerary", list.map((d, j) => ({ ...d, day: j + 1 })));
    setOpenDay(i + dir);
  };

  const showNotice = (ok: boolean, message: string) => {
    setNotice({ ok, message });
    window.setTimeout(() => setNotice(null), ok ? 2400 : 5000);
  };

  const save = () => {
    startSaving(async () => {
      if (isNew) {
        try {
          const result = await createPackageAction(pkg);
          if (result.ok) router.replace(`/admin/packages/${result.slug}`);
          else showNotice(false, result.error);
        } catch {
          showNotice(false, "Couldn't create — please try again");
        }
        return;
      }
      try {
        const result = await savePackage(initial.slug, pkg);
        if (result.ok) {
          setSavedStatus(pkg.status);
          set("priceOptions", result.priceOptions);
        }
        showNotice(result.ok, result.ok ? "Saved" : result.error);
      } catch {
        showNotice(false, "Couldn't save — please try again");
      }
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link href="/admin/packages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink">
            <ArrowLeft className="size-4" /> Packages
          </Link>
          <h1 className="mt-1 truncate font-display text-2xl font-semibold sm:text-3xl">{isNew ? "New package" : pkg.title || "Untitled package"}</h1>
        </div>
        <div className="flex gap-2">
          {!isNew &&
            (savedStatus === "published" ? (
              <Link href={`/packages/${pkg.slug}`} target="_blank" className={adminButton.secondary}>
                <Eye className="size-4" /> Preview
              </Link>
            ) : (
              <span title="Preview unavailable until published" className={cn(adminButton.secondary, "cursor-not-allowed text-ink/40 hover:bg-white")}>
                <EyeOff className="size-4" /> Not published
              </span>
            ))}
          <button type="button" onClick={save} disabled={saving} className={cn(adminButton.primary, "disabled:opacity-70")}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {saving ? "Saving…" : isNew ? "Create package" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Card title="Basics">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Title" className="sm:col-span-2">
                <input className={inputClass} value={pkg.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Hampta Pass with Chandratal" />
              </Field>
              <Field label="URL slug" hint={`traylborn.com/packages/${pkg.slug || "…"}`}>
                <input
                  className={cn(inputClass, !isNew && "bg-sand-50 text-muted-foreground")}
                  value={pkg.slug}
                  readOnly={!isNew}
                  onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                />
              </Field>
              <Field label="Experience">
                <select className={inputClass} value={pkg.category} onChange={(e) => set("category", e.target.value as Category)}>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Region">
                <input className={inputClass} value={pkg.region} onChange={(e) => set("region", e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card title="Trip details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Tagline" className="sm:col-span-2">
                <input className={inputClass} value={pkg.tagline} onChange={(e) => set("tagline", e.target.value)} />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea rows={5} className={textareaClass} value={pkg.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Days">
                  <input type="number" min={1} className={inputClass} value={pkg.durationDays} onChange={(e) => set("durationDays", Number(e.target.value))} />
                </Field>
                <Field label="Nights">
                  <input type="number" min={0} className={inputClass} value={pkg.nights} onChange={(e) => set("nights", Number(e.target.value))} />
                </Field>
              </div>
              <Field label="Difficulty">
                <select className={inputClass} value={pkg.difficulty} onChange={(e) => set("difficulty", e.target.value as Difficulty)}>
                  {difficultyOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Starting point">
                <input className={inputClass} value={pkg.startingPoint} onChange={(e) => set("startingPoint", e.target.value)} placeholder="e.g. Manali" />
              </Field>
              <Field label="Ending point">
                <input className={inputClass} value={pkg.endingPoint} onChange={(e) => set("endingPoint", e.target.value)} placeholder="e.g. Manali" />
              </Field>
              <Field label="Group size" className="sm:col-span-2" hint="Shown on the package page, e.g. 8–25 trekkers">
                <input className={inputClass} value={pkg.groupSize} onChange={(e) => set("groupSize", e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card
            title="Pricing"
            description="Prices are per traveller. Customers pick one option for their whole booking."
            action={
              <button
                type="button"
                onClick={() => set("priceOptions", [...options, { label: "", price: 0, isDefault: options.length === 0 }])}
                className={adminButton.secondary}
              >
                <Plus className="size-4" /> Add option
              </button>
            }
          >
            <div role="radiogroup" aria-label="Default price option" className="space-y-2">
              <div className="hidden grid-cols-[4.5rem_minmax(0,1fr)_9rem_2.75rem] gap-2 px-1 text-xs font-semibold text-muted-foreground sm:grid">
                <span>Default</span><span>Option name</span><span>Price (₹)</span><span />
              </div>
              {options.map((o, i) => (
                <div key={o.id ?? `new-${i}`} className="grid grid-cols-[auto_minmax(0,1fr)_2.75rem] items-center gap-2 rounded-xl border border-border p-2 sm:grid-cols-[4.5rem_minmax(0,1fr)_9rem_2.75rem] sm:border-0 sm:p-0">
                  <label className="flex items-center gap-2 px-1 text-xs font-medium sm:justify-center">
                    <input type="radio" name="default-price-option" checked={o.isDefault} onChange={() => makeDefault(i)} className="size-4 accent-pine-700" />
                    <span className="sm:sr-only">Default</span>
                  </label>
                  <input
                    className={cn(inputClass, "col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto")}
                    value={o.label}
                    onChange={(e) => updateOption(i, { label: e.target.value })}
                    placeholder={options.length > 1 ? "e.g. From Dehradun, Double sharing" : "e.g. Standard"}
                    aria-label={`Price option ${i + 1} name`}
                  />
                  <input
                    type="number"
                    min={1}
                    className={cn(inputClass, "col-span-2 row-start-3 sm:col-span-1 sm:row-start-auto")}
                    value={o.price || ""}
                    onChange={(e) => updateOption(i, { price: Number(e.target.value) })}
                    aria-label={`Price option ${i + 1} price`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    disabled={options.length === 1}
                    className="col-start-3 row-start-1 grid size-11 place-items-center rounded-xl text-muted-foreground hover:bg-sand-100 hover:text-destructive disabled:opacity-30 sm:col-start-auto sm:row-start-auto"
                    aria-label={`Remove price option ${i + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {options.length === 0 && <p className="text-sm text-destructive">Add at least one price option.</p>}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Original price (₹)" hint="Optional — shown struck-through next to the lowest option price">
                <input type="number" min={0} className={inputClass} value={pkg.originalPrice ?? ""} onChange={(e) => set("originalPrice", e.target.value ? Number(e.target.value) : undefined)} />
              </Field>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <div className="flex items-center justify-between gap-4">
                <span>
                  <span className="block text-sm font-medium" id="advance-label">Advance payment</span>
                  <span className="block text-xs text-muted-foreground">Let customers pay part now and the balance later.</span>
                </span>
                <Switch checked={advance.enabled} onCheckedChange={(v) => setAdvance({ enabled: v })} aria-labelledby="advance-label" />
              </div>
              {advance.enabled && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div role="radiogroup" aria-label="Advance type" className="grid grid-cols-2 gap-1 self-end rounded-xl bg-sand-100 p-1">
                    {([
                      { id: "percent", label: "Percentage" },
                      { id: "fixed", label: "Fixed per traveller" },
                    ] as const).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={advance.type === t.id}
                        onClick={() => advance.type !== t.id && setAdvance({ type: t.id, value: 0 })}
                        className={cn("h-9 rounded-lg text-xs font-semibold transition-colors sm:text-sm", advance.type === t.id ? "bg-white shadow-sm" : "text-ink/60 hover:text-ink")}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <Field
                    label={advance.type === "percent" ? "Advance (% of total)" : "Advance per traveller (₹)"}
                    hint={advance.type === "percent" ? "1–99" : "Must be less than the lowest option price"}
                  >
                    <input
                      type="number"
                      min={1}
                      max={advance.type === "percent" ? 99 : undefined}
                      className={inputClass}
                      value={advance.value || ""}
                      onChange={(e) => setAdvance({ value: Number(e.target.value) })}
                    />
                  </Field>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-xl bg-sand-50 p-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Customer sees</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {options.length > 1 && <span className="mr-1 font-sans text-sm font-normal text-muted-foreground">From</span>}
                {formatPrice(fromPrice)}
                <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">/person</span>
              </p>
              {discount > 0 && <p className="text-xs font-semibold text-moss-600">{discount}% off {formatPrice(pkg.originalPrice!)}</p>}
              {pricedOptions.length > 0 && (
                <table className="mt-3 w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr><th className="py-1 font-medium">Option</th><th className="py-1 text-right font-medium">Per traveller</th>{advance.enabled && <th className="py-1 text-right font-medium">Advance per traveller</th>}</tr>
                  </thead>
                  <tbody>
                    {pricedOptions.map((o, i) => {
                      const due = advanceAmount(advance, o, 1);
                      return (
                        <tr key={o.id ?? `p-${i}`} className="border-t border-border">
                          <td className="py-1.5">{o.label || <span className="text-muted-foreground">Unnamed</span>}{o.isDefault && <span className="ml-1.5 text-xs text-muted-foreground">(default)</span>}</td>
                          <td className="py-1.5 text-right font-medium">{formatPrice(o.price)}</td>
                          {advance.enabled && (
                            <td className={cn("py-1.5 text-right", due === null && "text-destructive")}>{due === null ? "Not available" : formatPrice(due)}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {advance.enabled && describeAdvance(advance) && (
                <p className="mt-2 text-xs text-muted-foreground">Advance: {describeAdvance(advance)}. The customer chooses full payment or the advance.</p>
              )}
            </div>
          </Card>

          <Card title="Images" description="The first image is the cover on cards and the hero.">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {pkg.images.map((img, i) => (
                <li key={img.src + i} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-sand-100">
                  <Image src={img.src} alt={img.alt} fill sizes="200px" className="object-cover" />
                  {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-ember-500 px-2 py-0.5 text-[0.65rem] font-bold text-ink">COVER</span>}
                  <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                    {i > 0 && (
                      <button type="button" onClick={() => set("images", [img, ...pkg.images.filter((_, j) => j !== i)])} className="grid size-8 place-items-center rounded-lg bg-white/95 text-ink" aria-label="Set as cover">
                        <Star className="size-3.5" />
                      </button>
                    )}
                    <button type="button" onClick={() => set("images", pkg.images.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-lg bg-white/95 text-destructive" aria-label="Remove image">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-pine-400 hover:text-pine-700"
                >
                  <ImagePlus className="size-5" /> Add image
                </button>
              </li>
            </ul>
            <MediaPickerDialog
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              media={media}
              type="image"
              exclude={pkg.images.map((i) => i.src)}
              onPick={(item) => set("images", [...pkg.images, { src: item.src, alt: item.alt || pkg.title }])}
            />
          </Card>

          <Card title="Highlights">
            <ListEditor label="Highlights" items={pkg.highlights} onChange={(v) => set("highlights", v)} />
          </Card>

          <Card title="Inclusions & exclusions">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ListEditor label="Inclusions" items={pkg.inclusions} onChange={(v) => set("inclusions", v)} />
              <ListEditor label="Exclusions" items={pkg.exclusions} onChange={(v) => set("exclusions", v)} />
            </div>
          </Card>

          <Card
            title="Itinerary"
            description={`${pkg.itinerary.length} days`}
            action={
              <button
                type="button"
                onClick={() => {
                  set("itinerary", [...pkg.itinerary, { day: pkg.itinerary.length + 1, title: "", description: "" }]);
                  setOpenDay(pkg.itinerary.length);
                }}
                className={adminButton.secondary}
              >
                <Plus className="size-4" /> Add day
              </button>
            }
          >
            <ol className="space-y-2">
              {pkg.itinerary.map((d, i) => (
                <li key={i} className="rounded-xl border border-border">
                  <div className="flex items-center gap-2 p-2 pl-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-pine-50 text-xs font-bold text-pine-800">D{i + 1}</span>
                    <button type="button" onClick={() => setOpenDay(openDay === i ? null : i)} aria-expanded={openDay === i} className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                      {d.title || <span className="text-muted-foreground">Untitled day</span>}
                    </button>
                    <button type="button" disabled={i === 0} onClick={() => moveDay(i, -1)} className="grid size-8 place-items-center rounded-lg hover:bg-sand-100 disabled:opacity-25" aria-label="Move day up"><ArrowUp className="size-4" /></button>
                    <button type="button" disabled={i === pkg.itinerary.length - 1} onClick={() => moveDay(i, 1)} className="grid size-8 place-items-center rounded-lg hover:bg-sand-100 disabled:opacity-25" aria-label="Move day down"><ArrowDown className="size-4" /></button>
                    <button type="button" onClick={() => set("itinerary", pkg.itinerary.filter((_, j) => j !== i).map((x, j) => ({ ...x, day: j + 1 })))} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-sand-100 hover:text-destructive" aria-label="Remove day"><Trash2 className="size-4" /></button>
                  </div>
                  {openDay === i && (
                    <div className="grid grid-cols-1 gap-3 border-t border-border p-3 sm:grid-cols-3">
                      <Field label="Title" className="sm:col-span-3">
                        <input className={inputClass} value={d.title} onChange={(e) => updateDay(i, { title: e.target.value })} />
                      </Field>
                      <Field label="Description" className="sm:col-span-3">
                        <textarea rows={3} className={textareaClass} value={d.description} onChange={(e) => updateDay(i, { description: e.target.value })} />
                      </Field>
                      <Field label="Altitude"><input className={inputClass} value={d.altitude ?? ""} onChange={(e) => updateDay(i, { altitude: e.target.value })} /></Field>
                      <Field label="Distance"><input className={inputClass} value={d.distance ?? ""} onChange={(e) => updateDay(i, { distance: e.target.value })} /></Field>
                      <Field label="Stay"><input className={inputClass} value={d.stay ?? ""} onChange={(e) => updateDay(i, { stay: e.target.value })} /></Field>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Departure rules" description="Controls which dates customers can book. Past and out-of-rule dates are blocked automatically.">
            <div role="radiogroup" aria-label="Rule type" className="grid grid-cols-3 gap-1 rounded-xl bg-sand-100 p-1">
              {([
                { id: "daily", label: "Every day" },
                { id: "weekly", label: "Weekly" },
                { id: "fixed", label: "Fixed dates" },
              ] as const).map((o) => (
                <button key={o.id} type="button" role="radio" aria-checked={rule.type === o.id} onClick={() => changeRuleType(o.id)} className={cn("h-10 rounded-lg text-sm font-semibold transition-colors", rule.type === o.id ? "bg-white shadow-sm" : "text-ink/60 hover:text-ink")}>
                  {o.label}
                </button>
              ))}
            </div>

            <div className="mt-5">
              {rule.type !== "fixed" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="From"><input type="date" className={inputClass} value={rule.startDate} onChange={(e) => setRule({ ...rule, startDate: e.target.value })} /></Field>
                  <Field label="Until"><input type="date" className={inputClass} value={rule.endDate} min={rule.startDate} onChange={(e) => setRule({ ...rule, endDate: e.target.value })} /></Field>
                </div>
              )}

              {rule.type === "weekly" && (
                <fieldset className="mt-4">
                  <legend className="mb-2 text-sm font-medium">Departs on</legend>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((w, i) => {
                      const on = rule.weekdays.includes(i);
                      return (
                        <button
                          key={w}
                          type="button"
                          aria-pressed={on}
                          onClick={() => {
                            const next = on ? rule.weekdays.filter((x) => x !== i) : [...rule.weekdays, i].sort();
                            if (next.length) setRule({ ...rule, weekdays: next });
                          }}
                          className={cn("h-10 w-14 rounded-xl text-sm font-semibold", on ? "bg-pine-800 text-white" : "border border-border hover:border-pine-300")}
                        >
                          {w}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {(rule.type === "daily" || rule.type === "fixed") && (
                <div className={rule.type === "daily" ? "mt-4" : ""}>
                  <p className="mb-2 text-sm font-medium">{rule.type === "daily" ? "Blackout dates" : "Departure dates"}</p>
                  <div className="flex flex-wrap gap-2">
                    {(rule.type === "daily" ? rule.blackoutDates ?? [] : rule.dates).map((d) => (
                      <span key={d} className="inline-flex h-8 items-center gap-1 rounded-full bg-sand-100 pr-1 pl-3 text-xs font-semibold">
                        {formatDate(d)}
                        <button
                          type="button"
                          aria-label={`Remove ${formatDate(d)}`}
                          onClick={() =>
                            rule.type === "daily"
                              ? setRule({ ...rule, blackoutDates: (rule.blackoutDates ?? []).filter((x) => x !== d) })
                              : setRule({ ...rule, dates: rule.dates.filter((x) => x !== d) })
                          }
                          className="grid size-6 place-items-center rounded-full hover:bg-white"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="date"
                      className={cn(inputClass, "sm:w-52")}
                      value={rule.type === "daily" ? newBlackout : newDate}
                      onChange={(e) => (rule.type === "daily" ? setNewBlackout(e.target.value) : setNewDate(e.target.value))}
                      aria-label={rule.type === "daily" ? "New blackout date" : "New departure date"}
                    />
                    <button
                      type="button"
                      className={cn(adminButton.secondary, "h-11 shrink-0")}
                      onClick={() => {
                        if (rule.type === "daily" && newBlackout) {
                          setRule({ ...rule, blackoutDates: Array.from(new Set([...(rule.blackoutDates ?? []), newBlackout])).sort() });
                          setNewBlackout("");
                        } else if (rule.type === "fixed" && newDate) {
                          setRule({ ...rule, dates: Array.from(new Set([...rule.dates, newDate])).sort() });
                          setNewDate("");
                        }
                      }}
                    >
                      <Plus className="size-4" /> Add
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-xl bg-pine-50 p-4">
                <p className="text-xs font-semibold tracking-wider text-pine-700 uppercase">Shown to customers</p>
                <p className="mt-1 text-sm font-medium text-ink">{departureLabel}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Written automatically from the rule above.</p>
                <p className="mt-4 text-xs font-semibold tracking-wider text-pine-700 uppercase">Next bookable dates</p>
                {preview.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {preview.map((d) => (
                      <li key={d.date} className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium">
                        {formatDate(d.date, { weekday: "short" })}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-destructive">No upcoming dates — customers won&apos;t be able to book.</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <h2 className="font-sans text-base font-semibold">Visibility</h2>
            <Field label="Status" className="mt-4">
              <select className={inputClass} value={pkg.status} onChange={(e) => set("status", e.target.value as PackageStatus)}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-sand-50 p-3.5">
              <span>
                <span className="block text-sm font-medium" id="featured-label">Featured on homepage</span>
                <span className="block text-xs text-muted-foreground">Shows in “Featured journeys”</span>
              </span>
              <Switch checked={pkg.featured} onCheckedChange={(v) => set("featured", v)} aria-labelledby="featured-label" />
            </div>
            <Field label="Badge" className="mt-4" hint="e.g. Bestseller, New">
              <input className={inputClass} value={pkg.badge ?? ""} onChange={(e) => set("badge", e.target.value || undefined)} />
            </Field>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
            <p className="px-5 pt-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Card preview</p>
            <div className="p-4">
              <div className="overflow-hidden rounded-xl ring-1 ring-black/5">
                <div className="relative aspect-[4/3] bg-sand-100">
                  {pkg.images[0] && <Image src={pkg.images[0].src} alt="" fill sizes="300px" className="object-cover" />}
                  {pkg.badge && <span className="absolute top-2 right-2 rounded-full bg-ember-500 px-2 py-0.5 text-[0.65rem] font-bold text-ink">{pkg.badge}</span>}
                </div>
                <div className="p-3">
                  <p className="truncate font-display font-semibold">{pkg.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">{pkg.durationDays}D/{pkg.nights}N · {departureLabel}</p>
                  <p className="mt-1 font-semibold">{options.length > 1 && <span className="text-xs font-normal text-muted-foreground">From </span>}{formatPrice(fromPrice)}<span className="text-xs font-normal text-muted-foreground"> /person</span></p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <AnimatePresence>
        {notice && (
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role={notice.ok ? "status" : "alert"}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-2xl"
          >
            {notice.ok ? <Check className="size-4 text-moss-400" /> : <AlertCircle className="size-4 text-red-400" />} {notice.message}
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
