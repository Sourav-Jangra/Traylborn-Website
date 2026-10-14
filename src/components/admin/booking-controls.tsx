"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelBookingAction,
  reconcileBookingPaymentsAction as reconcilePaymentsAction,
  saveBookingNotesAction,
} from "@/app/admin/(panel)/bookings/actions";
import { adminButton } from "./admin-ui";

const field = "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10";

export function BookingNotesForm({ reference, initialNotes }: { reference: string; initialNotes: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await saveBookingNotesAction(reference, notes);
          setMessage(result.ok ? { ok: true, text: "Saved" } : { ok: false, text: result.error });
          if (result.ok) router.refresh();
        });
      }}
    >
      <label htmlFor="admin-notes" className="sr-only">Internal notes</label>
      <textarea id="admin-notes" rows={4} maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} className={field} placeholder="Only visible to admins" />
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pending} className={adminButton.secondary}>{pending ? "Saving…" : "Save notes"}</button>
        {message && <p role="status" className={message.ok ? "text-sm text-moss-700" : "text-sm text-destructive"}>{message.text}</p>}
      </div>
    </form>
  );
}

export function ReconcilePaymentsButton({ reference }: { reference: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pending}
        className={adminButton.secondary}
        onClick={() =>
          startTransition(async () => {
            const result = await reconcilePaymentsAction(reference);
            setMessage(
              result.ok
                ? { ok: true, text: result.recorded ? `Recorded ${result.recorded} payment(s) from Razorpay` : "No new payments at Razorpay" }
                : { ok: false, text: result.error },
            );
            router.refresh();
          })
        }
      >
        {pending ? "Checking…" : "Check with Razorpay"}
      </button>
      {message && <p role="status" className={message.ok ? "text-sm text-moss-700" : "text-sm text-destructive"}>{message.text}</p>}
    </div>
  );
}

export function CancelBookingForm({ reference }: { reference: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!window.confirm(`Cancel booking ${reference}? This can't be undone.`)) return;
        startTransition(async () => {
          const result = await cancelBookingAction(reference, reason);
          if (result.ok) router.refresh();
          else setError(result.error);
        });
      }}
    >
      <label htmlFor="cancel-reason" className="mb-1.5 block text-sm font-medium">Reason</label>
      <input id="cancel-reason" required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className={field} placeholder="e.g. Customer changed plans" />
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={pending} className="mt-3 inline-flex h-10 items-center rounded-full bg-destructive px-4 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-60">
        {pending ? "Cancelling…" : "Cancel booking"}
      </button>
    </form>
  );
}
