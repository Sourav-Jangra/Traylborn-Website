"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Download,
  Gift,
  MapPin,
  Mountain,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import type { Booking, Category } from "@/lib/types";
import { StatusBadge } from "@/components/booking/status-badge";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { CopyCode } from "@/components/offers/copy-code";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addDays, formatDate, formatDateLong, formatPrice, parseISODate } from "@/lib/utils/format";
import { todayISO } from "@/lib/utils/departures";
import { whatsappLink } from "@/lib/mock-data/site";
import { cn } from "@/lib/utils";

export interface TripView extends Booking {
  image: string;
  durationDays: number;
  startingPoint: string;
  category: Category;
}

interface Customer {
  name: string;
  firstName: string;
  email: string;
  phone: string;
  city: string;
  memberSince: string;
  tripsCompleted: number;
  travelCredits: number;
}

const checklistItems = ["Booking confirmed", "Fitness plan started", "ID proof uploaded", "Medical form", "Gear checklist"];

export function MyTripsDashboard({ customer, trips: initialTrips }: { customer: Customer; trips: TripView[] }) {
  const [trips, setTrips] = useState(initialTrips);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [checklist, setChecklist] = useState([true, true, false, false, false]);
  const today = todayISO();

  const upcoming = trips.filter((t) => t.status !== "Completed" && t.status !== "Cancelled").sort((a, b) => a.departureDate.localeCompare(b.departureDate));
  const past = trips.filter((t) => t.status === "Completed" || t.status === "Cancelled").sort((a, b) => b.departureDate.localeCompare(a.departureDate));
  const next = upcoming.find((t) => t.status === "Confirmed");
  const daysToGo = next ? Math.max(0, Math.round((parseISODate(next.departureDate).getTime() - parseISODate(today).getTime()) / 86_400_000)) : 0;
  const list = tab === "upcoming" ? upcoming : past;
  const open = trips.find((t) => t.id === openId);
  const done = checklist.filter(Boolean).length;

  const payBalance = (id: string) => setTrips((ts) => ts.map((t) => (t.id === id ? { ...t, status: "Confirmed" } : t)));

  return (
    <div className="pt-24 pb-20 sm:pt-28">
      <div className="container-page">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-pine-600"><span className="h-px w-6 bg-pine-600" /> My Trips</p>
            <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Hi {customer.firstName}, ready for the trail?</h1>
            <p className="mt-2 text-muted-foreground">Traylborn member since {formatDate(customer.memberSince, { month: "long", year: "numeric" })}</p>
          </div>
          <Link href="/treks" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-ember-500 px-6 text-sm font-semibold text-ink hover:bg-ember-400">
            Plan a new journey
          </Link>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { Icon: CalendarDays, label: "Upcoming trips", value: String(upcoming.length) },
            { Icon: Mountain, label: "Journeys completed", value: String(past.filter((p) => p.status === "Completed").length) },
            { Icon: Wallet, label: "Travel credits", value: formatPrice(customer.travelCredits) },
            { Icon: Users, label: "Fellow travellers", value: "38" },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="flex flex-col rounded-[1.5rem] bg-white p-5 ring-1 ring-black/5">
              <Icon className="size-5 text-pine-600" aria-hidden="true" />
              <dt className="mt-4 text-sm text-muted-foreground">{label}</dt>
              <dd className="order-2 font-display text-2xl font-semibold text-ink sm:text-3xl">{value}</dd>
            </div>
          ))}
        </dl>

        {next && (
          <section aria-labelledby="next-trip" className="mt-8 grid grid-cols-1 overflow-hidden rounded-[2rem] bg-pine-950 text-white lg:grid-cols-[1.3fr_1fr]">
            <div className="relative isolate min-h-72 p-6 sm:p-10">
              <Image src={next.image} alt="" fill sizes="(min-width: 1024px) 55vw, 100vw" className="-z-10 object-cover" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-950 via-pine-950/60 to-pine-950/10 lg:bg-gradient-to-r lg:from-pine-950/90 lg:via-pine-950/50" />
              <div className="flex h-full flex-col justify-end">
                <p className="text-xs font-semibold tracking-[0.2em] text-ember-300 uppercase">Your next adventure</p>
                <h2 id="next-trip" className="mt-2 max-w-md text-3xl font-semibold sm:text-4xl">{next.tripName}</h2>
                <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/80">
                  <span className="flex items-center gap-1.5"><CalendarDays className="size-4" /> {formatDate(next.departureDate)} – {formatDate(addDays(next.departureDate, next.durationDays - 1))}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="size-4" /> From {next.startingPoint}</span>
                </p>
                <div className="mt-6 flex items-end gap-3">
                  <span className="font-display text-6xl leading-none font-semibold text-ember-400">{daysToGo}</span>
                  <span className="pb-1 text-sm text-white/80">days to go</span>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 p-6 sm:p-10 lg:border-t-0 lg:border-l">
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-sm font-semibold">Pre-trip checklist</h3>
                <span className="text-sm text-white/60">{done}/{checklist.length}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-moss-500 transition-all duration-500" style={{ width: `${(done / checklist.length) * 100}%` }} />
              </div>
              <ul className="mt-5 space-y-2">
                {checklistItems.map((item, i) => (
                  <li key={item}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={checklist[i]}
                        disabled={i === 0}
                        onChange={() => setChecklist((c) => c.map((v, j) => (j === i ? !v : v)))}
                        className="peer sr-only"
                      />
                      <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ember-400", checklist[i] ? "border-moss-500 bg-moss-500" : "border-white/30")}>
                        {checklist[i] && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className={cn("text-sm", checklist[i] ? "text-white/60 line-through" : "text-white")}>{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <a href={whatsappLink(`Hi Traylborn! Question about my booking ${next.id}.`)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ember-300 hover:underline">
                <WhatsappIcon className="size-4" /> Join your batch WhatsApp group
              </a>
            </div>
          </section>
        )}

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section aria-label="Bookings" className="min-w-0">
            <div role="tablist" aria-label="Trips" className="inline-flex rounded-full bg-white p-1 ring-1 ring-black/5">
              {([
                { id: "upcoming", label: "Upcoming", count: upcoming.length },
                { id: "past", label: "Past", count: past.length },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn("h-10 rounded-full px-5 text-sm font-semibold transition-colors", tab === t.id ? "bg-pine-800 text-white" : "text-ink/70 hover:text-ink")}
                >
                  {t.label} <span className="ml-1 opacity-70">{t.count}</span>
                </button>
              ))}
            </div>

            <ul role="tabpanel" className="mt-6 space-y-4">
              {list.map((t) => (
                <li key={t.id} className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-black/5">
                  <div className="grid grid-cols-1 sm:grid-cols-[13rem_minmax(0,1fr)]">
                    <div className="relative h-44 sm:h-auto">
                      <Image src={t.image} alt="" fill sizes="(min-width: 640px) 208px, 100vw" className={cn("object-cover", t.status === "Completed" && "grayscale-[35%]")} />
                    </div>
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-muted-foreground">{t.id}</p>
                          <h3 className="mt-1 text-xl font-semibold">{t.tripName}</h3>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Departure</dt>
                          <dd className="font-semibold">{formatDate(t.departureDate)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Travellers</dt>
                          <dd className="font-semibold">{t.participants}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Amount</dt>
                          <dd className="font-semibold">{formatPrice(t.amount)}</dd>
                        </div>
                      </dl>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {t.status === "Pending payment" && (
                          <button type="button" onClick={() => payBalance(t.id)} className="inline-flex h-10 items-center rounded-full bg-ember-500 px-4 text-sm font-semibold text-ink hover:bg-ember-400">
                            Pay {formatPrice(t.amount)}
                          </button>
                        )}
                        <button type="button" onClick={() => setOpenId(t.id)} className="inline-flex h-10 items-center gap-1 rounded-full bg-pine-800 px-4 text-sm font-semibold text-white hover:bg-pine-700">
                          View details <ChevronRight className="size-4" />
                        </button>
                        {t.status !== "Pending payment" && (
                          <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-sand-50">
                            <Download className="size-4" /> Invoice
                          </button>
                        )}
                        {t.status === "Completed" && (
                          reviewed.includes(t.id) ? (
                            <span className="inline-flex h-10 items-center gap-1.5 px-2 text-sm font-semibold text-moss-600"><Check className="size-4" /> Review shared</span>
                          ) : (
                            <button type="button" onClick={() => setReviewed((r) => [...r, t.id])} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-sand-50">
                              <Star className="size-4" /> Write a review
                            </button>
                          )
                        )}
                        {t.status === "Completed" && (
                          <Link href={`/packages/${t.packageSlug}`} className="inline-flex h-10 items-center px-2 text-sm font-semibold text-pine-800 hover:underline">
                            Book again
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[1.75rem] bg-white p-6 ring-1 ring-black/5">
              <div className="flex items-center gap-4">
                <span className="grid size-14 place-items-center rounded-2xl bg-pine-800 font-display text-lg font-semibold text-white" aria-hidden="true">
                  {customer.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{customer.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{customer.email}</p>
                </div>
              </div>
              <dl className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{customer.phone}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">City</dt><dd className="font-medium">{customer.city}</dd></div>
              </dl>
              <button type="button" className="mt-5 h-10 w-full rounded-full border border-border text-sm font-semibold hover:bg-sand-50">Edit profile</button>
            </div>
            <div className="rounded-[1.75rem] bg-ember-500/10 p-6 ring-1 ring-ember-500/20">
              <Gift className="size-6 text-ember-600" aria-hidden="true" />
              <p className="mt-4 font-display text-xl font-semibold">Give ₹500, get ₹500</p>
              <p className="mt-1 text-sm text-ink/70">Friends get ₹500 off their first trek. You get ₹500 in credits when they travel.</p>
              <CopyCode code="AANYA500" className="mt-4 text-ember-700" />
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto rounded-[1.75rem] p-0 sm:max-w-lg">
          {open && (
            <>
              <div className="relative h-40">
                <Image src={open.image} alt="" fill sizes="512px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-pine-950/80 to-transparent" />
                <StatusBadge status={open.status} className="absolute bottom-4 left-5 bg-white" />
              </div>
              <div className="p-6">
                <DialogHeader className="text-left">
                  <DialogTitle className="font-display text-2xl">{open.tripName}</DialogTitle>
                  <DialogDescription className="font-mono">{open.id}</DialogDescription>
                </DialogHeader>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Departure", value: formatDateLong(open.departureDate) },
                    { label: "Return", value: formatDateLong(addDays(open.departureDate, open.durationDays - 1)) },
                    { label: "Pickup", value: open.startingPoint },
                    { label: "Travellers", value: String(open.participants) },
                    { label: "Booked on", value: formatDate(open.bookedOn) },
                    { label: "Coupon", value: open.coupon ?? "—" },
                  ].map((f) => (
                    <div key={f.label}>
                      <dt className="text-xs text-muted-foreground">{f.label}</dt>
                      <dd className="font-semibold">{f.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-sand-50 p-4">
                  <span className="text-sm text-muted-foreground">{open.status === "Pending payment" ? "Amount due" : "Amount paid"}</span>
                  <span className="font-display text-2xl font-semibold">{formatPrice(open.amount)}</span>
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Link href={`/packages/${open.packageSlug}`} className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-pine-800 px-5 text-sm font-semibold text-white hover:bg-pine-700">
                    View itinerary
                  </Link>
                  <a href={whatsappLink(`Hi Traylborn! Question about booking ${open.id}.`)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-semibold hover:bg-sand-50">
                    <WhatsappIcon className="size-4" /> Get help
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
