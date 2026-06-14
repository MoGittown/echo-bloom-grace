import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { assertStudioAccess } from "../_shared/planAccess.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

/**
 * Studio-E-Mail wird serverseitig aus der DB aufgelöst, damit der Client
 * NICHT als offenes Spam-Relay missbraucht werden kann. Empfänger ist immer
 * die im Branding hinterlegte Studio-Adresse.
 */
function slugifyStudioName(name: string): string {
  const map: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
  let slug = name.toLowerCase().trim();
  for (const [char, repl] of Object.entries(map)) {
    slug = slug.replaceAll(char, repl);
  }
  return (
    slug
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "studio"
  );
}

async function resolveStudioRow(studioSlug?: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return null;
  const supabase = createClient(supabaseUrl, serviceKey);

  let query = supabase
    .from("studio_branding")
    .select("contact_email, subscription_status, billing_grace_ends_at, plan");
  if (studioSlug && studioSlug.trim()) {
    query = query.eq("studio_slug", slugifyStudioName(studioSlug));
  } else {
    query = query.limit(1);
  }
  const { data } = await query.maybeSingle();
  return data as Record<string, unknown> | null;
}

async function resolveStudioEmail(studioSlug?: string): Promise<string | null> {
  const row = await resolveStudioRow(studioSlug);
  const email = (row?.contact_email as string | undefined)?.trim();
  return email && email.length > 0 ? email : null;
}

/** Best-effort In-Memory Rate-Limit gegen Massen-Versand (pro Instanz). */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 8;
const rateHits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (rateHits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  rateHits.set(key, hits);
  return hits.length > RATE_MAX_PER_WINDOW;
}

/** Verified Resend domain required for delivery to studio inboxes (not onboarding@resend.dev). */
const RESEND_FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") ?? "Küchenberatung <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  notes: string;
  timeline: string;
}

interface ProtocolEmailRequest {
  /** @deprecated Empfänger wird serverseitig aus dem Branding aufgelöst. */
  recipientEmail?: string;
  studioSlug?: string;
  customerName: string;
  projectDate: string;
  summaryHtml: string;
  summaryPlainText?: string;
  projectJson?: string;
  customerData?: CustomerData;
}

function encodeAttachmentUtf8(content: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode("\ufeff" + content);
  return btoa(String.fromCharCode(...bytes));
}

/** Escapes HTML special characters to prevent injection */
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Escapes CSV fields to prevent formula injection */
function escapeCsvField(field: string): string {
  if (!field) return '';
  // Prevent CSV formula injection
  if (/^[=+\-@\t\r]/.test(field)) {
    return "'" + field;
  }
  return field;
}

// Generate CSV content with customer contact data only
function generateContactCSV(customer: CustomerData, projectDate: string): string {
  const rows = [
    ['Feld', 'Wert'],
    ['Vorname', escapeCsvField(customer.firstName || '')],
    ['Nachname', escapeCsvField(customer.lastName || '')],
    ['E-Mail', escapeCsvField(customer.email || '')],
    ['Telefon', escapeCsvField(customer.phone || '')],
    ['Straße', escapeCsvField(customer.address || '')],
    ['PLZ', escapeCsvField(customer.postalCode || '')],
    ['Ort', escapeCsvField(customer.city || '')],
    ['Zeitrahmen', escapeCsvField(customer.timeline || '')],
    ['Anmerkungen', escapeCsvField((customer.notes || '').replace(/\n/g, ' '))],
    ['Protokoll-Datum', escapeCsvField(projectDate)],
  ];

  // Convert to CSV with semicolon separator (German Excel compatible)
  return rows.map(row => 
    row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(';')
  ).join('\n');
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studioSlug, customerName, projectDate, summaryHtml, summaryPlainText, projectJson, customerData }: ProtocolEmailRequest = await req.json();

    // Rate-Limit pro Absender-IP, um Massen-Versand zu verhindern
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(`${clientIp}:${studioSlug ?? "default"}`)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // SICHERHEIT: Empfänger wird serverseitig aus dem Branding bestimmt –
    // niemals aus dem Client-Payload. Verhindert Missbrauch als Spam-Relay.
    const studioRow = await resolveStudioRow(studioSlug);
    if (!studioRow) {
      return new Response(
        JSON.stringify({ error: "Studio not found." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const access = assertStudioAccess(studioRow);
    if (!access.ok) {
      return new Response(
        JSON.stringify({ error: "Studio subscription is inactive." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const recipientEmail = await resolveStudioEmail(studioSlug);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || recipientEmail.length > 254 || !emailRegex.test(recipientEmail)) {
      return new Response(
        JSON.stringify({ error: "Studio email is not configured." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending protocol email for customer`);

    // Escape all user-provided values before interpolation into HTML
    const safeCustomerName = escapeHtml(customerName);
    const safeProjectDate = escapeHtml(projectDate);
    const safePhone = customerData ? escapeHtml(customerData.phone) : '';
    const safeEmail = customerData ? escapeHtml(customerData.email) : '';
    const safeTimeline = customerData ? escapeHtml(customerData.timeline) : '';

    // Build email options
    const emailOptions: any = {
      from: RESEND_FROM_EMAIL,
      to: [recipientEmail],
      subject: `Beratungsprotokoll: ${safeCustomerName} - ${safeProjectDate}`,
      html: `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Beratungsprotokoll</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              border-bottom: 2px solid #8b7355;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            h1 {
              color: #2d2a26;
              font-size: 24px;
              margin: 0 0 10px 0;
            }
            .meta {
              color: #666;
              font-size: 14px;
            }
            .highlight-box {
              background: linear-gradient(135deg, #f0ebe3 0%, #e5e0d8 100%);
              border-left: 4px solid #8b7355;
              padding: 15px 20px;
              margin: 20px 0;
              border-radius: 0 8px 8px 0;
            }
            .highlight-box h2 {
              font-size: 16px;
              color: #5a4a3a;
              margin: 0 0 10px 0;
            }
            .highlight-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }
            .highlight-item {
              font-size: 13px;
            }
            .highlight-label {
              color: #666;
              font-size: 11px;
              text-transform: uppercase;
            }
            .highlight-value {
              font-weight: 600;
              color: #2d2a26;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #8b7355;
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 1px solid #e5e0d8;
            }
            .info-row {
              display: flex;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: 500;
              width: 150px;
              color: #666;
            }
            .info-value {
              flex: 1;
            }
            .tag {
              display: inline-block;
              background: #f0ebe3;
              color: #5a4a3a;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 13px;
              margin: 2px;
            }
            .info-line {
              margin-bottom: 6px;
              font-size: 13px;
              color: #2d2a26;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e0d8;
              color: #666;
              font-size: 12px;
              text-align: center;
            }
            .csv-note {
              background: #e8f4e8;
              border: 1px solid #4caf50;
              border-radius: 6px;
              padding: 12px 15px;
              margin: 20px 0;
              font-size: 13px;
              color: #2e7d32;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Beratungsprotokoll</h1>
              <div class="meta">
                <strong>Kunde:</strong> ${safeCustomerName}<br>
                <strong>Datum:</strong> ${safeProjectDate}
              </div>
            </div>

            ${customerData ? `
            <div class="highlight-box">
              <h2>📋 Auf einen Blick</h2>
              <div class="highlight-grid">
                <div class="highlight-item">
                  <div class="highlight-label">Kontakt</div>
                  <div class="highlight-value">${safePhone || safeEmail || 'Nicht angegeben'}</div>
                </div>
                <div class="highlight-item">
                  <div class="highlight-label">Zeitrahmen</div>
                  <div class="highlight-value">${safeTimeline || 'Nicht angegeben'}</div>
                </div>
              </div>
            </div>
            
            <div class="csv-note">
              📎 <strong>Dateien im Anhang:</strong> Kontaktdaten (CSV), vollständige Checkliste (TXT) und Projekt-Daten (JSON) für die Terminvorbereitung.
            </div>
            ` : ''}
            
            ${summaryHtml}
            
            <div class="footer">
              <p>Dieses Beratungsprotokoll wurde automatisch generiert.</p>
              <p>Bei Fragen wenden Sie sich bitte an Ihr Küchenstudio.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const attachments: Array<{ filename: string; content: string }> = [];

    if (customerData) {
      const csvContent = generateContactCSV(customerData, projectDate);
      const lastName = customerData.lastName || 'Kunde';
      const dateStr = new Date().toISOString().split('T')[0];

      attachments.push({
        filename: `Kontaktdaten_${lastName}_${dateStr}.csv`,
        content: encodeAttachmentUtf8(csvContent),
      });

      if (summaryPlainText && summaryPlainText.trim().length > 0) {
        attachments.push({
          filename: `Checkliste_${lastName}_${dateStr}.txt`,
          content: encodeAttachmentUtf8(summaryPlainText),
        });
      }

      if (projectJson && projectJson.trim().length > 0) {
        attachments.push({
          filename: `Projekt_${lastName}_${dateStr}.json`,
          content: btoa(unescape(encodeURIComponent(projectJson))),
        });
      }
    }

    if (attachments.length > 0) {
      emailOptions.attachments = attachments;
    }

    const emailResponse = await resend.emails.send(emailOptions);

    console.log("Email sent successfully");

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-protocol-email function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email. Please try again later." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
