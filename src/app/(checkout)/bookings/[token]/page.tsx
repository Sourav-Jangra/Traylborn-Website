import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CheckCircle2, Info } from "lucide-react";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { BookingStatusBadge, paymentStatusLabel } from "@/components/booking/booking-status-badge";
import { PayButton } from "@/components/booking/pay-button";
import { isRazorpayConfigured } from "@/server/razorpay";
import { whatsappLink } from "@/lib/config/site";
import { BUSINESS_TIME_ZONE, formatDateLong, formatPrice } from "@/lib/utils/format";
import { getBookingByAccessToken } from "@/server/bookings";

// The URL is the only key to this page: keep it out of search engines and out of Referer headers.
export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const time = new Intl.DateTimeFormat("en-IN", { timeZone: BUSINESS_TIME_ZONE, hour: "numeric", minute: "2-digit", day: "numeric", month: "short" });

export default async function GuestBookingPage({ params }: PageProps<"/bookings/[token]">) {
  await connection();
  const { token } = await params;
  const booking = await getBookingByAccessToken(token);
  if (!booking) notFound();

  const primary = booking.travellers[0];
  const others = booking.travellers.slice(1);
  const pending = booking.status === "pending_payment";
  const dueNow = Math.max(0, booking.amountDueNow - booking.amountPaid);
  const onlinePayment = pending && dueNow > 0 && isRazorpayConfigured();

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Booking reference</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-wide sm:text-4xl">{booking.reference}</h1>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Bookmark this page: it&apos;s the only way to view your booking online. Don&apos;t share the link.
          </p>
        </div>

        {pending && (
          <div className="rounded-2xl bg-pine-50 p-5 text-sm ring-1 ring-pine-200">
            <p className="flex items-center gap-2 font-semibold text-pine-800">
              <Info className="size-4 shrink-0" aria-hidden="true" /> Your booking is awaiting payment
            </p>
            {onlinePayment ? (
              <>
                <p className="mt-1.5 text-pine-800/80">
                  Pay {booking.paymentPlan === "advance" ? "the advance" : "the full amount"} to confirm your place
                  {booking.expiresAt ? ` before ${time.format(booking.expiresAt)} (IST)` : ""}. Payments are processed securely by Razorpay.
                </p>
                <div className="mt-4">
                  <PayButton token={token} amount={dueNow} label={booking.paymentPlan === "advance" ? "Pay advance" : "Pay"} />
                </div>
              </>
            ) : (
              <p className="mt-1.5 text-pine-800/80">
                Online payment is unavailable right now. Our team will contact you to arrange payment
                {booking.expiresAt ? `; your place is held until ${time.format(booking.expiresAt)} (IST)` : ""}.
              </p>
            )}
          </div>
        )}
        {booking.status === "confirmed" && (
          <div className="rounded-2xl bg-moss-500/10 p-5 text-sm ring-1 ring-moss-500/25">
            <p className="flex items-center gap-2 font-semibold text-moss-700">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" /> Your booking is confirmed
            </p>
            <p className="mt-1.5 text-ink/80">
              {booking.balance > 0
                ? `We've received ${formatPrice(booking.amountPaid)}. The remaining ${formatPrice(booking.balance)} is paid to our team before the trip.`
                : `We've received the full amount of ${formatPrice(booking.amountPaid)}.`}
            </p>
          </div>
        )}
        {booking.status === "expired" && (
          <div className="rounded-2xl bg-sand-100 p-5 text-sm ring-1 ring-black/5">
            This booking wasn&apos;t paid in time and has expired. Contact us with your reference if you&apos;d still like to go.
          </div>
        )}
        {booking.status === "cancelled" && (
          <div className="rounded-2xl bg-sand-100 p-5 text-sm ring-1 ring-black/5">
            This booking has been cancelled.
            {booking.amountPaid > 0 && ` We've received ${formatPrice(booking.amountPaid)} for it; our team will contact you about a refund.`}
          </div>
        )}

        <Section title="Your trip">
          <p className="font-semibold text-ink">{booking.packageTitle}</p>
          <p className="text-muted-foreground">{formatDateLong(booking.departureDate)} → {formatDateLong(booking.endDate)}</p>
          <p className="text-muted-foreground">{booking.optionLabel}</p>
        </Section>

        <Section title={`Travellers (${booking.travellerCount})`}>
          <p className="font-semibold text-ink">{primary.fullName}, {primary.age}</p>
          <p className="text-muted-foreground">{primary.email} · {primary.phone}</p>
          {others.length > 0 && (
            <ul className="mt-2 space-y-0.5 border-t border-border pt-2 text-muted-foreground">
              {others.map((t) => (
                <li key={t.position}>{t.fullName}, {t.age}</li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Price">
          {booking.discount > 0 ? (
            <>
              <Row label={`${formatPrice(booking.unitPrice)} × ${booking.travellerCount}`} value={formatPrice(booking.subtotal)} />
              <Row label={booking.discountLabel ?? "Discount"} value={`−${formatPrice(booking.discount)}`} />
              <Row label="Total" value={formatPrice(booking.total)} strong />
            </>
          ) : (
            <Row label={`${formatPrice(booking.unitPrice)} × ${booking.travellerCount}`} value={formatPrice(booking.total)} strong />
          )}
          <Row label="Payment plan" value={booking.paymentPlan === "advance" ? `Advance of ${formatPrice(booking.amountDueNow)}` : "Full amount"} />
          <Row label="Payment status" value={paymentStatusLabel[booking.paymentStatus] ?? booking.paymentStatus} />
          <Row label="Paid" value={formatPrice(booking.amountPaid)} />
          <Row label="Remaining balance" value={formatPrice(booking.balance)} />
        </Section>

        <a
          href={whatsappLink(`Hi Traylborn! I have a question about my booking ${booking.reference}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 font-semibold text-white transition-colors hover:bg-[#1fbb59]"
        >
          <WhatsappIcon className="size-4" /> Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 text-sm ring-1 ring-black/5">
      <h2 className="mb-2 font-sans text-xs font-semibold tracking-wider text-pine-600 uppercase">{title}</h2>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-display text-lg font-semibold text-ink" : "font-medium text-ink"}>{value}</span>
    </p>
  );
}
