#!/usr/bin/env node
/**
 * Trägt alle Admin-Felder für Küchenstudio Eins / Vollmer ein.
 * Nutzung: node scripts/seed-vollmer-studio.mjs [admin-passwort]
 */
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pstfazamjmpcywgtkoyt.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdGZhemFtam1wY3l3Z3Rrb3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDE2NzUsImV4cCI6MjA4NDIxNzY3NX0.Y--lvlqqF8Vs0eUwwnbPoVmZJ9kWmnZk2j-qIANaTaI';
const PASSWORD = process.argv[2] || process.env.ADMIN_PASSWORD || 'Kuechenready2026!';
const RESET_KEY = process.env.ADMIN_RESET_KEY || 'kuechenready-reset-v1';

async function invoke(body) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/branding-admin`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data;
}

// Schema reparieren (falls neue Spalten fehlen)
const repair = await invoke({ action: 'repair-schema', resetKey: RESET_KEY });
if (!repair?.success && repair?.error !== 'invalid_reset_key') {
  console.warn('Schema-Repair:', repair?.error || repair);
}

const studioSettings = {
  content: {
    onboardingText: 'In wenigen Minuten sammeln wir alles Wichtige für Ihren persönlichen Beratungstermin.',
    customQuestions: [],
    hiddenStandardQuestionKeys: [],
  },
  legal: {
    consentText:
      'Ich willige ein, dass meine Angaben (Name, Kontakt, Küchenwünsche und hochgeladene Fotos/Pläne) an Küchenstudio Eins / Vollmer Objektmöbel zur Vorbereitung des Küchenberatungstermins übermittelt und verarbeitet werden. Die Einwilligung kann jederzeit widerrufen werden.',
    dataDelivery: 'both',
    crmWebhookUrl: null,
  },
  pdf: {
    footerText:
      'Vollmer Objektmöbel · Schusters Garten 4 · 50374 Erftstadt · Tel. +49 178 8576150 · office@vollmer-objektmoebel.com · www.vollmer-objektmoebel.com',
    privacySnippet:
      'Ihre Angaben werden vertraulich behandelt und ausschließlich zur Vorbereitung Ihrer Küchenberatung verwendet. Verantwortlich: Vollmer Objektmöbel, Schusters Garten 4, 50374 Erftstadt. Weitere Informationen: www.vollmer-objektmoebel.com/datenschutz',
    termsSnippet:
      'Dieses Beratungsprotokoll dient der Vorbereitung eines persönlichen Beratungstermins und stellt kein verbindliches Angebot dar. Preisangaben, falls enthalten, sind unverbindlich und können sich ändern.',
    template: 'standard',
    autoEmailToStudio: true,
    headerNote: '',
    headerColorHex: '#BE185D',
  },
  catalog: {
    budgetMin: 5000,
    budgetMax: 50000,
    budgetStep: 1000,
    recommendedPackages: [],
    topStyleRecommendations: [],
    topMaterialRecommendations: [],
    questionHints: {},
  },
  analytics: {
    googleAnalyticsId: null,
    showStatsToStudio: true,
    internalNotes: '',
  },
  technical: {
    customSubdomain: null,
    pushNotifications: false,
    apiEnabled: false,
  },
};

const data = await invoke({
  action: 'update',
  password: PASSWORD,
  studioName: 'Küchenstudio Eins',
  displayAppName: 'Vollmer Objektmöbel',
  slogan: 'Ihre Küche. Ihr Zuhause. Professionell geplant.',
  studioSlug: 'vollmer-objektmoebel',
  studioCode: 'VOLL-2026',
  privacyUrl: 'https://www.vollmer-objektmoebel.com/datenschutz',
  imprintUrl: 'https://www.vollmer-objektmoebel.com/impressum',
  contactAddress: 'Schusters Garten 4, 50374 Erftstadt',
  contactPhone: '+49 178 8576150',
  contactEmail: 'office@vollmer-objektmoebel.com',
  contactWebsite: 'https://www.vollmer-objektmoebel.com',
  landingHeadline: 'Vermeiden Sie die 3 teuersten Fehler beim ersten Küchentermin',
  landingSubheadline: 'In nur 7 Minuten perfekt vorbereitet für Ihre Küchenberatung bei Vollmer Objektmöbel',
  landingBenefit1: 'Sparen Sie Zeit im Beratungsgespräch',
  landingBenefit2: 'Vermeiden Sie kostspielige Planungsfehler',
  landingBenefit3: 'Erhalten Sie eine maßgeschneiderte Erstberatung',
  landingCtaText: 'Jetzt Küchen-Check starten',
  landingWhyText:
    'Studios mit vorbereiteten Kunden können sofort mit der Planung beginnen – das spielt Ihnen Zeit und Nerven und führt zu besseren Ergebnissen.',
  showLandingPage: true,
  studioSettings,
});

if (!data?.success) {
  console.error('Fehler:', JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log('✅ Alle Felder eingetragen.');
console.log('Studio-Slug:', data.branding?.studio_slug || 'vollmer-objektmoebel');
console.log('Landing:', 'https://kuechenready.de/s/vollmer-objektmoebel');
console.log('Check:', 'https://kuechenready.de/s/vollmer-objektmoebel/check');
