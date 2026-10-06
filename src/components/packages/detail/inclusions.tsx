import { Check, X } from "lucide-react";

export function Inclusions({ inclusions, exclusions }: { inclusions: string[]; exclusions: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
        <h3 className="font-sans text-sm font-semibold tracking-wider text-moss-600 uppercase">What&apos;s included</h3>
        <ul className="mt-4 space-y-3">
          {inclusions.map((item) => (
            <li key={item} className="flex gap-3 text-[0.95rem] text-ink/85">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-moss-500/15 text-moss-600">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
        <h3 className="font-sans text-sm font-semibold tracking-wider text-red-700 uppercase">Not included</h3>
        <ul className="mt-4 space-y-3">
          {exclusions.map((item) => (
            <li key={item} className="flex gap-3 text-[0.95rem] text-ink/85">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-red-500/10 text-red-700">
                <X className="size-3.5" aria-hidden="true" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
