"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence } from "framer-motion";
import { Check, Loader2, Mail, Phone, UserRound } from "lucide-react";
import { m } from "@/components/ui/motion";
import { TextField } from "@/components/forms/text-field";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { categories } from "@/lib/mock-data/categories";
import { whatsappLink } from "@/lib/mock-data/site";
import { cn } from "@/lib/utils";

const interests = [...categories.map((c) => c.label), "Private / corporate trip"];

type Errors = Partial<Record<"name" | "email" | "phone" | "message", string>>;

export function EnquiryForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", interest: interests[0], travellers: "2", month: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Please tell us your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid mobile number";
    if (form.message.trim().length < 10) next.message = "A line or two helps us plan better";
    setErrors(next);
    if (Object.keys(next).length) return;
    setStatus("sending");
    window.setTimeout(() => setStatus("sent"), 1200);
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white p-6 ring-1 ring-black/5 sm:p-10">
      <AnimatePresence mode="wait" initial={false}>
        {status === "sent" ? (
          <m.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-12 text-center" role="status">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-moss-500 text-white">
              <Check className="size-8" strokeWidth={3} />
            </span>
            <h3 className="mt-6 text-3xl font-semibold">Thanks, {form.name.split(" ")[0]}!</h3>
            <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
              This form isn&apos;t connected yet, so your enquiry hasn&apos;t been sent. Please send it to us on WhatsApp instead.
            </p>
            <a
              href={whatsappLink(
                `Hi Traylborn! I'm ${form.name.trim()}. Interested in: ${form.interest}. Travellers: ${form.travellers}.${form.month ? ` Month: ${form.month}.` : ""} ${form.message.trim()}`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-semibold text-white hover:bg-[#1fbb59]"
            >
              <WhatsappIcon className="size-4" /> Send on WhatsApp
            </a>
            <br />
            <button
              type="button"
              onClick={() => { setStatus("idle"); setForm((f) => ({ ...f, message: "" })); }}
              className="mt-8 inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-semibold hover:bg-sand-50"
            >
              Send another enquiry
            </button>
          </m.div>
        ) : (
          <m.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="text-2xl font-semibold sm:text-3xl">Plan your trip with us</h2>
            <p className="mt-1.5 text-muted-foreground">Tell us a little about the trip you have in mind.</p>

            <fieldset className="mt-7">
              <legend className="mb-2 text-sm font-medium text-ink">I&apos;m interested in</legend>
              <div className="flex flex-wrap gap-2">
                {interests.map((i) => (
                  <label key={i} className={cn("cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pine-600", form.interest === i ? "border-pine-800 bg-pine-800 text-white" : "border-border hover:border-pine-300")}>
                    <input type="radio" name="interest" value={i} checked={form.interest === i} onChange={() => set("interest", i)} className="sr-only" />
                    {i}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Your name" required autoComplete="name" icon={<UserRound className="size-4" />} value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} className="sm:col-span-2" />
              <TextField label="Email" type="email" required autoComplete="email" icon={<Mail className="size-4" />} value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
              <TextField label="Mobile (WhatsApp)" type="tel" required autoComplete="tel" icon={<Phone className="size-4" />} value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
              <TextField label="Travellers" type="number" min={1} max={25} value={form.travellers} onChange={(e) => set("travellers", e.target.value)} />
              <TextField label="Preferred month" type="month" value={form.month} onChange={(e) => set("month", e.target.value)} />
            </div>

            <div className="mt-4">
              <label htmlFor="enquiry-message" className="mb-1.5 block text-sm font-medium text-ink">
                What do you have in mind? <span className="text-ember-600">*</span>
              </label>
              <textarea
                id="enquiry-message"
                rows={4}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "enquiry-message-error" : undefined}
                placeholder="e.g. A 5-day snow trek in December for 4 friends, first time at altitude."
                className={cn(
                  "w-full rounded-xl border bg-white px-4 py-3 text-[0.95rem] outline-none focus:ring-4",
                  errors.message ? "border-destructive focus:ring-destructive/10" : "border-border focus:border-pine-600 focus:ring-pine-600/10",
                )}
              />
              {errors.message && <p id="enquiry-message-error" className="mt-1.5 text-xs text-destructive">{errors.message}</p>}
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-ember-500 px-8 font-semibold text-ink transition-colors hover:bg-ember-400 disabled:opacity-80 sm:w-auto"
            >
              {status === "sending" ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : "Send enquiry"}
            </button>
          </m.form>
        )}
      </AnimatePresence>
    </div>
  );
}
