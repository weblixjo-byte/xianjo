import type { Metadata, Viewport } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL('https://xianjo.com'),
  title: {
    default: "Xian Restaurant | Asian Cuisine",
    template: "%s | Xian Restaurant"
  },
  description: "Boutique Asian Dining in the heart of Amman, Jordan.",
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Xian Restaurant (مطعم شيان)",
    "image": "https://xianjo.com/hero-food.png",
    "@id": "https://xianjo.com",
    "url": "https://xianjo.com",
    "telephone": "+962779990504",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Amman",
      "addressLocality": "Amman",
      "addressRegion": "Amman",
      "postalCode": "11181",
      "addressCountry": "JO"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 31.9454,
      "longitude": 35.9284
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "11:00",
      "closes": "23:00"
    },
    "menu": "https://xianjo.com#menu-anchor",
    "servesCuisine": ["Asian", "Chinese", "Sushi", "Noodles"],
    "priceRange": "$$"
  };

  return (
    <html lang="ar" className="h-full antialiased scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden bg-brand-cream">
        <Providers>
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
