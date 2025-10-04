import { NEOObject } from '@/components/solar-system/utils';

// Define the orbital data interface locally since we're not using backend
export interface NEOOrbitalData {
  orbit_id: string;
  orbit_determination_date: string;
  first_observation_date: string;
  last_observation_date: string;
  data_arc_in_days: number;
  observations_used: number;
  orbit_uncertainty: string;
  minimum_orbit_intersection: string;
  jupiter_tisserand_invariant: string;
  epoch_osculation: string;
  eccentricity: string;
  semi_major_axis: string;
  inclination: string;
  ascending_node_longitude: string;
  orbital_period: string;
  perihelion_distance: string;
  perihelion_argument: string;
  aphelion_distance: string;
  perihelion_time: string;
  mean_anomaly: string;
  mean_motion: string;
  equinox: string;
  orbit_class: {
    orbit_class_type: string;
    orbit_class_description: string;
    orbit_class_range: string;
  };
}

/**
 * Convert NASA API orbital data to our NEO object format for visualization
 */
export function convertNASADataToNEO(name: string, orbitalData: NEOOrbitalData): NEOObject {
  // Convert string values to numbers
  const eccentricity = parseFloat(orbitalData.eccentricity);
  const semiMajorAxis = parseFloat(orbitalData.semi_major_axis);
  const inclination = parseFloat(orbitalData.inclination);
  const ascendingNodeLongitude = parseFloat(orbitalData.ascending_node_longitude);
  const perihelionArgument = parseFloat(orbitalData.perihelion_argument);
  const meanAnomalyAtEpoch = parseFloat(orbitalData.mean_anomaly);
  const meanMotion = parseFloat(orbitalData.mean_motion); // degrees per day
  const epoch = parseFloat(orbitalData.epoch_osculation); // Julian Date of epoch

  // Calculate longitude of perihelion (w_bar = Omega + omega)
  const longitudeOfPerihelion = ascendingNodeLongitude + perihelionArgument;

  // For real orbital mechanics, we need to use mean motion and epoch
  // Mean longitude at epoch
  const meanLongitudeAtEpoch = meanAnomalyAtEpoch + longitudeOfPerihelion;

  // Debug: Log the orbital elements
  console.log(`Converting NEO ${name}:`, {
    semiMajorAxis,
    eccentricity,
    inclination,
    meanAnomalyAtEpoch,
    meanMotion,
    epoch,
    longitudeOfPerihelion,
    ascendingNodeLongitude
  });

  // Determine if potentially hazardous based on minimum orbit intersection
  const minOrbitIntersection = parseFloat(orbitalData.minimum_orbit_intersection);
  const isHazardous = minOrbitIntersection < 0.05; // Less than 0.05 AU is considered potentially hazardous

  // Determine color based on orbit class and hazard level
  let color = '#888888'; // Default gray
  if (isHazardous) {
    color = '#FF4444'; // Red for hazardous
  } else {
    switch (orbitalData.orbit_class.orbit_class_type) {
      case 'ATE': color = '#FFA500'; break; // Orange for Aten
      case 'APO': color = '#FFFF00'; break; // Yellow for Apollo
      case 'AMO': color = '#00FF00'; break; // Green for Amor
      default: color = '#888888'; break;
    }
  }

  // Estimate size based on orbit uncertainty and data quality
  // Make them smaller for better visualization when there are many
  const uncertainty = parseInt(orbitalData.orbit_uncertainty);
  const baseSize = 0.02; // Much smaller base size
  const size = baseSize + (uncertainty > 5 ? 0.01 : 0);

  const neoObject: NEOObject = {
    id: `neo_${name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name,
    color: color,
    size: size,
    type: 'asteroid' as const,
    orbitalElements: {
      // Use proper format for asteroid orbital elements
      a: [semiMajorAxis, 0] as [number, number],
      e: [eccentricity, 0] as [number, number],
      I: [inclination, 0] as [number, number],
      // For asteroids, we need to track mean longitude progression
      L: [meanLongitudeAtEpoch, meanMotion * 36525] as [number, number], // mean motion per century
      w_bar: [longitudeOfPerihelion, 0] as [number, number],
      Omega: [ascendingNodeLongitude, 0] as [number, number],
      // Store additional data for proper calculations
      epoch: epoch,
      meanMotion: meanMotion
    } as any,
    hazardous: isHazardous,
    closestApproach: {
      date: orbitalData.perihelion_time,
      distance: minOrbitIntersection
    }
  };

  console.log(`Final NEO object for ${name}:`, neoObject);
  return neoObject;
}

/**
 * Get date range for fetching NEO data (last 7 days)
 */
export function getNEODateRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

/**
 * Determine threat level based on orbital characteristics
 */
export function calculateThreatLevel(orbitalData: NEOOrbitalData): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const minOrbitIntersection = parseFloat(orbitalData.minimum_orbit_intersection);
  const uncertainty = parseInt(orbitalData.orbit_uncertainty);

  // Critical: Very close approach with good data quality
  if (minOrbitIntersection < 0.02 && uncertainty <= 2) {
    return 'CRITICAL';
  }

  // High: Close approach or uncertain trajectory
  if (minOrbitIntersection < 0.05 || uncertainty >= 7) {
    return 'HIGH';
  }

  // Medium: Moderate approach distance
  if (minOrbitIntersection < 0.1) {
    return 'MEDIUM';
  }

  return 'LOW';
}
