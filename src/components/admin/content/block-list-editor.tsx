"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteBlockAction, reorderBlocksAction, saveBlockAction, setBlockActiveAction } from "@/app/admin/(panel)/content/actions";
import { heroSlideSchema, promoSchema, type ContentData } from "@/lib/content/schema";
import { plainTitle } from "@/components/content/rich-title";
import { MediaThumb } from "@/components/admin/media-picker";
import { Switch } from "@/components/ui/switch";
import { adminButton } from "@/components/admin/admin-ui";
import { ContentFields, emptyData, withDefaults, type FieldContext } from "./content-fields";
import { cn } from "@/lib/utils";

export interface BlockView {
  id: number;
  isActive: boolean;
  data: ContentData;
}

const KINDS = {
  hero: { schema: heroSlideSchema, noun: "slide", mediaKey: "imageId", empty: "No hero slides yet." },
  promo: { schema: promoSchema, noun: "promotion", mediaKey: "mediaId", empty: "No promotions yet. Add one to show an offer or announcement on the homepage." },
} as const;

type Result = { ok: true; id?: number } | { ok: false; error: string };

export function BlockListEditor({ kind, blocks, ctx }: { kind: "hero" | "promo"; blocks: BlockView[]; ctx: FieldContext }) {
  const router = useRouter();
  const config = KINDS[kind];
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<ContentData>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (action: () => Promise<Result>, after?: (r: Result) => void, success?: string) => {
    setError(null);
    setNotice(null);
    start(async () => {
      let result: Result;
      try {
        result = await action();
      } catch {
        result = { ok: false, error: "Couldn't save — please try again" };
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      after?.(result);
      if (success) setNotice(success);
      router.refresh();
    });
  };

  const openEditor = (target: number | "new") => {
    setError(null);
    setNotice(null);
    setEditing(target);
    setDraft(target === "new" ? emptyData(config.schema.fields) : withDefaults(config.schema, blocks.find((b) => b.id === target)?.data));
  };

  const move = (i: number, d: -1 | 1) => {
    const ids = blocks.map((b) => b.id);
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    run(() => reorderBlocksAction(kind, ids));
  };

  const form = (
    <div className="rounded-2xl bg-sand-50 p-5 ring-1 ring-black/5">
      <ContentFields fields={config.schema.fields} value={draft} onChange={setDraft} ctx={ctx} idPrefix={`${kind}-${editing}`} />
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () => saveBlockAction(kind, editing === "new" ? null : editing, draft),
              () => setEditing(null),
              editing === "new" ? `New ${config.noun} saved as hidden. Preview it, then switch it on to show it on the homepage.` : "Saved.",
            )
          }
          className={adminButton.primary}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save {config.noun}
        </button>
        <button type="button" onClick={() => setEditing(null)} className={adminButton.secondary}>
          <X className="size-4" /> Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3 p-5">
      {error && <p role="alert" className="rounded-xl bg-destructive/8 px-4 py-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-moss-500/10 px-4 py-3 text-sm text-moss-700">{notice}</p>}
      {blocks.length === 0 && editing !== "new" && <p className="text-sm text-muted-foreground">{config.empty}</p>}
      <ul className="space-y-3">
        {blocks.map((b, i) => {
          const mediaId = b.data[config.mediaKey];
          const thumb = typeof mediaId === "number" ? ctx.media.find((m) => m.id === mediaId) : undefined;
          const title = plainTitle(String(b.data.title ?? ""));
          return (
            <li key={b.id} className="rounded-2xl ring-1 ring-black/5">
              <div className="flex flex-wrap items-center gap-3 p-3">
                {thumb ? <MediaThumb item={thumb} className="aspect-[4/3] w-20 shrink-0 rounded-lg" sizes="80px" /> : <div className="aspect-[4/3] w-20 shrink-0 rounded-lg bg-sand-100" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{title}</p>
                  <p className={cn("text-xs font-medium", b.isActive ? "text-moss-700" : "text-muted-foreground")}>{b.isActive ? "Visible on homepage" : "Hidden"}</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium">
                  <Switch checked={b.isActive} disabled={pending} onCheckedChange={(v) => run(() => setBlockActiveAction(kind, b.id, v))} aria-label={`Show "${title}" on the homepage`} />
                  Show
                </label>
                <div className="flex gap-1">
                  <button type="button" disabled={pending || i === 0} onClick={() => move(i, -1)} className={cn(adminButton.ghost, "disabled:opacity-30")} aria-label={`Move "${title}" up`}><ArrowUp className="size-3.5" /></button>
                  <button type="button" disabled={pending || i === blocks.length - 1} onClick={() => move(i, 1)} className={cn(adminButton.ghost, "disabled:opacity-30")} aria-label={`Move "${title}" down`}><ArrowDown className="size-3.5" /></button>
                  <button type="button" onClick={() => openEditor(b.id)} className={adminButton.ghost}><Pencil className="size-3.5" /> Edit</button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => window.confirm(`Delete "${title}"? This can't be undone.`) && run(() => deleteBlockAction(kind, b.id), () => setEditing(null), "Deleted.")}
                    className={cn(adminButton.ghost, "text-destructive hover:text-destructive")}
                    aria-label={`Delete "${title}"`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              {editing === b.id && <div className="border-t border-border p-3">{form}</div>}
            </li>
          );
        })}
      </ul>
      {editing === "new" ? form : (
        <button type="button" onClick={() => openEditor("new")} className={adminButton.secondary}>
          <Plus className="size-4" /> Add {config.noun}
        </button>
      )}
    </div>
  );
}
