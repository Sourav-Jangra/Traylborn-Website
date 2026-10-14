export interface CloudinaryAsset {
  resourceType: "image" | "video";
  publicId: string;
  format: string;
}

const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "avif"];
const VIDEO_FORMATS = ["mp4", "webm", "mov"];

/**
 * Reads an original-asset delivery URL from the configured Cloudinary cloud, e.g.
 * https://res.cloudinary.com/<cloud>/image/upload/v1712345678/treks/hampta.jpg.
 * URLs with transformations, other clouds, or other hosts return null.
 */
export function parseCloudinaryUrl(value: string, cloudName: string): CloudinaryAsset | null {
  if (!/^[a-z0-9_-]+$/i.test(cloudName)) return null;
  const match = /^https:\/\/res\.cloudinary\.com\/([A-Za-z0-9_-]+)\/(image|video)\/upload\/(v\d+\/)?([A-Za-z0-9_\-/]+)\.([a-z0-9]{2,5})$/.exec(value);
  if (!match || match[1] !== cloudName) return null;
  const [, , resourceType, version, publicId, format] = match;
  const segments = publicId.split("/");
  if (segments.some((seg) => !seg)) return null;
  // A transformation ("w_400", "c_fill,w_400" — commas never match above) can only sit
  // before the version; only original-asset URLs are stored.
  if (!version && segments.length > 1 && /^[a-z]{1,3}_[^/]*$/.test(segments[0])) return null;
  const allowed = resourceType === "image" ? IMAGE_FORMATS : VIDEO_FORMATS;
  if (!allowed.includes(format)) return null;
  return { resourceType: resourceType as "image" | "video", publicId, format };
}
