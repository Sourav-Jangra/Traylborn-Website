import type { BookingPackageInfo } from "../booking-context";
import type { Category } from "@/lib/types";

export interface CheckoutPackage extends BookingPackageInfo {
  startingPoint: string;
  endingPoint: string;
  category: Category;
}

export { emptyDetails, type TravellerDetails } from "@/lib/utils/booking-details";

export const STEPS = ["Trip", "Travellers", "Review"] as const;
