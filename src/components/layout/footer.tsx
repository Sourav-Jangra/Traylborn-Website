import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/brand/social-icons";
import { categories } from "@/lib/config/categories";
import { siteConfig } from "@/lib/config/site";
import { getFeaturedPackages } from "@/server/packages";

const company = [
  { label: "About Traylborn", href: "/about" },
  { label: "Offers", href: "/offers" },
  { label: "Contact", href: "/contact" },
  { label: "Search journeys", href: "/search" },
];

const socials = [
  { label: "Instagram", href: siteConfig.social.instagram, Icon: InstagramIcon },
  { label: "Facebook", href: siteConfig.social.facebook, Icon: FacebookIcon },
  { label: "YouTube", href: siteConfig.social.youtube, Icon: YoutubeIcon },
].filter((s): s is typeof s & { href: string } => Boolean(s.href));

export async function Footer() {
  const popular = (await getFeaturedPackages()).slice(0, 5);

  return (
    <footer className="bg-pine-950 text-white/75">
      <div className="container-page grid grid-cols-1 gap-12 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Logo tone="light" showTagline />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            Himalayan treks, road expeditions and mountain retreats — crafted in Chandigarh.
          </p>
          {socials.length > 0 && (
          <ul className="mt-6 flex gap-2">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-full bg-white/8 text-white transition-colors hover:bg-ember-500 hover:text-ink"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
          <FooterColumn title="Experiences">
            {categories.map((c) => (
              <FooterLink key={c.slug} href={c.href}>
                {c.label}
              </FooterLink>
            ))}
          </FooterColumn>
          <FooterColumn title="Popular">
            {popular.map((p) => (
              <FooterLink key={p.slug} href={`/packages/${p.slug}`}>
                {p.title.replace(" with Chandratal", "")}
              </FooterLink>
            ))}
          </FooterColumn>
          <FooterColumn title="Company">
            {company.map((c) => (
              <FooterLink key={c.href} href={c.href}>
                {c.label}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        <div className="lg:col-span-3">
          <h2 className="font-sans text-xs font-semibold tracking-[0.18em] text-white uppercase">Get in touch</h2>
          <ul className="mt-5 space-y-4 text-sm">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ember-400" />
              <address className="not-italic">
                {siteConfig.address.line1}
                <br />
                {siteConfig.address.city} {siteConfig.address.postalCode}
              </address>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0 text-ember-400" />
              <span className="flex flex-col">
                <a href={siteConfig.phoneHref} className="hover:text-white">{siteConfig.phone}</a>
                <a href={siteConfig.altPhoneHref} className="hover:text-white">{siteConfig.altPhone}</a>
              </span>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-ember-400" />
              <a href={`mailto:${siteConfig.email}`} className="break-all hover:text-white">{siteConfig.email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Traylborn. Born of Trails. Made for Journeys.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-sans text-xs font-semibold tracking-[0.18em] text-white uppercase">{title}</h2>
      <ul className="mt-5 space-y-3 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="transition-colors hover:text-white">
        {children}
      </Link>
    </li>
  );
}
