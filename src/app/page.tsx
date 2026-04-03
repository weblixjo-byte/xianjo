import { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';
import { Product } from '@/components/MenuItemCard';
import { prisma } from "@/db";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Xian Restaurant | Asian Cuisine & Chinese Food Amman",
  description: "Order the best Asian Cuisine in Amman from Xian Restaurant. Fresh sushi, noodles & Chinese Food delivered fast. مطعم شيان للمأكولات الآسيوية.",
  keywords: "Xian Restaurant, مطعم شيان, Asian Food Jordan, Xian Menu, Best Sushi Amman, Chinese Food Jordan, Asian Cuisine Amman",
  openGraph: {
    title: "مزيج يأسرك! اطلب الآن من مطعم شيان | Xian Restaurant",
    description: "جرب المذاق الآسيوي الأصيل في عمّان. نودلز، سوشي، وأطباق صينية تُحضر بشغف وبأعلى جودة. اطلب الآن واكتشف النكهة الحقيقية!",
    images: [{ url: '/hero-food.png', width: 1200, height: 630, alt: 'Xian Restaurant - Asian Cuisine Amman' }],
    type: 'website',
    url: 'https://xianrestaurant.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Xian Restaurant | Asian Cuisine Amman",
    description: "Order the best Asian Cuisine in Amman from Xian Restaurant. Fresh sushi & Chinese food.",
    images: ['/hero-food.png'],
  },
  alternates: {
    canonical: 'https://xianrestaurant.com',
  }
};

export default async function Home() {
  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isAvailable: true }
    }),
    prisma.storeSettings.findUnique({
      where: { id: 1 }
    })
  ]);

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
        "image": p.imageUrl || "https://xianrestaurant.com/logo.png",
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
      <HomeClient initialData={products as Product[]} initialSettings={settings as { categoryOrder?: string } | null} />
    </>
  );
}