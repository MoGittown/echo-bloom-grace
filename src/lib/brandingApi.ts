import type { BrandingData } from '@/hooks/useBranding';
import type { LandingPageData, ContactData } from '@/hooks/useBranding';
import type { StudioSettings } from '@/types/studioSettings';
import type { FeatureConfig } from '@/types/featureConfig';

export type BrandingUpdates = Partial<Omit<BrandingData, 'landingPage' | 'contact' | 'studioSettings'>> & {
  landingPage?: Partial<LandingPageData>;
  contact?: Partial<ContactData>;
  studioSettings?: Partial<StudioSettings> | StudioSettings;
  featureConfig?: FeatureConfig;
  removeLogo?: boolean;
  studioSlug?: string;
  targetStudioSlug?: string;
};

export function buildBrandingUpdateBody(password: string, updates: BrandingUpdates) {
  const studioSettings =
    updates.studioSettings && typeof updates.studioSettings === 'object'
      ? updates.studioSettings
      : undefined;

  return {
    action: 'update',
    password,
    studioName: updates.studioName,
    logoUrl: updates.logoUrl,
    removeLogo: updates.removeLogo,
    primaryColor: updates.primaryColor,
    secondaryColor: updates.secondaryColor,
    accentColor: updates.accentColor,
    displayAppName: updates.displayAppName,
    slogan: updates.slogan,
    logoWhiteUrl: updates.logoWhiteUrl,
    imprintUrl: updates.imprintUrl,
    privacyUrl: updates.privacyUrl,
    studioCode: updates.studioCode,
    studioSlug: updates.studioSlug,
    targetStudioSlug: updates.targetStudioSlug,
    showDefaultBranding: updates.showDefaultBranding,
    showAppointmentBooking: updates.showAppointmentBooking,
    showManufacturerField: updates.showManufacturerField,
    customManufacturers: updates.customManufacturers,
    enabledManufacturers: updates.enabledManufacturers,
    featureConfig: updates.featureConfig,
    studioSettings,
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
  };
}
