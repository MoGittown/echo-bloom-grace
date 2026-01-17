import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrandingData {
  id?: string;
  studioName: string;
  logoUrl: string | null;
  primaryColor: string;
  showDefaultBranding: boolean;
}

const DEFAULT_BRANDING: BrandingData = {
  studioName: '',
  logoUrl: null,
  primaryColor: '#8B7355',
  showDefaultBranding: true,
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

export function useBranding() {
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  // Load branding from database (public read)
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const { data, error } = await supabase
          .from('studio_branding')
          .select('id, studio_name, logo_url, primary_color, show_default_branding')
          .limit(1)
          .single();

        if (data && !error) {
          const brandingData = {
            id: data.id,
            studioName: data.studio_name || '',
            logoUrl: data.logo_url,
            primaryColor: data.primary_color || '#8B7355',
            showDefaultBranding: data.show_default_branding ?? true,
          };
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
          .select('id, studio_name, logo_url, primary_color, show_default_branding')
          .limit(1)
          .single();

        if (error && error.code === 'PGRST116') {
          // No rows = needs setup
          setNeedsSetup(true);
        } else if (data) {
          setBranding({
            id: data.id,
            studioName: data.studio_name || '',
            logoUrl: data.logo_url,
            primaryColor: data.primary_color || '#8B7355',
            showDefaultBranding: data.show_default_branding ?? true,
          });
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
          setBranding({
            id: data.branding.id,
            studioName: data.branding.studio_name || '',
            logoUrl: data.branding.logo_url,
            primaryColor: data.branding.primary_color || '#8B7355',
            showDefaultBranding: data.branding.show_default_branding ?? true,
          });
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
          setBranding({
            id: data.branding.id,
            studioName: data.branding.studio_name || '',
            logoUrl: data.branding.logo_url,
            primaryColor: data.branding.primary_color || '#8B7355',
            showDefaultBranding: data.branding.show_default_branding ?? true,
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Setup failed:', error);
      return false;
    }
  }, []);

  const updateBranding = useCallback(async (updates: Partial<BrandingData>): Promise<boolean> => {
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
        },
      });

      if (error) throw error;

      if (data.success && data.branding) {
        const newBranding = {
          id: data.branding.id,
          studioName: data.branding.studio_name || '',
          logoUrl: data.branding.logo_url,
          primaryColor: data.branding.primary_color || '#8B7355',
          showDefaultBranding: data.branding.show_default_branding ?? true,
        };
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
