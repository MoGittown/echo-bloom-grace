import { useState, useEffect, useCallback } from 'react';

export interface BrandingData {
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

const STORAGE_KEY = 'kitchen-studio-branding';

export function useBranding() {
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBranding({ ...DEFAULT_BRANDING, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load branding:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
      } catch (error) {
        console.error('Failed to save branding:', error);
      }
    }
  }, [branding, isLoading]);

  const updateBranding = useCallback((data: Partial<BrandingData>) => {
    setBranding(prev => ({ ...prev, ...data }));
  }, []);

  const uploadLogo = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Compress if needed (max 200KB for localStorage)
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 300; // Max dimension
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL('image/png', 0.9);
          updateBranding({ logoUrl: compressed });
          resolve(compressed);
        };
        img.onerror = reject;
        img.src = result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, [updateBranding]);

  const removeLogo = useCallback(() => {
    updateBranding({ logoUrl: null });
  }, [updateBranding]);

  const resetBranding = useCallback(() => {
    setBranding(DEFAULT_BRANDING);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    branding,
    isLoading,
    updateBranding,
    uploadLogo,
    removeLogo,
    resetBranding,
  };
}
