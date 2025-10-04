import { nasaApiService, NASAObject } from './nasaApi';
import { trajectoryCalculator } from './trajectoryCalculator';
import { ImpactScenario } from '../types/asteroid';

export interface RealAsteroidData {
  nasaObjects: NASAObject[];
  impactScenarios: ImpactScenario[];
  lastUpdated: Date;
}

class NASADataManager {
  private cache: RealAsteroidData | null = null;
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  async getRealAsteroidData(): Promise<RealAsteroidData> {
    // Check if we have valid cached data
    if (this.cache && this.isCacheValid()) {
      return this.cache;
    }

    try {
      // Fetch real NASA data
      const nasaResponse = await nasaApiService.getCurrentWeekAsteroids();
      
      // Extract all asteroids from all dates
      const allAsteroids: NASAObject[] = [];
      Object.values(nasaResponse.near_earth_objects).forEach(asteroids => {
        allAsteroids.push(...asteroids);
      });

      // Filter for potentially hazardous asteroids and close approaches
      const interestingAsteroids = allAsteroids.filter(asteroid => {
        const approachData = asteroid.close_approach_data[0];
        const missDistance = parseFloat(approachData.miss_distance.kilometers);
        const earthRadius = 6371; // km
        
        // Include potentially hazardous asteroids or those coming within 10 Earth radii
        return asteroid.is_potentially_hazardous_asteroid || missDistance < earthRadius * 10;
      });

      // Create impact scenarios for major cities
      const majorCities = [
        { lat: 40.7128, lng: -74.0060, name: 'New York City' },
        { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
        { lat: 51.5074, lng: -0.1278, name: 'London' },
        { lat: -33.8688, lng: 151.2093, name: 'Sydney' },
        { lat: 53.4285, lng: 14.5528, name: 'Szczecin' }
      ];

      const impactScenarios: ImpactScenario[] = [];
      
      // Create scenarios for the most interesting asteroids
      const topAsteroids = interestingAsteroids
        .sort((a, b) => {
          const aMiss = parseFloat(a.close_approach_data[0].miss_distance.kilometers);
          const bMiss = parseFloat(b.close_approach_data[0].miss_distance.kilometers);
          return aMiss - bMiss; // Closest first
        })
        .slice(0, 10); // Top 10 most interesting

      topAsteroids.forEach((asteroid, index) => {
        const city = majorCities[index % majorCities.length];
        const scenario = trajectoryCalculator.convertToImpactScenario(asteroid, city);
        impactScenarios.push(scenario);
      });

      // Cache the data
      this.cache = {
        nasaObjects: interestingAsteroids,
        impactScenarios,
        lastUpdated: new Date()
      };

      return this.cache;
    } catch (error) {
      console.error('Error fetching NASA data:', error);
      
      // Return fallback data if API fails
      return this.getFallbackData();
    }
  }

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    const now = new Date();
    const cacheAge = now.getTime() - this.cache.lastUpdated.getTime();
    return cacheAge < this.cacheExpiry;
  }

  private getFallbackData(): RealAsteroidData {
    // Return some sample data if NASA API is unavailable
    return {
      nasaObjects: [],
      impactScenarios: [
        {
          id: 'fallback-1',
          name: 'Simulated Asteroid Impact',
          position: { lat: 40.7128, lng: -74.0060 },
          city: 'New York City',
          asteroidSize: 500,
          energy: 1000,
          casualties: 10000000,
          tsunami: true,
          blastRadius: 50,
          craterSize: 5,
          collisionProbability: 0.05
        }
      ],
      lastUpdated: new Date()
    };
  }

  async getAsteroidDetails(asteroidId: string): Promise<any> {
    try {
      return await nasaApiService.getAsteroidDetails(asteroidId);
    } catch (error) {
      console.error('Error fetching asteroid details:', error);
      return null;
    }
  }

  // Get asteroids sorted by collision probability
  getAsteroidsByThreat(): ImpactScenario[] {
    if (!this.cache) return [];
    
    return this.cache.impactScenarios
      .filter(scenario => scenario.collisionProbability && scenario.collisionProbability > 0)
      .sort((a, b) => (b.collisionProbability || 0) - (a.collisionProbability || 0));
  }

  // Get asteroids sorted by closest approach
  getAsteroidsByProximity(): ImpactScenario[] {
    if (!this.cache) return [];
    
    return this.cache.impactScenarios
      .filter(scenario => scenario.trajectory)
      .sort((a, b) => (a.trajectory?.closestApproach || Infinity) - (b.trajectory?.closestApproach || Infinity));
  }

  // Get asteroids sorted by impact energy
  getAsteroidsByEnergy(): ImpactScenario[] {
    if (!this.cache) return [];
    
    return this.cache.impactScenarios
      .sort((a, b) => b.energy - a.energy);
  }

  // Force refresh data
  async refreshData(): Promise<RealAsteroidData> {
    this.cache = null;
    return this.getRealAsteroidData();
  }
}

export const nasaDataManager = new NASADataManager();
