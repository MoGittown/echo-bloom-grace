import { Resend } from "https://esm.sh/resend@2.0.0";

/**
 * Billing-bezogene Transaktions-E-Mails (Deutsch, schlichtes HTML).
 *
 * Robust: Jeder Versand ist in try/catch gekapselt und wirft niemals – ein
 * fehlgeschlagener Mail-Versand darf den Stripe-Webhook nicht zum Absturz
 * bringen. Fehler werden nur geloggt.
 *
 * Benötigte Secrets:
 *  - RESEND_API_KEY        (Pflicht, sonst werden Mails übersprungen)
 *  - RESEND_FROM_EMAIL     (optional, verifizierte Absenderdomain empfohlen)
 *  - PLATFORM_NOTIFY_EMAIL (optional, Empfänger der Betreiber-Benachrichtigung)
 */

const FALLBACK_FROM = "Küchenready <onboarding@resend.dev>";

function fromAddress(): string {
  return Deno.env.get("RESEND_FROM_EMAIL")?.trim() || FALLBACK_FROM;
}

export function platformNotifyEmail(): string | null {
  return Deno.env.get("PLATFORM_NOTIFY_EMAIL")?.trim() || null;
}

function getResend(): Resend | null {
  const key = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!key) {
    console.warn("billingEmails: RESEND_API_KEY missing — skipping email");
    return null;
  }
  return new Resend(key);
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string | null | undefined): email is string {
  return Boolean(email && email.length <= 254 && EMAIL_RE.test(email));
}

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#2d2a26;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border-radius:10px;padding:28px;box-shadow:0 2px 10px rgba(0,0,0,0.06);">
      <h1 style="font-size:20px;margin:0 0 16px 0;color:#2d2a26;">${escapeHtml(title)}</h1>
      ${bodyHtml}
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #ececec;color:#888;font-size:12px;">
        <p style="margin:0;">Küchenready · Diese E-Mail wurde automatisch versendet.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function safeSend(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  try {
    if (!isValidEmail(opts.to)) {
      console.warn("billingEmails: invalid recipient, skipping:", opts.to);
      return;
    }
    const resend = getResend();
    if (!resend) return;
    await resend.emails.send({
      from: fromAddress(),
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    });
    console.log("billingEmails: sent", opts.subject);
  } catch (error) {
    console.error("billingEmails: send failed", opts.subject, error);
  }
}

export interface StudioContact {
  studioName: string | null;
  email: string | null;
  plan?: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  premium: "Premium",
};

function planLabel(plan: string | null | undefined): string {
  if (!plan) return "—";
  return PLAN_LABELS[plan] ?? plan;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/** a) Willkommens-/Bestätigungsmail ans Studio, sobald das Abo aktiv ist. */
export async function sendStudioWelcomeEmail(studio: StudioContact): Promise<void> {
  const name = escapeHtml(studio.studioName || "Ihr Küchenstudio");
  const html = layout(
    "Willkommen bei Küchenready",
    `<p style="margin:0 0 12px 0;">Hallo ${name},</p>
     <p style="margin:0 0 12px 0;">vielen Dank! Ihr Abo ist jetzt aktiv und Ihr Kunden-Check ist freigeschaltet.</p>
     <p style="margin:0 0 12px 0;"><strong>Tarif:</strong> ${escapeHtml(planLabel(studio.plan))}</p>
     <p style="margin:0 0 12px 0;">Sie können Ihr Studio jederzeit in der Admin-Konsole anpassen –
     Farben, Logo, Check-Schritte und mehr. Rechnungen und Zahlungsmethode verwalten Sie
     bequem im Stripe-Kundenportal (im Bereich „Abo").</p>
     <p style="margin:0;">Viel Erfolg mit Ihren Beratungsgesprächen!</p>`,
  );
  await safeSend({
    to: studio.email ?? "",
    subject: "Willkommen bei Küchenready – Ihr Abo ist aktiv",
    html,
  });
}

/** b) Benachrichtigung an den Plattform-Betreiber über einen neuen Abschluss. */
export async function sendOperatorNewSubscriptionEmail(
  studio: StudioContact & { studioSlug?: string | null },
): Promise<void> {
  const to = platformNotifyEmail();
  if (!to) {
    console.warn("billingEmails: PLATFORM_NOTIFY_EMAIL not set — skipping operator notice");
    return;
  }
  const html = layout(
    "Neuer Abo-Abschluss",
    `<p style="margin:0 0 12px 0;">Ein Studio hat ein Abo abgeschlossen bzw. aktiviert:</p>
     <table style="border-collapse:collapse;font-size:14px;">
       <tr><td style="padding:4px 12px 4px 0;color:#888;">Studio</td><td style="padding:4px 0;">${escapeHtml(studio.studioName || "—")}</td></tr>
       <tr><td style="padding:4px 12px 4px 0;color:#888;">Slug</td><td style="padding:4px 0;">${escapeHtml(studio.studioSlug || "—")}</td></tr>
       <tr><td style="padding:4px 12px 4px 0;color:#888;">Tarif</td><td style="padding:4px 0;">${escapeHtml(planLabel(studio.plan))}</td></tr>
       <tr><td style="padding:4px 12px 4px 0;color:#888;">E-Mail</td><td style="padding:4px 0;">${escapeHtml(studio.email || "—")}</td></tr>
     </table>`,
  );
  await safeSend({ to, subject: "Küchenready: Neuer Abo-Abschluss", html });
}

/** c) Erinnerung ~1 Woche vor der Verlängerung (Stripe-Event invoice.upcoming). */
export async function sendRenewalReminderEmail(
  studio: StudioContact,
  opts: { renewalDate?: string | null; amountText?: string | null },
): Promise<void> {
  const name = escapeHtml(studio.studioName || "Ihr Küchenstudio");
  const amountLine = opts.amountText
    ? `<p style="margin:0 0 12px 0;"><strong>Betrag:</strong> ${escapeHtml(opts.amountText)}</p>`
    : "";
  const html = layout(
    "Ihre Abo-Verlängerung steht an",
    `<p style="margin:0 0 12px 0;">Hallo ${name},</p>
     <p style="margin:0 0 12px 0;">Ihr Küchenready-Abo verlängert sich am
     <strong>${escapeHtml(formatDate(opts.renewalDate))}</strong> automatisch.</p>
     ${amountLine}
     <p style="margin:0 0 12px 0;">Sie müssen nichts tun – die Zahlung erfolgt automatisch über Ihre
     hinterlegte Zahlungsmethode. Möchten Sie etwas ändern oder kündigen, nutzen Sie das
     Stripe-Kundenportal im Bereich „Abo" Ihrer Admin-Konsole.</p>
     <p style="margin:0;">Danke, dass Sie Küchenready nutzen!</p>`,
  );
  await safeSend({
    to: studio.email ?? "",
    subject: "Küchenready: Ihre Abo-Verlängerung steht an",
    html,
  });
}

/** d1) Zahlung fehlgeschlagen. */
export async function sendPaymentFailedEmail(studio: StudioContact): Promise<void> {
  const name = escapeHtml(studio.studioName || "Ihr Küchenstudio");
  const html = layout(
    "Zahlung fehlgeschlagen",
    `<p style="margin:0 0 12px 0;">Hallo ${name},</p>
     <p style="margin:0 0 12px 0;">leider konnte die letzte Zahlung für Ihr Küchenready-Abo nicht
     eingezogen werden.</p>
     <p style="margin:0 0 12px 0;">Bitte aktualisieren Sie Ihre Zahlungsmethode im Stripe-Kundenportal
     (Bereich „Abo" in Ihrer Admin-Konsole). Ihr Kunden-Check bleibt noch für eine kurze Übergangsfrist
     erreichbar.</p>
     <p style="margin:0;">Bei Fragen sind wir gerne für Sie da.</p>`,
  );
  await safeSend({
    to: studio.email ?? "",
    subject: "Küchenready: Zahlung fehlgeschlagen – bitte Zahlungsmethode prüfen",
    html,
  });
}

/** d2) Kündigung bestätigt. */
export async function sendCancellationEmail(studio: StudioContact): Promise<void> {
  const name = escapeHtml(studio.studioName || "Ihr Küchenstudio");
  const html = layout(
    "Ihr Abo wurde gekündigt",
    `<p style="margin:0 0 12px 0;">Hallo ${name},</p>
     <p style="margin:0 0 12px 0;">wir bestätigen die Kündigung Ihres Küchenready-Abos. Ihr Zugang bleibt
     bis zum Ende der bereits bezahlten Periode aktiv.</p>
     <p style="margin:0 0 12px 0;">Schade, dass Sie gehen – Sie können jederzeit über Ihre Admin-Konsole
     ein neues Abo abschließen.</p>
     <p style="margin:0;">Danke, dass Sie Küchenready genutzt haben!</p>`,
  );
  await safeSend({
    to: studio.email ?? "",
    subject: "Küchenready: Kündigung bestätigt",
    html,
  });
}
