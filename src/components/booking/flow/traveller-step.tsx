"use client";

import { Mail, Phone, UserRound } from "lucide-react";
import { TextField } from "@/components/forms/text-field";
import type { TravellerDetails } from "./types";

export type DetailErrors = Partial<Record<keyof TravellerDetails, string>>;

export function validateDetails(d: TravellerDetails): DetailErrors {
  const e: DetailErrors = {};
  if (d.name.trim().length < 2) e.name = "Please enter your full name";
  if (!/^\S+@\S+\.\S+$/.test(d.email)) e.email = "Enter a valid email address";
  if (d.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid 10-digit mobile number";
  if (!d.city.trim()) e.city = "Where will you be travelling from?";
  if (d.emergencyPhone && d.emergencyPhone.replace(/\D/g, "").length < 10) e.emergencyPhone = "Enter a valid number";
  return e;
}

interface TravellerStepProps {
  details: TravellerDetails;
  participants: number;
  errors: DetailErrors;
  onChange: (patch: Partial<TravellerDetails>) => void;
}

export function TravellerStep({ details, participants, errors, onChange }: TravellerStepProps) {
  const companions = Array.from({ length: participants - 1 }, (_, i) => details.companions[i] ?? "");

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="font-display text-xl font-semibold">Lead traveller</legend>
        <p className="mt-1 text-sm text-muted-foreground">How we can reach you about this trip.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Full name" required autoComplete="name" icon={<UserRound className="size-4" />} value={details.name} onChange={(e) => onChange({ name: e.target.value })} error={errors.name} placeholder="As per government ID" className="sm:col-span-2" />
          <TextField label="Email" type="email" required autoComplete="email" icon={<Mail className="size-4" />} value={details.email} onChange={(e) => onChange({ email: e.target.value })} error={errors.email} placeholder="you@example.com" />
          <TextField label="Mobile (WhatsApp)" type="tel" required autoComplete="tel" inputMode="tel" icon={<Phone className="size-4" />} value={details.phone} onChange={(e) => onChange({ phone: e.target.value })} error={errors.phone} placeholder="+91 98765 43210" />
          <TextField label="City" required autoComplete="address-level2" value={details.city} onChange={(e) => onChange({ city: e.target.value })} error={errors.city} placeholder="e.g. Chandigarh" className="sm:col-span-2" />
        </div>
      </fieldset>

      {participants > 1 && (
        <fieldset>
          <legend className="font-display text-xl font-semibold">Co-travellers</legend>
          <p className="mt-1 text-sm text-muted-foreground">Optional.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {companions.map((name, i) => (
              <TextField
                key={i}
                label={`Traveller ${i + 2}`}
                value={name}
                placeholder="Full name"
                onChange={(e) => {
                  const next = [...companions];
                  next[i] = e.target.value;
                  onChange({ companions: next });
                }}
              />
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="font-display text-xl font-semibold">Emergency contact</legend>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Contact name" value={details.emergencyName} onChange={(e) => onChange({ emergencyName: e.target.value })} placeholder="Parent, partner or friend" />
          <TextField label="Contact number" type="tel" inputMode="tel" value={details.emergencyPhone} onChange={(e) => onChange({ emergencyPhone: e.target.value })} error={errors.emergencyPhone} placeholder="+91" />
        </div>
      </fieldset>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-ink">Anything we should know?</label>
        <textarea
          id="notes"
          rows={3}
          value={details.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Dietary needs, medical conditions, first high-altitude trek…"
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[0.95rem] outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10"
        />
      </div>
    </div>
  );
}
