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

      // Polish Cities
      { name: 'Warsaw', lat: 52.2297, lng: 21.0122, density: 3500, radius: 25, country: 'Poland', region: 'Europe' },
      { name: 'Krakow', lat: 50.0647, lng: 19.9450, density: 2500, radius: 20, country: 'Poland', region: 'Europe' },
      { name: 'Gdansk', lat: 54.3520, lng: 18.6466, density: 2000, radius: 18, country: 'Poland', region: 'Europe' },
      { name: 'Szczecin', lat: 53.4285, lng: 14.5528, density: 1800, radius: 15, country: 'Poland', region: 'Europe' },
      { name: 'Wroclaw', lat: 51.1079, lng: 17.0385, density: 2200, radius: 20, country: 'Poland', region: 'Europe' },
      { name: 'Poznan', lat: 52.4064, lng: 16.9252, density: 2000, radius: 18, country: 'Poland', region: 'Europe' },
      { name: 'Lodz', lat: 51.7592, lng: 19.4560, density: 1800, radius: 15, country: 'Poland', region: 'Europe' },

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

      // Other Major Cities
      { name: 'Sydney', lat: -33.8688, lng: 151.2093, density: 2000, radius: 60, country: 'Australia', region: 'Oceania' },
      { name: 'Buenos Aires', lat: -34.6118, lng: -58.3960, density: 6000, radius: 40, country: 'Argentina', region: 'South America' },
      { name: 'Lima', lat: -12.0464, lng: -77.0428, density: 8000, radius: 35, country: 'Peru', region: 'South America' },
      { name: 'Bogotá', lat: 4.7110, lng: -74.0721, density: 7000, radius: 30, country: 'Colombia', region: 'South America' },
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
