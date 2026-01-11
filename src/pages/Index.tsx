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
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, ChefHat, User, Ruler, LayoutGrid, Square, Palette, Camera, FileText, Plug, Droplets } from 'lucide-react';

const STEPS = [
  { title: 'Stil', icon: <Palette className="w-5 h-5" /> },
  { title: 'Geräte', icon: <Plug className="w-5 h-5" /> },
  { title: 'Spüle', icon: <Droplets className="w-5 h-5" /> },
  { title: 'Raum', icon: <Ruler className="w-5 h-5" /> },
  { title: 'Grundriss', icon: <LayoutGrid className="w-5 h-5" /> },
  { title: 'Wände', icon: <Square className="w-5 h-5" /> },
  { title: 'Fotos', icon: <Camera className="w-5 h-5" /> },
  { title: 'Kontakt', icon: <User className="w-5 h-5" /> },
  { title: 'Übersicht', icon: <FileText className="w-5 h-5" /> },
];

const Index = () => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 no-print">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-display font-bold">Küchen-Checkliste</h1>
                <p className="text-xs text-muted-foreground">Erstberatung</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={resetProject} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Neu starten</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="bg-card border-b">
        <div className="container mx-auto">
          <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={goToStep} />
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
          <CustomerForm data={project.customer} onChange={updateCustomer} />
        )}
        {currentStep === 8 && (
          <SummaryView project={project} onUpdateNotes={updateNotes} />
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-12 no-print">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </Button>
          {currentStep < totalSteps - 1 ? (
            <Button onClick={nextStep} className="gap-2">
              Weiter
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => window.print()} className="gap-2">
              <FileText className="w-4 h-4" />
              Drucken
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
