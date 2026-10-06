import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, Instrument_Serif } from "next/font/google";
import { MotionProvider } from "@/components/ui/motion";
import { siteConfig } from "@/lib/mock-data/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Traylborn — Himalayan Treks, Road Trips & Retreats",
    template: "%s · Traylborn",
  },
  description: siteConfig.description,
  keywords: [
    "Himalayan treks",
    "Hampta Pass trek",
    "Kedarkantha trek",
    "Spiti road trip",
    "yoga retreat Rishikesh",
    "trekking company Chandigarh",
    "Traylborn",
  ],
  openGraph: {
    type: "website",
    siteName: "Traylborn",
    title: "Traylborn — Himalayan Treks, Road Trips & Retreats",
    description: siteConfig.description,
    images: [{ url: "/images/hero/himalaya-sunrise.jpg", width: 2400, height: 1600 }],
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0f4a49",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${inter.variable} ${bricolage.variable} ${instrument.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
