import "server-only";
import { connection } from "next/server";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import {
  heroSlideSchema,
  promoSchema,
  sectionDefinitions,
  isSectionKey,
  type ContentData,
  type ContentSchema,
  type SectionKey,
} from "@/lib/content/schema";
import { InvalidContent, mediaIdsIn, validateContent, type ValidationContext } from "@/lib/content/validate";
import { recordAudit, diff, type Actor } from "./audit";
import { db, parseJson, withTransaction } from "./db";
import { getMediaByIds, type MediaAsset } from "./media";
import { getPublishedPackages } from "./packages";

// ---------------------------------------------------------------------------------------
// Ordered blocks: hero slides and promotions

export type BlockKind = "hero" | "promo";

interface BlockDefinition {
  table: string;
  entityType: string;
  noun: string;
  schema: ContentSchema;
  /** Schema field key -> column. */
  columns: Record<string, string>;
}

export const BLOCKS: Record<BlockKind, BlockDefinition> = {
  hero: {
    table: "home_hero_slides",
    entityType: "home_hero_slide",
    noun: "hero slide",
    schema: heroSlideSchema,
    columns: {
      eyebrow: "eyebrow",
      title: "title",
      subtitle: "subtitle",
      imageId: "image_id",
      videoId: "video_id",
      ctaLabel: "cta_label",
      ctaHref: "cta_href",
      secondaryCtaLabel: "secondary_cta_label",
      secondaryCtaHref: "secondary_cta_href",
    },
  },
  promo: {
    table: "home_promos",
    entityType: "home_promo",
    noun: "promotion",
    schema: promoSchema,
    columns: { eyebrow: "eyebrow", title: "title", body: "body", mediaId: "media_id", ctaLabel: "cta_label", ctaHref: "cta_href" },
  },
};

export function isBlockKind(value: unknown): value is BlockKind {
  return value === "hero" || value === "promo";
}

export interface Block {
  id: number;
  isActive: boolean;
  sortOrder: number;
  data: ContentData;
}

function toBlock(def: BlockDefinition, row: RowDataPacket): Block {
  const data: ContentData = {};
  for (const [key, column] of Object.entries(def.columns)) data[key] = row[column];
  return { id: row.id, isActive: Boolean(row.is_active), sortOrder: row.sort_order, data };
}

export async function listBlocks(kind: BlockKind, { activeOnly = false } = {}): Promise<Block[]> {
  const def = BLOCKS[kind];
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT * FROM ${def.table} ${activeOnly ? "WHERE is_active = 1" : ""} ORDER BY sort_order, id`,
  );
  return rows.map((r) => toBlock(def, r));
}

async function validationContext(): Promise<ValidationContext> {
  const [media] = await db.query<RowDataPacket[]>("SELECT id, resource_type FROM media_assets");
  const types = new Map(media.map((m) => [m.id as number, m.resource_type as "image" | "video"]));
  const published = new Set((await getPublishedPackages()).map((p) => p.slug));
  return { mediaType: (id) => types.get(id), isPublishedPackage: (slug) => published.has(slug) };
}

export type ContentResult = { ok: true; id?: number } | { ok: false; error: string };

async function validate(schema: ContentSchema, raw: unknown): Promise<ContentData | string> {
  try {
    return validateContent(schema, raw, await validationContext());
  } catch (e) {
    if (e instanceof InvalidContent) return e.message;
    throw e;
  }
}

async function lockBlocks(conn: PoolConnection, def: BlockDefinition) {
  const [rows] = await conn.query<RowDataPacket[]>(`SELECT * FROM ${def.table} ORDER BY sort_order, id FOR UPDATE`);
  return rows;
}

/** Creates (id null) or updates a block. New blocks start hidden so they can be previewed first. */
export async function saveBlock(kind: BlockKind, id: number | null, raw: unknown, actor: Actor): Promise<ContentResult> {
  const def = BLOCKS[kind];
  const data = await validate(def.schema, raw);
  if (typeof data === "string") return { ok: false, error: data };
  const keys = Object.keys(def.columns);
  // Block schemas only hold text, links and media ids.
  const values = keys.map((k) => data[k] as string | number | null);

  return withTransaction(async (conn): Promise<ContentResult> => {
    const rows = await lockBlocks(conn, def);
    if (id === null) {
      const nextOrder = rows.reduce((max, r) => Math.max(max, r.sort_order + 1), 0);
      const [res] = await conn.execute<ResultSetHeader>(
        `INSERT INTO ${def.table} (${keys.map((k) => def.columns[k]).join(", ")}, is_active, sort_order, created_at, updated_at)
         VALUES (${keys.map(() => "?").join(", ")}, 0, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
        [...values, nextOrder],
      );
      await recordAudit(actor, { action: `content.${kind}.create`, entityType: def.entityType, entityId: String(res.insertId), after: data }, conn);
      return { ok: true, id: res.insertId };
    }
    const row = rows.find((r) => r.id === id);
    if (!row) return { ok: false, error: `This ${def.noun} no longer exists` };
    const changes = diff(toBlock(def, row).data, data);
    if (!changes.changed) return { ok: true, id };
    await conn.execute(
      `UPDATE ${def.table} SET ${keys.map((k) => `${def.columns[k]} = ?`).join(", ")}, updated_at = UTC_TIMESTAMP() WHERE id = ?`,
      [...values, id],
    );
    await recordAudit(
      actor,
      { action: `content.${kind}.update`, entityType: def.entityType, entityId: String(id), before: changes.before, after: changes.after },
      conn,
    );
    return { ok: true, id };
  });
}

/** The homepage always needs at least one live hero slide. */
const LAST_HERO = "The homepage needs at least one visible hero slide. Show another slide first.";

export async function setBlockActive(kind: BlockKind, id: number, active: boolean, actor: Actor): Promise<ContentResult> {
  const def = BLOCKS[kind];
  return withTransaction(async (conn): Promise<ContentResult> => {
    const rows = await lockBlocks(conn, def);
    const row = rows.find((r) => r.id === id);
    if (!row) return { ok: false, error: `This ${def.noun} no longer exists` };
    if (Boolean(row.is_active) === active) return { ok: true, id };
    if (kind === "hero" && !active && rows.filter((r) => r.is_active).length <= 1) return { ok: false, error: LAST_HERO };
    await conn.execute(`UPDATE ${def.table} SET is_active = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?`, [active ? 1 : 0, id]);
    await recordAudit(
      actor,
      { action: `content.${kind}.visibility`, entityType: def.entityType, entityId: String(id), before: { isActive: !active }, after: { isActive: active } },
      conn,
    );
    return { ok: true, id };
  });
}

export async function deleteBlock(kind: BlockKind, id: number, actor: Actor): Promise<ContentResult> {
  const def = BLOCKS[kind];
  return withTransaction(async (conn): Promise<ContentResult> => {
    const rows = await lockBlocks(conn, def);
    const row = rows.find((r) => r.id === id);
    if (!row) return { ok: false, error: `This ${def.noun} no longer exists` };
    if (kind === "hero" && row.is_active && rows.filter((r) => r.is_active).length <= 1) return { ok: false, error: LAST_HERO };
    await conn.execute(`DELETE FROM ${def.table} WHERE id = ?`, [id]);
    const block = toBlock(def, row);
    await recordAudit(
      actor,
      { action: `content.${kind}.delete`, entityType: def.entityType, entityId: String(id), before: { ...block.data, isActive: block.isActive } },
      conn,
    );
    return { ok: true };
  });
}

/** `ids` must list every block of this kind exactly once, in the new order. */
export async function reorderBlocks(kind: BlockKind, ids: number[], actor: Actor): Promise<ContentResult> {
  const def = BLOCKS[kind];
  return withTransaction(async (conn): Promise<ContentResult> => {
    const rows = await lockBlocks(conn, def);
    const current = rows.map((r) => r.id as number);
    if (ids.length !== current.length || new Set(ids).size !== ids.length || !ids.every((i) => current.includes(i))) {
      return { ok: false, error: "The list changed in another window. Reload the page and try again." };
    }
    if (ids.every((i, n) => i === current[n])) return { ok: true };
    for (const [n, i] of ids.entries()) {
      await conn.execute(`UPDATE ${def.table} SET sort_order = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?`, [n, i]);
    }
    await recordAudit(
      actor,
      { action: `content.${kind}.reorder`, entityType: def.entityType, entityId: null, before: { order: current }, after: { order: ids } },
      conn,
    );
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------------------
// Fixed sections

export interface Section {
  key: SectionKey;
  isActive: boolean;
  data: ContentData;
}

export async function listSections(): Promise<Partial<Record<SectionKey, Section>>> {
  const [rows] = await db.query<RowDataPacket[]>("SELECT section_key, is_active, data FROM content_sections");
  const out: Partial<Record<SectionKey, Section>> = {};
  for (const r of rows) {
    if (isSectionKey(r.section_key)) out[r.section_key] = { key: r.section_key, isActive: Boolean(r.is_active), data: parseJson(r.data) };
  }
  return out;
}

export async function saveSection(key: SectionKey, raw: unknown, isActive: boolean, actor: Actor): Promise<ContentResult> {
  const data = await validate(sectionDefinitions[key].schema, raw);
  if (typeof data === "string") return { ok: false, error: data };
  return withTransaction(async (conn): Promise<ContentResult> => {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT is_active, data FROM content_sections WHERE section_key = ? FOR UPDATE", [key]);
    const before = rows[0] ? { ...parseJson<ContentData>(rows[0].data), isActive: Boolean(rows[0].is_active) } : {};
    const changes = diff(before, { ...data, isActive });
    if (!changes.changed) return { ok: true };
    if (rows[0]) {
      await conn.execute("UPDATE content_sections SET data = ?, is_active = ?, updated_at = UTC_TIMESTAMP() WHERE section_key = ?", [
        JSON.stringify(data),
        isActive ? 1 : 0,
        key,
      ]);
    } else {
      await conn.execute("INSERT INTO content_sections (section_key, is_active, data, updated_at) VALUES (?, ?, ?, UTC_TIMESTAMP())", [
        key,
        isActive ? 1 : 0,
        JSON.stringify(data),
      ]);
    }
    await recordAudit(
      actor,
      { action: "content.section.update", entityType: "content_section", entityId: key, before: changes.before, after: changes.after },
      conn,
    );
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------------------
// Homepage

export interface MediaRef {
  src: string;
  alt: string;
  resourceType: MediaAsset["resourceType"];
}

export interface HomeContent {
  hero: Block[];
  promos: Block[];
  sections: Partial<Record<SectionKey, Section>>;
  media: Record<number, MediaRef>;
}

/** One live section with the media it refers to, for pages that reuse a homepage section. */
export async function getLiveSection(key: SectionKey): Promise<{ data: ContentData; media: HomeContent["media"] } | null> {
  await connection();
  const [rows] = await db.query<RowDataPacket[]>("SELECT data FROM content_sections WHERE section_key = ? AND is_active = 1", [key]);
  if (!rows[0]) return null;
  const data = parseJson<ContentData>(rows[0].data);
  const media: HomeContent["media"] = {};
  for (const [id, a] of await getMediaByIds(mediaIdsIn(sectionDefinitions[key].schema, data))) {
    media[id] = { src: a.src, alt: a.alt, resourceType: a.resourceType };
  }
  return { data, media };
}

/**
 * Everything the homepage shows. Hidden slides, promotions and sections are only included
 * for the admin preview (`includeHidden`).
 */
export async function getHomeContent({ includeHidden = false } = {}): Promise<HomeContent> {
  await connection();
  const [hero, promos, allSections] = await Promise.all([
    listBlocks("hero", { activeOnly: !includeHidden }),
    listBlocks("promo", { activeOnly: !includeHidden }),
    listSections(),
  ]);
  const sections = Object.fromEntries(
    Object.entries(allSections).filter(([, s]) => includeHidden || s.isActive),
  ) as HomeContent["sections"];

  const ids = [
    ...hero.flatMap((b) => mediaIdsIn(heroSlideSchema, b.data)),
    ...promos.flatMap((b) => mediaIdsIn(promoSchema, b.data)),
    ...Object.values(sections).flatMap((s) => mediaIdsIn(sectionDefinitions[s.key].schema, s.data)),
  ];
  const assets = await getMediaByIds(ids);
  const media: HomeContent["media"] = {};
  for (const [id, a] of assets) media[id] = { src: a.src, alt: a.alt, resourceType: a.resourceType };
  return { hero, promos, sections, media };
}
