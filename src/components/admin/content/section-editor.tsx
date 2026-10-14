"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { saveSectionAction } from "@/app/admin/(panel)/content/actions";
import { sectionDefinitions, type ContentData, type SectionKey } from "@/lib/content/schema";
import { Switch } from "@/components/ui/switch";
import { adminButton } from "@/components/admin/admin-ui";
import { ContentFields, withDefaults, type FieldContext } from "./content-fields";
import { cn } from "@/lib/utils";

export function SectionEditor({ sectionKey, initial, ctx }: { sectionKey: SectionKey; initial: { isActive: boolean; data: ContentData } | null; ctx: FieldContext }) {
  const router = useRouter();
  const def = sectionDefinitions[sectionKey];
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(() => withDefaults(def.schema, initial?.data));
  const [isActive, setIsActive] = useState(initial?.isActive ?? false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  const liveActive = initial?.isActive ?? false;

  const save = () => {
    setResult(null);
    start(async () => {
      try {
        const r = await saveSectionAction(sectionKey, data, isActive);
        setResult(r.ok ? { ok: true, message: isActive ? "Saved. Live on the website." : "Saved. This section is hidden from visitors." } : { ok: false, message: r.error });
        if (r.ok) router.refresh();
      } catch {
        setResult({ ok: false, message: "Couldn't save — please try again" });
      }
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-sand-50/60">
        <div className="min-w-0 flex-1">
          <h2 className="font-sans text-sm font-semibold">{def.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{def.description}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", liveActive ? "bg-moss-500/12 text-moss-700 ring-moss-500/25" : "bg-sand-200 text-ink/70 ring-black/5")}>
          {initial ? (liveActive ? "Visible" : "Hidden") : "Not set up"}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div className="border-t border-border p-5">
          <ContentFields fields={def.schema.fields} value={data} onChange={setData} ctx={ctx} idPrefix={sectionKey.replace(".", "-")} />
          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              Show this section on the website
            </label>
            <button type="button" onClick={save} disabled={pending} className={adminButton.primary}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save section
            </button>
            {result && (
              <p role={result.ok ? "status" : "alert"} className={cn("text-sm", result.ok ? "text-moss-700" : "text-destructive")}>{result.message}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
