// NEO (Near-Earth Objects) data structure
export interface NEOObject {
  id: string;
  name: string;
  color: string;
  size: number;
  type: 'asteroid' | 'comet';
  orbitalElements: {
    a: [number, number];      // semi-major axis
    e: [number, number];      // eccentricity
    I: [number, number];      // inclination
    L: [number, number];      // mean longitude
    w_bar: [number, number];  // longitude of perihelion
    Omega: [number, number];  // longitude of ascending node
    // Additional fields for asteroids
    epoch?: number;           // epoch JD
    meanMotion?: number;      // degrees per day
  };
  hazardous: boolean;
  closestApproach?: {
    date: string;
    distance: number; // AU
  };
}

// Re-export ImpactPrediction from impactCalculation
export type { ImpactPrediction } from './impactCalculation';

// Sample NEO objects (this will be expanded)
export const NEO_OBJECTS: NEOObject[] = [
  // Temporarily removed for testing
];

// Time simulation state
export interface TimeState {
  currentDate: Date;
  julianDate: number;
  timeScale: number; // Hours per frame
  isPlaying: boolean;
}
