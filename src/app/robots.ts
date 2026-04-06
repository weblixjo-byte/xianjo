import { MetadataRoute } from 'next';
import { BRANDING } from '@/constants/branding';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${BRANDING.seo.url}/sitemap.xml`,
  };
}
