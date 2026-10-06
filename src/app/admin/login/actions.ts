"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/server/auth/session";

export type LoginState = { error: string | null; email: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return { error: "Enter your email and password.", email: typeof email === "string" ? email : "" };
  }

  const result = await signIn(email, password);
  if (!result.ok) {
    return {
      error:
        result.reason === "throttled"
          ? "Too many failed attempts. Please wait 15 minutes and try again."
          : "That email and password don't match.",
      email,
    };
  }
  redirect("/admin");
}

export async function logoutAction() {
  await signOut();
  redirect("/admin/login");
}
