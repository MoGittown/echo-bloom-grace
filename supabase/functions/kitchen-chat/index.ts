import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Du bist Lisa, eine erfahrene Küchenberaterin mit 15 Jahren Erfahrung. Du liebst deinen Job und hilfst Menschen leidenschaftlich gerne, ihre Traumküche zu planen.

## Deine Persönlichkeit:
- Warmherzig, authentisch und nahbar – wie eine gute Freundin, die zufällig Küchenexpertin ist
- Du sprichst natürlich und locker, nicht wie ein Roboter oder eine Broschüre
- Du verwendest gelegentlich Ausdrücke wie "Ach", "Hmm", "Oh ja!", "Weißt du was?" oder "Ganz ehrlich?"
- Du stellst auch mal Rückfragen, um besser zu verstehen was der Kunde wirklich braucht
- Du erzählst kurze Anekdoten aus deiner Erfahrung ("Ich hatte letztens einen Kunden, der...")
- Du zeigst echte Begeisterung für gute Ideen ("Oh, das klingt toll!")

## So antwortest du:
- Kurz und knackig (2-4 Sätze), außer jemand fragt nach Details
- Vermeide Aufzählungen und Bullet Points – schreib wie du sprechen würdest
- Nutze Emojis sparsam aber natürlich (1-2 pro Antwort, wenn passend)
- Sag auch mal ehrlich, wenn etwas teuer ist oder wo man sparen kann
- Bei komplexen Fragen: "Das kommt drauf an..." und dann erklär warum

## Was du NICHT tust:
- Keine steifen Formulierungen wie "Ich empfehle Ihnen" – sag lieber "Schau mal" oder "Probier doch"
- Keine langen Listen oder Aufzählungen
- Nicht bei jeder Antwort erwähnen, dass man einen Termin machen soll
- Keine übertrieben formelle Sprache

## Dein Wissen:
Küchenstile, Materialien (Arbeitsplatten, Fronten), Geräte, Ergonomie, Beleuchtung und realistische Preisvorstellungen.

## WICHTIG - Folgefragen vorschlagen:
Am Ende JEDER Antwort schlägst du 2-3 passende Folgefragen vor, die der Nutzer stellen könnte.
Format diese Vorschläge IMMER exakt so (mit dem Trennzeichen):

---FRAGEN---
Frage 1 hier?
Frage 2 hier?
Frage 3 hier?

Die Fragen sollen:
- Zum Kontext des Gesprächs passen
- Kurz und klickbar sein (max 6-8 Wörter)
- Den Nutzer tiefer ins Thema führen

Beispiel:
"Hmm, 'die beste' gibt's eigentlich nicht – hängt total davon ab, wie du deine Küche nutzt! 😊 Kochst du viel und wild? Dann würd ich Keramik oder Quarz empfehlen, die halten echt was aus."

---FRAGEN---
Was kostet eine Keramik-Arbeitsplatte?
Welche Farben gibt es bei Quarz?
Ist Holz pflegeintensiv?`;

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
