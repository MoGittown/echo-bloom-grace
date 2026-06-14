import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { assertPlanFeature, assertStudioAccess } from "../_shared/planAccess.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugifyStudioSlug(slug: string): string {
  return slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

async function fetchStudioForChat(studioSlug?: string) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key || !studioSlug?.trim()) return null;
  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("studio_branding")
    .select("subscription_status, billing_grace_ends_at, plan")
    .eq("studio_slug", slugifyStudioSlug(studioSlug))
    .maybeSingle();
  return data as Record<string, unknown> | null;
}

const SYSTEM_PROMPT = `Du bist ein kompetenter Küchenplanungs-Assistent für ein professionelles Küchenstudio.

## Dein Kommunikationsstil:
- Freundlich und professionell – höfliches "Sie"
- Kompetent und sachlich, aber nicht steif
- Klare, verständliche Erklärungen
- Hilfsbereit ohne aufdringlich zu sein

## So antwortest du:
- Prägnant und auf den Punkt (2-4 Sätze)
- Sachliche Informationen mit praktischem Mehrwert
- Bei Bedarf konkrete Beispiele oder Preisrahmen nennen
- Bei komplexen Themen: kurze Einordnung, dann Kernaussage

## Was du NICHT tust:
- Keine übertrieben lockere Sprache ("du", Spitznamen)
- Keine Phrasen wie "Hmm", "Ach", "Weißt du was"
- Keine Emojis
- Keine persönlichen Anekdoten
- Nicht bei jeder Antwort auf Terminvereinbarung hinweisen

## Dein Wissen:
Küchenstile, Materialien (Arbeitsplatten, Fronten), Geräte, Ergonomie, Beleuchtung und realistische Preisvorstellungen.

## WICHTIG - Folgefragen vorschlagen:
Am Ende JEDER Antwort schlägst du 2-3 passende Folgefragen vor.
Format diese Vorschläge IMMER exakt so (mit dem Trennzeichen):

---FRAGEN---
Frage 1 hier?
Frage 2 hier?
Frage 3 hier?

Die Fragen sollen:
- Zum Kontext des Gesprächs passen
- Kurz und präzise sein (max 6-8 Wörter)
- Den Nutzer tiefer ins Thema führen

Beispiel:
"Die Wahl der Arbeitsplatte hängt stark von der Nutzung ab. Für intensive Nutzung eignen sich Keramik oder Quarz besonders gut – beide sind hitzebeständig und kratzfest. Bei moderater Nutzung ist auch Holz eine schöne Option, erfordert jedoch regelmäßige Pflege."

---FRAGEN---
Was kostet eine Keramik-Arbeitsplatte?
Welche Farben gibt es bei Quarz?
Wie pflegt man eine Holzarbeitsplatte?`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, studioSlug } = await req.json();

    const studio = await fetchStudioForChat(studioSlug);
    if (!studio) {
      return new Response(
        JSON.stringify({ error: "Studio nicht gefunden." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const access = assertStudioAccess(studio);
    if (!access.ok) {
      return new Response(
        JSON.stringify({ error: "Der KI-Berater ist derzeit nicht verfügbar." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const feature = assertPlanFeature(studio, "kitchenChat");
    if (!feature.ok) {
      return new Response(
        JSON.stringify({ error: "Der KI-Berater ist in Ihrem Tarif nicht enthalten." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Google Gemini über den OpenAI-kompatiblen Endpoint (gleiches Stream-Format wie zuvor).
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Der Assistent ist gerade überlastet. Bitte versuche es in einem Moment erneut." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Der KI-Service ist derzeit nicht verfügbar." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Kitchen chat error:", e);
    return new Response(
      JSON.stringify({ error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut." }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
