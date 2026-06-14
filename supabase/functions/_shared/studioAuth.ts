import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import type { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

type Supabase = ReturnType<typeof createClient>;

function isLegacyHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash);
}

async function legacyHashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "kitchen-studio-salt-2025");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (isLegacyHash(hash)) {
    return (await legacyHashPassword(password)) === hash;
  }
  return bcrypt.compareSync(password, hash);
}

export function slugifyStudioSlug(slug: string): string {
  return slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function fetchStudioBySlug(supabase: Supabase, studioSlug: string) {
  const normalized = slugifyStudioSlug(studioSlug);
  const { data, error } = await supabase
    .from("studio_branding")
    .select("*")
    .eq("studio_slug", normalized)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function verifyStudioAdmin(
  supabase: Supabase,
  studioSlug: string | undefined,
  password: string | undefined,
) {
  if (!studioSlug || !password) {
    return { ok: false as const, error: "missing_credentials" };
  }
  const studio = await fetchStudioBySlug(supabase, studioSlug);
  if (!studio) {
    return { ok: false as const, error: "studio_not_found" };
  }
  const valid = await verifyPassword(password, studio.admin_password_hash as string);
  if (!valid) {
    return { ok: false as const, error: "invalid_password" };
  }
  return { ok: true as const, studio };
}
