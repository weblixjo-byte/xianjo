import { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';
import { Product } from '@/components/MenuItemCard';
import { prisma } from "@/db";
import { BRANDING } from '@/constants/branding';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${BRANDING.nameEn} | Asian Cuisine & Chinese Food Amman`,
  description: BRANDING.seo.descriptionEn,
  keywords: `restaurant, food, sushi, asian, ${BRANDING.shortNameEn.toLowerCase()}, delivery, pickup`,
  openGraph: {
    title: `مزيج يأسرك! اطلب الآن من ${BRANDING.nameAr} | ${BRANDING.nameEn}`,
    description: BRANDING.seo.descriptionAr,
    images: [{ url: '/hero-food.png', width: 1200, height: 630, alt: `${BRANDING.nameEn} - Asian Cuisine Amman` }],
    type: 'website',
    url: BRANDING.seo.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRANDING.nameEn} | Asian Cuisine Amman`,
    description: BRANDING.seo.descriptionEn,
    images: ['/hero-food.png'],
  },
  alternates: {
    canonical: BRANDING.seo.url,
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
        "name": p.nameEn || p.nameAr,
        "description": p.descriptionEn || p.descriptionAr || `Delicious ${p.nameEn || p.nameAr} at ${BRANDING.nameEn}`,
        "image": p.imageUrl || `${BRANDING.seo.url}${BRANDING.logo.url}`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema).replace(/</g, '\\u003c') }}
      />
      <HomeClient initialData={products as Product[]} initialSettings={settings as { categoryOrder?: string } | null} />
    </>
  );
}