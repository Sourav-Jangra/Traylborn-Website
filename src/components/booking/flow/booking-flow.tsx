"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { m, EASE } from "@/components/ui/motion";
import type { Departure } from "@/lib/utils/departures";
import { calculatePrice } from "@/lib/utils/pricing";
import { formatPrice } from "@/lib/utils/format";
import { demoCustomer } from "@/lib/mock-data/bookings";
import { DateSelector } from "../date-selector";
import { ParticipantSelector } from "../participant-selector";
import { Stepper } from "./stepper";
import { OrderSummaryCard } from "./order-summary-card";
import { TravellerStep, validateDetails, type DetailErrors } from "./traveller-step";
import { ReviewStep } from "./review-step";
import { PaymentStep } from "./payment-step";
import { Confirmation } from "./confirmation";
import { emptyDetails, STEPS, type CheckoutPackage, type TravellerDetails } from "./types";

interface BookingFlowProps {
  pkg: CheckoutPackage;
  departures: Departure[];
  initialDate: string | null;
  initialParticipants: number;
}

const stepTitles = [
  { title: "Choose your departure", sub: "Pick a date and tell us how many are coming." },
  { title: "Who's travelling?", sub: "A few details so your trek leader knows who to expect." },
  { title: "Review your booking", sub: "Check everything looks right before payment." },
  { title: "Payment", sub: "Choose how you'd like to pay." },
];

export function BookingFlow({ pkg, departures, initialDate, initialParticipants }: BookingFlowProps) {
  const [step, setStep] = useState(initialDate ? 1 : 0);
  const [date, setDate] = useState<string | null>(initialDate);
  const [participants, setParticipants] = useState(initialParticipants);
  const [details, setDetails] = useState<TravellerDetails>(emptyDetails);
  const [errors, setErrors] = useState<DetailErrors>({});
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const breakdown = useMemo(() => calculatePrice(pkg.price, participants), [pkg.price, participants]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step, bookingId]);

  const next = () => {
    if (step === 0) {
      if (!date) return setDateError(true);
      setStep(1);
    } else if (step === 1) {
      const e = validateDetails(details);
      setErrors(e);
      if (Object.keys(e).length) {
        document.querySelector<HTMLInputElement>("[aria-invalid='true']")?.focus();
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!agreed) return setAgreeError(true);
      setStep(3);
    }
  };

  const pay = () => {
    setProcessing(true);
    window.setTimeout(() => {
      setBookingId(`TRB-2026-${String(10000 + Math.floor(Math.random() * 89999))}`);
      setProcessing(false);
    }, 1800);
  };

  if (bookingId && date) {
    return (
      <Confirmation bookingId={bookingId} pkg={pkg} date={date} details={details} breakdown={breakdown} />
    );
  }

  const ctaLabel = step === 2 ? "Continue to payment" : "Continue";

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
                    <ParticipantSelector value={participants} onChange={setParticipants} />
                  </div>
                )}
                {step === 1 && (
                  <TravellerStep
                    details={details}
                    participants={participants}
                    errors={errors}
                    onChange={(patch) => {
                      setDetails((d) => ({ ...d, ...patch }));
                      setErrors((e) => {
                        const copy = { ...e };
                        for (const k of Object.keys(patch)) delete copy[k as keyof TravellerDetails];
                        return copy;
                      });
                    }}
                    onPrefill={() => {
                      setDetails((d) => ({
                        ...d,
                        name: demoCustomer.name,
                        email: demoCustomer.email,
                        phone: demoCustomer.phone,
                        city: demoCustomer.city,
                      }));
                      setErrors({});
                    }}
                  />
                )}
                {step === 2 && date && (
                  <ReviewStep
                    pkg={pkg}
                    date={date}
                    details={details}
                    breakdown={breakdown}
                    agreed={agreed}
                    onAgree={(v) => {
                      setAgreed(v);
                      setAgreeError(false);
                    }}
                    agreeError={agreeError}
                    onEdit={setStep}
                  />
                )}
                {step === 3 && <PaymentStep amount={breakdown.total} processing={processing} onPay={pay} />}
              </m.div>
            </AnimatePresence>

            {step < 3 && (
              <div className="mt-10 hidden items-center justify-between gap-4 border-t border-border pt-6 lg:flex">
                <p className="text-sm text-muted-foreground">
                  Total <span className="font-display text-xl font-semibold text-ink">{formatPrice(breakdown.total)}</span>
                </p>
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex h-13 items-center gap-2 rounded-full bg-ember-500 px-8 font-semibold text-ink transition-colors hover:bg-ember-400"
                >
                  {ctaLabel} <ArrowRight className="size-4" />
                </button>
              </div>
            )}
          </div>

          <aside aria-label="Order summary" className="lg:sticky lg:top-24 lg:self-start">
            <OrderSummaryCard pkg={pkg} date={date} breakdown={breakdown} />
          </aside>
        </div>
      </div>

      {step < 3 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {participants} × {formatPrice(pkg.price)}
              </p>
              <p className="font-display text-xl font-semibold text-ink">{formatPrice(breakdown.total)}</p>
            </div>
            <button
              type="button"
              onClick={next}
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-ember-500 px-6 text-sm font-semibold text-ink"
            >
              {step === 2 ? "Pay" : "Continue"} <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
