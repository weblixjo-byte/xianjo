import type { Metadata, Viewport } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { BRANDING } from "@/constants/branding";

export const metadata: Metadata = {
  metadataBase: new URL(BRANDING.seo.url),
  title: {
    default: `${BRANDING.nameEn} | Asian Cuisine Amman`,
    template: `%s | ${BRANDING.shortNameEn}`
  },
  description: BRANDING.seo.descriptionEn,
  robots: "index, follow",
  openGraph: {
    title: `${BRANDING.nameEn} | Asian Cuisine Amman`,
    description: BRANDING.seo.descriptionEn,
    url: BRANDING.seo.url,
    siteName: BRANDING.nameEn,
    images: [{ url: "/hero-food.png", width: 1200, height: 630 }],
    locale: "en_JO",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": BRANDING.nameEn,
    "image": `${BRANDING.seo.url}/hero-food.png`,
    "@id": BRANDING.seo.url,
    "url": BRANDING.seo.url,
    "telephone": BRANDING.contact.phone,
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
    "hasMenu": {
      "@type": "Menu",
      "name": "Our Menu",
      "url": `${BRANDING.seo.url}#menu-anchor`
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "128",
      "bestRating": "5",
      "worstRating": "1"
    },
    "servesCuisine": ["Asian", "Chinese", "Sushi", "Noodles", "Dumplings"],
    "priceRange": "$$"
  };

  return (
    <html lang="ar" className="h-full antialiased scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storage = localStorage.getItem('${BRANDING.shortNameEn.toLowerCase()}-language-storage');
                if (storage) {
                  const { state } = JSON.parse(storage);
                  if (state && state.language) {
                    document.documentElement.lang = state.language;
                  }
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
