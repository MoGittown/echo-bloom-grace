import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKitchenProject } from '@/hooks/useKitchenProject';
import { useBranding } from '@/hooks/useBranding';
import { LandingPage } from '@/components/LandingPage';
import { StepIndicator } from '@/components/kitchen/StepIndicator';
import { CustomerForm } from '@/components/kitchen/CustomerForm';
import { RoomForm } from '@/components/kitchen/RoomForm';
import { FloorPlanEditor } from '@/components/kitchen/FloorPlanEditor';
import { WallViewEditor } from '@/components/kitchen/WallViewEditor';
import { StyleForm } from '@/components/kitchen/StyleForm';
import { AppliancesForm } from '@/components/kitchen/AppliancesForm';
import { SinkForm } from '@/components/kitchen/SinkForm';
import { PhotoUpload } from '@/components/kitchen/PhotoUpload';
import { SummaryView } from '@/components/kitchen/SummaryView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChatWidget } from '@/components/kitchen/ChatWidget';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, RotateCcw, ChefHat, User, Ruler, LayoutGrid, Square, Palette, Camera, FileText, Plug, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
// Background images
import bgStyle from '@/assets/bg-style.jpg';
import bgAppliances from '@/assets/bg-appliances.jpg';
import bgSink from '@/assets/bg-sink.jpg';
import bgRoom from '@/assets/bg-room.jpg';

const STEPS = [
  { title: 'Stil', icon: <Palette className="w-5 h-5" />, bg: bgStyle },
  { title: 'Geräte', icon: <Plug className="w-5 h-5" />, bg: bgAppliances },
  { title: 'Spüle', icon: <Droplets className="w-5 h-5" />, bg: bgSink },
  { title: 'Raum', icon: <Ruler className="w-5 h-5" />, bg: bgRoom },
  { title: 'Grundriss', icon: <LayoutGrid className="w-5 h-5" />, bg: bgRoom },
  { title: 'Wände', icon: <Square className="w-5 h-5" />, bg: bgRoom },
  { title: 'Fotos', icon: <Camera className="w-5 h-5" />, bg: bgStyle },
  { title: 'Kontakt', icon: <User className="w-5 h-5" />, bg: bgStyle },
  { title: 'Übersicht', icon: <FileText className="w-5 h-5" />, bg: bgStyle },
];

const STARTED_KEY = 'kitchen-has-started';

const Index = () => {
  const navigate = useNavigate();
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showLanding, setShowLanding] = useState(() => {
    try {
      // Explicit flag wins
      if (localStorage.getItem(STARTED_KEY) === '1') return false;

      // Backward compatible: if a project with meaningful progress exists, don't block with landing
      const saved = localStorage.getItem('kitchen-project');
      if (!saved) return true;
      try {
        const parsed = JSON.parse(saved);
        const hasProgress =
          (parsed?.preferences?.style?.length ?? 0) > 0 ||
          (parsed?.preferences?.colors?.length ?? 0) > 0 ||
          (parsed?.preferences?.materials?.length ?? 0) > 0 ||
          (parsed?.photos?.length ?? 0) > 0 ||
          !!parsed?.additionalNotes?.trim?.() ||
          !!parsed?.customer?.firstName?.trim?.() ||
          !!parsed?.customer?.lastName?.trim?.() ||
          !!parsed?.customer?.email?.trim?.() ||
          !!parsed?.customer?.phone?.trim?.();
        return !hasProgress;
      } catch {
        return true;
      }
    } catch {
      return true;
    }
  });
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({});

  const {
    project,
    currentStep,
    isLoading,
    updateCustomer,
    updateRoom,
    updateFloorPlan,
    updatePreferences,
    addPhoto,
    removePhoto,
    updateNotes,
    resetProject,
    nextStep,
    prevStep,
    goToStep,
  } = useKitchenProject();

  const { branding } = useBranding();

  // Validate customer form - now only used for inline validation display
  const validateCustomerForm = useCallback(() => {
    if (!project) return false;
    
    const errors: Record<string, string> = {};
    const { customer } = project;
    
    if (!customer.firstName?.trim()) {
      errors.firstName = 'Vorname ist erforderlich';
    }
    if (!customer.lastName?.trim()) {
      errors.lastName = 'Nachname ist erforderlich';
    }
    if (!customer.email?.trim()) {
      errors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      errors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
    }
    if (!customer.phone?.trim()) {
      errors.phone = 'Telefon ist erforderlich';
    }
    
    setCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  }, [project]);

  // Handle next step - no mandatory validation for summary anymore
  const handleNextStep = useCallback(() => {
    setCustomerErrors({});
    nextStep();
  }, [nextStep]);

  // Handle direct step navigation - no mandatory contact validation for summary
  const handleGoToStep = useCallback((step: number) => {
    setCustomerErrors({});
    goToStep(step);
  }, [goToStep]);

  // Hidden admin access via logo clicks (5x)
  const handleLogoClick = useCallback(() => {
    setLogoClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        navigate('/admin');
        return 0;
      }
      // Reset after 2 seconds of inactivity
      setTimeout(() => setLogoClickCount(0), 2000);
      return newCount;
    });
  }, [navigate]);

  // Hidden admin access via keyboard shortcut (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        navigate('/admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  if (isLoading || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <ChefHat className="w-16 h-16 mx-auto text-primary animate-pulse" />
          <p className="mt-4 text-muted-foreground">Lade...</p>
        </div>
      </div>
    );
  }

  // Show landing page if enabled and user hasn't started yet
  if (showLanding && branding.landingPage.showLandingPage) {
    return (
      <LandingPage
        branding={branding}
        onStart={() => {
          try {
            localStorage.setItem(STARTED_KEY, '1');
          } catch {
            // ignore
          }
          setShowLanding(false);
        }}
      />
    );
  }

  const totalSteps = STEPS.length;
  const currentBg = STEPS[currentStep]?.bg || bgStyle;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center transition-[background-image] duration-700 ease-in-out"
        style={{ backgroundImage: `url(${currentBg})` }}
      >
        <div className="absolute inset-0 bg-background/40 dark:bg-background/50 backdrop-blur-[1px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-card/70 backdrop-blur-md border-b sticky top-0 z-50 no-print">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleLogoClick}
                  className="focus:outline-none cursor-default"
                  aria-label="Logo"
                >
                  {branding.logoUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                      <img src={branding.logoUrl} alt="Studio Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ChefHat className="w-7 h-7 text-primary" />
                    </div>
                  )}
                </button>
                <div>
                  <h1 className="text-xl font-display font-bold">
                    {branding.studioName || 'Küchen-Checkliste'}
                  </h1>
                  <p className="text-xs text-muted-foreground">Erstberatung</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      <span className="hidden sm:inline">Neu starten</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Neu starten?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Alle bisher eingegebenen Daten werden gelöscht. Dies kann nicht rückgängig gemacht werden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          try {
                            localStorage.removeItem(STARTED_KEY);
                          } catch {
                            // ignore
                          }
                          setCustomerErrors({});
                          resetProject();
                          setShowLanding(true);
                        }}
                      >
                        Neu starten
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </header>

        {/* Step Indicator */}
        <div className="bg-card/50 backdrop-blur-md border-b">
          <div className="container mx-auto">
            <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={handleGoToStep} />
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {currentStep === 0 && (
            <StyleForm data={project.preferences} onChange={updatePreferences} />
          )}
          {currentStep === 1 && (
            <AppliancesForm data={project.preferences} onChange={updatePreferences} />
          )}
          {currentStep === 2 && (
            <SinkForm data={project.preferences} onChange={updatePreferences} />
          )}
          {currentStep === 3 && (
            <RoomForm data={project.room} onChange={updateRoom} />
          )}
          {currentStep === 4 && (
            <FloorPlanEditor floorPlan={project.floorPlan} room={project.room} onChange={updateFloorPlan} />
          )}
          {currentStep === 5 && (
            <WallViewEditor floorPlan={project.floorPlan} room={project.room} />
          )}
          {currentStep === 6 && (
            <PhotoUpload photos={project.photos} onAdd={addPhoto} onRemove={removePhoto} />
          )}
          {currentStep === 7 && (
            <CustomerForm data={project.customer} onChange={updateCustomer} errors={customerErrors} />
          )}
          {currentStep === 8 && (
            <SummaryView project={project} onUpdateNotes={updateNotes} onUpdateCustomer={updateCustomer} />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-12 no-print">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 0} 
              className="gap-2 bg-card/70 backdrop-blur-sm hover:bg-card"
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </Button>
            {currentStep < totalSteps - 1 && (
              <Button onClick={handleNextStep} className="gap-2 shadow-lg">
                Weiter
                <ChevronRight className="w-4 h-4" />
          </Button>
            )}
          </div>
        </main>

        {/* AI Chat Widget */}
        <ChatWidget />
      </div>
    </div>
  );
};

export default Index;
