"use client";

import type { FAQ } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FaqList({ faqs }: { faqs: FAQ[] }) {
  return (
    <Accordion type="single" collapsible className="overflow-hidden rounded-3xl bg-white px-5 ring-1 ring-black/5 sm:px-7">
      {faqs.map((f, i) => (
        <AccordionItem key={f.question} value={`faq-${i}`}>
          <AccordionTrigger className="py-5 text-base font-semibold text-ink hover:no-underline">{f.question}</AccordionTrigger>
          <AccordionContent className="pb-5 text-[0.95rem] leading-relaxed text-muted-foreground">{f.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
