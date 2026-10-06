import type { BookingPackageInfo } from "../booking-context";
import type { Category } from "@/lib/types";

export interface CheckoutPackage extends BookingPackageInfo {
  startingPoint: string;
  endingPoint: string;
  category: Category;
}

export interface TravellerDetails {
  name: string;
  email: string;
  phone: string;
  city: string;
  emergencyName: string;
  emergencyPhone: string;
  companions: string[];
  notes: string;
}

export const emptyDetails: TravellerDetails = {
  name: "",
  email: "",
  phone: "",
  city: "",
  emergencyName: "",
  emergencyPhone: "",
  companions: [],
  notes: "",
};

export const STEPS = ["Trip", "Travellers", "Review"] as const;
