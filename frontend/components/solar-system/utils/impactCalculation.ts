import { NEOObject } from '../utils';
import { calculateKeplerianPosition } from './orbitalMechanics';
import { getCurrentJulianDate } from './timeUtils';

export interface ImpactPrediction {
  willImpact: boolean;
  impactDate: Date | null;
  impactJulianDate: number | null;
  closestApproach: number;
  closestApproachDate: Date | null;
  closestApproachPositions?: {
    earth: { x: number; y: number; z: number };
    asteroid: { x: number; y: number; z: number };
  };
  daysUntilImpact: number | null;
  impactProbability: number;
}

export function calculateImpactPrediction(asteroid: NEOObject, currentJulianDate?: number): ImpactPrediction {
  console.log('🔍 Calculating impact prediction for:', asteroid.name);
  
  // Use provided julian date or current time
  const currentJD = currentJulianDate || getCurrentJulianDate();
  console.log('Starting search from JD:', currentJD);
  
  const earthRadius = 0.000042633; // Earth radius in AU (6371 km / 149597871 km/AU)
  
  // Create orbital elements for calculation
  const asteroidElements = {
    name: asteroid.name,
    color: asteroid.color,
    size: asteroid.size,
    a: asteroid.orbitalElements.a,
    e: asteroid.orbitalElements.e,
    I: asteroid.orbitalElements.I,
    L: asteroid.orbitalElements.L,
    w_bar: asteroid.orbitalElements.w_bar,
    Omega: asteroid.orbitalElements.Omega,
    epoch: asteroid.orbitalElements.epoch,
    meanMotion: asteroid.orbitalElements.meanMotion
  };

  // Earth orbital elements
  const earthElements = {
    name: 'Earth',
    color: '#4A90E2',
    size: 1,
    a: [1.00000261, 0.00000562],
    e: [0.01671123, -0.00004392],
    I: [-0.00001531, -0.01294668],
    L: [100.46457166, 35999.37244981],
    w_bar: [102.93768193, 0.32327364],
    Omega: [0.0, 0.0]
  };

  let closestDistance = Infinity;
  let closestApproachJD: number | null = null;
  let closestApproachPositions: { earth: { x: number; y: number; z: number }; asteroid: { x: number; y: number; z: number } } | undefined;
  let impactJD: number | null = null;
  
  // Check positions over the next 5 years (more precise search)
  const daysToCheck = 365 * 5;
  const timeStep = 0.1; // Check every 0.1 days for higher precision
  
  for (let day = 0; day < daysToCheck; day += timeStep) {
    const checkJD = currentJD + day;
    
    // Calculate positions
    const asteroidPos = calculateKeplerianPosition(asteroidElements, checkJD);
    const earthPos = calculateKeplerianPosition(earthElements, checkJD);
    
    // Calculate distance between asteroid and Earth
    const distance = Math.sqrt(
      Math.pow(asteroidPos.x - earthPos.x, 2) +
      Math.pow(asteroidPos.y - earthPos.y, 2) +
      Math.pow(asteroidPos.z - earthPos.z, 2)
    );
    
    // Track closest approach
    if (distance < closestDistance) {
      closestDistance = distance;
      closestApproachJD = checkJD;
      // Store positions with simple scale factor to match Planet and NEO components
      const scaleFactor = 4;
      closestApproachPositions = {
        earth: { 
          x: earthPos.x * scaleFactor, 
          y: earthPos.y * scaleFactor,
          z: earthPos.z * scaleFactor
        },
        asteroid: { 
          x: asteroidPos.x * scaleFactor, 
          y: asteroidPos.y * scaleFactor,
          z: asteroidPos.z * scaleFactor
        }
      };
    }
    
    // Check for impact (within Earth's radius + small margin)
    if (distance < earthRadius * 2) { // 2x Earth radius for impact zone
      impactJD = checkJD;
      break;
    }
  }
  
  // Convert Julian dates to regular dates
  const impactDate = impactJD ? julianToDate(impactJD) : null;
  const closestApproachDate = closestApproachJD ? julianToDate(closestApproachJD) : null;
  
  console.log('Impact JD:', impactJD);
  console.log('Impact Date:', impactDate);
  console.log('Closest approach:', closestDistance, 'AU');
  
  // Calculate days until impact
  const daysUntilImpact = impactJD ? impactJD - currentJD : null;
  
  // Calculate impact probability based on closest approach
  let impactProbability = 0;
  if (closestDistance < earthRadius * 10) { // Within 10 Earth radii
    impactProbability = Math.max(0, Math.min(100, (1 - (closestDistance / (earthRadius * 10))) * 100));
  }
  
  console.log('Impact probability:', Math.round(impactProbability * 10) / 10, '%');
  
  return {
    willImpact: impactJD !== null,
    impactDate,
    impactJulianDate: impactJD,
    closestApproach: closestDistance,
    closestApproachDate,
    closestApproachPositions,
    daysUntilImpact,
    impactProbability: Math.round(impactProbability * 10) / 10
  };
}

function julianToDate(julianDate: number): Date {
  // Convert Julian Date to regular Date
  const j = julianDate + 0.5;
  const z = Math.floor(j);
  const f = j - z;
  
  let a;
  if (z < 2299161) {
    a = z;
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  
  const day = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  
  const hours = (day - Math.floor(day)) * 24;
  const minutes = (hours - Math.floor(hours)) * 60;
  const seconds = (minutes - Math.floor(minutes)) * 60;
  
  return new Date(year, month - 1, Math.floor(day), Math.floor(hours), Math.floor(minutes), Math.floor(seconds));
}