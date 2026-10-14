/** Icons an admin may pick for trust-bar points and "Why Traylborn" reasons. */
export const ICON_KEYS = [
  "map-pin",
  "users",
  "receipt",
  "message",
  "compass",
  "shield",
  "headset",
  "mountain",
  "calendar",
  "star",
  "heart",
  "leaf",
  "tent",
  "sun",
  "camera",
  "route",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];
