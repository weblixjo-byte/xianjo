import type { Metadata, Viewport } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Xian Restaurant | Boutique Asian Cuisine",
  description: "Experience world-class Asian dining in Amman. Gourmet Sushi, Noodles, and Signature Dishes.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" className="h-full antialiased scroll-smooth">
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
