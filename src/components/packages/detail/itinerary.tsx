"use client";

import { BedDouble, Footprints, Mountain, Utensils } from "lucide-react";
import type { ItineraryDay } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function Itinerary({ days }: { days: ItineraryDay[] }) {
  return (
    <Accordion type="multiple" defaultValue={["day-1"]} className="relative">
      <span aria-hidden="true" className="absolute top-6 bottom-6 left-[1.4rem] w-px bg-pine-200" />
      {days.map((d) => (
        <AccordionItem key={d.day} value={`day-${d.day}`} className="relative border-0">
          <AccordionTrigger className="items-center gap-4 py-3 hover:no-underline [&>svg]:size-5">
            <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-pine-800 font-display text-sm font-semibold text-white ring-4 ring-background">
              {String(d.day).padStart(2, "0")}
            </span>
            <span className="flex-1">
              <span className="block text-xs font-semibold tracking-wider text-pine-600 uppercase">Day {d.day}</span>
              <span className="block text-base font-semibold text-ink sm:text-lg">{d.title}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-5 pl-15">
            <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{d.description}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {d.altitude && <Meta icon={<Mountain className="size-3.5" />} text={d.altitude} />}
              {d.distance && <Meta icon={<Footprints className="size-3.5" />} text={d.distance} />}
              {d.stay && <Meta icon={<BedDouble className="size-3.5" />} text={d.stay} />}
              {d.meals && <Meta icon={<Utensils className="size-3.5" />} text={d.meals} />}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink/80">
      <span className="text-pine-600" aria-hidden="true">{icon}</span>
      {text}
    </li>
  );
}
