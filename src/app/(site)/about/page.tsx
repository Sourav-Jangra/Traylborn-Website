import type { Metadata } from "next";
import Image from "next/image";
import { HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { PageHero } from "@/components/hero/page-hero";
import { SectionHeading, Accent } from "@/components/layout/section-heading";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { SharedFinalCta } from "@/components/home/final-cta";

export const metadata: Metadata = {
  title: "About us",
  description: "Traylborn is a Chandigarh-based travel company running small-group Himalayan treks, road trips and retreats — born of trails, made for journeys.",
};

const values = [
  { Icon: ShieldCheck, title: "Safety isn't a line item", body: "Safety is planned into every departure, from the route to the pace of the group." },
  { Icon: Users, title: "Capped groups, real people", body: "Bookings are capped at 25 travellers so everyone gets heard at the campfire — and nobody gets left at the back of the trail." },
  { Icon: HeartHandshake, title: "Clear pricing", body: "Inclusions and exclusions are spelled out on every journey page before you book." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title={<>Born of trails. <Accent className="text-ember-300">Made for journeys.</Accent></>}
        description="We're a Chandigarh-based team of trekkers, drivers, cooks and yoga teachers who believe the mountains are best shared — in small groups, done properly."
        image="/images/treks/sunrise-silhouette.jpg"
        imageAlt="Trekker silhouetted against a Himalayan sunrise"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      <section className="container-page py-16 sm:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <Reveal className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
              <Image src="/images/treks/homestay-group.jpg" alt="Traylborn group gathered outside a mountain homestay" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
            <div className="absolute -right-2 -bottom-6 w-44 overflow-hidden rounded-3xl border-4 border-background shadow-xl sm:-right-6 sm:w-56">
              <div className="relative aspect-square">
                <Image src="/images/gallery/campfire.jpg" alt="Campfire under the stars" fill sizes="224px" className="object-cover" />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow text-pine-600"><span className="h-px w-6 bg-pine-600" /> Why we exist</p>
            <h2 className="mt-3 text-[2rem] leading-[1.05] font-semibold sm:text-5xl">
              The mountains changed us. <Accent className="text-pine-700">We&apos;d like to return the favour.</Accent>
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-ink/75 sm:text-lg">
              <p>
                Traylborn started with a simple frustration: most group trips felt like conveyor belts. Big batches, vague itineraries,
                and surprise costs once you reached base camp.
              </p>
              <p>
                So we built the trips we wanted to go on — with clear itineraries, clear inclusions and a real person to talk to.
              </p>
              <p className="font-medium text-ink">Every journey still starts the same way — a real person picking up the phone.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-pine-950 py-16 text-white sm:py-24">
        <div className="container-page">
          <SectionHeading tone="light" eyebrow="What we stand for" title={<>Three promises, <Accent className="text-ember-300">every departure.</Accent></>} />
          <Stagger className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {values.map(({ Icon, title, body }) => (
              <StaggerItem key={title} className="rounded-[1.75rem] bg-white/5 p-6 ring-1 ring-white/10 sm:p-7">
                <Icon className="size-7 text-ember-400" aria-hidden="true" />
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <SharedFinalCta />
    </>
  );
}
