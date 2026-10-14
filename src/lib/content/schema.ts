// Field definitions for every piece of admin-managed homepage content. The admin forms are
// rendered from these and the server validates against the same definitions, so the two
// can't drift apart.

import { ICON_KEYS } from "./icon-keys";

interface BaseField {
  key: string;
  label: string;
  help?: string;
  required?: boolean;
}

export type Field =
  | (BaseField & { type: "text"; max: number; accent?: boolean; lines?: number })
  | (BaseField & { type: "textarea"; max: number })
  | (BaseField & { type: "link" })
  | (BaseField & { type: "image" | "video" })
  | (BaseField & { type: "package" })
  | (BaseField & { type: "icon" })
  | (BaseField & { type: "list"; min: number; max: number; itemLabel: string; fields: Field[] });

export interface ContentSchema {
  fields: Field[];
  /** [label key, link key]: a button needs both its text and its link, or neither. */
  pairs?: [string, string][];
}

export type ContentData = Record<string, unknown>;

const ACCENT_HELP = "Wrap a word or two in *asterisks* to show them in the accent style.";

export const heroSlideSchema: ContentSchema = {
  fields: [
    { key: "eyebrow", label: "Small line above the title", type: "text", max: 120 },
    { key: "title", label: "Title", type: "text", max: 160, required: true, accent: true, lines: 3, help: `${ACCENT_HELP} Press Enter for a line break.` },
    { key: "subtitle", label: "Description", type: "textarea", max: 400 },
    { key: "imageId", label: "Background image", type: "image", required: true, help: "Also shown while a video loads, and on phones." },
    { key: "videoId", label: "Background video (optional)", type: "video", help: "Plays on larger screens only." },
    { key: "ctaLabel", label: "Main button text", type: "text", max: 40 },
    { key: "ctaHref", label: "Main button link", type: "link" },
    { key: "secondaryCtaLabel", label: "Second button text", type: "text", max: 40 },
    { key: "secondaryCtaHref", label: "Second button link", type: "link" },
  ],
  pairs: [
    ["ctaLabel", "ctaHref"],
    ["secondaryCtaLabel", "secondaryCtaHref"],
  ],
};

export const promoSchema: ContentSchema = {
  fields: [
    { key: "eyebrow", label: "Small label", type: "text", max: 60, help: "For example: Limited offer" },
    { key: "title", label: "Title", type: "text", max: 160, required: true, accent: true, help: ACCENT_HELP },
    { key: "body", label: "Text", type: "textarea", max: 600 },
    { key: "mediaId", label: "Image (optional)", type: "image" },
    { key: "ctaLabel", label: "Button text", type: "text", max: 40 },
    { key: "ctaHref", label: "Button link", type: "link" },
  ],
  pairs: [["ctaLabel", "ctaHref"]],
};

const headingFields: Field[] = [
  { key: "eyebrow", label: "Small line above the title", type: "text", max: 60 },
  { key: "title", label: "Title", type: "text", max: 160, required: true, accent: true, help: ACCENT_HELP },
  { key: "description", label: "Description", type: "textarea", max: 300 },
];

export const SECTION_KEYS = [
  "home.trust_bar",
  "home.featured",
  "home.categories",
  "home.spotlight",
  "home.why",
  "home.final_cta",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const sectionDefinitions: Record<SectionKey, { title: string; description: string; schema: ContentSchema }> = {
  "home.trust_bar": {
    title: "Trust bar",
    description: "The short points in the white strip under the hero.",
    schema: {
      fields: [
        {
          key: "items",
          label: "Points",
          type: "list",
          min: 1,
          max: 6,
          itemLabel: "Point",
          fields: [
            { key: "icon", label: "Icon", type: "icon", required: true },
            { key: "label", label: "Text", type: "text", max: 60, required: true },
          ],
        },
      ],
    },
  },
  "home.featured": {
    title: "Featured journeys heading",
    description: "Heading above the featured packages carousel. Turn off to hide the whole carousel.",
    schema: { fields: headingFields },
  },
  "home.categories": {
    title: "Experiences heading",
    description: "Heading above the Treks / Road Trips / Retreats cards.",
    schema: { fields: headingFields },
  },
  "home.spotlight": {
    title: "Journey spotlight",
    description: "One package shown large with its photos, facts and price.",
    schema: {
      fields: [
        { key: "packageSlug", label: "Package", type: "package", required: true, help: "Only published packages can be shown." },
        { key: "badge", label: "Badge on the photo", type: "text", max: 40 },
        { key: "title", label: "Headline", type: "text", max: 160, required: true, accent: true, help: ACCENT_HELP },
      ],
    },
  },
  "home.why": {
    title: "Why Traylborn",
    description: "The dark section with the reasons to travel with you.",
    schema: {
      fields: [
        ...headingFields.map((f) => (f.key === "description" ? { ...f, max: 400 } : f)),
        { key: "imageId", label: "Image", type: "image", required: true },
        {
          key: "pillars",
          label: "Reasons",
          type: "list",
          min: 1,
          max: 6,
          itemLabel: "Reason",
          fields: [
            { key: "icon", label: "Icon", type: "icon", required: true },
            { key: "title", label: "Title", type: "text", max: 80, required: true },
            { key: "body", label: "Text", type: "textarea", max: 300, required: true },
          ],
        },
      ],
    },
  },
  "home.final_cta": {
    title: "Closing call to action",
    description: "The large photo banner at the bottom of the homepage and the About page.",
    schema: {
      fields: [
        { key: "eyebrow", label: "Small line above the title", type: "text", max: 60 },
        { key: "title", label: "Title", type: "text", max: 160, required: true, accent: true, help: ACCENT_HELP },
        { key: "body", label: "Text", type: "textarea", max: 400 },
        { key: "imageId", label: "Background image", type: "image", required: true },
        { key: "ctaLabel", label: "Main button text", type: "text", max: 40 },
        { key: "ctaHref", label: "Main button link", type: "link" },
        { key: "whatsappLabel", label: "WhatsApp button text", type: "text", max: 40, help: "Leave empty to hide the WhatsApp button." },
        { key: "whatsappMessage", label: "WhatsApp pre-filled message", type: "text", max: 200 },
      ],
      pairs: [
        ["ctaLabel", "ctaHref"],
        ["whatsappLabel", "whatsappMessage"],
      ],
    },
  },
};

export function isSectionKey(value: unknown): value is SectionKey {
  return SECTION_KEYS.includes(value as SectionKey);
}

export { ICON_KEYS };
