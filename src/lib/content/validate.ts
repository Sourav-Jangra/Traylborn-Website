import { ICON_KEYS } from "./icon-keys";
import type { ContentData, ContentSchema, Field } from "./schema";

export class InvalidContent extends Error {}

export interface ValidationContext {
  /** Resource type of a media library item, or undefined when the id doesn't exist. */
  mediaType(id: number): "image" | "video" | undefined;
  isPublishedPackage(slug: string): boolean;
}

/**
 * Links an admin may use on a button: a path on this site, an in-page anchor, an https URL,
 * or a phone/email link. Anything else (javascript:, data:, protocol-relative //host) is
 * refused.
 */
export function isSafeHref(value: string) {
  if (/^\/(?![/\\])[^\s\\]*$/.test(value)) return true;
  if (/^#[A-Za-z0-9_-]+$/.test(value)) return true;
  if (/^tel:\+?[0-9 -]{6,20}$/.test(value)) return true;
  if (/^mailto:[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && value.startsWith("https://");
  } catch {
    return false;
  }
}

/** "*" marks the accented words, so the asterisks must pair up around something. */
function checkAccent(value: string, label: string) {
  const parts = value.split("*");
  if (parts.length % 2 === 0) throw new InvalidContent(`${label}: every *accent* needs an opening and closing asterisk`);
  if (parts.some((p, i) => i % 2 === 1 && !p.trim())) throw new InvalidContent(`${label}: an *accent* can't be empty`);
}

function validateField(field: Field, raw: unknown, ctx: ValidationContext, path: string): unknown {
  const label = path ? `${path} ${field.label.toLowerCase()}` : field.label;
  switch (field.type) {
    case "text":
    case "textarea": {
      if (raw != null && typeof raw !== "string") throw new InvalidContent(`${label} is not valid`);
      let v = (raw ?? "").replace(/\r\n?/g, "\n").trim();
      if (field.type === "text") {
        const lines = v.split("\n").map((l) => l.trim());
        if (lines.length > (field.lines ?? 1)) {
          throw new InvalidContent(field.lines ? `${label} can have at most ${field.lines} lines` : `${label} must be a single line`);
        }
        v = lines.join("\n");
        if (field.accent) checkAccent(v, label);
      }
      if (field.required && !v) throw new InvalidContent(`${label} is required`);
      if (v.length > field.max) throw new InvalidContent(`${label} must be ${field.max} characters or fewer`);
      return v;
    }
    case "link": {
      if (raw != null && typeof raw !== "string") throw new InvalidContent(`${label} is not valid`);
      const v = (raw ?? "").trim();
      if (field.required && !v) throw new InvalidContent(`${label} is required`);
      if (v.length > 300) throw new InvalidContent(`${label} must be 300 characters or fewer`);
      if (v && !isSafeHref(v)) {
        throw new InvalidContent(`${label} must be a page on this site (starting with /) or a full https:// address`);
      }
      return v;
    }
    case "image":
    case "video": {
      if (raw == null || raw === "") {
        if (field.required) throw new InvalidContent(`${label} is required`);
        return null;
      }
      if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 1) throw new InvalidContent(`${label} is not valid`);
      const type = ctx.mediaType(raw);
      if (!type) throw new InvalidContent(`${label}: that media item no longer exists`);
      if (type !== field.type) throw new InvalidContent(`${label} must be ${field.type === "image" ? "an image" : "a video"}`);
      return raw;
    }
    case "package": {
      if (raw != null && typeof raw !== "string") throw new InvalidContent(`${label} is not valid`);
      const v = (raw ?? "").trim();
      if (!v) {
        if (field.required) throw new InvalidContent(`${label} is required`);
        return "";
      }
      if (!ctx.isPublishedPackage(v)) throw new InvalidContent(`${label} must be a published package`);
      return v;
    }
    case "icon": {
      if (!ICON_KEYS.includes(raw as (typeof ICON_KEYS)[number])) throw new InvalidContent(`${label} is not a valid icon`);
      return raw;
    }
    case "list": {
      if (!Array.isArray(raw)) throw new InvalidContent(`${label} must be a list`);
      if (raw.length < field.min) throw new InvalidContent(`Add at least ${field.min} ${field.itemLabel.toLowerCase()}${field.min === 1 ? "" : "s"}`);
      if (raw.length > field.max) throw new InvalidContent(`Use at most ${field.max} ${field.itemLabel.toLowerCase()}s`);
      return raw.map((item, i) => validateObject(field.fields, item, ctx, `${field.itemLabel} ${i + 1}`));
    }
  }
}

function validateObject(fields: Field[], raw: unknown, ctx: ValidationContext, path: string) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new InvalidContent(`${path || "Content"} is not valid`);
  const input = raw as Record<string, unknown>;
  const out: ContentData = {};
  for (const field of fields) out[field.key] = validateField(field, input[field.key], ctx, path);
  return out;
}

/** Returns a clean copy holding only the schema's fields; throws InvalidContent with a message for the admin. */
export function validateContent(schema: ContentSchema, raw: unknown, ctx: ValidationContext): ContentData {
  const data = validateObject(schema.fields, raw, ctx, "");
  for (const [labelKey, linkKey] of schema.pairs ?? []) {
    if (Boolean(data[labelKey]) !== Boolean(data[linkKey])) {
      const labelField = schema.fields.find((f) => f.key === labelKey)!;
      const linkField = schema.fields.find((f) => f.key === linkKey)!;
      throw new InvalidContent(`Fill in both "${labelField.label}" and "${linkField.label}", or leave both empty`);
    }
  }
  return data;
}

/** Every media id a piece of content refers to (including inside lists). */
export function mediaIdsIn(schema: ContentSchema, data: ContentData): number[] {
  const ids: number[] = [];
  const walk = (fields: Field[], obj: ContentData) => {
    for (const f of fields) {
      const v = obj?.[f.key];
      if ((f.type === "image" || f.type === "video") && typeof v === "number") ids.push(v);
      if (f.type === "list" && Array.isArray(v)) v.forEach((item) => walk(f.fields, item as ContentData));
    }
  };
  walk(schema.fields, data);
  return ids;
}
