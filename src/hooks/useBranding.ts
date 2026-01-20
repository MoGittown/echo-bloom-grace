import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export interface BrandingData {
  id?: string;
  studioName: string;
  logoUrl: string | null;
  primaryColor: string;
  showDefaultBranding: boolean;
  showAppointmentBooking: boolean;
  showManufacturerField: boolean;
  customManufacturers: string[];
  landingPage: LandingPageData;
  contact: ContactData;
}

const DEFAULT_LANDING: LandingPageData = {
  headline: 'Vermeiden Sie die 3 teuersten Fehler beim ersten Küchentermin',
  subheadline: 'In nur 7 Minuten perfekt vorbereitet für Ihre Küchenberatung',
  benefit1: 'Sparen Sie Zeit im Beratungsgespräch',
  benefit2: 'Vermeiden Sie kostspielige Planungsfehler',
  benefit3: 'Erhalten Sie ein maßgeschneidertes Angebot',
  ctaText: 'Jetzt starten',
  whyText: 'Studios mit vorbereiteten Kunden können sofort mit der Planung beginnen – das spart Zeit und führt zu besseren Ergebnissen.',
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
  showDefaultBranding: true,
  showAppointmentBooking: false,
  showManufacturerField: true,
  customManufacturers: [],
  landingPage: DEFAULT_LANDING,
  contact: DEFAULT_CONTACT,
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
    studioName: data.studio_name || '',
    logoUrl: data.logo_url,
    primaryColor: data.primary_color || '#C2410C',
    showDefaultBranding: data.show_default_branding ?? true,
    showAppointmentBooking: data.show_appointment_booking ?? false,
    showManufacturerField: data.show_manufacturer_field ?? true,
    customManufacturers: data.custom_manufacturers || [],
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
  };
}

export function useBranding() {
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  // Load branding from database (public read)
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const { data, error } = await supabase
          .from('studio_branding')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          const brandingData = parseBrandingData(data);
          setBranding(brandingData);
          
          // Apply the primary color to CSS
          if (data.primary_color) {
            applyPrimaryColor(data.primary_color);
          }
        }
      } catch (error) {
        console.error('Failed to load branding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBranding();
  }, []);

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

  // Check initial state
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('studio_branding')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error && error.code === 'PGRST116') {
          // No rows = needs setup
          setNeedsSetup(true);
        } else if (!data) {
          setNeedsSetup(true);
        } else if (data) {
          setBranding(parseBrandingData(data));
        }
      } catch (error) {
        console.error('Failed to check branding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  const verifyPassword = useCallback(async (password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('branding-admin', {
        body: { action: 'verify', password },
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
        return true;
      }
      return false;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }, []);

  const setupBranding = useCallback(async (password: string, initialData?: Partial<BrandingData>): Promise<boolean> => {
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

      if (data.success) {
        setIsAuthenticated(true);
        setSessionPassword(password);
        setNeedsSetup(false);
        if (data.branding) {
          setBranding(parseBrandingData(data.branding));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Setup failed:', error);
      return false;
    }
  }, []);

  const updateBranding = useCallback(async (updates: Partial<Omit<BrandingData, 'landingPage' | 'contact'>> & { landingPage?: Partial<LandingPageData>; contact?: Partial<ContactData> }): Promise<boolean> => {
    if (!sessionPassword) return false;

    try {
      const { data, error } = await supabase.functions.invoke('branding-admin', {
        body: {
          action: 'update',
          password: sessionPassword,
          studioName: updates.studioName,
          logoUrl: updates.logoUrl,
          primaryColor: updates.primaryColor,
          showDefaultBranding: updates.showDefaultBranding,
          showAppointmentBooking: updates.showAppointmentBooking,
          showManufacturerField: updates.showManufacturerField,
          customManufacturers: updates.customManufacturers,
          landingHeadline: updates.landingPage?.headline,
          landingSubheadline: updates.landingPage?.subheadline,
          landingBenefit1: updates.landingPage?.benefit1,
          landingBenefit2: updates.landingPage?.benefit2,
          landingBenefit3: updates.landingPage?.benefit3,
          landingCtaText: updates.landingPage?.ctaText,
          landingWhyText: updates.landingPage?.whyText,
          showLandingPage: updates.landingPage?.showLandingPage,
          contactAddress: updates.contact?.address,
          contactPhone: updates.contact?.phone,
          contactEmail: updates.contact?.email,
          contactWebsite: updates.contact?.website,
        },
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
  }, [sessionPassword]);

  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('studio-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('studio-assets')
        .getPublicUrl(filePath);

      const logoUrl = urlData.publicUrl;
      
      // Update branding with new logo URL
      const success = await updateBranding({ logoUrl });
      return success ? logoUrl : null;
    } catch (error) {
      console.error('Logo upload failed:', error);
      return null;
    }
  }, [updateBranding]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setSessionPassword(null);
  }, []);

  return {
    branding,
    isLoading,
    isAuthenticated,
    needsSetup,
    verifyPassword,
    setupBranding,
    updateBranding,
    uploadLogo,
    logout,
  };
}
