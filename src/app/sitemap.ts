import { MetadataRoute } from 'next';
import { prisma } from '@/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://xianjo.com';

  // Home Page
  const routes = [
    {
      url: baseUrl,
      lastModified: new Uint8Array(new Date().getTime() as any) as any, // TypeScript hack for Next.js 15
      changeFrequency: 'daily' as any,
      priority: 1,
    },
  ];

  // If you ever add /product/[id] pages, you'd fetch them here:
  /*
  const products = await prisma.product.findMany({ where: { isAvailable: true } });
  const productRoutes = products.map((p) => ({
    url: `${baseUrl}/product/${p.id}`, ...
  }));
  return [...routes, ...productRoutes];
  */

  return routes;
}
