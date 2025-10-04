// Population Density Service
// Provides population density data for any given latitude/longitude coordinate

export interface PopulationData {
  latitude: number;
  longitude: number;
  populationDensity: number; // people per km²
  totalPopulation: number; // estimated population in the area
  country: string;
  region: string;
  isUrban: boolean;
  isCoastal: boolean;
}

export interface ImpactZonePopulation {
  immediateBlast: {
    population: number;
    casualties: number;
    casualtyRate: number; // percentage
  };
  thermalRadiation: {
    population: number;
    casualties: number;
    casualtyRate: number;
  };
  seismicEffects: {
    population: number;
    casualties: number;
    casualtyRate: number;
  };
  totalAffected: number;
  totalCasualties: number;
}

class PopulationDensityService {
  // Cache for population calculations to prevent lag
  private calculationCache = new Map<string, ImpactZonePopulation>();

  // Major population centers with their approximate coordinates and densities
  private populationCenters: Array<{
    name: string;
    lat: number;
    lng: number;
    density: number; // people per km²
    radius: number; // km radius of influence
    country: string;
    region: string;
  }> = [
      // Major Cities - High Density
      { name: 'Tokyo', lat: 35.6762, lng: 139.6503, density: 15000, radius: 50, country: 'Japan', region: 'Asia' },
      { name: 'New York City', lat: 40.7128, lng: -74.0060, density: 12000, radius: 40, country: 'USA', region: 'North America' },
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777, density: 25000, radius: 60, country: 'India', region: 'Asia' },
      { name: 'Dhaka', lat: 23.8103, lng: 90.4125, density: 30000, radius: 30, country: 'Bangladesh', region: 'Asia' },
      { name: 'Lagos', lat: 6.5244, lng: 3.3792, density: 20000, radius: 40, country: 'Nigeria', region: 'Africa' },
      { name: 'Cairo', lat: 30.0444, lng: 31.2357, density: 18000, radius: 50, country: 'Egypt', region: 'Africa' },
      { name: 'São Paulo', lat: -23.5505, lng: -46.6333, density: 15000, radius: 60, country: 'Brazil', region: 'South America' },
      { name: 'Shanghai', lat: 31.2304, lng: 121.4737, density: 14000, radius: 50, country: 'China', region: 'Asia' },
      { name: 'Delhi', lat: 28.7041, lng: 77.1025, density: 22000, radius: 45, country: 'India', region: 'Asia' },
      { name: 'Karachi', lat: 24.8607, lng: 67.0011, density: 16000, radius: 40, country: 'Pakistan', region: 'Asia' },

      // European Cities - Medium-High Density
      { name: 'London', lat: 51.5074, lng: -0.1278, density: 8000, radius: 30, country: 'UK', region: 'Europe' },
      { name: 'Paris', lat: 48.8566, lng: 2.3522, density: 7000, radius: 25, country: 'France', region: 'Europe' },
      { name: 'Berlin', lat: 52.5200, lng: 13.4050, density: 6000, radius: 30, country: 'Germany', region: 'Europe' },
      { name: 'Moscow', lat: 55.7558, lng: 37.6176, density: 5000, radius: 40, country: 'Russia', region: 'Europe' },
      { name: 'Rome', lat: 41.9028, lng: 12.4964, density: 4000, radius: 25, country: 'Italy', region: 'Europe' },
      { name: 'Madrid', lat: 40.4168, lng: -3.7038, density: 5500, radius: 30, country: 'Spain', region: 'Europe' },

      // Additional European Cities
      { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, density: 4000, radius: 20, country: 'Netherlands', region: 'Europe' },
      { name: 'Vienna', lat: 48.2082, lng: 16.3738, density: 3000, radius: 25, country: 'Austria', region: 'Europe' },
      { name: 'Prague', lat: 50.0755, lng: 14.4378, density: 2500, radius: 20, country: 'Czech Republic', region: 'Europe' },
      { name: 'Warsaw', lat: 52.2297, lng: 21.0122, density: 3500, radius: 25, country: 'Poland', region: 'Europe' },
      { name: 'Budapest', lat: 47.4979, lng: 19.0402, density: 3000, radius: 25, country: 'Hungary', region: 'Europe' },
      { name: 'Stockholm', lat: 59.3293, lng: 18.0686, density: 2000, radius: 20, country: 'Sweden', region: 'Europe' },
      { name: 'Oslo', lat: 59.9139, lng: 10.7522, density: 1500, radius: 15, country: 'Norway', region: 'Europe' },
      { name: 'Copenhagen', lat: 55.6761, lng: 12.5683, density: 2500, radius: 20, country: 'Denmark', region: 'Europe' },
      { name: 'Helsinki', lat: 60.1699, lng: 24.9384, density: 2000, radius: 18, country: 'Finland', region: 'Europe' },
      { name: 'Zurich', lat: 47.3769, lng: 8.5417, density: 3000, radius: 20, country: 'Switzerland', region: 'Europe' },
      { name: 'Brussels', lat: 50.8503, lng: 4.3517, density: 4000, radius: 20, country: 'Belgium', region: 'Europe' },
      { name: 'Athens', lat: 37.9838, lng: 23.7275, density: 3500, radius: 25, country: 'Greece', region: 'Europe' },
      { name: 'Lisbon', lat: 38.7223, lng: -9.1393, density: 3000, radius: 20, country: 'Portugal', region: 'Europe' },
      { name: 'Dublin', lat: 53.3498, lng: -6.2603, density: 2500, radius: 18, country: 'Ireland', region: 'Europe' },

      // North American Cities
      { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, density: 4000, radius: 80, country: 'USA', region: 'North America' },
      { name: 'Chicago', lat: 41.8781, lng: -87.6298, density: 5000, radius: 50, country: 'USA', region: 'North America' },
      { name: 'Toronto', lat: 43.6532, lng: -79.3832, density: 4500, radius: 40, country: 'Canada', region: 'North America' },
      { name: 'Mexico City', lat: 19.4326, lng: -99.1332, density: 12000, radius: 60, country: 'Mexico', region: 'North America' },

      // Asian Cities
      { name: 'Seoul', lat: 37.5665, lng: 126.9780, density: 10000, radius: 35, country: 'South Korea', region: 'Asia' },
      { name: 'Bangkok', lat: 13.7563, lng: 100.5018, density: 8000, radius: 40, country: 'Thailand', region: 'Asia' },
      { name: 'Jakarta', lat: -6.2088, lng: 106.8456, density: 15000, radius: 50, country: 'Indonesia', region: 'Asia' },
      { name: 'Manila', lat: 14.5995, lng: 120.9842, density: 18000, radius: 30, country: 'Philippines', region: 'Asia' },

      // Additional Asian Cities
      { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, density: 20000, radius: 25, country: 'Hong Kong', region: 'Asia' },
      { name: 'Singapore', lat: 1.3521, lng: 103.8198, density: 15000, radius: 20, country: 'Singapore', region: 'Asia' },
      { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, density: 4000, radius: 30, country: 'Malaysia', region: 'Asia' },
      { name: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297, density: 12000, radius: 35, country: 'Vietnam', region: 'Asia' },
      { name: 'Hanoi', lat: 21.0285, lng: 105.8542, density: 8000, radius: 25, country: 'Vietnam', region: 'Asia' },
      { name: 'Yangon', lat: 16.8661, lng: 96.1951, density: 6000, radius: 30, country: 'Myanmar', region: 'Asia' },
      { name: 'Phnom Penh', lat: 11.5564, lng: 104.9282, density: 4000, radius: 20, country: 'Cambodia', region: 'Asia' },
      { name: 'Vientiane', lat: 17.9757, lng: 102.6331, density: 2000, radius: 15, country: 'Laos', region: 'Asia' },

      // Additional African Cities
      { name: 'Cape Town', lat: -33.9249, lng: 18.4241, density: 3000, radius: 30, country: 'South Africa', region: 'Africa' },
      { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, density: 4000, radius: 35, country: 'South Africa', region: 'Africa' },
      { name: 'Nairobi', lat: -1.2921, lng: 36.8219, density: 5000, radius: 25, country: 'Kenya', region: 'Africa' },
      { name: 'Addis Ababa', lat: 9.1450, lng: 38.7667, density: 4000, radius: 30, country: 'Ethiopia', region: 'Africa' },
      { name: 'Casablanca', lat: 33.5731, lng: -7.5898, density: 6000, radius: 25, country: 'Morocco', region: 'Africa' },
      { name: 'Algiers', lat: 36.7538, lng: 3.0588, density: 5000, radius: 25, country: 'Algeria', region: 'Africa' },
      { name: 'Tunis', lat: 36.8065, lng: 10.1815, density: 4000, radius: 20, country: 'Tunisia', region: 'Africa' },
      { name: 'Tripoli', lat: 32.8872, lng: 13.1913, density: 3000, radius: 20, country: 'Libya', region: 'Africa' },

      // Additional South American Cities
      { name: 'Santiago', lat: -33.4489, lng: -70.6693, density: 5000, radius: 30, country: 'Chile', region: 'South America' },
      { name: 'Montevideo', lat: -34.9011, lng: -56.1645, density: 3000, radius: 20, country: 'Uruguay', region: 'South America' },
      { name: 'Asuncion', lat: -25.2637, lng: -57.5759, density: 2000, radius: 15, country: 'Paraguay', region: 'South America' },
      { name: 'La Paz', lat: -16.2902, lng: -68.1342, density: 4000, radius: 20, country: 'Bolivia', region: 'South America' },
      { name: 'Quito', lat: -0.1807, lng: -78.4678, density: 3000, radius: 25, country: 'Ecuador', region: 'South America' },
      { name: 'Caracas', lat: 10.4806, lng: -66.9036, density: 6000, radius: 30, country: 'Venezuela', region: 'South America' },
      { name: 'Georgetown', lat: 6.8013, lng: -58.1551, density: 1500, radius: 15, country: 'Guyana', region: 'South America' },
      { name: 'Paramaribo', lat: 5.8520, lng: -55.2038, density: 1000, radius: 10, country: 'Suriname', region: 'South America' },

      // Additional North American Cities
      { name: 'Vancouver', lat: 49.2827, lng: -123.1207, density: 3000, radius: 30, country: 'Canada', region: 'North America' },
      { name: 'Montreal', lat: 45.5017, lng: -73.5673, density: 4000, radius: 25, country: 'Canada', region: 'North America' },
      { name: 'Calgary', lat: 51.0447, lng: -114.0719, density: 2000, radius: 20, country: 'Canada', region: 'North America' },
      { name: 'Ottawa', lat: 45.4215, lng: -75.6972, density: 1500, radius: 15, country: 'Canada', region: 'North America' },
      { name: 'Quebec City', lat: 46.8139, lng: -71.2080, density: 1000, radius: 12, country: 'Canada', region: 'North America' },
      { name: 'Winnipeg', lat: 49.8951, lng: -97.1384, density: 1500, radius: 15, country: 'Canada', region: 'North America' },
      { name: 'Edmonton', lat: 53.5461, lng: -113.4938, density: 1200, radius: 15, country: 'Canada', region: 'North America' },
      { name: 'Halifax', lat: 44.6488, lng: -63.5752, density: 800, radius: 10, country: 'Canada', region: 'North America' },

      // Additional Oceania Cities
      { name: 'Melbourne', lat: -37.8136, lng: 144.9631, density: 2500, radius: 50, country: 'Australia', region: 'Oceania' },
      { name: 'Brisbane', lat: -27.4698, lng: 153.0251, density: 2000, radius: 40, country: 'Australia', region: 'Oceania' },
      { name: 'Perth', lat: -31.9505, lng: 115.8605, density: 1500, radius: 35, country: 'Australia', region: 'Oceania' },
      { name: 'Adelaide', lat: -34.9285, lng: 138.6007, density: 1200, radius: 25, country: 'Australia', region: 'Oceania' },
      { name: 'Auckland', lat: -36.8485, lng: 174.7633, density: 2000, radius: 30, country: 'New Zealand', region: 'Oceania' },
      { name: 'Wellington', lat: -41.2924, lng: 174.7787, density: 1500, radius: 20, country: 'New Zealand', region: 'Oceania' },
      { name: 'Christchurch', lat: -43.5321, lng: 172.6362, density: 1000, radius: 15, country: 'New Zealand', region: 'Oceania' },
    ];

  // Regional population density baselines (people per km²) - more realistic
  private regionalDensities: Record<string, number> = {
    'Asia': 150,
    'Europe': 180, // More realistic European average
    'North America': 20,
    'South America': 25,
    'Africa': 45,
    'Oceania': 5,
  };

  // Ocean and remote area densities
  private oceanDensity = 0;
  private remoteAreaDensity = 1;

  /**
   * Get all major cities for selection
   */
  getAllCities() {
    return this.populationCenters.map(city => ({
      name: city.name,
      lat: city.lat,
      lng: city.lng,
      country: city.country,
      region: city.region,
      density: city.density
    }));
  }

  /**
   * Get cities by region
   */
  getCitiesByRegion(region: string) {
    return this.populationCenters
      .filter(city => city.region === region)
      .map(city => ({
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        country: city.country,
        region: city.region,
        density: city.density
      }));
  }

  /**
   * Get population data for a specific latitude/longitude coordinate
   */
  getPopulationData(latitude: number, longitude: number): PopulationData {
    // Find the closest major population center
    const closestCenter = this.findClosestPopulationCenter(latitude, longitude);

    if (closestCenter) {
      const distance = this.calculateDistance(latitude, longitude, closestCenter.lat, closestCenter.lng);

      if (distance <= closestCenter.radius) {
        // Within a major city - use city density with realistic falloff
        const influenceFactor = Math.max(0.3, 1 - (distance / closestCenter.radius));
        const density = closestCenter.density * influenceFactor;

        return {
          latitude,
          longitude,
          populationDensity: Math.round(density),
          totalPopulation: Math.round(density * Math.PI * Math.pow(Math.min(distance, 10), 2)), // Cap at 10km radius
          country: closestCenter.country,
          region: closestCenter.region,
          isUrban: true,
          isCoastal: this.isCoastal(latitude, longitude)
        };
      }
    }

    // Not in a major city - use regional baseline with realistic adjustments
    const region = this.getRegion(latitude, longitude);
    const baseDensity = this.regionalDensities[region] || 10;

    // Adjust for coastal areas (slightly higher density)
    const coastalFactor = this.isCoastal(latitude, longitude) ? 1.5 : 1;

    // Adjust for latitude (temperate zones have higher density)
    const latitudeFactor = this.getLatitudeFactor(latitude);

    // Adjust for proximity to cities (gradual falloff)
    let cityInfluence = 1;
    if (closestCenter) {
      const distance = this.calculateDistance(latitude, longitude, closestCenter.lat, closestCenter.lng);
      if (distance <= closestCenter.radius * 2) {
        // Within 2x city radius - gradual falloff
        cityInfluence = Math.max(1.2, 2 - (distance / (closestCenter.radius * 2)));
      }
    }

    const density = Math.round(baseDensity * coastalFactor * latitudeFactor * cityInfluence);

    return {
      latitude,
      longitude,
      populationDensity: density,
      totalPopulation: Math.round(density * 100), // Estimate for 10km radius
      country: this.getCountry(latitude, longitude),
      region,
      isUrban: false,
      isCoastal: this.isCoastal(latitude, longitude)
    };
  }

  /**
   * Calculate casualties for impact zones based on population density
   * Uses optimized analysis with caching for better performance
   */
  calculateImpactCasualties(
    latitude: number,
    longitude: number,
    immediateBlastRadius: number, // km
    thermalRadius: number, // km
    seismicRadius: number, // km
    energy: number // megatons
  ): ImpactZonePopulation {
    // Create cache key for this calculation
    const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}_${immediateBlastRadius.toFixed(1)}_${thermalRadius.toFixed(1)}_${seismicRadius.toFixed(1)}_${energy.toFixed(1)}`;

    // Check cache first
    if (this.calculationCache.has(cacheKey)) {
      console.log(`Using cached calculation for ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
      return this.calculationCache.get(cacheKey)!;
    }

    console.log(`Calculating casualties for impact at ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
    console.log(`Impact zones: Blast=${immediateBlastRadius.toFixed(2)}km, Thermal=${thermalRadius.toFixed(2)}km, Seismic=${seismicRadius.toFixed(2)}km`);

    // Calculate casualties for each zone using optimized analysis
    const immediateBlastResult = this.calculateZoneCasualties(
      latitude, longitude, 0, immediateBlastRadius, energy, 'immediate'
    );

    const thermalResult = this.calculateZoneCasualties(
      latitude, longitude, immediateBlastRadius, thermalRadius, energy, 'thermal'
    );

    const seismicResult = this.calculateZoneCasualties(
      latitude, longitude, thermalRadius, seismicRadius, energy, 'seismic'
    );

    const totalAffected = immediateBlastResult.population + thermalResult.population + seismicResult.population;
    const totalCasualties = immediateBlastResult.casualties + thermalResult.casualties + seismicResult.casualties;

    console.log(`Total affected: ${totalAffected.toLocaleString()}, Total casualties: ${totalCasualties.toLocaleString()}`);

    const result = {
      immediateBlast: immediateBlastResult,
      thermalRadiation: thermalResult,
      seismicEffects: seismicResult,
      totalAffected,
      totalCasualties
    };

    // Cache the result (limit cache size to prevent memory issues)
    if (this.calculationCache.size > 100) {
      this.calculationCache.clear();
    }
    this.calculationCache.set(cacheKey, result);

    return result;
  }

  /**
   * Calculate casualties for a specific impact zone using realistic analysis
   */
  private calculateZoneCasualties(
    centerLat: number,
    centerLng: number,
    innerRadius: number, // km
    outerRadius: number, // km
    energy: number, // megatons
    zoneType: 'immediate' | 'thermal' | 'seismic'
  ): { population: number; casualties: number; casualtyRate: number } {
    // Get population density at center point
    const centerPopulationData = this.getPopulationData(centerLat, centerLng);

    // Calculate area of the zone
    const zoneArea = Math.PI * (Math.pow(outerRadius, 2) - Math.pow(innerRadius, 2));

    // Use more realistic density calculation
    let adjustedDensity = centerPopulationData.populationDensity;

    // For larger zones, reduce density to account for suburban/rural areas
    if (outerRadius > 10) {
      const sizeFactor = Math.max(0.3, 1 - (outerRadius - 10) / 50); // Gradual reduction for large zones
      adjustedDensity = adjustedDensity * sizeFactor;
    }

    // Cap density at reasonable maximum
    adjustedDensity = Math.min(adjustedDensity, 5000); // Max 5000 people/km²

    // Calculate population in zone
    const totalPopulation = Math.round(zoneArea * adjustedDensity);

    // Calculate casualty rate based on zone type and energy
    let casualtyRate: number;
    switch (zoneType) {
      case 'immediate':
        casualtyRate = Math.min(0.99, 0.8 + (energy / 1000) * 0.1); // 80-99%
        break;
      case 'thermal':
        casualtyRate = Math.min(0.8, 0.3 + (energy / 1000) * 0.2); // 30-80%
        break;
      case 'seismic':
        casualtyRate = Math.min(0.5, 0.1 + (energy / 1000) * 0.1); // 10-50%
        break;
      default:
        casualtyRate = 0.1;
    }

    const totalCasualties = Math.round(totalPopulation * casualtyRate);

    console.log(`${zoneType} zone: ${totalPopulation.toLocaleString()} people, ${totalCasualties.toLocaleString()} casualties (${(casualtyRate * 100).toFixed(1)}%)`);

    return {
      population: totalPopulation,
      casualties: totalCasualties,
      casualtyRate: casualtyRate * 100
    };
  }

  private findClosestPopulationCenter(lat: number, lng: number) {
    let closest = null;
    let minDistance = Infinity;

    for (const center of this.populationCenters) {
      const distance = this.calculateDistance(lat, lng, center.lat, center.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closest = center;
      }
    }

    return closest;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private isCoastal(lat: number, lng: number): boolean {
    // Simplified coastal detection - within 50km of major coastlines
    // This is a rough approximation
    const coastalRegions = [
      { lat: 40.7, lng: -74.0, radius: 100 }, // East Coast US
      { lat: 34.0, lng: -118.2, radius: 100 }, // West Coast US
      { lat: 51.5, lng: -0.1, radius: 100 }, // UK
      { lat: 35.7, lng: 139.7, radius: 100 }, // Japan
      { lat: -33.9, lng: 151.2, radius: 100 }, // Australia
    ];

    return coastalRegions.some(region =>
      this.calculateDistance(lat, lng, region.lat, region.lng) <= region.radius
    );
  }

  private getRegion(lat: number, lng: number): string {
    if (lat > 60 || lat < -60) return 'Oceania'; // Polar regions
    if (lat > 0 && lng > 60 && lng < 180) return 'Asia';
    if (lat > 0 && lng > -10 && lng < 60) return 'Europe';
    if (lat > 0 && lng > -180 && lng < -50) return 'North America';
    if (lat < 0 && lng > -80 && lng < -30) return 'South America';
    if (lat > -40 && lat < 40 && lng > -20 && lng < 60) return 'Africa';
    return 'Oceania';
  }

  private getCountry(lat: number, lng: number): string {
    // Simplified country detection based on coordinates
    if (lat > 24 && lat < 50 && lng > -125 && lng < -66) return 'USA';
    if (lat > 35 && lat < 70 && lng > -10 && lng < 40) return 'Europe';
    if (lat > 20 && lat < 50 && lng > 100 && lng < 150) return 'Asia';
    if (lat > -40 && lat < -10 && lng > 110 && lng < 160) return 'Australia';
    return 'Unknown';
  }

  private getLatitudeFactor(lat: number): number {
    // Temperate zones (30-60 degrees) have higher population density
    const absLat = Math.abs(lat);
    if (absLat < 30) return 1.2; // Tropical/subtropical
    if (absLat < 60) return 1.5; // Temperate
    return 0.3; // Polar
  }
}

export const populationDensityService = new PopulationDensityService();
