import { redirect } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { verifySession } from "@/server/auth/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await verifySession()) redirect("/admin");

  return (
    <main id="main" className="grid min-h-svh place-items-center bg-[#f4f5f3] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5 text-pine-900">
          <LogoMark className="size-8" />
          <span className="font-display text-xl font-bold tracking-[0.12em]">TRAYLBORN</span>
        </div>
        <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5 sm:p-8">
          <h1 className="font-display text-2xl font-semibold">Admin sign in</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">For Traylborn staff only.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
