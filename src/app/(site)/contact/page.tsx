import type { Metadata } from "next";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { EnquiryForm } from "@/components/contact/enquiry-form";
import { WhatsappIcon, InstagramIcon, FacebookIcon, YoutubeIcon } from "@/components/brand/social-icons";
import { Accent } from "@/components/layout/section-heading";
import { siteConfig, whatsappLink } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Traylborn — call, WhatsApp, email or visit us at Sector 17C, Chandigarh to plan your next trek, road trip or retreat.",
};

const socials = [
  { Icon: InstagramIcon, label: "Instagram", href: siteConfig.social.instagram },
  { Icon: FacebookIcon, label: "Facebook", href: siteConfig.social.facebook },
  { Icon: YoutubeIcon, label: "YouTube", href: siteConfig.social.youtube },
].filter((s): s is typeof s & { href: string } => Boolean(s.href));

const channels = [
  { Icon: WhatsappIcon, label: "WhatsApp", value: siteConfig.phone, note: "Message us on WhatsApp", href: whatsappLink(), external: true },
  { Icon: Phone, label: "Call us", value: siteConfig.phone, note: `Also ${siteConfig.altPhone}`, href: siteConfig.phoneHref },
  { Icon: Mail, label: "Email", value: siteConfig.email, note: "Write to us", href: `mailto:${siteConfig.email}` },
];

export default function ContactPage() {
  return (
    <>
      <section className="pt-28 pb-10 sm:pt-36 sm:pb-14">
        <div className="container-page">
          <p className="eyebrow text-pine-600"><span className="h-px w-6 bg-pine-600" /> Contact</p>
          <h1 className="mt-3 max-w-3xl text-[2.6rem] leading-[0.98] font-semibold tracking-[-0.03em] sm:text-6xl lg:text-7xl">
            Talk to <Accent className="text-pine-700">Traylborn.</Accent>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Real people, not a call centre. Whether you&apos;re choosing your first trek or planning a team offsite, we&apos;ll help you find the right trail.
          </p>
        </div>
      </section>

      <section className="container-page pb-16 sm:pb-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10">
          <EnquiryForm />

          <div className="space-y-4">
            <ul className="space-y-3">
              {channels.map(({ Icon, label, value, note, href, external }) => (
                <li key={label}>
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex items-center gap-4 rounded-[1.5rem] bg-white p-5 ring-1 ring-black/5 transition-shadow hover:shadow-lg hover:shadow-pine-900/5"
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-pine-50 text-pine-700 transition-colors group-hover:bg-pine-800 group-hover:text-white">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold tracking-wider text-pine-600 uppercase">{label}</span>
                      <span className="block truncate font-semibold text-ink">{value}</span>
                      <span className="block text-sm text-muted-foreground">{note}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-black/5">
              <div className="relative h-44">
                <Image src="/images/road-trips/mountain-road.jpg" alt="" fill sizes="(min-width: 1024px) 35vw, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-pine-950/35" />
                <span className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ember-500 text-ink shadow-xl ring-8 ring-ember-500/25">
                  <MapPin className="size-5" aria-hidden="true" />
                </span>
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <p className="text-xs font-semibold tracking-wider text-pine-600 uppercase">Visit our office</p>
                  <address className="mt-1 not-italic font-semibold text-ink">
                    {siteConfig.address.line1}, {siteConfig.address.city} {siteConfig.address.postalCode}
                  </address>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${siteConfig.address.line1}, ${siteConfig.address.city}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-sm font-semibold text-pine-800 underline underline-offset-4"
                >
                  Get directions
                </a>
              </div>
            </div>

            {socials.length > 0 && (
              <div className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-pine-950 p-5 text-white">
                <p className="text-sm font-medium">Follow the trail</p>
                <div className="flex gap-2">
                  {socials.map(({ Icon, label, href }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                      <Icon className="size-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
