export interface Offer {
  id: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  code: string;
  validTill: string;
  image: string;
  imageAlt: string;
  href: string;
}

export const offers: Offer[] = [
  {
    id: "offer_summer",
    eyebrow: "Summer Adventures 2027",
    title: "Early-bird summer treks",
    highlight: "Up to 30% off",
    description:
      "Lock in Hampta Pass, Sar Pass and Har Ki Dun for summer 2027 at this season's lowest prices. Valid for groups of 4 or more.",
    code: "SUMMER30",
    validTill: "2027-05-31",
    image: "/images/gallery/sunset-jump.jpg",
    imageAlt: "Trekkers celebrating at sunset on a snowy summit",
    href: "/treks",
  },
  {
    id: "offer_winter",
    eyebrow: "Winter Season",
    title: "Snow treks & Spiti in winter",
    highlight: "15% off",
    description: "Kedarkantha, Brahmatal, Tungnath and our Spiti Winter Expedition — snow season is here.",
    code: "WINTER15",
    validTill: "2027-02-28",
    image: "/images/treks/snow-forest-group.jpg",
    imageAlt: "Trekkers in a snowy pine forest",
    href: "/treks",
  },
  {
    id: "offer_first",
    eyebrow: "New to Traylborn",
    title: "Your first trail is on us",
    highlight: "₹500 off",
    description: "Flat ₹500 off per traveller on your very first Traylborn journey. Any trek, road trip or retreat.",
    code: "FIRSTTRAIL",
    validTill: "2027-12-31",
    image: "/images/treks/hampta-meadow-trekkers.jpg",
    imageAlt: "Trekkers walking through green meadows",
    href: "/search",
  },
];
