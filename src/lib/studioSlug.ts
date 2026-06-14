/** Client-seitige Slug-Vorschau (gleiche Logik wie Server). */
export function slugifyStudioName(name: string): string {
  const map: Record<string, string> = {
    ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss',
  };
  let slug = name.toLowerCase().trim();
  for (const [char, repl] of Object.entries(map)) {
    slug = slug.replaceAll(char, repl);
  }
  slug = slug
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'studio';
}
