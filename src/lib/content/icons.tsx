import {
  Calendar,
  Camera,
  Compass,
  Headset,
  Heart,
  Leaf,
  MapPin,
  MessageCircle,
  Mountain,
  ReceiptIndianRupee,
  Route,
  ShieldCheck,
  Star,
  Sun,
  Tent,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "./icon-keys";

export const contentIcons: Record<IconKey, { Icon: LucideIcon; label: string }> = {
  "map-pin": { Icon: MapPin, label: "Location pin" },
  users: { Icon: Users, label: "People" },
  receipt: { Icon: ReceiptIndianRupee, label: "Receipt (₹)" },
  message: { Icon: MessageCircle, label: "Chat" },
  compass: { Icon: Compass, label: "Compass" },
  shield: { Icon: ShieldCheck, label: "Shield" },
  headset: { Icon: Headset, label: "Support" },
  mountain: { Icon: Mountain, label: "Mountain" },
  calendar: { Icon: Calendar, label: "Calendar" },
  star: { Icon: Star, label: "Star" },
  heart: { Icon: Heart, label: "Heart" },
  leaf: { Icon: Leaf, label: "Leaf" },
  tent: { Icon: Tent, label: "Tent" },
  sun: { Icon: Sun, label: "Sun" },
  camera: { Icon: Camera, label: "Camera" },
  route: { Icon: Route, label: "Route" },
};

export function ContentIcon({ name, className }: { name: string; className?: string }) {
  const icon = contentIcons[name as IconKey];
  if (!icon) return null;
  return <icon.Icon className={className} aria-hidden="true" />;
}
