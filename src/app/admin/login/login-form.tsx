"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const field =
  "mt-1.5 block h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-pine-600/40";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, { error: null, email: "" });

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.email} className={field} />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={field} />
      </div>
      {state.error && (
        <p role="alert" className="rounded-xl bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-pine-800 text-sm font-semibold text-white transition-colors hover:bg-pine-700 disabled:opacity-70"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Sign in
      </button>
    </form>
  );
}
