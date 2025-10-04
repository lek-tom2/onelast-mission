import { ImpactScenario } from '../types/asteroid';
import { SortOption, FilterOption } from '../stores/useAsteroidStore';

export function sortAsteroids(scenarios: ImpactScenario[], sortOption: SortOption): ImpactScenario[] {
  const sorted = [...scenarios];
  
  switch (sortOption) {
    case 'nearest':
      return sorted.sort((a, b) => {
        const aDistance = a.trajectory?.closestApproach || Infinity;
        const bDistance = b.trajectory?.closestApproach || Infinity;
        return aDistance - bDistance;
      });
      
    case 'furthest':
      return sorted.sort((a, b) => {
        const aDistance = a.trajectory?.closestApproach || 0;
        const bDistance = b.trajectory?.closestApproach || 0;
        return bDistance - aDistance;
      });
      
    case 'highest_energy':
      return sorted.sort((a, b) => b.energy - a.energy);
      
    case 'lowest_energy':
      return sorted.sort((a, b) => a.energy - b.energy);
      
    case 'largest':
      return sorted.sort((a, b) => b.asteroidSize - a.asteroidSize);
      
    case 'smallest':
      return sorted.sort((a, b) => a.asteroidSize - b.asteroidSize);
      
    case 'most_dangerous':
      return sorted.sort((a, b) => {
        const aDanger = (a.collisionProbability || 0) * a.energy;
        const bDanger = (b.collisionProbability || 0) * b.energy;
        return bDanger - aDanger;
      });
      
    case 'least_dangerous':
      return sorted.sort((a, b) => {
        const aDanger = (a.collisionProbability || 0) * a.energy;
        const bDanger = (b.collisionProbability || 0) * b.energy;
        return aDanger - bDanger;
      });
      
    default:
      return sorted;
  }
}

export function filterAsteroids(scenarios: ImpactScenario[], filterOption: FilterOption): ImpactScenario[] {
  switch (filterOption) {
    case 'hazardous':
      return scenarios.filter(scenario => scenario.nasaData?.is_potentially_hazardous_asteroid);
      
    case 'close_approach':
      return scenarios.filter(scenario => {
        const distance = scenario.trajectory?.closestApproach || Infinity;
        return distance < 1000000; // Within 1 million km
      });
      
    case 'high_energy':
      return scenarios.filter(scenario => scenario.energy > 100); // More than 100 megatons
      
    case 'large_size':
      return scenarios.filter(scenario => scenario.asteroidSize > 100); // More than 100m diameter
      
    case 'all':
    default:
      return scenarios;
  }
}

export function getThreatLevel(scenario: ImpactScenario): 'low' | 'medium' | 'high' | 'critical' {
  const probability = scenario.collisionProbability || 0;
  const energy = scenario.energy;
  
  if (probability > 0.1 || energy > 1000) return 'critical';
  if (probability > 0.05 || energy > 500) return 'high';
  if (probability > 0.01 || energy > 100) return 'medium';
  return 'low';
}

export function getThreatColor(threatLevel: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (threatLevel) {
    case 'critical': return '#dc2626'; // red-600
    case 'high': return '#ea580c'; // orange-600
    case 'medium': return '#d97706'; // amber-600
    case 'low': return '#16a34a'; // green-600
  }
}

export function formatDistance(km: number): string {
  if (km < 1000) return `${km.toFixed(0)} km`;
  if (km < 1000000) return `${(km / 1000).toFixed(1)}k km`;
  return `${(km / 1000000).toFixed(1)}M km`;
}

export function formatEnergy(megatons: number): string {
  if (megatons < 1) return `${(megatons * 1000).toFixed(0)} kT`;
  if (megatons < 1000) return `${megatons.toFixed(1)} MT`;
  return `${(megatons / 1000).toFixed(1)} GT`;
}
