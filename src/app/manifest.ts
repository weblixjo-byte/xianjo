import { MetadataRoute } from 'next';
import { BRANDING } from '@/constants/branding';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRANDING.shortNameEn} Admin`,
    short_name: BRANDING.shortNameEn,
    description: `${BRANDING.nameEn} Admin Dashboard`,
    start_url: '/admin',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: BRANDING.colors.primary,
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
