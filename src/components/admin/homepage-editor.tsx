"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, Check, Eye, GripVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { adminButton } from "./admin-ui";
import { cn } from "@/lib/utils";

const initialSections = [
  { id: "hero", label: "Hero & search", locked: true },
  { id: "trust", label: "Trust bar" },
  { id: "featured", label: "Featured journeys" },
  { id: "categories", label: "Explore by experience" },
  { id: "editorial", label: "Editorial feature" },
  { id: "offer", label: "Seasonal offer" },
  { id: "why", label: "Why Traylborn" },
  { id: "reviews", label: "Reviews" },
  { id: "gallery", label: "Gallery" },
  { id: "cta", label: "Final call to action", locked: true },
];

const heroImages = ["/images/hero/himalaya-sunrise.jpg", "/images/hero/above-the-clouds.jpg", "/images/treks/summit-sunrise.jpg"];
const inputClass = "h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10";

export function HomepageEditor() {
  const [sections, setSections] = useState(initialSections.map((s) => ({ ...s, visible: true })));
  const [headline, setHeadline] = useState("Go further. Come back with stories.");
  const [sub, setSub] = useState("Small-group Himalayan treks, road trips and retreats — led by people who've walked every trail.");
  const [hero, setHero] = useState(heroImages[0]);
  const [saved, setSaved] = useState(false);

  const move = (i: number, dir: -1 | 1) =>
    setSections((s) => {
      const next = [...s];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Homepage</h1>
          <p className="mt-1 text-sm text-muted-foreground">Edit the hero and choose which sections appear, in what order.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank" className={adminButton.secondary}><Eye className="size-4" /> Preview</Link>
          <button type="button" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2000); }} className={adminButton.primary}>
            <Check className="size-4" /> {saved ? "Saved (demo)" : "Publish changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6">
          <h2 className="font-sans text-base font-semibold">Hero</h2>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium">Headline</span>
            <input className={inputClass} value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium">Subheading</span>
            <textarea rows={3} className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10" value={sub} onChange={(e) => setSub(e.target.value)} />
          </label>
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium">Background image</legend>
            <div className="grid grid-cols-3 gap-2">
              {heroImages.map((src) => (
                <label key={src} className={cn("relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl ring-2 ring-offset-2 has-[:focus-visible]:ring-pine-600", hero === src ? "ring-ember-500" : "ring-transparent")}>
                  <input type="radio" name="hero" className="sr-only" checked={hero === src} onChange={() => setHero(src)} />
                  <Image src={src} alt="" fill sizes="160px" className="object-cover" />
                </label>
              ))}
            </div>
          </fieldset>

          <div className="relative mt-6 isolate overflow-hidden rounded-xl bg-pine-950 p-6 text-white">
            <Image src={hero} alt="" fill sizes="600px" className="-z-10 object-cover opacity-70" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-950/90 to-pine-950/20" />
            <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-ember-300 uppercase">Live preview</p>
            <p className="mt-10 font-display text-2xl leading-tight font-semibold">{headline}</p>
            <p className="mt-2 text-xs text-white/80">{sub}</p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6">
          <h2 className="font-sans text-base font-semibold">Sections</h2>
          <ol className="mt-4 space-y-2">
            {sections.map((s, i) => (
              <li key={s.id} className={cn("flex items-center gap-2 rounded-xl border border-border p-2 pl-3", !s.visible && "bg-sand-50")}>
                <GripVertical className="size-4 shrink-0 text-ink/25" aria-hidden="true" />
                <span className={cn("flex-1 text-sm font-medium", !s.visible && "text-muted-foreground line-through")}>{s.label}</span>
                {!s.locked && (
                  <>
                    <button type="button" disabled={i <= 1} onClick={() => move(i, -1)} className="grid size-8 place-items-center rounded-lg hover:bg-sand-100 disabled:opacity-25" aria-label={`Move ${s.label} up`}><ArrowUp className="size-4" /></button>
                    <button type="button" disabled={i >= sections.length - 2} onClick={() => move(i, 1)} className="grid size-8 place-items-center rounded-lg hover:bg-sand-100 disabled:opacity-25" aria-label={`Move ${s.label} down`}><ArrowDown className="size-4" /></button>
                  </>
                )}
                <Switch
                  checked={s.visible}
                  disabled={s.locked}
                  onCheckedChange={(v) => setSections((all) => all.map((x) => (x.id === s.id ? { ...x, visible: v } : x)))}
                  aria-label={`Show ${s.label}`}
                  className="ml-1"
                />
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
