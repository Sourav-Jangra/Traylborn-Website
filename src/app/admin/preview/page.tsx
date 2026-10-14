import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/layout/footer";
import { HomeSections } from "@/components/home/home-sections";
import { requireAdmin } from "@/server/auth/session";

export const metadata = { title: "Homepage preview" };

export default async function HomepagePreviewPage() {
  await requireAdmin();
  return (
    <>
      <Navbar />
      <main id="main" className="flex-1">
        <HomeSections preview />
      </main>
      <Footer />
      <div className="fixed inset-x-0 bottom-0 z-[60] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-ink/95 px-4 py-2.5 text-xs text-white backdrop-blur">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Eye className="size-3.5" aria-hidden="true" /> Admin preview
        </span>
        <span className="text-white/70">Hidden slides, promotions and sections are shown with an orange label.</span>
        <Link href="/admin/content" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
          <ArrowLeft className="size-3.5" aria-hidden="true" /> Back to editing
        </Link>
      </div>
    </>
  );
}
