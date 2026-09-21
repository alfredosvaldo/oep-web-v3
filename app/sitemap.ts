import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { MetadataRoute } from 'next';

const BASE = 'https://alfredosvaldo.github.io/oep-web-v3';
const LAST_MODIFIED = new Date('2026-09-04');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ['', '/explorador', '/mapa', '/perfiles', '/rankings', '/informes', '/datos-metodologia'].map(
    (p) => ({ url: `${BASE}${p}/`, lastModified: LAST_MODIFIED, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.8 }),
  );

  const files = await readdir(path.join(process.cwd(), 'public/data/profiles'));
  const profiles = files
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({
      url: `${BASE}/perfiles/${f.replace(/\.json$/, '')}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...profiles];
}
