import {
  Palette, Plug, Droplets, Ruler, LayoutGrid, Square, Camera, User, FileText,
} from 'lucide-react';
import type { FeatureConfig } from '@/types/featureConfig';
import bgStyle from '@/assets/bg-style.jpg';
import bgAppliances from '@/assets/bg-appliances.jpg';
import bgSink from '@/assets/bg-sink.jpg';
import bgRoom from '@/assets/bg-room.jpg';

export type WizardStepId =
  | 'style'
  | 'appliances'
  | 'sink'
  | 'room'
  | 'floorPlan'
  | 'wallView'
  | 'photos'
  | 'contact'
  | 'summary';

export type WizardStepDef = {
  id: WizardStepId;
  title: string;
  icon: React.ReactNode;
  bg: string;
  configKey?: keyof FeatureConfig['steps'];
};

export const ALL_WIZARD_STEPS: WizardStepDef[] = [
  { id: 'style', title: 'Stil', icon: <Palette className="w-5 h-5" />, bg: bgStyle, configKey: 'style' },
  { id: 'appliances', title: 'Geräte', icon: <Plug className="w-5 h-5" />, bg: bgAppliances, configKey: 'appliances' },
  { id: 'sink', title: 'Spüle', icon: <Droplets className="w-5 h-5" />, bg: bgSink, configKey: 'sink' },
  { id: 'room', title: 'Raum', icon: <Ruler className="w-5 h-5" />, bg: bgRoom, configKey: 'room' },
  { id: 'floorPlan', title: 'Grundriss', icon: <LayoutGrid className="w-5 h-5" />, bg: bgRoom, configKey: 'floorPlan' },
  { id: 'wallView', title: 'Wände', icon: <Square className="w-5 h-5" />, bg: bgRoom, configKey: 'wallView' },
  { id: 'photos', title: 'Fotos', icon: <Camera className="w-5 h-5" />, bg: bgStyle, configKey: 'photos' },
  { id: 'contact', title: 'Kontakt', icon: <User className="w-5 h-5" />, bg: bgStyle, configKey: 'contact' },
  { id: 'summary', title: 'Übersicht', icon: <FileText className="w-5 h-5" />, bg: bgStyle },
];

export function getActiveWizardSteps(config: FeatureConfig): WizardStepDef[] {
  return ALL_WIZARD_STEPS.filter((step) => {
    if (step.id === 'summary') return true;
    if (!step.configKey) return true;
    return config.steps[step.configKey] !== false;
  });
}
