// Traveller details collected at checkout. The checkout form runs validateDetails for
// inline errors; the server runs parseDetails on whatever it receives and is the only
// authority on what gets stored.
import { MAX_PARTICIPANTS } from "./departures";

/** Form state: every field is the raw text the customer typed. */
export interface CompanionDetails {
  name: string;
  age: string;
  phone: string;
  email: string;
}

export interface TravellerDetails {
  name: string;
  age: string;
  email: string;
  phone: string;
  city: string;
  emergencyName: string;
  emergencyPhone: string;
  /** Everyone except the primary booker; length is the traveller count minus one. */
  companions: CompanionDetails[];
  notes: string;
}

export const emptyCompanion: CompanionDetails = { name: "", age: "", phone: "", email: "" };

export const emptyDetails: TravellerDetails = {
  name: "",
  age: "",
  email: "",
  phone: "",
  city: "",
  emergencyName: "",
  emergencyPhone: "",
  companions: [],
  notes: "",
};

/** Errors keyed by field path, e.g. "email" or "companions.2.age". */
export type DetailErrors = Record<string, string>;

export interface CleanTraveller {
  fullName: string;
  age: number;
  email: string | null;
  phone: string | null;
  city: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
}

export interface CleanDetails {
  /** Primary booker first. */
  travellers: CleanTraveller[];
  notes: string | null;
}

export const MIN_AGE = 1;
export const MAX_AGE = 100;
export const MAX_NOTES = 1000;
const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_PHONE = 32;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^\+?[\d\s()-]+$/;

const clean = (v: string) => v.trim().replace(/\s+/g, " ");

function nameError(v: string, label: string) {
  const n = clean(v);
  if (n.length < 2) return `Enter ${label}`;
  if (n.length > MAX_NAME) return `Use ${MAX_NAME} characters or fewer`;
}

function ageError(v: string) {
  const a = v.trim();
  if (!/^\d{1,3}$/.test(a) || Number(a) < MIN_AGE || Number(a) > MAX_AGE) return `Enter an age between ${MIN_AGE} and ${MAX_AGE}`;
}

function emailError(v: string) {
  const e = v.trim();
  if (e.length > MAX_EMAIL || !EMAIL.test(e)) return "Enter a valid email address";
}

function phoneError(v: string) {
  const p = v.trim();
  const digits = p.replace(/\D/g, "").length;
  if (p.length > MAX_PHONE || !PHONE_CHARS.test(p) || digits < 10 || digits > 15) return "Enter a valid phone number";
}

export function validateDetails(d: TravellerDetails): DetailErrors {
  const errors: DetailErrors = {};
  const check = (key: string, error: string | undefined) => {
    if (error) errors[key] = error;
  };
  check("name", nameError(d.name, "your full name"));
  check("age", ageError(d.age));
  check("email", emailError(d.email));
  check("phone", phoneError(d.phone));
  const city = clean(d.city);
  check("city", !city ? "Where will you be travelling from?" : city.length > MAX_NAME ? `Use ${MAX_NAME} characters or fewer` : undefined);
  check("emergencyName", nameError(d.emergencyName, "an emergency contact name"));
  check("emergencyPhone", phoneError(d.emergencyPhone));
  d.companions.forEach((c, i) => {
    check(`companions.${i}.name`, nameError(c.name, "their full name"));
    check(`companions.${i}.age`, ageError(c.age));
    if (c.phone.trim()) check(`companions.${i}.phone`, phoneError(c.phone));
    if (c.email.trim()) check(`companions.${i}.email`, emailError(c.email));
  });
  if (d.notes.trim().length > MAX_NOTES) errors.notes = `Use ${MAX_NOTES} characters or fewer`;
  return errors;
}

const isString = (v: unknown, max = 2000): v is string => typeof v === "string" && v.length <= max;

/** Narrows untrusted input to the form shape. Rejects anything with extra travellers or oversized fields. */
function toDetails(input: unknown): TravellerDetails | null {
  if (!input || typeof input !== "object") return null;
  const r = input as Record<string, unknown>;
  const fields = ["name", "age", "email", "phone", "city", "emergencyName", "emergencyPhone"] as const;
  if (!fields.every((f) => isString(r[f])) || !isString(r.notes, MAX_NOTES * 2)) return null;
  if (!Array.isArray(r.companions) || r.companions.length > MAX_PARTICIPANTS - 1) return null;
  const companions: CompanionDetails[] = [];
  for (const c of r.companions as unknown[]) {
    if (!c || typeof c !== "object") return null;
    const o = c as Record<string, unknown>;
    if (!isString(o.name) || !isString(o.age) || !isString(o.phone) || !isString(o.email)) return null;
    companions.push({ name: o.name, age: o.age, phone: o.phone, email: o.email });
  }
  return {
    name: r.name as string,
    age: r.age as string,
    email: r.email as string,
    phone: r.phone as string,
    city: r.city as string,
    emergencyName: r.emergencyName as string,
    emergencyPhone: r.emergencyPhone as string,
    companions,
    notes: r.notes as string,
  };
}

export type ParsedDetails = { ok: true; details: CleanDetails } | { ok: false; errors: DetailErrors };

/** Server-side: validates untrusted input and returns the values to store. */
export function parseDetails(input: unknown): ParsedDetails {
  const d = toDetails(input);
  if (!d) return { ok: false, errors: { form: "Traveller details are missing or not valid" } };
  const errors = validateDetails(d);
  if (Object.keys(errors).length) return { ok: false, errors };
  const optional = (v: string) => v.trim() || null;
  return {
    ok: true,
    details: {
      travellers: [
        {
          fullName: clean(d.name),
          age: Number(d.age.trim()),
          email: d.email.trim(),
          phone: d.phone.trim(),
          city: clean(d.city),
          emergencyName: clean(d.emergencyName),
          emergencyPhone: d.emergencyPhone.trim(),
        },
        ...d.companions.map((c) => ({
          fullName: clean(c.name),
          age: Number(c.age.trim()),
          email: optional(c.email),
          phone: optional(c.phone),
          city: null,
          emergencyName: null,
          emergencyPhone: null,
        })),
      ],
      notes: optional(d.notes),
    },
  };
}
