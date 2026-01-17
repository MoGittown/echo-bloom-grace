import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Du bist ein freundlicher und kompetenter Küchenplanungs-Assistent für ein professionelles Küchenstudio. 

Deine Aufgaben:
- Beantworte Fragen zur Küchenplanung verständlich und hilfreich
- Gib Tipps zu Materialien, Stilen, Geräten und Ergonomie
- Erkläre Vor- und Nachteile verschiedener Optionen
- Hilf bei Budget-Entscheidungen
- Beantworte Fragen zu aktuellen Küchentrends

Wichtige Richtlinien:
- Sei freundlich, professionell und hilfsbereit
- Antworte auf Deutsch
- Halte Antworten prägnant (max. 3-4 Sätze, es sei denn mehr Detail wird gefragt)
- Bei technischen Fragen empfehle im Zweifel eine persönliche Beratung
- Erwähne, dass individuelle Wünsche im Beratungsgespräch besprochen werden können

Themengebiete, in denen du besonders kompetent bist:
- Küchenstile: Modern, Landhausstil, Industrial, Skandinavisch, Klassisch
- Materialien: Arbeitsplatten (Granit, Quarz, Holz, Keramik), Fronten, Griffe
- Geräte: Herde, Backöfen, Kühlschränke, Spülmaschinen, Dunstabzüge
- Ergonomie: Arbeitshöhen, Arbeitsdreieck, Stauraum-Optimierung
- Beleuchtung: Arbeitsbeleuchtung, Ambiente, LED-Konzepte
- Budget: Preiskategorien, Einsparmöglichkeiten, Qualitätsmerkmale`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

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
      console.error("AI gateway error:", response.status, errorText);
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
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
