import type { Category, TravelPackage } from "@/lib/types";
import { categoryMeta } from "@/lib/config/categories";

function haystack(pkg: TravelPackage) {
  return [
    pkg.title,
    pkg.tagline,
    pkg.region,
    pkg.state,
    pkg.destination,
    pkg.startingPoint,
    pkg.endingPoint,
    pkg.difficulty,
    categoryMeta[pkg.category].label,
    categoryMeta[pkg.category].singular,
    ...pkg.bestSeason,
    ...pkg.tags,
  ]
    .join(" ")
    .toLowerCase();
}

/** Simple token search: every word in the query must match somewhere. Title hits rank first. */
export function searchPackages(
  packages: TravelPackage[],
  query: string,
  category?: Category | "all",
) {
  const pool = category && category !== "all" ? packages.filter((p) => p.category === category) : packages;
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return pool;

  return pool
    .map((pkg) => {
      const text = haystack(pkg);
      const title = pkg.title.toLowerCase();
      if (!tokens.every((t) => text.includes(t) || text.includes(t.replace(/s$/, "")))) return null;
      const score = tokens.reduce((s, t) => s + (title.includes(t) ? 3 : 1), 0) + (pkg.featured ? 0.5 : 0);
      return { pkg, score };
    })
    .filter((r): r is { pkg: TravelPackage; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.pkg);
}
