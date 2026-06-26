import { MetadataRoute } from 'next';

import { founders } from '@/data/founders';
import { blogPosts } from '@/data/blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://inboxfm.me';

  let releases: { slug: string; updatedAt: string }[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/releases`, { cache: 'no-store' });
    if (res.ok) releases = await res.json();
  } catch (e) {
    console.error('Sitemap fetch failed', e);
  }

  const founderEntries = founders.map(f => ({
    url: `${baseUrl}/team/${f.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const releaseEntries = releases.map(r => ({
    url: `${baseUrl}/releases/${r.slug}/`,
    lastModified: new Date(r.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const blogEntries = blogPosts.map(p => ({
    url: `${baseUrl}/blog/${p.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/team/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/releases/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/terms/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  return [...baseEntries, ...founderEntries, ...releaseEntries, ...blogEntries];
}
