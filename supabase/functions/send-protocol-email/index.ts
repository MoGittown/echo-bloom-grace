import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  recipientEmail: string;
  customerName: string;
  projectDate: string;
  summaryHtml: string;
  customerData?: CustomerData;
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
    const { recipientEmail, customerName, projectDate, summaryHtml, customerData }: ProtocolEmailRequest = await req.json();

    // Validate email format and length
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || typeof recipientEmail !== 'string' || recipientEmail.length > 254 || !emailRegex.test(recipientEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid recipient email address." }),
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
      from: "Küchenberatung <onboarding@resend.dev>",
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
              📎 <strong>CSV-Datei im Anhang:</strong> Die Kundenkontaktdaten können direkt in Ihre Planungssoftware importiert werden.
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

    // Add CSV attachment if customer data is provided
    if (customerData) {
      const csvContent = generateContactCSV(customerData, projectDate);
      const lastName = customerData.lastName || 'Kunde';
      const dateStr = new Date().toISOString().split('T')[0];
      
      // Encode CSV content as base64 using TextEncoder
      const encoder = new TextEncoder();
      const csvBytes = encoder.encode('\ufeff' + csvContent);
      const base64Content = btoa(String.fromCharCode(...csvBytes));
      
      emailOptions.attachments = [
        {
          filename: `Kontaktdaten_${lastName}_${dateStr}.csv`,
          content: base64Content,
        }
      ];
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
