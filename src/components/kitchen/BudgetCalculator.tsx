import { useMemo } from 'react';
import { RoomDimensions, KitchenPreferences } from '@/types/kitchen';
import { Euro, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BudgetCalculatorProps {
  room: RoomDimensions;
  preferences: KitchenPreferences;
}

// Preisdaten basierend auf aktueller Marktrecherche 2025
const PRICE_PER_METER = {
  budget: { min: 600, max: 1000, label: 'Einsteiger' },
  midRange: { min: 1000, max: 2500, label: 'Mittelklasse' },
  premium: { min: 2500, max: 5000, label: 'Premium' },
  luxury: { min: 5000, max: 10000, label: 'Luxus' },
} as const;

// Stilzuschläge
const STYLE_MULTIPLIERS: Record<string, number> = {
  'Landhausstil': 1.25,     // +25% - profilierte Fronten, Kassetten
  'Minimalistisch': 1.15,   // +15% - grifflos, Tip-On-Systeme
  'Industrial': 1.10,       // +10% - Spezialoberflächen
  'Modern': 1.0,
  'Klassisch': 1.0,
  'Skandinavisch': 1.05,
  'Mediterran': 1.10,
};

// Materialzuschläge
const MATERIAL_MULTIPLIERS: Record<string, number> = {
  'Echtholz': 1.4,
  'Hochglanz Lack': 1.2,
  'Matt Lack': 1.1,
  'Glas': 1.25,
  'Edelstahl': 1.3,
  'Beton-Optik': 1.15,
  'Stein-Optik': 1.15,
  'Holzdekor': 1.0,
};

// Arbeitsplattenzuschläge (absolut pro Meter)
const COUNTERTOP_PRICES: Record<string, number> = {
  'HPL/Schichtstoff': 150,
  'Holz/Massivholz': 350,
  'Quarzkomposit': 450,
  'Granit': 500,
  'Naturstein': 600,
  'Keramik': 700,
  'Edelstahl': 550,
  'Beton': 500,
};

// Küchenform-Faktoren (für Laufmeter-Berechnung)
const SHAPE_FACTORS: Record<string, number> = {
  'rectangular': 1.0,   // Zeile
  'l-shaped': 1.5,      // L-Form
  'u-shaped': 2.0,      // U-Form
  'galley': 1.8,        // Zweizeilig
};

// Premium-Hersteller
const PREMIUM_MANUFACTURERS = ['Bulthaup', 'SieMatic', 'Leicht', 'Poggenpohl', 'Next125'];
const MID_MANUFACTURERS = ['Nolte', 'Schüller', 'Häcker'];

function calculateLinearMeters(room: RoomDimensions): number {
  const lengthM = room.length / 100;
  const widthM = room.width / 100;
  const shapeFactor = SHAPE_FACTORS[room.shape] || 1.0;
  
  // Basis: längste Wand + Formfaktor
  const baseMeters = Math.max(lengthM, widthM);
  return baseMeters * shapeFactor;
}

function determinePriceSegment(preferences: KitchenPreferences): keyof typeof PRICE_PER_METER {
  const { materials, manufacturers, countertop } = preferences;
  
  const hasPremiumMaterial = materials.some(m => ['Echtholz', 'Glas', 'Edelstahl'].includes(m));
  const hasPremiumManufacturer = manufacturers.some(m => PREMIUM_MANUFACTURERS.includes(m));
  const hasPremiumCountertop = countertop.some(c => ['Keramik', 'Naturstein', 'Granit'].includes(c));
  
  const hasMidMaterial = materials.some(m => ['Hochglanz Lack', 'Matt Lack'].includes(m));
  const hasMidManufacturer = manufacturers.some(m => MID_MANUFACTURERS.includes(m));
  
  if (hasPremiumManufacturer && (hasPremiumMaterial || hasPremiumCountertop)) {
    return 'luxury';
  }
  if (hasPremiumMaterial || hasPremiumManufacturer || hasPremiumCountertop) {
    return 'premium';
  }
  if (hasMidMaterial || hasMidManufacturer) {
    return 'midRange';
  }
  return 'midRange'; // Default: Mittelklasse
}

export function BudgetCalculator({ room, preferences }: BudgetCalculatorProps) {
  const estimate = useMemo(() => {
    const linearMeters = calculateLinearMeters(room);
    const segment = determinePriceSegment(preferences);
    const basePrice = PRICE_PER_METER[segment];
    
    // Stil-Multiplikator
    let styleMultiplier = 1.0;
    preferences.style.forEach(style => {
      const mult = STYLE_MULTIPLIERS[style];
      if (mult && mult > styleMultiplier) styleMultiplier = mult;
    });
    
    // Material-Multiplikator
    let materialMultiplier = 1.0;
    preferences.materials.forEach(mat => {
      const mult = MATERIAL_MULTIPLIERS[mat];
      if (mult && mult > materialMultiplier) materialMultiplier = mult;
    });
    
    // Arbeitsplatten-Zuschlag
    let countertopCost = 0;
    preferences.countertop.forEach(ct => {
      const price = COUNTERTOP_PRICES[ct] || 300;
      if (price > countertopCost) countertopCost = price;
    });
    
    // Berechnung
    const baseCostMin = linearMeters * basePrice.min * styleMultiplier * materialMultiplier;
    const baseCostMax = linearMeters * basePrice.max * styleMultiplier * materialMultiplier;
    const countertopTotal = linearMeters * countertopCost;
    
    // Geräte-Pauschale (ca. 30-35% des Gesamtpreises)
    const applianceFactor = 0.35;
    
    const totalMin = Math.round((baseCostMin + countertopTotal) / (1 - applianceFactor) / 1000) * 1000;
    const totalMax = Math.round((baseCostMax + countertopTotal) / (1 - applianceFactor) / 1000) * 1000;
    
    return {
      linearMeters: Math.round(linearMeters * 10) / 10,
      segment,
      segmentLabel: basePrice.label,
      totalMin,
      totalMax,
      styleMultiplier,
      materialMultiplier,
    };
  }, [room, preferences]);

  const budgetStatus = useMemo(() => {
    const userMax = preferences.budget.max;
    const userMin = preferences.budget.min;
    const estimateAvg = (estimate.totalMin + estimate.totalMax) / 2;
    
    if (userMax < estimate.totalMin * 0.7) {
      return {
        level: 'low' as const,
        message: 'Das Budget liegt deutlich unter dem Marktdurchschnitt für diese Ausstattung.',
        suggestion: 'Empfehlung: Budgetrahmen prüfen oder Ausstattung anpassen.',
        icon: AlertTriangle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/30',
      };
    }
    if (userMax < estimate.totalMin) {
      return {
        level: 'tight' as const,
        message: 'Das Budget ist knapp für die gewünschte Ausstattung.',
        suggestion: 'Kompromisse bei Material oder Geräten könnten nötig sein.',
        icon: Info,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
      };
    }
    if (userMin >= estimate.totalMin && userMax <= estimate.totalMax * 1.3) {
      return {
        level: 'match' as const,
        message: 'Das Budget passt gut zur gewählten Ausstattung.',
        suggestion: 'Qualifizierter Lead mit realistischen Erwartungen.',
        icon: CheckCircle,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
      };
    }
    return {
      level: 'high' as const,
      message: 'Das Budget ermöglicht Premium-Ausstattung.',
      suggestion: 'High-Value Lead – erweiterte Optionen präsentieren.',
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
    };
  }, [preferences.budget, estimate]);

  const StatusIcon = budgetStatus.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }}
      className={`kitchen-card p-6 space-y-4 border-2 ${budgetStatus.borderColor} ${budgetStatus.bgColor}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Euro className="w-5 h-5 text-primary" />
            Budget-Check
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Schätzung basierend auf aktuellen Marktpreisen 2025, 
                    Raumgröße ({estimate.linearMeters} Laufmeter) und gewählter Ausstattung.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h3>
          <p className="text-sm text-muted-foreground">Automatische Marktpreisschätzung</p>
        </div>
        <div className={`p-2 rounded-full ${budgetStatus.bgColor}`}>
          <StatusIcon className={`w-6 h-6 ${budgetStatus.color}`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <span className="text-muted-foreground">Küchenfront</span>
          <p className="font-medium">{estimate.linearMeters} Laufmeter</p>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground">Preissegment</span>
          <p className="font-medium">{estimate.segmentLabel}</p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Geschätzter Marktpreis</span>
          <span className="text-lg font-bold text-foreground">
            {estimate.totalMin.toLocaleString('de-DE')} € – {estimate.totalMax.toLocaleString('de-DE')} €
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          inkl. Elektrogeräte, exkl. Montage
        </p>
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-muted-foreground">Kundenbudget</span>
          <span className="font-semibold">
            {preferences.budget.min.toLocaleString('de-DE')} € – {preferences.budget.max.toLocaleString('de-DE')} €
          </span>
        </div>
        
        <div className={`p-3 rounded-lg ${budgetStatus.bgColor} border ${budgetStatus.borderColor}`}>
          <p className={`font-medium ${budgetStatus.color}`}>{budgetStatus.message}</p>
          <p className="text-sm text-muted-foreground mt-1">{budgetStatus.suggestion}</p>
        </div>
      </div>

      {/* Lead-Qualitäts-Badge für B2B */}
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Lead-Qualität</span>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          budgetStatus.level === 'high' ? 'bg-primary text-primary-foreground' :
          budgetStatus.level === 'match' ? 'bg-emerald-500 text-white' :
          budgetStatus.level === 'tight' ? 'bg-amber-500 text-white' :
          'bg-muted text-muted-foreground'
        }`}>
          {budgetStatus.level === 'high' ? '⭐ Premium' :
           budgetStatus.level === 'match' ? '✓ Qualifiziert' :
           budgetStatus.level === 'tight' ? '⚠ Prüfen' :
           '✗ Unrealistisch'}
        </span>
      </div>
    </motion.div>
  );
}
