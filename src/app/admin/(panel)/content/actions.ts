"use server";

import { revalidatePath } from "next/cache";
import { isSectionKey } from "@/lib/content/schema";
import { requireAdminActor } from "@/server/auth/session";
import { deleteBlock, isBlockKind, reorderBlocks, saveBlock, saveSection, setBlockActive, type ContentResult } from "@/server/content";
import { reorderFeaturedPackages } from "@/server/packages";

// Server actions are reachable by direct POST, so each one checks the session itself.

const isId = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0 && v < 2 ** 31;
const UNKNOWN: ContentResult = { ok: false, error: "This content no longer exists" };

function published(result: ContentResult) {
  // Homepage content also appears on the About page (closing banner).
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function saveBlockAction(kind: unknown, id: unknown, input: unknown): Promise<ContentResult> {
  const actor = await requireAdminActor();
  if (!isBlockKind(kind) || (id !== null && !isId(id))) return UNKNOWN;
  return published(await saveBlock(kind, id, input, actor));
}

export async function setBlockActiveAction(kind: unknown, id: unknown, active: unknown): Promise<ContentResult> {
  const actor = await requireAdminActor();
  if (!isBlockKind(kind) || !isId(id) || typeof active !== "boolean") return UNKNOWN;
  return published(await setBlockActive(kind, id, active, actor));
}

export async function deleteBlockAction(kind: unknown, id: unknown): Promise<ContentResult> {
  const actor = await requireAdminActor();
  if (!isBlockKind(kind) || !isId(id)) return UNKNOWN;
  return published(await deleteBlock(kind, id, actor));
}

export async function reorderBlocksAction(kind: unknown, ids: unknown): Promise<ContentResult> {
  const actor = await requireAdminActor();
  if (!isBlockKind(kind) || !Array.isArray(ids) || ids.length > 500 || !ids.every(isId)) return UNKNOWN;
  return published(await reorderBlocks(kind, ids, actor));
}

export async function saveSectionAction(key: unknown, input: unknown, isActive: unknown): Promise<ContentResult> {
  const actor = await requireAdminActor();
  if (!isSectionKey(key) || typeof isActive !== "boolean") return UNKNOWN;
  return published(await saveSection(key, input, isActive, actor));
}

export async function reorderFeaturedAction(slugs: unknown): Promise<ContentResult> {
  const actor = await requireAdminActor();
  if (!Array.isArray(slugs) || slugs.length > 500 || !slugs.every((s) => typeof s === "string" && s.length <= 160)) return UNKNOWN;
  const ok = await reorderFeaturedPackages(slugs, actor);
  return published(ok ? { ok: true } : { ok: false, error: "The featured list changed in another window. Reload the page and try again." });
}
