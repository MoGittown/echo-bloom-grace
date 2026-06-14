import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DEFAULT_STUDIO_SETTINGS,
  mergeStudioSettings,
  type StudioSettings,
} from '@/types/studioSettings';
import {
  DEFAULT_FEATURE_CONFIG,
  parseFeatureConfig,
  type FeatureConfig,
} from '@/types/featureConfig';
import { buildBrandingUpdateBody, type BrandingUpdates } from '@/lib/brandingApi';
import { fetchBillingSnapshot } from '@/lib/billingApi';
import type { BillingSnapshot } from '@/types/billing';
import { parseBillingSnapshot } from '@/types/billing';
import {
  parseStudioAccessFromBranding,
  type StudioAccess,
  resolveStudioAccess,
} from '@/lib/planFeatures';

export interface LandingPageData {
  headline: string;
  subheadline: string;
  benefit1: string;
  benefit2: string;
  benefit3: string;
  ctaText: string;
  whyText: string;
  showLandingPage: boolean;
}

export interface ContactData {
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

export interface AnalyticsData {
  rangeDays: number;
  totalEvents: number;
  sessions: number;
  funnel: Record<string, number>;
  conversions: Record<string, number>;
  errors: Array<{ context: string; message: string; at: string }>;
  byDay: Array<{ day: string; sessions: number }>;
}

export interface BrandingData {
  id?: string;
  studioSlug?: string | null;
  studioCode?: string | null;
  studioName: string;
  displayAppName?: string | null;
  slogan?: string | null;
  logoUrl: string | null;
  logoWhiteUrl?: string | null;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  imprintUrl?: string | null;
  privacyUrl?: string | null;
  showDefaultBranding: boolean;
  showAppointmentBooking: boolean;
  showManufacturerField: boolean;
  customManufacturers: string[];
  enabledManufacturers: string[];
  landingPage: LandingPageData;
  contact: ContactData;
  studioSettings: StudioSettings;
  featureConfig: FeatureConfig;
  studioAccess: StudioAccess;
}

const DEFAULT_LANDING: LandingPageData = {
  headline: 'Vermeiden Sie die 3 teuersten Fehler beim ersten Küchentermin',
  subheadline: 'In nur 7 Minuten perfekt vorbereitet für Ihre Küchenberatung',
  benefit1: 'Sparen Sie Zeit im Beratungsgespräch',
  benefit2: 'Vermeiden Sie kostspielige Planungsfehler',
  benefit3: 'Erhalten Sie ein maßgeschneidertes Angebot',
  ctaText: 'Jetzt starten',
  whyText: 'Mit ausgefüllter Checkliste startet Ihr Beratungstermin direkt mit der Planung – das spart Ihnen Zeit und Nerven und führt zu besseren Ergebnissen.',
  showLandingPage: true,
};

const DEFAULT_CONTACT: ContactData = {
  address: null,
  phone: null,
  email: null,
  website: null,
};

const DEFAULT_BRANDING: BrandingData = {
  studioName: '',
  logoUrl: null,
  primaryColor: '#8B7355',
  secondaryColor: '#6B7280',
  accentColor: '#16A34A',
  showDefaultBranding: true,
  showAppointmentBooking: false,
  showManufacturerField: true,
  customManufacturers: [],
  enabledManufacturers: [],
  landingPage: DEFAULT_LANDING,
  contact: DEFAULT_CONTACT,
  studioSettings: DEFAULT_STUDIO_SETTINGS,
  featureConfig: DEFAULT_FEATURE_CONFIG,
  studioAccess: resolveStudioAccess({ subscriptionStatus: 'legacy' }),
};

// Helper to convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Apply primary color to CSS variables
function applyPrimaryColor(hexColor: string) {
  const hsl = hexToHSL(hexColor);
  if (!hsl) return;

  const root = document.documentElement;
  const hslValue = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
  
  // Light mode primary
  root.style.setProperty('--primary', hslValue);
  root.style.setProperty('--ring', hslValue);
  root.style.setProperty('--sidebar-primary', hslValue);
  root.style.setProperty('--sidebar-ring', hslValue);
  
  // Create a slightly lighter version for dark mode
  const darkHsl = `${hsl.h} ${hsl.s}% ${Math.min(hsl.l + 10, 65)}%`;
  
  // Apply to dark mode using a style element
  let darkStyleEl = document.getElementById('branding-dark-styles');
  if (!darkStyleEl) {
    darkStyleEl = document.createElement('style');
    darkStyleEl.id = 'branding-dark-styles';
    document.head.appendChild(darkStyleEl);
  }
  darkStyleEl.textContent = `
    .dark {
      --primary: ${darkHsl};
      --ring: ${darkHsl};
      --sidebar-primary: ${darkHsl};
      --sidebar-ring: ${darkHsl};
    }
  `;
}

// Helper to parse branding data from database response
function parseBrandingData(data: any): BrandingData {
  return {
    id: data.id,
    studioSlug: data.studio_slug || null,
    studioCode: data.studio_code || null,
    studioName: data.studio_name || '',
    displayAppName: data.display_app_name || null,
    slogan: data.slogan || null,
    logoUrl: data.logo_url,
    logoWhiteUrl: data.logo_white_url || null,
    primaryColor: data.primary_color || '#C2410C',
    secondaryColor: data.secondary_color || '#6B7280',
    accentColor: data.accent_color || '#16A34A',
    imprintUrl: data.imprint_url || null,
    privacyUrl: data.privacy_url || null,
    showDefaultBranding: data.show_default_branding ?? true,
    showAppointmentBooking: data.show_appointment_booking ?? false,
    showManufacturerField: data.show_manufacturer_field ?? true,
    customManufacturers: data.custom_manufacturers || [],
    enabledManufacturers: data.enabled_manufacturers || [],
    studioSettings: mergeStudioSettings(data.studio_settings),
    featureConfig: parseFeatureConfig(data.feature_config),
    landingPage: {
      headline: data.landing_headline || DEFAULT_LANDING.headline,
      subheadline: data.landing_subheadline || DEFAULT_LANDING.subheadline,
      benefit1: data.landing_benefit_1 || DEFAULT_LANDING.benefit1,
      benefit2: data.landing_benefit_2 || DEFAULT_LANDING.benefit2,
      benefit3: data.landing_benefit_3 || DEFAULT_LANDING.benefit3,
      ctaText: data.landing_cta_text || DEFAULT_LANDING.ctaText,
      whyText: data.landing_why_text || DEFAULT_LANDING.whyText,
      showLandingPage: data.show_landing_page ?? true,
    },
    contact: {
      address: data.contact_address || null,
      phone: data.contact_phone || null,
      email: data.contact_email || null,
      website: data.contact_website || null,
    },
    studioAccess: parseStudioAccessFromBranding(data),
  };
}

export function useBranding(studioSlug?: string) {
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBranding = async () => {
      const applyLoaded = (row: any) => {
        const brandingData = parseBrandingData(row);
        setBranding(brandingData);
        if (row.primary_color) {
          applyPrimaryColor(row.primary_color);
        }
      };

      try {
        const { data, error } = await supabase.functions.invoke('branding-admin', {
          body: {
            action: 'public-get',
            studioSlug: studioSlug || undefined,
          },
        });

        if (!error && !data?.error && data?.branding) {
          applyLoaded(data.branding);
          return;
        }
      } catch (error) {
        console.warn('Branding via edge function failed, trying view:', error);
      }

      try {
        let query = supabase.from('studio_branding_public' as any).select('*');
        if (studioSlug) {
          query = query.eq('studio_slug', studioSlug);
        } else {
          query = query.limit(1);
        }
        const { data, error } = await query.maybeSingle();

        if (data && !error) {
          applyLoaded(data as any);
        }
      } catch (error) {
        console.error('Failed to load branding:', error);
      }
    };

    loadBranding().finally(() => setIsLoading(false));
  }, [studioSlug]);

  return {
    branding,
    isLoading,
  };
}

// Admin hook with password-protected updates
export function useBrandingAdmin() {
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [sessionPassword, setSessionPassword] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);

  const loadPublicBranding = useCallback(async () => {
    const tryInvoke = async (action: string) => {
      const { data, error } = await supabase.functions.invoke('branding-admin', {
        body: { action },
      });
      if (error || data?.error) return null;
      return data?.branding ?? null;
    };

    const fromStatus = await tryInvoke('status');
    if (fromStatus) return fromStatus;

    const fromPublic = await tryInvoke('public-get');
    if (fromPublic) return fromPublic;

    const { data } = await supabase
      .from('studio_branding_public' as any)
      .select('*')
      .limit(1)
      .maybeSingle();
    return data ?? null;
  }, []);

  // Check initial state (Edge Function + Fallbacks)
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('branding-admin', {
          body: { action: 'verify', password: '__status_probe__' },
        });

        if (error) throw error;

        if (data?.needsSetup || data?.error === 'no_branding_setup') {
          setNeedsSetup(true);
          return;
        }

        setNeedsSetup(false);
        const row = await loadPublicBranding();
        if (row) {
          setBranding(parseBrandingData(row));
        }
      } catch (error) {
        console.error('Failed to check branding status:', error);
        try {
          const row = await loadPublicBranding();
          if (row) {
            setBranding(parseBrandingData(row));
            setNeedsSetup(false);
          } else {
            setNeedsSetup(true);
          }
        } catch (fallbackError) {
          console.error('Branding fallback failed:', fallbackError);
          setNeedsSetup(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [loadPublicBranding]);

  const verifyPassword = useCallback(async (password: string, studioSlug?: string): Promise<boolean> => {
    try {
      const slug = studioSlug?.trim() || undefined;
      const { data, error } = await supabase.functions.invoke('branding-admin', {
        body: {
          action: 'verify',
          password,
          targetStudioSlug: slug,
          studioSlug: slug,
        },
      });

      if (error) throw error;

      if (data.needsSetup) {
        setNeedsSetup(true);
        return false;
      }

      if (data.success) {
        setIsAuthenticated(true);
        setSessionPassword(password);
        if (data.branding) {
          setBranding(parseBrandingData(data.branding));
        }
        setBilling(parseBillingSnapshot(data.billing));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }, []);

  const setupBranding = useCallback(async (
    password: string,
    initialData?: Partial<BrandingData>,
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('branding-admin', {
        body: {
          action: 'setup',
          password,
          studioName: initialData?.studioName || '',
          logoUrl: initialData?.logoUrl || null,
          primaryColor: initialData?.primaryColor || '#8B7355',
          showDefaultBranding: initialData?.showDefaultBranding ?? true,
        },
      });

      if (error) throw error;

      if (data?.error === 'already_setup') {
        setNeedsSetup(false);
        if (data.branding) {
          setBranding(parseBrandingData(data.branding));
        }
        return { ok: false, error: 'already_setup' };
      }

      if (data.success) {
        setIsAuthenticated(true);
        setSessionPassword(password);
        setNeedsSetup(false);
        if (data.branding) {
          setBranding(parseBrandingData(data.branding));
        }
        return { ok: true };
      }
      return { ok: false, error: data?.error || 'setup_failed' };
    } catch (error) {
      console.error('Setup failed:', error);
      return { ok: false, error: 'network_error' };
    }
  }, []);

  const updateBranding = useCallback(async (updates: BrandingUpdates): Promise<boolean> => {
    if (!sessionPassword) return false;

    try {
      const body = buildBrandingUpdateBody(sessionPassword, {
        ...updates,
        targetStudioSlug: branding.studioSlug ?? undefined,
      });
      const { data, error } = await supabase.functions.invoke('branding-admin', {
        body,
      });

      if (error) throw error;

      if (data.success && data.branding) {
        const newBranding = parseBrandingData(data.branding);
        setBranding(newBranding);
        
        // Apply the primary color immediately
        if (data.branding.primary_color) {
          applyPrimaryColor(data.branding.primary_color);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update failed:', error);
      return false;
    }
  }, [sessionPassword, branding.studioSlug]);

  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    try {
      if (!sessionPassword) return null;

      const formData = new FormData();
      formData.append('action', 'upload-logo');
      formData.append('password', sessionPassword);
      formData.append('file', file);
      if (branding.studioSlug) {
        formData.append('targetStudioSlug', branding.studioSlug);
      }

      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${url}/functions/v1/branding-admin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}` },
        body: formData,
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Upload failed');

      if (data.branding) {
        setBranding(parseBrandingData(data.branding));
      }
      return data.logoUrl as string;
    } catch (error) {
      console.error('Logo upload failed:', error);
      return null;
    }
  }, [sessionPassword, branding.studioSlug]);

  const changePassword = useCallback(async (
    newPassword: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!sessionPassword) return { ok: false, error: 'not_authenticated' };
    if (!newPassword || newPassword.length < 8) {
      return { ok: false, error: 'password_too_short' };
    }
    try {
      const { data, error } = await supabase.functions.invoke('branding-admin', {
        body: {
          action: 'change-password',
          password: sessionPassword,
          newPassword,
          targetStudioSlug: branding.studioSlug ?? undefined,
        },
      });
      if (error) throw error;
      if (data?.success) {
        setSessionPassword(newPassword);
        return { ok: true };
      }
      return { ok: false, error: data?.error || 'change_failed' };
    } catch (err) {
      console.error('Password change failed:', err);
      return { ok: false, error: 'network_error' };
    }
  }, [sessionPassword, branding.studioSlug]);

  const getAnalytics = useCallback(async (): Promise<AnalyticsData | null> => {
    if (!sessionPassword) return null;
    try {
      const { data, error } = await supabase.functions.invoke('branding-admin', {
        body: {
          action: 'get-analytics',
          password: sessionPassword,
          targetStudioSlug: branding.studioSlug ?? undefined,
        },
      });
      if (error) throw error;
      if (data?.success && data.analytics) {
        return data.analytics as AnalyticsData;
      }
      return null;
    } catch (err) {
      console.error('Analytics fetch failed:', err);
      return null;
    }
  }, [sessionPassword, branding.studioSlug]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setSessionPassword(null);
    setBilling(null);
  }, []);

  const refreshBilling = useCallback(async (): Promise<BillingSnapshot | null> => {
    if (!sessionPassword) return null;
    const snap = await fetchBillingSnapshot({
      password: sessionPassword,
      studioSlug: branding.studioSlug ?? undefined,
    });
    setBilling(snap);
    return snap;
  }, [sessionPassword, branding.studioSlug]);

  return {
    branding,
    billing,
    sessionPassword,
    isLoading,
    isAuthenticated,
    needsSetup,
    verifyPassword,
    setupBranding,
    updateBranding,
    uploadLogo,
    changePassword,
    getAnalytics,
    refreshBilling,
    logout,
  };
}
