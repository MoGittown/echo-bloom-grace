import { useState, useEffect, useCallback } from 'react';
import {
  KitchenProject,
  CustomerData,
  RoomDimensions,
  FloorPlan,
  WallView,
  KitchenPreferences,
  UploadedPhoto,
  defaultCustomerData,
  defaultRoomDimensions,
  defaultFloorPlan,
  defaultPreferences,
} from '@/types/kitchen';

const STORAGE_KEY = 'kitchen-project';

export function useKitchenProject() {
  const [project, setProject] = useState<KitchenProject | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProject({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          updatedAt: new Date(parsed.updatedAt),
        });
      } catch (e) {
        console.error('Failed to parse saved project:', e);
        initializeNewProject();
      }
    } else {
      initializeNewProject();
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (project) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    }
  }, [project]);

  const initializeNewProject = useCallback(() => {
    const newProject: KitchenProject = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: defaultCustomerData,
      room: defaultRoomDimensions,
      floorPlan: defaultFloorPlan,
      wallViews: [],
      preferences: defaultPreferences,
      photos: [],
      additionalNotes: '',
    };
    setProject(newProject);
    setCurrentStep(0);
  }, []);

  const updateCustomer = useCallback((data: Partial<CustomerData>) => {
    setProject((prev) =>
      prev
        ? {
            ...prev,
            customer: { ...prev.customer, ...data },
            updatedAt: new Date(),
          }
        : prev
    );
  }, []);

  const updateRoom = useCallback((data: Partial<RoomDimensions>) => {
    setProject((prev) =>
      prev
        ? {
            ...prev,
            room: { ...prev.room, ...data },
            updatedAt: new Date(),
          }
        : prev
    );
  }, []);

  const updateFloorPlan = useCallback((data: Partial<FloorPlan>) => {
    setProject((prev) =>
      prev
        ? {
            ...prev,
            floorPlan: { ...prev.floorPlan, ...data },
            updatedAt: new Date(),
          }
        : prev
    );
  }, []);

  const updatePreferences = useCallback((data: Partial<KitchenPreferences>) => {
    setProject((prev) =>
      prev
        ? {
            ...prev,
            preferences: { ...prev.preferences, ...data },
            updatedAt: new Date(),
          }
        : prev
    );
  }, []);

  const addPhoto = useCallback((photo: UploadedPhoto) => {
    setProject((prev) =>
      prev
        ? {
            ...prev,
            photos: [...prev.photos, photo],
            updatedAt: new Date(),
          }
        : prev
    );
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setProject((prev) =>
      prev
        ? {
            ...prev,
            photos: prev.photos.filter((p) => p.id !== photoId),
            updatedAt: new Date(),
          }
        : prev
    );
  }, []);

  const updateNotes = useCallback((notes: string) => {
    setProject((prev) =>
      prev
        ? {
            ...prev,
            additionalNotes: notes,
            updatedAt: new Date(),
          }
        : prev
    );
  }, []);

  const resetProject = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    initializeNewProject();
  }, [initializeNewProject]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, 6)));
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
    nextStep,
    prevStep,
    goToStep,
  };
}