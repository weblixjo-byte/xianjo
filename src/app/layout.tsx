import type { Metadata, Viewport } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL('https://xianrestaurant.com'),
  title: {
    default: "Xian Restaurant | Asian Cuisine Amman",
    template: "%s | Xian Restaurant"
  },
  description: "Experience authentic Asian cuisine at Xian Restaurant Amman. Order premium Chinese food & sushi online. مطعم شيان الأردن.",
  robots: "index, follow",
  openGraph: {
    title: "Xian Restaurant | Asian Cuisine Amman",
    description: "Experience authentic Asian cuisine at Xian Restaurant Amman. Order premium Chinese food & sushi online. مطعم شيان الأردن.",
    url: "https://xianrestaurant.com",
    siteName: "Xian Restaurant",
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
    "name": "Xian Restaurant (مطعم شيان)",
    "image": "https://xianrestaurant.com/hero-food.png",
    "@id": "https://xianrestaurant.com",
    "url": "https://xianrestaurant.com",
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
    "menu": "https://xianrestaurant.com#menu-anchor",
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
                const storage = localStorage.getItem('xian-language-storage');
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
