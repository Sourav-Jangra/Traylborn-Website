import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { parseCloudinaryUrl } from "@/lib/content/cloudinary";
import { sectionDefinitions, isSectionKey } from "@/lib/content/schema";
import { mediaIdsIn } from "@/lib/content/validate";
import type { PackageImage } from "@/lib/types";
import { recordAudit, diff, type Actor } from "./audit";
import { db, parseJson, withTransaction } from "./db";

export interface MediaAsset {
  id: number;
  provider: "local" | "cloudinary";
  resourceType: "image" | "video";
  src: string;
  publicId: string | null;
  alt: string;
  label: string;
  createdAt: Date;
}

interface MediaRow extends RowDataPacket {
  id: number;
  provider: MediaAsset["provider"];
  resource_type: MediaAsset["resourceType"];
  src: string;
  cloudinary_public_id: string | null;
  alt_text: string;
  label: string;
  created_at: Date;
}

const toAsset = (r: MediaRow): MediaAsset => ({
  id: r.id,
  provider: r.provider,
  resourceType: r.resource_type,
  src: r.src,
  publicId: r.cloudinary_public_id,
  alt: r.alt_text,
  label: r.label,
  createdAt: r.created_at,
});

export type MediaResult = { ok: true; id: number } | { ok: false; error: string };

export async function listMedia(): Promise<MediaAsset[]> {
  const [rows] = await db.query<MediaRow[]>("SELECT * FROM media_assets ORDER BY id DESC");
  return rows.map(toAsset);
}

export async function getMediaByIds(ids: number[]): Promise<Map<number, MediaAsset>> {
  if (!ids.length) return new Map();
  const [rows] = await db.query<MediaRow[]>("SELECT * FROM media_assets WHERE id IN (?)", [[...new Set(ids)]]);
  return new Map(rows.map((r) => [r.id, toAsset(r)]));
}

// ---------------------------------------------------------------------------------------
// Local files shipped with the site

const SITE_IMAGES_DIR = path.join(process.cwd(), "public", "images");
const SITE_IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

/** Every image file under public/images, as the /images/... path the browser uses. */
export async function listSiteImages(): Promise<string[]> {
  const entries = await readdir(SITE_IMAGES_DIR, { recursive: true, withFileTypes: true }).catch(() => []);
  return entries
    .filter((e) => e.isFile() && SITE_IMAGE_EXT.test(e.name))
    .map((e) => "/images/" + path.relative(SITE_IMAGES_DIR, path.join(e.parentPath, e.name)).split(path.sep).join("/"))
    .filter((src) => /^\/images\/[A-Za-z0-9_\-/.]+$/.test(src) && !src.includes(".."))
    .sort();
}

export async function listUnregisteredSiteImages(): Promise<string[]> {
  const [rows] = await db.query<RowDataPacket[]>("SELECT src FROM media_assets WHERE provider = 'local'");
  const registered = new Set(rows.map((r) => r.src as string));
  return (await listSiteImages()).filter((src) => !registered.has(src));
}

function defaultLabel(src: string) {
  const name = src.split("/").pop()!.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
  return (name.charAt(0).toUpperCase() + name.slice(1)).slice(0, 160);
}

async function insertAsset(
  actor: Actor,
  asset: { provider: MediaAsset["provider"]; resourceType: MediaAsset["resourceType"]; src: string; publicId: string | null; alt: string; label: string },
): Promise<MediaResult> {
  try {
    return await withTransaction(async (conn) => {
      const [res] = await conn.execute<ResultSetHeader>(
        `INSERT INTO media_assets (provider, resource_type, src, cloudinary_public_id, alt_text, label, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
        [asset.provider, asset.resourceType, asset.src, asset.publicId, asset.alt, asset.label],
      );
      await recordAudit(actor, { action: "media.create", entityType: "media", entityId: String(res.insertId), after: asset }, conn);
      return { ok: true as const, id: res.insertId };
    });
  } catch (e) {
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") return { ok: false, error: "This file is already in the media library" };
    throw e;
  }
}

/** Adds one of the site's own image files to the library. Only files that exist under public/images are accepted. */
export async function registerSiteImage(src: string, alt: string, label: string, actor: Actor): Promise<MediaResult> {
  if (!(await listSiteImages()).includes(src)) return { ok: false, error: "That image file isn't part of the website" };
  return insertAsset(actor, { provider: "local", resourceType: "image", src, publicId: null, alt, label: label || defaultLabel(src) });
}

// ---------------------------------------------------------------------------------------
// Cloudinary

/** The cloud name is public (it appears in every delivery URL); no API key or secret is used. */
export function cloudinaryCloudName(): string | null {
  const name = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  return /^[A-Za-z0-9_-]{1,64}$/.test(name) ? name : null;
}

/**
 * Adds an asset already uploaded to the configured Cloudinary cloud, by its delivery URL.
 * The URL must be an original (untransformed) asset and must answer with the right
 * content type.
 */
export async function registerCloudinaryAsset(url: string, alt: string, label: string, actor: Actor): Promise<MediaResult> {
  const cloud = cloudinaryCloudName();
  if (!cloud) return { ok: false, error: "Cloudinary isn't configured on this website yet" };
  const parsed = parseCloudinaryUrl(url, cloud);
  if (!parsed) {
    return { ok: false, error: `Paste the original delivery URL of an image or video from the "${cloud}" Cloudinary account (https://res.cloudinary.com/${cloud}/image/upload/…)` };
  }
  if (parsed.resourceType === "image" && !alt) return { ok: false, error: "Describe the image for people who can't see it (alt text)" };
  let res: Response;
  try {
    res = await fetch(url, { method: "HEAD", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10_000) });
  } catch {
    return { ok: false, error: "Couldn't reach that Cloudinary URL. Check it opens in your browser and try again." };
  }
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith(`${parsed.resourceType}/`)) {
    return { ok: false, error: `Cloudinary didn't return ${parsed.resourceType === "image" ? "an image" : "a video"} for that URL` };
  }
  return insertAsset(actor, {
    provider: "cloudinary",
    resourceType: parsed.resourceType,
    src: url,
    publicId: parsed.publicId,
    alt,
    label: label || defaultLabel(parsed.publicId),
  });
}

// ---------------------------------------------------------------------------------------
// Editing and removing

export async function updateMediaText(id: number, alt: string, label: string, actor: Actor): Promise<MediaResult> {
  return withTransaction(async (conn) => {
    const [rows] = await conn.query<MediaRow[]>("SELECT * FROM media_assets WHERE id = ? FOR UPDATE", [id]);
    const row = rows[0];
    if (!row) return { ok: false, error: "This media item no longer exists" };
    if (row.resource_type === "image" && !alt) return { ok: false, error: "Images need alt text" };
    const changes = diff({ alt: row.alt_text, label: row.label }, { alt, label });
    if (!changes.changed) return { ok: true, id };
    await conn.execute("UPDATE media_assets SET alt_text = ?, label = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?", [alt, label, id]);
    await recordAudit(actor, { action: "media.update", entityType: "media", entityId: String(id), before: changes.before, after: changes.after }, conn);
    return { ok: true, id };
  });
}

const plain = (title: unknown) => String(title).replace(/\*/g, "").replace(/\s*\n\s*/g, " ");

/**
 * Where each media item is used, in words an admin understands, keyed by media id. Items
 * that aren't used anywhere are absent. Packages refer to images by path, so they are
 * matched on src.
 */
export async function getMediaUsage(conn: Pick<typeof db, "query"> = db): Promise<Map<number, string[]>> {
  const usage = new Map<number, string[]>();
  const add = (id: number, use: string) => usage.set(id, [...(usage.get(id) ?? []), use]);

  const [hero] = await conn.query<RowDataPacket[]>("SELECT title, image_id, video_id FROM home_hero_slides");
  for (const r of hero) {
    add(r.image_id, `Hero slide "${plain(r.title)}"`);
    if (r.video_id) add(r.video_id, `Hero slide "${plain(r.title)}" (video)`);
  }
  const [promos] = await conn.query<RowDataPacket[]>("SELECT title, media_id FROM home_promos WHERE media_id IS NOT NULL");
  for (const r of promos) add(r.media_id, `Promotion "${plain(r.title)}"`);
  const [sections] = await conn.query<RowDataPacket[]>("SELECT section_key, data FROM content_sections");
  for (const r of sections) {
    if (!isSectionKey(r.section_key)) continue;
    const def = sectionDefinitions[r.section_key];
    for (const id of new Set(mediaIdsIn(def.schema, parseJson(r.data)))) add(id, `Homepage section "${def.title}"`);
  }
  const [packages] = await conn.query<RowDataPacket[]>("SELECT title, images FROM packages");
  const [assets] = await conn.query<RowDataPacket[]>("SELECT id, src FROM media_assets");
  const idBySrc = new Map(assets.map((a) => [a.src as string, a.id as number]));
  for (const r of packages) {
    for (const src of new Set(parseJson<PackageImage[]>(r.images).map((img) => img.src))) {
      const id = idBySrc.get(src);
      if (id) add(id, `Package "${r.title}"`);
    }
  }
  return usage;
}

export async function deleteMedia(id: number, actor: Actor): Promise<MediaResult> {
  try {
    return await deleteUnusedMedia(id, actor);
  } catch (e) {
    // A slide or promotion started using it after the usage check.
    if ((e as { code?: string }).code === "ER_ROW_IS_REFERENCED_2") return { ok: false, error: "This media item is in use. Reload the page to see where." };
    throw e;
  }
}

async function deleteUnusedMedia(id: number, actor: Actor): Promise<MediaResult> {
  return withTransaction(async (conn) => {
    const [rows] = await conn.query<MediaRow[]>("SELECT * FROM media_assets WHERE id = ? FOR UPDATE", [id]);
    const row = rows[0];
    if (!row) return { ok: false, error: "This media item no longer exists" };
    const uses = (await getMediaUsage(conn)).get(row.id) ?? [];
    if (uses.length) return { ok: false, error: `Still used by: ${uses.join(", ")}. Replace it there first.` };
    await conn.execute("DELETE FROM media_assets WHERE id = ?", [id]);
    await recordAudit(actor, { action: "media.delete", entityType: "media", entityId: String(id), before: toAsset(row) as unknown as Record<string, unknown> }, conn);
    return { ok: true, id };
  });
}
