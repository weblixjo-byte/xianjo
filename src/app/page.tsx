import { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';
import { prisma } from "@/db";

export const metadata: Metadata = {
  title: "Xian Restaurant (مطعم شيان) | Best Asian Food in Jordan",
  description: "Experience the finest Asian cuisine in Amman at Xian Restaurant. Sushi, Noodles, and Gourmet Chinese dishes. Discover our menu and order online today!",
  keywords: "Xian Restaurant, مطعم شيان, Asian Food Jordan, Xian Menu, Best Sushi Amman, Chinese Food Jordan",
  openGraph: {
    title: "Xian Restaurant - Boutique Asian Cuisine Amman",
    description: "Savor gourmet Asian flavors at Xian. Order your favorite Sushi and Noodles online. Amman's top-rated Asian dining.",
    images: [{ url: '/hero-food.png', width: 1200, height: 630, alt: 'Xian Restaurant Gourmet Dish' }],
    type: 'website',
    url: 'https://xianjo.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Xian Restaurant - Experience Excellence",
    description: "Premium Asian dining delivered to your doorstep in Amman.",
    images: ['/hero-food.png'],
  },
  alternates: {
    canonical: 'https://xianjo.com',
  }
};

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { isAvailable: true }
  });

  const menuSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": products.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "MenuItem",
        "name": p.nameEn || p.nameAr,
        "description": p.descriptionEn || p.descriptionAr || `Delicious ${p.nameEn || p.nameAr} at Xian Restaurant`,
        "image": p.imageUrl || "https://xianjo.com/logo.png",
        "offers": {
          "@type": "Offer",
          "price": p.price,
          "priceCurrency": "JOD"
        }
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
      />
      <HomeClient />
    </>
  );
}