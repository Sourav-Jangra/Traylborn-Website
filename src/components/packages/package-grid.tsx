import type { TravelPackage } from "@/lib/types";
import { PackageCard } from "./package-card";
import { cn } from "@/lib/utils";

export function PackageGrid({ packages, className }: { packages: TravelPackage[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3", className)}>
      {packages.map((pkg) => (
        <li key={pkg.id}>
          <PackageCard pkg={pkg} sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 92vw" />
        </li>
      ))}
    </ul>
  );
}
