"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActor } from "@/server/auth/session";
import { deleteMedia, registerCloudinaryAsset, registerSiteImage, updateMediaText, type MediaResult } from "@/server/media";

// Server actions are reachable by direct POST, so each one checks the session itself.

class InvalidInput extends Error {}

function text(value: unknown, field: string, max: number) {
  if (typeof value !== "string") throw new InvalidInput(`${field} is missing`);
  const v = value.trim().replace(/\s+/g, " ");
  if (v.length > max) throw new InvalidInput(`${field} must be ${max} characters or fewer`);
  return v;
}

const isId = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0 && v < 2 ** 31;

async function run(fn: () => Promise<MediaResult>): Promise<MediaResult> {
  try {
    const result = await fn();
    if (result.ok) {
      revalidatePath("/admin/media");
      revalidatePath("/", "layout");
    }
    return result;
  } catch (e) {
    if (e instanceof InvalidInput) return { ok: false, error: e.message };
    throw e;
  }
}

export async function registerSiteImageAction(src: unknown, alt: unknown, label: unknown): Promise<MediaResult> {
  const actor = await requireAdminActor();
  return run(async () => {
    const altText = text(alt, "Alt text", 300);
    if (!altText) throw new InvalidInput("Describe the image for people who can't see it (alt text)");
    return registerSiteImage(text(src, "Image file", 500), altText, text(label, "Label", 160), actor);
  });
}

export async function addCloudinaryMediaAction(url: unknown, alt: unknown, label: unknown): Promise<MediaResult> {
  const actor = await requireAdminActor();
  return run(async () => registerCloudinaryAsset(text(url, "Cloudinary URL", 500), text(alt, "Alt text", 300), text(label, "Label", 160), actor));
}

export async function updateMediaAction(id: unknown, alt: unknown, label: unknown): Promise<MediaResult> {
  const actor = await requireAdminActor();
  if (!isId(id)) return { ok: false, error: "This media item no longer exists" };
  return run(async () => updateMediaText(id, text(alt, "Alt text", 300), text(label, "Label", 160), actor));
}

export async function deleteMediaAction(id: unknown): Promise<MediaResult> {
  const actor = await requireAdminActor();
  if (!isId(id)) return { ok: false, error: "This media item no longer exists" };
  return run(async () => deleteMedia(id, actor));
}
