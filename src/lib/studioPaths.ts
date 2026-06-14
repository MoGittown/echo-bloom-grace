/** Reservierte Pfade – dürfen nicht als Studio-Slug vergeben werden. */
export const RESERVED_STUDIO_SLUGS = new Set([
  'admin',
  'fuer-studios',
  'fuer-kuechenstudios',
  'pitch',
  'onepager',
  'marketing',
  'start',
  'sales',
  's',
  'api',
  'assets',
  'dist',
]);

export function isReservedStudioSlug(slug: string): boolean {
  return RESERVED_STUDIO_SLUGS.has(slug.toLowerCase());
}

export function studioLandingPath(slug: string): string {
  return `/${slug}`;
}

export function studioCheckPath(slug: string): string {
  return `/${slug}/check`;
}

export function studioImpressumPath(slug: string): string {
  return `/${slug}/impressum`;
}

export function studioDatenschutzPath(slug: string): string {
  return `/${slug}/datenschutz`;
}

export function studioLandingUrl(origin: string, slug: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}${studioLandingPath(slug)}`;
}

export function studioCheckUrl(origin: string, slug: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}${studioCheckPath(slug)}`;
}
