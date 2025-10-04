import { ImpactScenario } from '../types/asteroid';
import { trajectoryCalculator } from './trajectoryCalculator';
import { NASAObject } from './nasaApi';

export interface City {
  lat: number;
  lng: number;
  name: string;
}

export function recalculateImpactForCity(
  originalScenario: ImpactScenario,
  targetCity: City
): ImpactScenario {
  if (!originalScenario.nasaData) {
    // If no NASA data, return original scenario with new city
    return {
      ...originalScenario,
      position: targetCity,
      city: targetCity.name
    };
  }

  // Recalculate trajectory and consequences for the new city
  const newScenario = trajectoryCalculator.convertToImpactScenario(
    originalScenario.nasaData,
    targetCity
  );

  return newScenario;
}

export function calculateImpactConsequencesForCity(
  nasaData: NASAObject,
  targetCity: City
): ImpactScenario {
  return trajectoryCalculator.convertToImpactScenario(nasaData, targetCity);
}
