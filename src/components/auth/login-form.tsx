"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { TextField } from "@/components/forms/text-field";
import { demoCustomer } from "@/lib/mock-data/bookings";
import { Divider, GoogleButton, PasswordField, PrototypeNote } from "./auth-parts";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const signIn = () => {
    setLoading(true);
    window.setTimeout(() => router.push("/my-trips"), 900);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email";
    if (password.length < 6) next.password = "Password must be at least 6 characters";
    setErrors(next);
    if (!Object.keys(next).length) signIn();
  };

  return (
    <>
      <h1 className="text-4xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">Sign in to manage your trips, invoices and travel credits.</p>

      <div className="mt-8">
        <GoogleButton label="Continue with Google" onClick={signIn} />
      </div>
      <Divider />

      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Email" type="email" required autoComplete="email" icon={<Mail className="size-4" />} value={email} onChange={(e) => { setEmail(e.target.value); setErrors((x) => ({ ...x, email: undefined })); }} error={errors.email} placeholder="you@example.com" />
        <PasswordField value={password} onChange={(v) => { setPassword(v); setErrors((x) => ({ ...x, password: undefined })); }} error={errors.password} autoComplete="current-password" />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="size-4 accent-pine-800" /> Remember me
          </label>
          <button type="button" className="font-semibold text-pine-800 hover:underline">Forgot password?</button>
        </div>
        <button type="submit" disabled={loading} className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-pine-800 font-semibold text-white transition-colors hover:bg-pine-700 disabled:opacity-80">
          {loading ? <><Loader2 className="size-4 animate-spin" /> Signing in…</> : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => { setEmail(demoCustomer.email); setPassword("trailblazer"); signIn(); }}
          className="h-12 w-full rounded-full border border-dashed border-pine-300 text-sm font-semibold text-pine-800 hover:bg-pine-50"
        >
          Explore with demo account
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to Traylborn?{" "}
        <Link href="/register" className="font-semibold text-pine-800 hover:underline">Create an account</Link>
      </p>
      <PrototypeNote />
    </>
  );
}
