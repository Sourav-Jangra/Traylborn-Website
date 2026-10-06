import type { Booking } from "@/lib/types";

/** Bookings for the demo logged-in customer shown on /my-trips. */
export const demoCustomer = {
  name: "Aanya Sharma",
  firstName: "Aanya",
  email: "aanya.sharma@example.com",
  phone: "+91 98765 43210",
  city: "Chandigarh",
  memberSince: "2024-11-02",
  tripsCompleted: 3,
  travelCredits: 1500,
};

export const customerBookings: Booking[] = [
  {
    id: "TRB-2026-10418",
    packageSlug: "hampta-pass-chandratal",
    tripName: "Hampta Pass with Chandratal",
    customerName: demoCustomer.name,
    customerEmail: demoCustomer.email,
    departureDate: "2026-10-18",
    participants: 2,
    amount: 10800,
    status: "Confirmed",
    bookedOn: "2026-09-12",
    coupon: "TRAYLBORN10",
  },
  {
    id: "TRB-2026-11207",
    packageSlug: "spiti-valley-winter-expedition",
    tripName: "Spiti Valley Winter Expedition",
    customerName: demoCustomer.name,
    customerEmail: demoCustomer.email,
    departureDate: "2027-01-09",
    participants: 1,
    amount: 24999,
    status: "Pending payment",
    bookedOn: "2026-09-26",
  },
  {
    id: "TRB-2026-00931",
    packageSlug: "kedarkantha-trek",
    tripName: "Kedarkantha Winter Trek",
    customerName: demoCustomer.name,
    customerEmail: demoCustomer.email,
    departureDate: "2026-01-10",
    participants: 3,
    amount: 25497,
    status: "Completed",
    bookedOn: "2025-12-01",
  },
  {
    id: "TRB-2025-07752",
    packageSlug: "tungnath-chandrashila-trek",
    tripName: "Tungnath Chandrashila Trek",
    customerName: demoCustomer.name,
    customerEmail: demoCustomer.email,
    departureDate: "2025-11-14",
    participants: 2,
    amount: 13000,
    status: "Completed",
    bookedOn: "2025-10-20",
  },
  {
    id: "TRB-2025-05120",
    packageSlug: "adventure-yoga-retreat",
    tripName: "Adventure Yoga Retreat",
    customerName: demoCustomer.name,
    customerEmail: demoCustomer.email,
    departureDate: "2025-08-08",
    participants: 1,
    amount: 14999,
    status: "Completed",
    bookedOn: "2025-07-02",
  },
];

/** Recent bookings across all customers, used by the admin preview. */
export const recentBookings: Booking[] = [
  { id: "TRB-2026-11342", packageSlug: "hampta-pass-chandratal", tripName: "Hampta Pass with Chandratal", customerName: "Rahul Verma", customerEmail: "rahul.v@example.com", departureDate: "2026-10-22", participants: 4, amount: 21600, status: "Confirmed", bookedOn: "2026-09-30", coupon: "TRAYLBORN10" },
  { id: "TRB-2026-11339", packageSlug: "tungnath-chandrashila-trek", tripName: "Tungnath Chandrashila Trek", customerName: "Meera Iyer", customerEmail: "meera.i@example.com", departureDate: "2026-10-09", participants: 2, amount: 13000, status: "Confirmed", bookedOn: "2026-09-30" },
  { id: "TRB-2026-11331", packageSlug: "spiti-valley-winter-expedition", tripName: "Spiti Valley Winter Expedition", customerName: "Kabir Singh", customerEmail: "kabir.s@example.com", departureDate: "2026-12-12", participants: 3, amount: 74997, status: "Pending payment", bookedOn: "2026-09-29" },
  { id: "TRB-2026-11324", packageSlug: "sar-pass-trek", tripName: "Sar Pass Trek", customerName: "Priya Nair", customerEmail: "priya.n@example.com", departureDate: "2026-10-16", participants: 6, amount: 27300, status: "Confirmed", bookedOn: "2026-09-29", coupon: "SUMMER30" },
  { id: "TRB-2026-11318", packageSlug: "adventure-yoga-retreat", tripName: "Adventure Yoga Retreat", customerName: "Ananya Das", customerEmail: "ananya.d@example.com", departureDate: "2026-10-16", participants: 1, amount: 14999, status: "Confirmed", bookedOn: "2026-09-28" },
  { id: "TRB-2026-11305", packageSlug: "deoriatal-chandrashila", tripName: "Deoriatal Chandrashila", customerName: "Vikram Joshi", customerEmail: "vikram.j@example.com", departureDate: "2026-10-15", participants: 2, amount: 23998, status: "Cancelled", bookedOn: "2026-09-27" },
  { id: "TRB-2026-11297", packageSlug: "har-ki-dun-trek", tripName: "Har Ki Dun Trek", customerName: "Sana Qureshi", customerEmail: "sana.q@example.com", departureDate: "2026-10-23", participants: 2, amount: 25000, status: "Confirmed", bookedOn: "2026-09-27" },
];
