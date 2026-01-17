import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProtocolEmailRequest {
  recipientEmail: string;
  customerName: string;
  projectDate: string;
  summaryHtml: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, customerName, projectDate, summaryHtml }: ProtocolEmailRequest = await req.json();

    console.log(`Sending protocol email for ${customerName} to ${recipientEmail}`);

    const emailResponse = await resend.emails.send({
      from: "Küchenberatung <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `Beratungsprotokoll: ${customerName} - ${projectDate}`,
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Beratungsprotokoll</h1>
              <div class="meta">
                <strong>Kunde:</strong> ${customerName}<br>
                <strong>Datum:</strong> ${projectDate}
              </div>
            </div>
            
            ${summaryHtml}
            
            <div class="footer">
              <p>Dieses Beratungsprotokoll wurde automatisch generiert.</p>
              <p>Bei Fragen wenden Sie sich bitte an Ihr Küchenstudio.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
