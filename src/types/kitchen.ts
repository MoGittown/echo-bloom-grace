// Küchenstudio Datentypen und Konstanten

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  notes: string;
}

export interface RoomDimensions {
  length: number;
  width: number;
  height: number;
  shape: 'rectangular' | 'l-shaped' | 'u-shaped' | 'galley';
}

export interface WallElement {
  id: string;
  type: 'window' | 'door' | 'socket' | 'water' | 'gas' | 'drain' | 'vent';
  wall: 'north' | 'east' | 'south' | 'west';
  x: number;
  y: number;
  width: number;
  height: number;
  distanceFromFloor?: number;
  distanceFromLeft?: number;
  notes?: string;
}

export interface FloorPlan {
  walls: { north: number; east: number; south: number; west: number };
  elements: WallElement[];
  scale: number;
}

export interface WallView {
  wall: 'north' | 'east' | 'south' | 'west';
  width: number;
  height: number;
  elements: WallElement[];
}

export interface Appliances {
  cooktop: string;
  oven: string;
  fridge: string;
  dishwasher: boolean;
  microwave: boolean;
  hood: string;
  other: string[];
}

export interface KitchenPreferences {
  style: string[];
  colors: string[];
  materials: string[];
  manufacturers: string[];
  budget: { min: number; max: number };
  mustHaves: string[];
  niceToHaves: string[];
  appliances: Appliances;
  storage: string[];
  countertop: string[];
  sink: string;
  lighting: string[];
}

export interface UploadedPhoto {
  id: string;
  file: File;
  preview: string;
  type: 'room' | 'inspiration';
  description?: string;
}

export interface KitchenProject {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  customer: CustomerData;
  room: RoomDimensions;
  floorPlan: FloorPlan;
  wallViews: WallView[];
  preferences: KitchenPreferences;
  photos: UploadedPhoto[];
  additionalNotes: string;
}

// Default values
export const createDefaultProject = (): KitchenProject => ({
  id: crypto.randomUUID(),
  createdAt: new Date(),
  updatedAt: new Date(),
  customer: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    notes: '',
  },
  room: {
    length: 400,
    width: 300,
    height: 250,
    shape: 'rectangular',
  },
  floorPlan: {
    walls: { north: 400, east: 300, south: 400, west: 300 },
    elements: [],
    scale: 1,
  },
  wallViews: [],
  preferences: {
    style: [],
    colors: [],
    materials: [],
    manufacturers: [],
    budget: { min: 10000, max: 30000 },
    mustHaves: [],
    niceToHaves: [],
    appliances: {
      cooktop: '',
      oven: '',
      fridge: '',
      dishwasher: true,
      microwave: false,
      hood: '',
      other: [],
    },
    storage: [],
    countertop: [],
    sink: '',
    lighting: [],
  },
  photos: [],
  additionalNotes: '',
});

// Constants
export const KITCHEN_STYLES = ['Modern', 'Klassisch', 'Landhausstil', 'Skandinavisch', 'Industrial', 'Minimalistisch', 'Mediterran'];
export const KITCHEN_COLORS = ['Weiß', 'Schwarz', 'Grau', 'Holzoptik', 'Beige/Creme', 'Blau', 'Grün', 'Terrakotta'];
export const KITCHEN_MATERIALS = ['Hochglanz Lack', 'Matt Lack', 'Echtholz', 'Holzdekor', 'Beton-Optik', 'Stein-Optik', 'Glas', 'Edelstahl'];
export const KITCHEN_MANUFACTURERS = ['Bulthaup', 'SieMatic', 'Nolte', 'Nobilia', 'Leicht', 'Poggenpohl', 'Schüller', 'Häcker', 'Next125', 'Andere'];
export const COUNTERTOP_MATERIALS = ['Granit', 'Quarzkomposit', 'Keramik', 'Naturstein', 'Edelstahl', 'Holz/Massivholz', 'Beton', 'HPL/Schichtstoff'];
export const STORAGE_OPTIONS = ['Apothekerschrank', 'Eckschrank-Lösung', 'Schubladensystem', 'Gewürzauszug', 'Abfallsystem', 'Vorratsschrank', 'Ordnungssystem'];
export const APPLIANCE_TYPES = {
  cooktop: ['Gas', 'Induktion', 'Ceran', 'Domino-System'],
  oven: ['Einbaubackofen', 'Dampfgarer', 'Kombi-Gerät', 'Pyrolyse'],
  fridge: ['Einbau-Kühlschrank', 'Side-by-Side', 'French Door', 'Weinkühlschrank'],
  hood: ['Wandhaube', 'Inselhaube', 'Deckenlüfter', 'Kochfeldabzug', 'Umluft'],
};