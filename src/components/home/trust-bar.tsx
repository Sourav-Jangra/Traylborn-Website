import { MapPin, MessageCircle, ReceiptIndianRupee, Users } from "lucide-react";

const items = [
  { Icon: MapPin, label: "Chandigarh-based team" },
  { Icon: Users, label: "Up to 25 travellers per booking" },
  { Icon: ReceiptIndianRupee, label: "Clear inclusions & exclusions" },
  { Icon: MessageCircle, label: "Talk to us on WhatsApp" },
];

export function TrustBar() {
  return (
    <div className="border-b border-border bg-white">
      <ul className="container-page scrollbar-none flex gap-8 overflow-x-auto py-5 lg:justify-between">
        {items.map(({ Icon, label }) => (
          <li key={label} className="flex shrink-0 items-center gap-2.5 text-sm font-medium text-ink/80">
            <Icon className="size-5 text-pine-600" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
