"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Phone, UserRound } from "lucide-react";
import { TextField } from "@/components/forms/text-field";
import { Divider, GoogleButton, PasswordField, PrototypeNote } from "./auth-parts";
import { cn } from "@/lib/utils";

type Field = "name" | "email" | "phone" | "password" | "terms";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const strengthLabel = ["Too short", "Weak", "Okay", "Good", "Strong"];

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", terms: false });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [loading, setLoading] = useState(false);
  const score = strength(form.password);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const create = () => {
    setLoading(true);
    window.setTimeout(() => router.push("/my-trips"), 1000);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (form.name.trim().length < 2) next.name = "Please enter your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid mobile number";
    if (form.password.length < 8) next.password = "Use at least 8 characters";
    if (!form.terms) next.terms = "Please accept the terms to continue";
    setErrors(next);
    if (!Object.keys(next).length) create();
  };

  return (
    <>
      <h1 className="text-4xl font-semibold">Create your account</h1>
      <p className="mt-2 text-muted-foreground">Faster checkout, trip reminders and every invoice in one place.</p>

      <div className="mt-6">
        <GoogleButton label="Sign up with Google" onClick={create} />
      </div>
      <Divider />

      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Full name" required autoComplete="name" icon={<UserRound className="size-4" />} value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Email" type="email" required autoComplete="email" icon={<Mail className="size-4" />} value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
          <TextField label="Mobile" type="tel" required autoComplete="tel" icon={<Phone className="size-4" />} value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
        </div>
        <div>
          <PasswordField value={form.password} onChange={(v) => set("password", v)} error={errors.password} autoComplete="new-password" />
          {form.password && !errors.password && (
            <div className="mt-2 flex items-center gap-3" aria-live="polite">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={cn("h-1 flex-1 rounded-full", i < score ? (score < 2 ? "bg-destructive" : score < 3 ? "bg-ember-500" : "bg-moss-500") : "bg-border")} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{strengthLabel[score]}</span>
            </div>
          )}
        </div>
        <label className={cn("flex items-start gap-3 text-sm", errors.terms && "text-destructive")}>
          <input type="checkbox" checked={form.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-0.5 size-4 accent-pine-800" aria-invalid={!!errors.terms} />
          <span>I agree to Traylborn&apos;s terms and privacy policy, and I&apos;m happy to receive trip updates on WhatsApp.</span>
        </label>
        <button type="submit" disabled={loading} className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-pine-800 font-semibold text-white transition-colors hover:bg-pine-700 disabled:opacity-80">
          {loading ? <><Loader2 className="size-4 animate-spin" /> Creating account…</> : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-pine-800 hover:underline">Sign in</Link>
      </p>
      <PrototypeNote />
    </>
  );
}
