import Image from "next/image";
import { Compass, Headset, ReceiptIndianRupee, ShieldCheck } from "lucide-react";
import { Accent } from "@/components/layout/section-heading";
import { Reveal } from "@/components/ui/motion";

const pillars = [
  {
    Icon: Compass,
    title: "Diverse experiences",
    body: "Himalayan treks, winter road expeditions and yoga retreats — journeys for adventurers, wellness seekers and nature lovers.",
  },
  {
    Icon: ShieldCheck,
    title: "Safety & comfort first",
    body: "Safety is planned into every departure — from the route and the pace to the stays and transport.",
  },
  {
    Icon: ReceiptIndianRupee,
    title: "Transparent pricing",
    body: "Clear inclusions and exclusions on every journey page, so you know what you're paying for.",
  },
  {
    Icon: Headset,
    title: "Support, start to finish",
    body: "Packing lists before you go, help on the ground, and a real person on WhatsApp whenever you have a question.",
  },
];

export function WhyTraylborn() {
  return (
    <section aria-labelledby="why-heading" className="relative overflow-hidden bg-pine-950 py-20 text-white sm:py-28">
      <div className="container-page grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="eyebrow text-ember-400">
            <span className="h-px w-6 bg-ember-400" /> Why Traylborn
          </p>
          <h2 id="why-heading" className="mt-3 text-[2rem] leading-[1.05] font-semibold sm:text-5xl">
            Not just treks. <Accent className="text-ember-300">Life-changing</Accent> journeys.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
            Adventure designed for real explorers, planned by a Chandigarh-based team.
          </p>

          <Reveal className="relative mt-10 hidden aspect-[4/5] max-w-md overflow-hidden rounded-[2rem] lg:block">
            <Image
              src="/images/treks/homestay-group.jpg"
              alt="A Traylborn trekking group smiling outside a wooden mountain homestay"
              fill
              sizes="(min-width: 1024px) 30vw, 0px"
              className="object-cover"
            />
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pillars.map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.08} className="h-full">
                <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.07] sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-ember-500 text-ink">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-display text-sm text-white/40">0{i + 1}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-white/65">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
