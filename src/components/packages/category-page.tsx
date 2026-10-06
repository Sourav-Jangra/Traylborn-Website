import Link from "next/link";
import type { Category } from "@/lib/types";
import { PageHero } from "@/components/hero/page-hero";
import { PackageListing } from "./package-listing";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { categoryMeta, categories } from "@/lib/mock-data/categories";
import { getPackagesByCategory } from "@/server/packages";
import { whatsappLink } from "@/lib/mock-data/site";
import { cn } from "@/lib/utils";

export async function CategoryPage({ category }: { category: Category }) {
  const meta = categoryMeta[category];
  const list = await getPackagesByCategory(category);
  const rated = list.filter((p) => p.reviewCount > 0);
  const stats = [
    { label: "Journeys", value: list.length },
    list.length > 0 && { label: "Starting from", value: `₹${Math.min(...list.map((p) => p.price)).toLocaleString("en-IN")}` },
    rated.length > 0 && { label: "Avg. rating", value: `${(rated.reduce((s, p) => s + p.rating, 0) / rated.length).toFixed(1)} ★` },
  ].filter((s) => s !== false);

  return (
    <>
      <PageHero
        eyebrow={list.length > 0 ? meta.eyebrow : `${meta.eyebrow} · Coming soon`}
        title={meta.headline}
        description={
          list.length > 0
            ? meta.description
            : `${meta.description} New ${meta.label.toLowerCase()} will be listed here soon.`
        }
        image={meta.image}
        imageAlt={meta.imageAlt}
        breadcrumb={[{ label: "Home", href: "/" }, { label: meta.label }]}
      >
        {list.length > 0 && (
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-6">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="text-xs tracking-wider text-white/60 uppercase">{s.label}</dt>
                <dd className="order-first font-display text-2xl font-semibold sm:text-3xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </PageHero>

      <nav aria-label="Experience types" className="border-b border-border bg-white">
        <ul className="container-page scrollbar-none flex gap-2 overflow-x-auto py-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={c.href}
                aria-current={c.slug === category ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold whitespace-nowrap transition-colors",
                  c.slug === category ? "bg-pine-800 text-white" : "text-ink/70 hover:bg-sand-100 hover:text-ink",
                )}
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {list.length === 0 ? (
        <section aria-label={`${meta.label} coming soon`} className="container-page py-16 sm:py-24">
          <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[2rem] bg-sand-100 p-8 text-center sm:p-12">
            <p className="eyebrow text-pine-600">
              <span className="h-px w-6 bg-pine-600" /> Coming soon
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{meta.label} are on their way</h2>
            <p className="mt-3 text-muted-foreground">
              We&apos;re finalising our {meta.label.toLowerCase()} for the season. Message us on WhatsApp or send an enquiry and we&apos;ll share
              upcoming plans as soon as they&apos;re ready.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink(`Hi Traylborn! I'm interested in your upcoming ${meta.label.toLowerCase()}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-pine-800 px-6 text-sm font-semibold text-white hover:bg-pine-700"
              >
                <WhatsappIcon className="size-4" /> Ask on WhatsApp
              </a>
              <Link href="/contact" className="inline-flex h-12 items-center justify-center rounded-full border border-pine-800/20 px-6 text-sm font-semibold text-pine-800 hover:bg-white">
                Send an enquiry
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section aria-label={`${meta.label} list`} className="container-page py-10 sm:py-14">
            <PackageListing packages={list} label={meta.label} />
          </section>

          <section className="container-page pb-20 sm:pb-28">
            <div className="flex flex-col justify-center rounded-[2rem] bg-sand-100 p-7 sm:p-10">
              <p className="eyebrow text-pine-600">
                <span className="h-px w-6 bg-pine-600" /> Plan with us
              </p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Can&apos;t find the right dates?</h2>
              <p className="mt-3 text-muted-foreground">
                Tell us what you have in mind and we&apos;ll help you find the right journey.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappLink(`Hi Traylborn! I'm looking for a private ${meta.singular.toLowerCase()}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-pine-800 px-6 text-sm font-semibold text-white hover:bg-pine-700"
                >
                  <WhatsappIcon className="size-4" /> Plan on WhatsApp
                </a>
                <Link href="/contact" className="inline-flex h-12 items-center justify-center rounded-full border border-pine-800/20 px-6 text-sm font-semibold text-pine-800 hover:bg-white">
                  Send an enquiry
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
