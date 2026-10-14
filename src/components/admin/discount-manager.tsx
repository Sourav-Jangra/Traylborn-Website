"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { deleteCouponAction, saveCouponAction, setCouponActiveAction } from "@/app/admin/(panel)/coupons/actions";
import { deleteOfferAction, saveOfferAction, setOfferActiveAction } from "@/app/admin/(panel)/offers/actions";
import { Switch } from "@/components/ui/switch";
import { describeDiscount } from "@/lib/utils/pricing";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { AdminCard, AdminTable, adminButton } from "./admin-ui";

export interface PackageChoice {
  id: number;
  title: string;
  status: string;
}

type Status = "live" | "scheduled" | "expired" | "ended" | "inactive";

interface BaseRow {
  id: number;
  description: string;
  type: "percent" | "fixed";
  value: number;
  packageId: number | null;
  packageTitle: string | null;
  isActive: boolean;
  status: Status;
  timesUsed: number;
}

export interface CouponRow extends BaseRow {
  code: string;
  startsOn: string | null;
  endsOn: string | null;
}

export interface OfferRow extends BaseRow {
  title: string;
  startsOn: string;
  endsOn: string;
  showOnHomepage: boolean;
}

type Result = { ok: true; id: number } | { ok: false; error: string };

const inputClass = "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (action: () => Promise<Result>, onOk?: () => void) => {
    setError(null);
    start(async () => {
      try {
        const r = await action();
        if (!r.ok) return setError(r.error);
        onOk?.();
        router.refresh();
      } catch {
        setError("Couldn't save — please try again");
      }
    });
  };
  return { pending, error, setError, run };
}

const statusStyle: Record<Status, string> = {
  live: "bg-moss-500/12 text-moss-700 ring-moss-500/25",
  scheduled: "bg-pine-500/10 text-pine-800 ring-pine-500/20",
  expired: "bg-sand-200 text-ink/70 ring-black/5",
  ended: "bg-sand-200 text-ink/70 ring-black/5",
  inactive: "bg-destructive/8 text-destructive ring-destructive/20",
};

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset", statusStyle[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

function dates(startsOn: string | null, endsOn: string | null) {
  if (startsOn && endsOn) return `${formatDate(startsOn)} – ${formatDate(endsOn)}`;
  if (startsOn) return `From ${formatDate(startsOn)}`;
  if (endsOn) return `Until ${formatDate(endsOn)}`;
  return "No date limit";
}

function Field({ id, label, help, children }: { id: string; label: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium">{label}</label>
      {children}
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

interface FormState {
  name: string;
  description: string;
  type: "percent" | "fixed";
  value: string;
  packageId: string;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
  showOnHomepage: boolean;
}

function DiscountForm({
  kind,
  initial,
  packages,
  onSave,
  onClose,
}: {
  kind: "coupon" | "offer";
  initial: FormState;
  packages: PackageChoice[];
  onSave: (form: FormState) => Promise<Result>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial);
  const { pending, error, run } = useAction();
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const p = kind;
  const datesRequired = kind === "offer";

  return (
    <form
      className="grid gap-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => onSave(form), onClose);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {kind === "coupon" ? (
          <Field id={`${p}-name`} label="Code *" help="3–32 letters, numbers or hyphens. Saved in capitals; customers can type it in any case.">
            <input id={`${p}-name`} className={cn(inputClass, "uppercase")} value={form.name} maxLength={40} required autoComplete="off" onChange={(e) => set("name", e.target.value)} placeholder="TREK10" />
          </Field>
        ) : (
          <Field id={`${p}-name`} label="Title *" help="Shown to customers, e.g. on the homepage and at checkout.">
            <input id={`${p}-name`} className={inputClass} value={form.name} maxLength={120} required onChange={(e) => set("name", e.target.value)} placeholder="Monsoon sale" />
          </Field>
        )}
        <Field id={`${p}-package`} label="Applies to">
          <select id={`${p}-package`} className={inputClass} value={form.packageId} onChange={(e) => set("packageId", e.target.value)}>
            <option value="">All packages</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.title}{pkg.status !== "published" ? ` (${pkg.status})` : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        id={`${p}-description`}
        label={kind === "coupon" ? "Note (only you see this)" : "Description (optional, shown to customers)"}
      >
        <input id={`${p}-description`} className={inputClass} value={form.description} maxLength={kind === "coupon" ? 200 : 300} onChange={(e) => set("description", e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field id={`${p}-type`} label="Discount type">
          <select id={`${p}-type`} className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value as FormState["type"])}>
            <option value="percent">Percentage</option>
            <option value="fixed">Fixed amount (₹)</option>
          </select>
        </Field>
        <Field
          id={`${p}-value`}
          label={form.type === "percent" ? "Percent off *" : "Rupees off *"}
          help={form.type === "percent" ? "1–99% of the booking" : "Off the whole booking, not per traveller"}
        >
          <input id={`${p}-value`} className={inputClass} type="number" inputMode="numeric" min={1} max={form.type === "percent" ? 99 : undefined} step={1} required value={form.value} onChange={(e) => set("value", e.target.value)} />
        </Field>
        <Field id={`${p}-starts`} label={datesRequired ? "Starts on *" : "Starts on"}>
          <input id={`${p}-starts`} className={inputClass} type="date" required={datesRequired} value={form.startsOn} onChange={(e) => set("startsOn", e.target.value)} />
        </Field>
        <Field id={`${p}-ends`} label={datesRequired ? "Ends on *" : "Ends on"} help="Included: it stops at the end of this day (India time).">
          <input id={`${p}-ends`} className={inputClass} type="date" required={datesRequired} value={form.endsOn} onChange={(e) => set("endsOn", e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} /> Active
        </label>
        {kind === "offer" && (
          <label className="flex items-center gap-2.5 text-sm font-medium">
            <Switch checked={form.showOnHomepage} onCheckedChange={(v) => set("showOnHomepage", v)} /> Show on the homepage while live
          </label>
        )}
      </div>

      {error && <p role="alert" className="rounded-xl bg-destructive/8 px-3.5 py-2.5 text-sm font-medium text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={cn(adminButton.primary, "disabled:opacity-60")}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save
        </button>
        <button type="button" onClick={onClose} className={adminButton.secondary}>Cancel</button>
      </div>
    </form>
  );
}

function RowActions({
  isActive,
  onEdit,
  onToggle,
  onDelete,
}: {
  isActive: boolean;
  onEdit: () => void;
  onToggle: () => Promise<Result>;
  /** Return null when the admin cancels. */
  onDelete: () => (() => Promise<Result>) | null;
}) {
  const { pending, error, run } = useAction();
  return (
    <div>
      <div className="flex justify-end gap-1">
        <button type="button" onClick={onEdit} className={adminButton.ghost}><Pencil className="size-3.5" /> Edit</button>
        <button type="button" disabled={pending} onClick={() => run(onToggle)} className={adminButton.ghost}>
          <Power className="size-3.5" /> {isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const action = onDelete();
            if (action) run(action);
          }}
          className={cn(adminButton.ghost, "text-destructive hover:text-destructive")}
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
      </div>
      {error && <p role="alert" className="mt-1 text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}

const confirmDelete = (what: string, used: number) =>
  window.confirm(
    used > 0
      ? `Delete ${what}? ${used} booking${used === 1 ? "" : "s"} used it; they keep the discount they got.`
      : `Delete ${what}? This can't be undone.`,
  );

const blankForm: FormState = { name: "", description: "", type: "percent", value: "", packageId: "", startsOn: "", endsOn: "", isActive: true, showOnHomepage: true };

function payload(form: FormState) {
  return {
    description: form.description,
    type: form.type,
    value: form.value,
    packageId: form.packageId ? Number(form.packageId) : null,
    startsOn: form.startsOn || null,
    endsOn: form.endsOn || null,
    isActive: form.isActive,
  };
}

export function CouponManager({ coupons, packages }: { coupons: CouponRow[]; packages: PackageChoice[] }) {
  const [editing, setEditing] = useState<CouponRow | "new" | null>(null);
  const initial: FormState =
    editing && editing !== "new"
      ? {
          name: editing.code,
          description: editing.description,
          type: editing.type,
          value: String(editing.value),
          packageId: editing.packageId ? String(editing.packageId) : "",
          startsOn: editing.startsOn ?? "",
          endsOn: editing.endsOn ?? "",
          isActive: editing.isActive,
          showOnHomepage: false,
        }
      : blankForm;

  return (
    <div className="space-y-6">
      {editing ? (
        <AdminCard title={editing === "new" ? "New coupon" : `Edit coupon ${editing.code}`}>
          <DiscountForm
            key={editing === "new" ? "new" : editing.id}
            kind="coupon"
            initial={initial}
            packages={packages}
            onClose={() => setEditing(null)}
            onSave={(f) => saveCouponAction(editing === "new" ? null : editing.id, { ...payload(f), code: f.name })}
          />
        </AdminCard>
      ) : (
        <button type="button" onClick={() => setEditing("new")} className={adminButton.primary}>
          <Plus className="size-4" /> New coupon
        </button>
      )}

      <AdminCard title={`Coupons (${coupons.length})`}>
        {coupons.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No coupons yet.</p>
        ) : (
          <AdminTable label="Coupons">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Applies to</th>
                <th>Valid</th>
                <th>Status</th>
                <th>Used</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td>
                    <p className="font-mono font-semibold">{c.code}</p>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  </td>
                  <td>{describeDiscount(c)}</td>
                  <td>{c.packageTitle ?? "All packages"}</td>
                  <td className="whitespace-nowrap">{dates(c.startsOn, c.endsOn)}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>{c.timesUsed}</td>
                  <td>
                    <RowActions
                      isActive={c.isActive}
                      onEdit={() => setEditing(c)}
                      onToggle={() => setCouponActiveAction(c.id, !c.isActive)}
                      onDelete={() => (confirmDelete(`coupon ${c.code}`, c.timesUsed) ? () => deleteCouponAction(c.id) : null)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminCard>
    </div>
  );
}

export function OfferManager({ offers, packages }: { offers: OfferRow[]; packages: PackageChoice[] }) {
  const [editing, setEditing] = useState<OfferRow | "new" | null>(null);
  const initial: FormState =
    editing && editing !== "new"
      ? {
          name: editing.title,
          description: editing.description,
          type: editing.type,
          value: String(editing.value),
          packageId: editing.packageId ? String(editing.packageId) : "",
          startsOn: editing.startsOn,
          endsOn: editing.endsOn,
          isActive: editing.isActive,
          showOnHomepage: editing.showOnHomepage,
        }
      : { ...blankForm, isActive: false };

  return (
    <div className="space-y-6">
      {editing ? (
        <AdminCard title={editing === "new" ? "New offer" : `Edit offer: ${editing.title}`}>
          <DiscountForm
            key={editing === "new" ? "new" : editing.id}
            kind="offer"
            initial={initial}
            packages={packages}
            onClose={() => setEditing(null)}
            onSave={(f) =>
              saveOfferAction(editing === "new" ? null : editing.id, { ...payload(f), title: f.name, showOnHomepage: f.showOnHomepage })
            }
          />
        </AdminCard>
      ) : (
        <button type="button" onClick={() => setEditing("new")} className={adminButton.primary}>
          <Plus className="size-4" /> New offer
        </button>
      )}

      <AdminCard title={`Offers (${offers.length})`}>
        {offers.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No offers yet.</p>
        ) : (
          <AdminTable label="Offers">
            <thead>
              <tr>
                <th>Offer</th>
                <th>Discount</th>
                <th>Applies to</th>
                <th>Runs</th>
                <th>Status</th>
                <th>Used</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o.id}>
                  <td>
                    <p className="font-semibold">{o.title}</p>
                    <p className="text-xs text-muted-foreground">{o.showOnHomepage ? "Shown on the homepage while live" : "Not on the homepage"}</p>
                  </td>
                  <td>{describeDiscount(o)}</td>
                  <td>{o.packageTitle ?? "All packages"}</td>
                  <td className="whitespace-nowrap">{dates(o.startsOn, o.endsOn)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>{o.timesUsed}</td>
                  <td>
                    <RowActions
                      isActive={o.isActive}
                      onEdit={() => setEditing(o)}
                      onToggle={() => setOfferActiveAction(o.id, !o.isActive)}
                      onDelete={() => (confirmDelete(`the offer "${o.title}"`, o.timesUsed) ? () => deleteOfferAction(o.id) : null)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminCard>
    </div>
  );
}
