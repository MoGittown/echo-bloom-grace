export interface FeatureConfig {
  steps: Record<string, boolean>;
  kitchenChat: boolean;
  pdfExport: boolean;
  protocolEmail: boolean;
}

export const DEFAULT_FEATURE_CONFIG: FeatureConfig = {
  steps: {
    style: true,
    appliances: true,
    sink: true,
    room: true,
    floorPlan: true,
    wallView: true,
    photos: true,
    contact: true,
  },
  kitchenChat: true,
  pdfExport: true,
  protocolEmail: true,
};

export const WIZARD_STEP_LABELS: Record<string, string> = {
  style: 'Stil & Budget',
  appliances: 'Einbaugeräte',
  sink: 'Spüle & Armatur',
  room: 'Raummaße',
  floorPlan: 'Grundriss',
  wallView: 'Wandansichten',
  photos: 'Fotos',
  contact: 'Kontaktdaten',
};

export function parseFeatureConfig(raw: unknown): FeatureConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_FEATURE_CONFIG };
  const r = raw as Record<string, unknown>;
  const stepsRaw = r.steps as Record<string, boolean> | undefined;
  return {
    steps: { ...DEFAULT_FEATURE_CONFIG.steps, ...stepsRaw },
    kitchenChat: r.kitchenChat as boolean ?? true,
    pdfExport: r.pdfExport as boolean ?? true,
    protocolEmail: r.protocolEmail as boolean ?? true,
  };
}
