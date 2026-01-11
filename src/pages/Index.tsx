import { useState } from 'react';
import { useKitchenProject } from '@/hooks/useKitchenProject';
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
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, ChefHat, User, Ruler, LayoutGrid, Square, Palette, Camera, FileText, Plug, Droplets, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const Index = () => {
  const [showHero, setShowHero] = useState(true);
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

  const totalSteps = STEPS.length;
  const currentBg = STEPS[currentStep]?.bg || bgStyle;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  // Hero Screen
  if (showHero) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgStyle})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background/80" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-8 inline-flex p-5 bg-primary/20 backdrop-blur-md rounded-2xl border border-primary/30"
            >
              <ChefHat className="w-16 h-16 text-primary" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4"
            >
              Küchen-Checkliste
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg md:text-xl text-muted-foreground mb-12"
            >
              Erstellen Sie Schritt für Schritt Ihre perfekte Küchenplanung – 
              von Stil und Geräten bis zur vollständigen Dokumentation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <Button 
                size="lg" 
                onClick={() => setShowHero(false)}
                className="text-lg px-8 py-6 gap-3 shadow-2xl hover:scale-105 transition-transform"
              >
                Beratung starten
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Theme Toggle in Hero */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="absolute top-6 right-6"
          >
            <ThemeToggle />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background Image with Overlay */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBg}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${currentBg})` }}
        >
          <div className="absolute inset-0 bg-background/40 dark:bg-background/50 backdrop-blur-[1px]" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-card/70 backdrop-blur-md border-b sticky top-0 z-50 no-print">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setShowHero(true)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ChefHat className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold">Küchen-Checkliste</h1>
                  <p className="text-xs text-muted-foreground">Erstberatung</p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={resetProject} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Neu starten</span>
                </Button>
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
            <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={goToStep} />
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
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
                <CustomerForm data={project.customer} onChange={updateCustomer} />
              )}
              {currentStep === 8 && (
                <SummaryView project={project} onUpdateNotes={updateNotes} />
              )}
            </motion.div>
          </AnimatePresence>

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
            {currentStep < totalSteps - 1 ? (
              <Button onClick={nextStep} className="gap-2 shadow-lg">
                Weiter
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={() => window.print()} className="gap-2 shadow-lg">
                <FileText className="w-4 h-4" />
                Drucken
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
