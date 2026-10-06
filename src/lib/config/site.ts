export const siteConfig = {
  name: "Traylborn",
  tagline: "Born of Trails. Made for Journeys.",
  description:
    "Himalayan treks, road trips and retreats crafted by Traylborn, a Chandigarh-based travel company.",
  url: "https://traylborn.com",
  phone: "+91 62398 02895",
  phoneHref: "tel:+916239802895",
  altPhone: "+91 98033 59909",
  altPhoneHref: "tel:+919803359909",
  email: "Infotraylborn@gmail.com",
  whatsappNumber: "916239802895",
  address: {
    line1: "SCO 198-199, Sector 17C",
    city: "Chandigarh",
    postalCode: "160019",
    country: "India",
  },
  hours: "Mon – Sat · 10:00 AM – 7:00 PM",
  // Profile URLs are not confirmed yet. Icons and links stay hidden while a value is null.
  social: {
    instagram: null,
    facebook: null,
    youtube: null,
  } as Record<"instagram" | "facebook" | "youtube", string | null>,
};

export function whatsappLink(message = "Hi Traylborn! I'd like to know more about your trips.") {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const mainNav = [
  { label: "Treks", href: "/treks" },
  { label: "Road Trips", href: "/road-trips" },
  { label: "Retreats", href: "/retreats" },
  { label: "Offers", href: "/offers" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
