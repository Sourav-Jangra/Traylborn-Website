import { MAX_PARTICIPANTS } from "@/lib/utils/departures";

/** Admin preview only — invented seat counts, never shown to customers. */
export function sampleSeatsBooked(slug: string, date: string) {
  let hash = 0;
  for (const ch of slug + date) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % (MAX_PARTICIPANTS + 1);
}
