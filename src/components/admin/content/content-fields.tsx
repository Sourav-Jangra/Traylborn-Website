"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ContentData, ContentSchema, Field } from "@/lib/content/schema";
import { ICON_KEYS } from "@/lib/content/icon-keys";
import { ContentIcon, contentIcons } from "@/lib/content/icons";
import { MediaField, type MediaOption } from "@/components/admin/media-picker";
import { adminButton } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";

export interface PackageChoice {
  slug: string;
  title: string;
}

export interface FieldContext {
  media: MediaOption[];
  packages: PackageChoice[];
}

const inputClass = "h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10";
const textareaClass = "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10";

function emptyValue(field: Field): unknown {
  switch (field.type) {
    case "image":
    case "video":
      return null;
    case "icon":
      return ICON_KEYS[0];
    case "list":
      return [];
    default:
      return "";
  }
}

export function emptyData(fields: Field[]): ContentData {
  return Object.fromEntries(fields.map((f) => [f.key, emptyValue(f)]));
}

/** Fills keys missing from stored data, so older rows still render every input. */
export function withDefaults(schema: ContentSchema, data: ContentData | undefined): ContentData {
  return { ...emptyData(schema.fields), ...(data ?? {}) };
}

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className={cn("text-xs tabular-nums", value.length > max ? "text-destructive" : "text-muted-foreground")}>
      {value.length}/{max}
    </span>
  );
}

function FieldInput({ field, value, onChange, ctx, id }: { field: Field; value: unknown; onChange: (v: unknown) => void; ctx: FieldContext; id: string }) {
  switch (field.type) {
    case "text":
      return field.lines && field.lines > 1 ? (
        <textarea id={id} rows={field.lines} className={textareaClass} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className={inputClass} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      );
    case "textarea":
      return <textarea id={id} rows={3} className={textareaClass} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "link":
      return <input id={id} className={inputClass} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder="/treks or https://…" inputMode="url" />;
    case "image":
    case "video":
      return <MediaField media={ctx.media} type={field.type} value={typeof value === "number" ? value : null} onChange={onChange} required={field.required} />;
    case "package":
      return (
        <select id={id} className={inputClass} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose a package…</option>
          {ctx.packages.map((p) => (
            <option key={p.slug} value={p.slug}>{p.title}</option>
          ))}
          {typeof value === "string" && value && !ctx.packages.some((p) => p.slug === value) && (
            <option value={value}>{value} (not published)</option>
          )}
        </select>
      );
    case "icon":
      return (
        <div className="flex items-center gap-2">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sand-100 text-pine-700">
            <ContentIcon name={String(value)} className="size-5" />
          </span>
          <select id={id} className={inputClass} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
            {ICON_KEYS.map((k) => (
              <option key={k} value={k}>{contentIcons[k].label}</option>
            ))}
          </select>
        </div>
      );
    case "list":
      return <ListInput field={field} value={Array.isArray(value) ? (value as ContentData[]) : []} onChange={onChange} ctx={ctx} id={id} />;
  }
}

function ListInput({ field, value, onChange, ctx, id }: { field: Extract<Field, { type: "list" }>; value: ContentData[]; onChange: (v: unknown) => void; ctx: FieldContext; id: string }) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div key={i} className="rounded-xl bg-sand-50 p-4 ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{field.itemLabel} {i + 1}</p>
            <div className="flex gap-1">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className={cn(adminButton.ghost, "disabled:opacity-30")} aria-label={`Move ${field.itemLabel.toLowerCase()} ${i + 1} up`}><ArrowUp className="size-3.5" /></button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className={cn(adminButton.ghost, "disabled:opacity-30")} aria-label={`Move ${field.itemLabel.toLowerCase()} ${i + 1} down`}><ArrowDown className="size-3.5" /></button>
              <button type="button" disabled={value.length <= field.min} onClick={() => onChange(value.filter((_, j) => j !== i))} className={cn(adminButton.ghost, "text-destructive disabled:opacity-30")} aria-label={`Remove ${field.itemLabel.toLowerCase()} ${i + 1}`}><Trash2 className="size-3.5" /></button>
            </div>
          </div>
          <ContentFields fields={field.fields} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} ctx={ctx} idPrefix={`${id}-${i}`} />
        </div>
      ))}
      {value.length < field.max && (
        <button type="button" onClick={() => onChange([...value, emptyData(field.fields)])} className={adminButton.secondary}>
          <Plus className="size-4" /> Add {field.itemLabel.toLowerCase()}
        </button>
      )}
    </div>
  );
}

/** Inputs for every field of a schema. `value` is the whole object; `onChange` returns a new one. */
export function ContentFields({ fields, value, onChange, ctx, idPrefix }: { fields: Field[]; value: ContentData; onChange: (v: ContentData) => void; ctx: FieldContext; idPrefix: string }) {
  return (
    <div className="grid gap-4">
      {fields.map((field) => {
        const id = `${idPrefix}-${field.key}`;
        const v = value[field.key];
        const isGroup = field.type === "list" || field.type === "image" || field.type === "video";
        return (
          <div key={field.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              {isGroup ? (
                <p className="text-sm font-medium">{field.label}{field.required && <span className="text-destructive"> *</span>}</p>
              ) : (
                <label htmlFor={id} className="text-sm font-medium">{field.label}{field.required && <span className="text-destructive"> *</span>}</label>
              )}
              {(field.type === "text" || field.type === "textarea") && <Counter value={String(v ?? "")} max={field.max} />}
            </div>
            <FieldInput field={field} value={v} onChange={(nv) => onChange({ ...value, [field.key]: nv })} ctx={ctx} id={id} />
            {field.help && <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>}
          </div>
        );
      })}
    </div>
  );
}
