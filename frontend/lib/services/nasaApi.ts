// NASA NEO API Service
export interface NASAAPIResponse {
  links: {
    next: string;
    previous: string;
    self: string;
  };
  element_count: number;
  near_earth_objects: {
    [date: string]: NASAObject[];
  };
}

export interface NASAObject {
  links: {
    self: string;
  };
  id: string;
  neo_reference_id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
    meters: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
    miles: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
    feet: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: CloseApproachData[];
  is_sentry_object: boolean;
}

export interface CloseApproachData {
  close_approach_date: string;
  close_approach_date_full: string;
  epoch_date_close_approach: number;
  relative_velocity: {
    kilometers_per_second: string;
    kilometers_per_hour: string;
    miles_per_hour: string;
  };
  miss_distance: {
    astronomical: string;
    lunar: string;
    kilometers: string;
    miles: string;
  };
  orbiting_body: string;
}

class NASAApiService {
  private baseUrl = 'https://api.nasa.gov/neo/rest/v1';
  private apiKey = 'DEMO_KEY'; // In production, use a real API key

  async getNearEarthObjects(startDate: string, endDate: string): Promise<NASAAPIResponse> {
    try {
      const url = `${this.baseUrl}/feed?start_date=${startDate}&end_date=${endDate}&detailed=false&api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`NASA API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching NASA data:', error);
      throw error;
    }
  }

  async getAsteroidDetails(asteroidId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/neo/${asteroidId}?api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`NASA API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching asteroid details:', error);
      throw error;
    }
  }

  // Get current week's asteroids
  async getCurrentWeekAsteroids(): Promise<NASAAPIResponse> {
    const today = new Date();
    const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return this.getNearEarthObjects(startDateStr, endDateStr);
  }
}

export const nasaApiService = new NASAApiService();
