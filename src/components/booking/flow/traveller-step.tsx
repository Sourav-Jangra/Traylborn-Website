"use client";

import { Mail, Phone, UserRound } from "lucide-react";
import { TextField } from "@/components/forms/text-field";
import { emptyCompanion, MAX_AGE, MAX_NOTES, MIN_AGE, type CompanionDetails, type DetailErrors } from "@/lib/utils/booking-details";
import type { TravellerDetails } from "./types";

interface TravellerStepProps {
  details: TravellerDetails;
  participants: number;
  errors: DetailErrors;
  onChange: (patch: Partial<TravellerDetails>, changedKeys: string[]) => void;
}

const ageProps = { type: "number", inputMode: "numeric", min: MIN_AGE, max: MAX_AGE, placeholder: "Years" } as const;

export function TravellerStep({ details, participants, errors, onChange }: TravellerStepProps) {
  const companions = Array.from({ length: participants - 1 }, (_, i) => details.companions[i] ?? emptyCompanion);
  const set = (patch: Partial<TravellerDetails>) => onChange(patch, Object.keys(patch));
  const setCompanion = (i: number, patch: Partial<CompanionDetails>) => {
    const next = [...companions];
    next[i] = { ...next[i], ...patch };
    onChange({ companions: next }, Object.keys(patch).map((k) => `companions.${i}.${k}`));
  };

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="font-display text-xl font-semibold">Primary traveller</legend>
        <p className="mt-1 text-sm text-muted-foreground">The person making this booking. We&apos;ll contact you about the trip.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
          <TextField label="Full name" required autoComplete="name" icon={<UserRound className="size-4" />} value={details.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} placeholder="As per government ID" maxLength={120} />
          <TextField label="Age" required {...ageProps} value={details.age} onChange={(e) => set({ age: e.target.value })} error={errors.age} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Email" type="email" required autoComplete="email" icon={<Mail className="size-4" />} value={details.email} onChange={(e) => set({ email: e.target.value })} error={errors.email} placeholder="you@example.com" maxLength={254} />
          <TextField label="Mobile (WhatsApp)" type="tel" required autoComplete="tel" inputMode="tel" icon={<Phone className="size-4" />} value={details.phone} onChange={(e) => set({ phone: e.target.value })} error={errors.phone} placeholder="+91 98765 43210" maxLength={32} />
          <TextField label="City" required autoComplete="address-level2" value={details.city} onChange={(e) => set({ city: e.target.value })} error={errors.city} placeholder="e.g. Chandigarh" className="sm:col-span-2" maxLength={120} />
        </div>
      </fieldset>

      {companions.length > 0 && (
        <fieldset>
          <legend className="font-display text-xl font-semibold">Other travellers</legend>
          <p className="mt-1 text-sm text-muted-foreground">Name and age for everyone. Phone and email are optional.</p>
          <div className="mt-5 space-y-4">
            {companions.map((c, i) => (
              <div key={i} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                <p className="mb-3 text-sm font-semibold text-ink">Traveller {i + 2}</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
                  <TextField label="Full name" required value={c.name} onChange={(e) => setCompanion(i, { name: e.target.value })} error={errors[`companions.${i}.name`]} placeholder="As per government ID" maxLength={120} />
                  <TextField label="Age" required {...ageProps} value={c.age} onChange={(e) => setCompanion(i, { age: e.target.value })} error={errors[`companions.${i}.age`]} />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField label="Phone" type="tel" inputMode="tel" value={c.phone} onChange={(e) => setCompanion(i, { phone: e.target.value })} error={errors[`companions.${i}.phone`]} placeholder="Optional" maxLength={32} />
                  <TextField label="Email" type="email" value={c.email} onChange={(e) => setCompanion(i, { email: e.target.value })} error={errors[`companions.${i}.email`]} placeholder="Optional" maxLength={254} />
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="font-display text-xl font-semibold">Emergency contact</legend>
        <p className="mt-1 text-sm text-muted-foreground">Someone who isn&apos;t on the trip.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Contact name" required value={details.emergencyName} onChange={(e) => set({ emergencyName: e.target.value })} error={errors.emergencyName} placeholder="Parent, partner or friend" maxLength={120} />
          <TextField label="Contact number" required type="tel" inputMode="tel" value={details.emergencyPhone} onChange={(e) => set({ emergencyPhone: e.target.value })} error={errors.emergencyPhone} placeholder="+91" maxLength={32} />
        </div>
      </fieldset>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-ink">Medical or dietary notes</label>
        <textarea
          id="notes"
          rows={3}
          maxLength={MAX_NOTES}
          value={details.notes}
          onChange={(e) => set({ notes: e.target.value })}
          aria-invalid={!!errors.notes}
          placeholder="Optional: dietary needs, medical conditions, first high-altitude trek…"
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[0.95rem] outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10"
        />
        {errors.notes && <p className="mt-1.5 text-xs text-destructive">{errors.notes}</p>}
      </div>
    </div>
  );
}
