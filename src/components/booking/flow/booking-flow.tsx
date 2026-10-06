"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { m, EASE } from "@/components/ui/motion";
import type { Departure } from "@/lib/utils/departures";
import { quotePrice, type PaymentPlan } from "@/lib/utils/pricing";
import { formatPrice } from "@/lib/utils/format";
import { emptyCompanion, validateDetails, type DetailErrors } from "@/lib/utils/booking-details";
import { createBookingAction } from "@/app/(checkout)/book/[slug]/actions";
import { DateSelector } from "../date-selector";
import { ParticipantSelector } from "../participant-selector";
import { PriceOptionSelector } from "../price-option-selector";
import { Stepper } from "./stepper";
import { OrderSummaryCard } from "./order-summary-card";
import { TravellerStep } from "./traveller-step";
import { ConfirmButton, ReviewStep } from "./review-step";
import { emptyDetails, STEPS, type CheckoutPackage, type TravellerDetails } from "./types";

interface BookingFlowProps {
  pkg: CheckoutPackage;
  departures: Departure[];
  initialDate: string | null;
  initialParticipants: number;
  initialOptionId: number;
  /** Generated per page load so a resubmitted request can't create a second booking. */
  idempotencyKey: string;
}

const stepTitles = [
  { title: "Choose your departure", sub: "Pick a date and tell us how many are coming." },
  { title: "Who's travelling?", sub: "A few details so your trek leader knows who to expect." },
  { title: "Review your trip", sub: "Check everything looks right, then confirm your booking." },
];

export function BookingFlow({ pkg, departures, initialDate, initialParticipants, initialOptionId, idempotencyKey }: BookingFlowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(initialDate ? 1 : 0);
  const [date, setDate] = useState<string | null>(initialDate);
  const [participants, setParticipants] = useState(initialParticipants);
  const [optionId, setOptionId] = useState(initialOptionId);
  const [plan, setPlan] = useState<PaymentPlan>("full");
  const [details, setDetails] = useState<TravellerDetails>(emptyDetails);
  const [errors, setErrors] = useState<DetailErrors>({});
  const [dateError, setDateError] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const options = pkg.pricing.priceOptions;
  const quote = useMemo(() => {
    const full = quotePrice(pkg.pricing, { optionId, travellers: participants });
    // Switching option or travellers can make the advance unavailable; fall back to full.
    return plan === "advance" && full.advance !== null
      ? quotePrice(pkg.pricing, { optionId, travellers: participants, plan })
      : full;
  }, [pkg.pricing, optionId, participants, plan]);

  // Companion entries beyond the current traveller count are kept in state (in case the
  // count goes back up) but never validated or submitted.
  const travellers = useMemo<TravellerDetails>(
    () => ({ ...details, companions: Array.from({ length: participants - 1 }, (_, i) => details.companions[i] ?? emptyCompanion) }),
    [details, participants],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const next = () => {
    if (step === 0) {
      if (!date) return setDateError(true);
      setStep(1);
    } else if (step === 1) {
      const e = validateDetails(travellers);
      setErrors(e);
      if (Object.keys(e).length) {
        document.querySelector<HTMLInputElement>("[aria-invalid='true']")?.focus();
        return;
      }
      setSubmitError(null);
      setStep(2);
    }
  };

  const confirm = () => {
    if (!date || pending) return;
    setSubmitError(null);
    startTransition(async () => {
      const result = await createBookingAction({
        slug: pkg.slug,
        departureDate: date,
        optionId: quote.option.id ?? null,
        plan: quote.plan,
        expectedTotal: quote.total,
        expectedPayNow: quote.payNow,
        idempotencyKey,
        details: travellers,
      });
      if (result.ok) {
        router.push(result.path);
        return;
      }
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        setStep(1);
        return;
      }
      setSubmitError(result.error);
    });
  };

  return (
    <div className="container-page pt-6 pb-32 sm:pt-10 lg:pb-20">
      <div className="mx-auto max-w-6xl">
        <Link
          href={step === 0 ? `/packages/${pkg.slug}` : "#"}
          onClick={(e) => {
            if (step > 0) {
              e.preventDefault();
              setStep(step - 1);
            }
          }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-ink"
        >
          <ArrowLeft className="size-4" /> {step === 0 ? "Back to journey" : `Back to ${STEPS[step - 1].toLowerCase()}`}
        </Link>

        <div className="mt-5 max-w-2xl">
          <Stepper step={step} onStepClick={setStep} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
          <div className="min-w-0">
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-semibold outline-none sm:text-4xl">
              {stepTitles[step].title}
            </h1>
            <p className="mt-2 text-muted-foreground">{stepTitles[step].sub}</p>

            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="mt-8"
              >
                {step === 0 && (
                  <div className="space-y-6">
                    <div className="rounded-[1.75rem] bg-white p-4 ring-1 ring-black/5 sm:p-6">
                      <DateSelector
                        departures={departures}
                        value={date}
                        onChange={(d) => {
                          setDate(d);
                          setDateError(false);
                        }}
                        durationDays={pkg.durationDays}
                        ruleLabel={pkg.departureLabel}
                      />
                      {dateError && (
                        <p role="alert" className="mt-3 text-sm text-destructive">Please choose a departure date to continue.</p>
                      )}
                    </div>
                    {options.length > 1 && (
                      <div>
                        <p className="mb-3 font-semibold text-ink">Choose an option</p>
                        <PriceOptionSelector options={options} value={optionId} onChange={setOptionId} />
                      </div>
                    )}
                    <ParticipantSelector value={participants} onChange={setParticipants} />
                  </div>
                )}
                {step === 1 && (
                  <TravellerStep
                    details={details}
                    participants={participants}
                    errors={errors}
                    onChange={(patch, changedKeys) => {
                      setDetails((d) => ({ ...d, ...patch }));
                      setErrors((e) => {
                        const copy = { ...e };
                        for (const k of changedKeys) delete copy[k];
                        return copy;
                      });
                    }}
                  />
                )}
                {step === 2 && date && (
                  <ReviewStep
                    pkg={pkg}
                    date={date}
                    details={travellers}
                    quote={quote}
                    onPlanChange={setPlan}
                    onEdit={setStep}
                    onConfirm={confirm}
                    pending={pending}
                    error={submitError}
                  />
                )}
              </m.div>
            </AnimatePresence>

            {step < 2 && (
              <div className="mt-10 hidden items-center justify-between gap-4 border-t border-border pt-6 lg:flex">
                <p className="text-sm text-muted-foreground">
                  Total <span className="font-display text-xl font-semibold text-ink">{formatPrice(quote.total)}</span>
                </p>
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex h-13 items-center gap-2 rounded-full bg-ember-500 px-8 font-semibold text-ink transition-colors hover:bg-ember-400"
                >
                  Continue <ArrowRight className="size-4" />
                </button>
              </div>
            )}
          </div>

          <aside aria-label="Order summary" className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummaryCard pkg={pkg} date={date} quote={quote} />
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {quote.plan === "advance" ? `Advance now · total ${formatPrice(quote.total)}` : `${participants} × ${formatPrice(quote.option.price)}`}
            </p>
            <p className="font-display text-xl font-semibold text-ink">{formatPrice(quote.payNow)}</p>
          </div>
          {step === 2 && date ? (
            <ConfirmButton onClick={confirm} pending={pending} className="h-12 shrink-0 px-6 text-sm" />
          ) : (
            <button
              type="button"
              onClick={next}
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-ember-500 px-6 text-sm font-semibold text-ink"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
