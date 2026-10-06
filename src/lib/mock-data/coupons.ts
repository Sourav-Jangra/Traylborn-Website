import type { Coupon } from "@/lib/types";

export const coupons: Coupon[] = [
  {
    code: "TRAYLBORN10",
    type: "percent",
    value: 10,
    description: "10% off any journey",
    expiresOn: "2027-03-31",
    active: true,
  },
  {
    code: "SUMMER30",
    type: "percent",
    value: 30,
    description: "Up to 30% off Summer Adventures for groups of 4+",
    minParticipants: 4,
    expiresOn: "2027-05-31",
    active: true,
  },
  {
    code: "FIRSTTRAIL",
    type: "flat",
    value: 500,
    description: "₹500 off per traveller on your first trip",
    expiresOn: "2027-12-31",
    active: true,
  },
  {
    code: "WINTER15",
    type: "percent",
    value: 15,
    description: "15% off winter treks and Spiti expeditions",
    expiresOn: "2027-02-28",
    active: true,
  },
  {
    code: "MONSOON20",
    type: "percent",
    value: 20,
    description: "Monsoon retreat offer",
    expiresOn: "2026-09-15",
    active: false,
  },
];
