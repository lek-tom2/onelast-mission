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
  private currentDateRange: { startDate: string; endDate: string } | null = null;

  async getRealAsteroidData(customDateRange?: { startDate: string; endDate: string }): Promise<RealAsteroidData> {
    // Check if we have valid cached data for the same date range
    if (this.cache && this.isCacheValid() && 
        (!customDateRange || 
         (this.currentDateRange && 
          this.currentDateRange.startDate === customDateRange.startDate && 
          this.currentDateRange.endDate === customDateRange.endDate))) {
      console.log('Using cached NASA data');
      return this.cache;
    }

    try {
      console.log('Fetching fresh NASA data...');
      
      // Test NASA API first
      const apiWorking = await nasaApiService.testNASAAPI();
      if (!apiWorking) {
        console.log('NASA API test failed, using fallback data');
        return this.getFallbackData();
      }
      
      // Fetch real NASA data
      let nasaResponse;
      if (customDateRange) {
        this.currentDateRange = customDateRange;
        nasaResponse = await nasaApiService.getAsteroidsForDateRange(customDateRange.startDate, customDateRange.endDate);
      } else {
        nasaResponse = await nasaApiService.getCurrentWeekAsteroids();
      }
      console.log('NASA response received:', nasaResponse);
      
      // Extract all asteroids from all dates
      const allAsteroids: NASAObject[] = [];
      Object.values(nasaResponse.near_earth_objects).forEach(asteroids => {
        allAsteroids.push(...asteroids);
      });

      console.log('Raw NASA asteroids count:', allAsteroids.length);
      console.log('Sample asteroid data:', allAsteroids[0]);

      // Filter for interesting asteroids with better criteria
      const interestingAsteroids = allAsteroids.filter(asteroid => {
        const approachData = asteroid.close_approach_data[0];
        const missDistance = parseFloat(approachData.miss_distance.kilometers);
        const earthRadius = 6371; // km
        const velocity = parseFloat(approachData.relative_velocity.kilometers_per_second);
        const diameter = (asteroid.estimated_diameter.meters.estimated_diameter_min + 
                         asteroid.estimated_diameter.meters.estimated_diameter_max) / 2;
        
        // More inclusive filtering criteria:
        // 1. Potentially hazardous asteroids
        // 2. Close approaches (within 20 Earth radii)
        // 3. Large asteroids (over 100m diameter)
        // 4. Fast asteroids (over 15 km/s)
        // 5. Any asteroid with significant size and reasonable approach
        return asteroid.is_potentially_hazardous_asteroid || 
               missDistance < earthRadius * 20 ||
               diameter > 100 ||
               velocity > 15 ||
               (diameter > 50 && missDistance < earthRadius * 50);
      });

      // Create impact scenarios for major cities
      const majorCities = [
        { lat: 40.7128, lng: -74.0060, name: 'New York City' },
        { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
        { lat: 51.5074, lng: -0.1278, name: 'London' },
        { lat: -33.8688, lng: 151.2093, name: 'Sydney' },
        { lat: 53.4285, lng: 14.5528, name: 'Szczecin' },
        { lat: 48.8566, lng: 2.3522, name: 'Paris' },
        { lat: 52.5200, lng: 13.4050, name: 'Berlin' },
        { lat: 55.7558, lng: 37.6176, name: 'Moscow' },
        { lat: 39.9042, lng: 116.4074, name: 'Beijing' },
        { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
        { lat: -22.9068, lng: -43.1729, name: 'Rio de Janeiro' },
        { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
        { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
        { lat: 1.3521, lng: 103.8198, name: 'Singapore' },
        { lat: 25.2048, lng: 55.2708, name: 'Dubai' },
        { lat: -26.2041, lng: 28.0473, name: 'Johannesburg' },
        { lat: 43.6532, lng: -79.3832, name: 'Toronto' },
        { lat: 37.5665, lng: 126.9780, name: 'Seoul' },
        { lat: 23.1291, lng: 113.2644, name: 'Guangzhou' },
        { lat: 12.9716, lng: 77.5946, name: 'Bangalore' }
      ];

      const impactScenarios: ImpactScenario[] = [];
      
      // Create scenarios for the most interesting asteroids
      const topAsteroids = interestingAsteroids
        .sort((a, b) => {
          const aMiss = parseFloat(a.close_approach_data[0].miss_distance.kilometers);
          const bMiss = parseFloat(b.close_approach_data[0].miss_distance.kilometers);
          return aMiss - bMiss; // Closest first
        })
        .slice(0, 30); // Top 30 most interesting asteroids

      topAsteroids.forEach((asteroid, index) => {
        const city = majorCities[index % majorCities.length];
        const scenario = trajectoryCalculator.convertToImpactScenario(asteroid, city);
        console.log(`Creating scenario ${index}:`, {
          id: scenario.id,
          name: scenario.name,
          nasaId: scenario.nasaData?.id,
          nasaName: scenario.nasaData?.name
        });
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

  // Change date range and refresh data
  async changeDateRange(startDate: string, endDate: string): Promise<RealAsteroidData> {
    this.cache = null; // Clear cache for new date range
    this.currentDateRange = { startDate, endDate };
    return this.getRealAsteroidData({ startDate, endDate });
  }
}

export const nasaDataManager = new NASADataManager();
