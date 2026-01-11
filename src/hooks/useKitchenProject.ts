import { useState, useEffect, useCallback } from 'react';
import { KitchenProject, CustomerData, RoomDimensions, FloorPlan, KitchenPreferences, UploadedPhoto, createDefaultProject } from '@/types/kitchen';

const STORAGE_KEY = 'kitchen-project';

export function useKitchenProject() {
  const [project, setProject] = useState<KitchenProject | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProject({ ...parsed, createdAt: new Date(parsed.createdAt), updatedAt: new Date(parsed.updatedAt) });
      } catch {
        setProject(createDefaultProject());
      }
    } else {
      setProject(createDefaultProject());
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (project) {
      try {
        // Exclude large photo preview data and File objects from storage to prevent quota issues
        const storableProject = {
          ...project,
          photos: project.photos.map(p => ({
            id: p.id,
            type: p.type,
            description: p.description,
            preview: p.preview && p.preview.length > 50000 ? '' : p.preview // Only store small previews
          }))
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storableProject));
      } catch (e) {
        if (e instanceof Error && e.name === 'QuotaExceededError') {
          console.warn('LocalStorage quota exceeded. Photos will not persist between sessions.');
          // Try saving without any photo data
          try {
            const minimalProject = { ...project, photos: [] };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalProject));
          } catch {
            console.error('Unable to save project to localStorage');
          }
        }
      }
    }
  }, [project]);

  const updateCustomer = useCallback((data: Partial<CustomerData>) => {
    setProject(prev => prev ? { ...prev, customer: { ...prev.customer, ...data }, updatedAt: new Date() } : prev);
  }, []);

  const updateRoom = useCallback((data: Partial<RoomDimensions>) => {
    setProject(prev => prev ? { ...prev, room: { ...prev.room, ...data }, updatedAt: new Date() } : prev);
  }, []);

  const updateFloorPlan = useCallback((data: Partial<FloorPlan>) => {
    setProject(prev => prev ? { ...prev, floorPlan: { ...prev.floorPlan, ...data }, updatedAt: new Date() } : prev);
  }, []);

  const updatePreferences = useCallback((data: Partial<KitchenPreferences>) => {
    setProject(prev => prev ? { ...prev, preferences: { ...prev.preferences, ...data }, updatedAt: new Date() } : prev);
  }, []);

  const addPhoto = useCallback((photo: UploadedPhoto) => {
    setProject(prev => prev ? { ...prev, photos: [...prev.photos, photo], updatedAt: new Date() } : prev);
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setProject(prev => prev ? { ...prev, photos: prev.photos.filter(p => p.id !== photoId), updatedAt: new Date() } : prev);
  }, []);

  const updateNotes = useCallback((notes: string) => {
    setProject(prev => prev ? { ...prev, additionalNotes: notes, updatedAt: new Date() } : prev);
  }, []);

  const resetProject = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProject(createDefaultProject());
    setCurrentStep(0);
  }, []);

  return {
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
    nextStep: useCallback(() => {
      setCurrentStep(p => Math.min(p + 1, 8));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []),
    prevStep: useCallback(() => {
      setCurrentStep(p => Math.max(p - 1, 0));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []),
    goToStep: useCallback((step: number) => {
      setCurrentStep(Math.max(0, Math.min(step, 8)));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []),
  };
}