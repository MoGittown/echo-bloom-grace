import type { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

type Supabase = ReturnType<typeof createClient>;

export const RESERVED_STUDIO_SLUGS = new Set([
  "admin",
  "fuer-studios",
  "fuer-kuechenstudios",
  "pitch",
  "onepager",
  "marketing",
  "start",
  "sales",
  "s",
  "api",
  "assets",
  "dist",
]);

export function slugifyStudioName(name: string): string {
  const map: Record<string, string> = {
    ä: "ae", ö: "oe", ü: "ue", ß: "ss",
  };
  let slug = name.toLowerCase().trim();
  for (const [char, repl] of Object.entries(map)) {
    slug = slug.replaceAll(char, repl);
  }
  slug = slug
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "studio";
}

export function isReservedStudioSlug(slug: string): boolean {
  return RESERVED_STUDIO_SLUGS.has(slug.toLowerCase());
}

export async function ensureUniqueSlug(supabase: Supabase, base: string): Promise<string> {
  let candidate = base;
  let suffix = 0;
  while (true) {
    const { data } = await supabase
      .from("studio_branding")
      .select("id")
      .eq("studio_slug", candidate)
      .maybeSingle();
    if (!data) {
      if (!isReservedStudioSlug(candidate)) return candidate;
    }
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export const DEFAULT_FEATURE_CONFIG = {
  steps: {
    style: true,
    appliances: true,
    sink: true,
    room: true,
    floorPlan: true,
    wallView: true,
    photos: true,
    contact: true,
  },
  kitchenChat: true,
  pdfExport: true,
  protocolEmail: true,
};
