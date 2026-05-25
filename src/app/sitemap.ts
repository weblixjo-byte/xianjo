import { MetadataRoute } from 'next';
import { BRANDING } from '@/constants/branding';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = BRANDING.seo.url;

  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    }
  ];

  return routes;
}
