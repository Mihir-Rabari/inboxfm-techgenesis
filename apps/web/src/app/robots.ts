import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/player/', '/dashboard/', '/admin/', '/settings/', '/api/'],
    },
    sitemap: 'https://inboxfm.me/sitemap.xml',
  };
}