/**
 * Zentrale Studio-Konfiguration (Web-Landing + App + PDF).
 * Ergänzt die flachen Spalten in studio_branding.
 */

export interface CustomQuestion {
  id: string;
  label: string;
  type: 'text' | 'single' | 'multi' | 'yesno';
  options?: string[];
  required?: boolean;
  hint?: string;
}

export interface PdfSettings {
  headerNote: string;
  footerText: string;
  template: 'compact' | 'standard' | 'detailed';
  autoEmailToStudio: boolean;
  privacySnippet: string;
  termsSnippet: string;
  headerColorHex: string;
}

export interface LegalSettings {
  consentText: string;
  dataDelivery: 'pdf' | 'structured' | 'both';
  crmWebhookUrl: string | null;
}

export interface CatalogSettings {
  budgetMin: number;
  budgetMax: number;
  budgetStep: number;
  recommendedPackages: string[];
  topStyleRecommendations: string[];
  topMaterialRecommendations: string[];
  questionHints: Record<string, string>;
}

export interface AnalyticsSettings {
  googleAnalyticsId: string | null;
  showStatsToStudio: boolean;
  internalNotes: string;
}

export interface TechnicalSettings {
  customSubdomain: string | null;
  pushNotifications: boolean;
  apiEnabled: boolean;
}

export interface ContentSettings {
  onboardingText: string;
  customQuestions: CustomQuestion[];
  hiddenStandardQuestionKeys: string[];
}

export interface StudioSettings {
  content: ContentSettings;
  pdf: PdfSettings;
  legal: LegalSettings;
  catalog: CatalogSettings;
  analytics: AnalyticsSettings;
  technical: TechnicalSettings;
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  content: {
    onboardingText:
      'In wenigen Minuten sammeln wir alles Wichtige für Ihren persönlichen Beratungstermin.',
    customQuestions: [],
    hiddenStandardQuestionKeys: [],
  },
  pdf: {
    headerNote: '',
    footerText: '',
    template: 'standard',
    autoEmailToStudio: true,
    privacySnippet: '',
    termsSnippet: '',
    headerColorHex: '#8B7355',
  },
  legal: {
    consentText:
      'Ich willige ein, dass meine Daten zur Vorbereitung des Küchenberatungstermins verarbeitet werden.',
    dataDelivery: 'both',
    crmWebhookUrl: null,
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

export function mergeStudioSettings(raw: unknown): StudioSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STUDIO_SETTINGS };
  const r = raw as Partial<StudioSettings>;
  return {
    content: { ...DEFAULT_STUDIO_SETTINGS.content, ...r.content },
    pdf: { ...DEFAULT_STUDIO_SETTINGS.pdf, ...r.pdf },
    legal: { ...DEFAULT_STUDIO_SETTINGS.legal, ...r.legal },
    catalog: { ...DEFAULT_STUDIO_SETTINGS.catalog, ...r.catalog },
    analytics: { ...DEFAULT_STUDIO_SETTINGS.analytics, ...r.analytics },
    technical: { ...DEFAULT_STUDIO_SETTINGS.technical, ...r.technical },
  };
}
