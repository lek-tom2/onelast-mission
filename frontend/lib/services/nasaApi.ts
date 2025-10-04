// NASA NEO API Service
import feedData from '../../feed.json'; // NEO feed data
import orbitalData from '../../response-correct.json'; // Orbital data

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

export interface OrbitalData {
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

export interface OrbitalDataResponse {
  [asteroidName: string]: OrbitalData;
}

class NASAApiService {
  private baseUrl = 'http://localhost:8000'; // Call backend directly
  private nasaApiKey = process.env.NEXT_PUBLIC_NASA_API_KEY || 'DEMO_KEY';

  // Use local JSON files instead of API calls
  private useLocalData = true;

  constructor() {
    console.log('🔧 NASA API Service initialized:');
    console.log('  - Data source:', this.useLocalData ? 'LOCAL FILES (response-correct.json)' : 'BACKEND API');
    console.log('  - Backend URL:', this.baseUrl);
    console.log('  - NASA API Key:', this.nasaApiKey ? 'SET' : 'NOT SET');
  }

  // Convert orbital data to NASA API response format
  private convertOrbitalDataToNASAFormat(orbitalData: OrbitalDataResponse, startDate: string, endDate: string): NASAAPIResponse {
    const asteroidNames = Object.keys(orbitalData);
    const asteroids: NASAObject[] = [];

    asteroidNames.forEach((asteroidName, index) => {
      const orbitalInfo = orbitalData[asteroidName];

      // Generate synthetic asteroid data based on orbital parameters
      const asteroid: NASAObject = {
        links: {
          self: `http://api.nasa.gov/neo/rest/v1/neo/${index + 1}?api_key=${this.nasaApiKey}`
        },
        id: (index + 1).toString(),
        neo_reference_id: (index + 1).toString(),
        name: asteroidName,
        nasa_jpl_url: `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${index + 1}`,
        absolute_magnitude_h: this.estimateAbsoluteMagnitude(orbitalInfo),
        estimated_diameter: this.estimateDiameter(orbitalInfo),
        is_potentially_hazardous_asteroid: this.isPotentiallyHazardous(orbitalInfo),
        close_approach_data: this.generateCloseApproachData(orbitalInfo, startDate),
        is_sentry_object: false
      };

      asteroids.push(asteroid);
    });

    // Create NASA API response format
    return {
      links: {
        next: `http://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&detailed=true&api_key=${this.nasaApiKey}`,
        previous: `http://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&detailed=true&api_key=${this.nasaApiKey}`,
        self: `http://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&detailed=true&api_key=${this.nasaApiKey}`
      },
      element_count: asteroids.length,
      near_earth_objects: {
        [startDate]: asteroids
      }
    };
  }

  // Estimate absolute magnitude from orbital data
  private estimateAbsoluteMagnitude(orbitalInfo: OrbitalData): number {
    // Use semi-major axis and eccentricity to estimate magnitude
    const semiMajorAxis = parseFloat(orbitalInfo.semi_major_axis);
    const eccentricity = parseFloat(orbitalInfo.eccentricity);

    // Rough estimation: smaller orbits and higher eccentricity = brighter (lower magnitude)
    const baseMagnitude = 20 + (semiMajorAxis - 1) * 5;
    const eccentricityFactor = eccentricity * 2;

    return Math.max(15, Math.min(30, baseMagnitude - eccentricityFactor));
  }

  // Estimate diameter from orbital data
  private estimateDiameter(orbitalInfo: OrbitalData): { kilometers: { estimated_diameter_min: number; estimated_diameter_max: number }; meters: { estimated_diameter_min: number; estimated_diameter_max: number }; miles: { estimated_diameter_min: number; estimated_diameter_max: number }; feet: { estimated_diameter_min: number; estimated_diameter_max: number } } {
    // Use orbital period and eccentricity to estimate size
    const orbitalPeriod = parseFloat(orbitalInfo.orbital_period);
    const eccentricity = parseFloat(orbitalInfo.eccentricity);

    // Rough estimation: longer periods and higher eccentricity = larger objects
    const baseSizeKm = 0.1 + (orbitalPeriod / 1000) * 0.5 + eccentricity * 0.3;
    const minSizeKm = baseSizeKm * 0.7;
    const maxSizeKm = baseSizeKm * 1.3;

    return {
      kilometers: {
        estimated_diameter_min: minSizeKm,
        estimated_diameter_max: maxSizeKm
      },
      meters: {
        estimated_diameter_min: minSizeKm * 1000,
        estimated_diameter_max: maxSizeKm * 1000
      },
      miles: {
        estimated_diameter_min: minSizeKm * 0.621371,
        estimated_diameter_max: maxSizeKm * 0.621371
      },
      feet: {
        estimated_diameter_min: minSizeKm * 3280.84,
        estimated_diameter_max: maxSizeKm * 3280.84
      }
    };
  }

  // Determine if asteroid is potentially hazardous
  private isPotentiallyHazardous(orbitalInfo: OrbitalData): boolean {
    const perihelionDistance = parseFloat(orbitalInfo.perihelion_distance);
    const absoluteMagnitude = this.estimateAbsoluteMagnitude(orbitalInfo);

    // Potentially hazardous if: perihelion < 0.05 AU AND absolute magnitude < 22
    return perihelionDistance < 0.05 && absoluteMagnitude < 22;
  }

  // Generate synthetic close approach data
  private generateCloseApproachData(orbitalInfo: OrbitalData, startDate: string): CloseApproachData[] {
    const perihelionDistance = parseFloat(orbitalInfo.perihelion_distance);

    // Generate a close approach based on orbital parameters
    const missDistanceKm = perihelionDistance * 149597870.7; // Convert AU to km
    const relativeVelocity = 15 + Math.random() * 20; // Random velocity between 15-35 km/s

    return [{
      close_approach_date: startDate,
      close_approach_date_full: `${startDate} 12:00`,
      epoch_date_close_approach: new Date(startDate).getTime(),
      relative_velocity: {
        kilometers_per_second: relativeVelocity.toString(),
        kilometers_per_hour: (relativeVelocity * 3600).toString(),
        miles_per_hour: (relativeVelocity * 2236.94).toString()
      },
      miss_distance: {
        astronomical: perihelionDistance.toString(),
        lunar: (perihelionDistance * 384.4).toString(),
        kilometers: missDistanceKm.toString(),
        miles: (missDistanceKm * 0.621371).toString()
      },
      orbiting_body: "Earth"
    }];
  }

  async getNearEarthObjects(startDate: string, endDate: string): Promise<NASAAPIResponse> {
    try {
      if (this.useLocalData) {
        console.log('📁 Using imported feed.json data (developer mode)');
        console.log('📅 Requested date range:', startDate, 'to', endDate);

        // Use imported feed data directly
        console.log('✅ Feed data loaded from import!');
        console.log('📊 Feed data:', typeof feedData);
        console.log('📈 Element count:', feedData.element_count);
        console.log('📅 Date keys:', Object.keys(feedData.near_earth_objects || {}));
        console.log('🪨 Sample asteroids:', feedData.near_earth_objects ? Object.keys(feedData.near_earth_objects).map(date =>
          `${date}: ${(feedData.near_earth_objects as any)[date].length} asteroids`
        ) : 'No asteroids');

        return feedData as NASAAPIResponse;
      }

      // Original API call logic (kept as fallback)
      const url = `${this.baseUrl}/neo_data_all/?start_date=${startDate}&end_date=${endDate}`;
      console.log('Fetching NASA data directly from backend:', url);
      console.log('Calling backend directly at localhost:8000');
      console.log('⏱️ Request timeout set to 5 minutes (300 seconds)');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(300000) // 5 minute timeout
      });

      console.log('Local API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Local API error response:', errorText);
        console.error('🔍 Error details:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          headers: Object.fromEntries(response.headers.entries())
        });

        // Check for specific error types
        if (errorText.includes('API_KEY_INVALID')) {
          throw new Error('NASA API key is invalid. Please check your backend configuration.');
        } else if (response.status === 500) {
          throw new Error(`Backend server error (500): ${errorText}. Please check your backend logs.`);
        } else if (response.status === 404) {
          throw new Error(`API endpoint not found (404): ${url}. Please check your backend routes.`);
        } else if (response.status === 400) {
          throw new Error(`Bad request (400): ${errorText}. Please check the request parameters.`);
        }

        throw new Error(`Backend API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Local API response received successfully!');
      console.log('📊 Response data:', JSON.stringify(data, null, 2));
      console.log('📈 Element count:', data.element_count);
      console.log('📅 Date keys:', Object.keys(data.near_earth_objects || {}));
      if (data.near_earth_objects) {
        const firstDate = Object.keys(data.near_earth_objects)[0];
        if (firstDate && data.near_earth_objects[firstDate]) {
          console.log(`🪨 Asteroids for ${firstDate}:`, data.near_earth_objects[firstDate].length);
          if (data.near_earth_objects[firstDate].length > 0) {
            console.log('🔍 First asteroid sample:', JSON.stringify(data.near_earth_objects[firstDate][0], null, 2));
          }
        }
      }
      return data;
    } catch (error) {
      console.error('Error fetching NASA data:', error);

      // If it's a network error (backend not running), provide helpful message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to backend API at localhost:8000. Please ensure your backend server is running.');
      }

      // If it's a timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request to backend API timed out after 5 minutes. Please check if your backend is responding.');
      }

      throw error;
    }
  }

  async getAsteroidDetails(asteroidId: string): Promise<NASAObject> {
    try {
      if (this.useLocalData) {
        console.log('📁 Using imported feed.json data (developer mode)');
        console.log('🪨 Requested asteroid ID:', asteroidId);

        // Use imported feed data directly
        console.log('✅ Feed data loaded from import!');
        console.log('📊 Feed data:', typeof feedData);
        console.log('📈 Element count:', feedData.element_count);

        // Find the asteroid by ID in the feed data
        let foundAsteroid: NASAObject | null = null;

        // Search through all dates in the feed data
        for (const date of Object.keys(feedData.near_earth_objects)) {
          const asteroids = (feedData.near_earth_objects as any)[date];
          const asteroid = asteroids.find((ast: any) => ast.id === asteroidId);
          if (asteroid) {
            foundAsteroid = asteroid;
            break;
          }
        }

        if (foundAsteroid) {
          // Get orbital data for this asteroid if available
          const orbitalInfo = (orbitalData as OrbitalDataResponse)[foundAsteroid.name];
          if (orbitalInfo) {
            (foundAsteroid as any).orbital_data = orbitalInfo;
          }

          console.log('🪨 Asteroid found:', foundAsteroid.id);
          console.log('📊 Asteroid data:', JSON.stringify(foundAsteroid, null, 2));
          console.log('🏷️ Asteroid name:', foundAsteroid.name);
          console.log('⚠️ Potentially hazardous:', foundAsteroid.is_potentially_hazardous_asteroid);
          console.log('📏 Diameter range:', foundAsteroid.estimated_diameter?.meters ?
            `${foundAsteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(0)}-${foundAsteroid.estimated_diameter.meters.estimated_diameter_max.toFixed(0)}m` : 'N/A');
          console.log('🌟 Absolute magnitude:', foundAsteroid.absolute_magnitude_h);
          if (foundAsteroid.close_approach_data && foundAsteroid.close_approach_data.length > 0) {
            console.log('🚀 Close approach data:', JSON.stringify(foundAsteroid.close_approach_data[0], null, 2));
          }
          return foundAsteroid;
        } else {
          throw new Error(`Asteroid with ID ${asteroidId} not found in feed data`);
        }
      }

      // Original API call logic (kept as fallback)
      const url = `${this.baseUrl}/neo_data_one/${asteroidId}`;
      console.log('Fetching asteroid details directly from backend:', url);
      console.log('⏱️ Request timeout set to 5 minutes (300 seconds)');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(300000) // 5 minute timeout
      });

      console.log('Local API response:', response);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Local API error response:', errorText);
        console.error('🔍 Error details:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          headers: Object.fromEntries(response.headers.entries())
        });

        // Check for specific error types
        if (errorText.includes('API_KEY_INVALID')) {
          throw new Error('NASA API key is invalid. Please check your backend configuration.');
        } else if (response.status === 500) {
          throw new Error(`Backend server error (500): ${errorText}. Please check your backend logs.`);
        } else if (response.status === 404) {
          throw new Error(`API endpoint not found (404): ${url}. Please check your backend routes.`);
        } else if (response.status === 400) {
          throw new Error(`Bad request (400): ${errorText}. Please check the request parameters.`);
        }

        throw new Error(`Backend API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Asteroid details response received successfully!');
      console.log('🪨 Asteroid ID:', asteroidId);
      console.log('📊 Asteroid data:', JSON.stringify(data, null, 2));
      console.log('🏷️ Asteroid name:', data.name);
      console.log('⚠️ Potentially hazardous:', data.is_potentially_hazardous_asteroid);
      console.log('📏 Diameter range:', data.estimated_diameter?.meters ?
        `${data.estimated_diameter.meters.estimated_diameter_min.toFixed(0)}-${data.estimated_diameter.meters.estimated_diameter_max.toFixed(0)}m` : 'N/A');
      console.log('🌟 Absolute magnitude:', data.absolute_magnitude_h);
      if (data.close_approach_data && data.close_approach_data.length > 0) {
        console.log('🚀 Close approach data:', JSON.stringify(data.close_approach_data[0], null, 2));
      }
      return data;
    } catch (error) {
      console.error('Error fetching asteroid details:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to local backend API at localhost:8000. Please ensure your backend server is running.');
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request to local API timed out. Please check if your backend is responding.');
      }

      throw error;
    }
  }

  // Health check removed - using local JSON files

  // Test local API with a known working date
  async testNASAAPI(): Promise<boolean> {
    try {
      // Use a known working date from the example data you provided
      const testDate = '2015-09-08';
      console.log('🧪 Testing local API with date:', testDate);
      console.log('🔗 Testing URL:', `${this.baseUrl}/neo_data_all/?start_date=${testDate}&end_date=${testDate}`);

      const response = await this.getNearEarthObjects(testDate, testDate);
      console.log('✅ Local API test successful!');
      console.log('📊 Test results:');
      console.log('  - Element count:', response.element_count);
      console.log('  - Response structure:', Object.keys(response));
      console.log('  - Near earth objects keys:', Object.keys(response.near_earth_objects || {}));
      if (response.near_earth_objects && Object.keys(response.near_earth_objects).length > 0) {
        const firstDate = Object.keys(response.near_earth_objects)[0];
        const asteroids = response.near_earth_objects[firstDate];
        console.log(`  - Asteroids for ${firstDate}:`, asteroids.length);
        if (asteroids.length > 0) {
          console.log('  - Sample asteroid:', {
            id: asteroids[0].id,
            name: asteroids[0].name,
            hazardous: asteroids[0].is_potentially_hazardous_asteroid,
            diameter: asteroids[0].estimated_diameter?.meters
          });
        }
      }
      return true;
    } catch (error) {
      console.error('❌ Local API test failed:', error);
      console.error('🔍 Test error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return false;
    }
  }

  // Get asteroids for custom date range
  async getAsteroidsForDateRange(startDate: string, endDate: string): Promise<NASAAPIResponse> {
    console.log('📅 Requesting NASA data for custom date range:', startDate, 'to', endDate);

    try {
      const response = await this.getNearEarthObjects(startDate, endDate);
      console.log('✅ Custom date range request successful!');
      console.log('📊 Date range results:');
      console.log('  - Start date:', startDate);
      console.log('  - End date:', endDate);
      console.log('  - Total asteroids:', response.element_count);
      console.log('  - Available dates:', Object.keys(response.near_earth_objects || {}));
      return response;
    } catch (error) {
      console.log('⚠️ Custom date range failed, trying single day fallback...');
      console.log('🔄 Fallback: Using single day', startDate);
      console.log('Error details:', error);
      // Fallback to single day if range fails
      const fallbackResponse = await this.getNearEarthObjects(startDate, startDate);
      console.log('✅ Single day fallback successful!');
      console.log('📊 Fallback results:', fallbackResponse.element_count, 'asteroids');
      return fallbackResponse;
    }
  }

  // Get current week's asteroids
  async getCurrentWeekAsteroids(): Promise<NASAAPIResponse> {
    const today = new Date();
    // Get the current week
    const startDate = new Date(today);
    const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('📅 Getting current week asteroids:');
    console.log('  - Today:', today.toISOString().split('T')[0]);
    console.log('  - Start date:', startDateStr);
    console.log('  - End date:', endDateStr);
    console.log('  - Date range:', `${startDateStr} to ${endDateStr}`);

    const response = await this.getAsteroidsForDateRange(startDateStr, endDateStr);
    console.log('✅ Current week asteroids loaded successfully!');
    return response;
  }

  // Get asteroids per object (alternative endpoint) - returns orbital data
  async getAsteroidsPerObject(startDate: string, endDate: string): Promise<OrbitalDataResponse> {
    try {
      if (this.useLocalData) {
        console.log('📁 Using imported response-correct.json for orbital data (developer mode)');
        console.log('📅 Requested date range:', startDate, 'to', endDate);

        // Use imported orbital data directly
        console.log('✅ Orbital data loaded from import!');
        console.log('📊 Orbital data structure:', typeof orbitalData);
        console.log('🔑 Asteroid names with orbital data:', Object.keys(orbitalData));
        console.log('📈 Number of asteroids with orbital data:', Object.keys(orbitalData).length);

        // Log sample orbital data
        const firstAsteroidName = Object.keys(orbitalData)[0];
        if (firstAsteroidName && (orbitalData as OrbitalDataResponse)[firstAsteroidName]) {
          const sampleData = (orbitalData as OrbitalDataResponse)[firstAsteroidName];
          console.log(`🪨 Sample orbital data for "${firstAsteroidName}":`, {
            orbit_class: sampleData.orbit_class?.orbit_class_type,
            orbit_class_description: sampleData.orbit_class?.orbit_class_description,
            eccentricity: sampleData.eccentricity,
            semi_major_axis: sampleData.semi_major_axis,
            inclination: sampleData.inclination,
            orbital_period: sampleData.orbital_period,
            perihelion_distance: sampleData.perihelion_distance,
            aphelion_distance: sampleData.aphelion_distance,
            orbit_uncertainty: sampleData.orbit_uncertainty,
            observations_used: sampleData.observations_used
          });
        }

        return orbitalData as OrbitalDataResponse;
      }

      // Original API call logic (kept as fallback)
      const url = `${this.baseUrl}/neo_data_per_object/?start_date=${startDate}&end_date=${endDate}`;
      console.log('Fetching asteroids per object directly from backend:', url);
      console.log('⏱️ Request timeout set to 5 minutes (300 seconds)');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(300000) // 5 minute timeout
      });

      console.log('Local API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Local API error response:', errorText);
        console.error('🔍 Error details:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          headers: Object.fromEntries(response.headers.entries())
        });

        // Check for specific error types
        if (errorText.includes('API_KEY_INVALID')) {
          throw new Error('NASA API key is invalid. Please check your backend configuration.');
        } else if (response.status === 500) {
          throw new Error(`Backend server error (500): ${errorText}. Please check your backend logs.`);
        } else if (response.status === 404) {
          throw new Error(`API endpoint not found (404): ${url}. Please check your backend routes.`);
        } else if (response.status === 400) {
          throw new Error(`Bad request (400): ${errorText}. Please check the request parameters.`);
        }

        throw new Error(`Backend API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Orbital data response received successfully!');
      console.log('📊 Orbital data structure:', typeof data);
      console.log('🔑 Asteroid names with orbital data:', Object.keys(data));
      console.log('📈 Number of asteroids with orbital data:', Object.keys(data).length);

      if (Object.keys(data).length > 0) {
        const firstAsteroidName = Object.keys(data)[0];
        const firstOrbitalData = data[firstAsteroidName];
        console.log(`🪨 Sample orbital data for "${firstAsteroidName}":`, {
          orbit_class: firstOrbitalData.orbit_class?.orbit_class_type,
          orbit_class_description: firstOrbitalData.orbit_class?.orbit_class_description,
          eccentricity: firstOrbitalData.eccentricity,
          semi_major_axis: firstOrbitalData.semi_major_axis,
          inclination: firstOrbitalData.inclination,
          orbital_period: firstOrbitalData.orbital_period,
          perihelion_distance: firstOrbitalData.perihelion_distance,
          aphelion_distance: firstOrbitalData.aphelion_distance,
          orbit_uncertainty: firstOrbitalData.orbit_uncertainty,
          observations_used: firstOrbitalData.observations_used
        });
        console.log('🔍 Full orbital data sample:', JSON.stringify(firstOrbitalData, null, 2));
      }

      return data;
    } catch (error) {
      console.error('Error fetching asteroids per object:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to local backend API at localhost:8000. Please ensure your backend server is running.');
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request to local API timed out. Please check if your backend is responding.');
      }

      throw error;
    }
  }

  // Get comprehensive asteroid data (both standard NASA data and orbital data)
  async getComprehensiveAsteroidData(startDate: string, endDate: string): Promise<{
    standardData: NASAAPIResponse;
    orbitalData: OrbitalDataResponse;
  }> {
    console.log('🔄 Fetching comprehensive asteroid data...');
    console.log('📅 Date range:', startDate, 'to', endDate);
    console.log('⏱️ Request timeout set to 5 minutes (300 seconds) for each API call');

    try {
      // Fetch both datasets in parallel
      const [standardData, orbitalData] = await Promise.all([
        this.getNearEarthObjects(startDate, endDate),
        this.getAsteroidsPerObject(startDate, endDate)
      ]);

      console.log('✅ Comprehensive data fetched successfully!');
      console.log('📊 Standard data:', {
        element_count: standardData.element_count,
        dates: Object.keys(standardData.near_earth_objects || {})
      });
      console.log('🪨 Orbital data:', {
        asteroid_count: Object.keys(orbitalData).length,
        asteroid_names: Object.keys(orbitalData)
      });

      return {
        standardData,
        orbitalData
      };
    } catch (error) {
      console.error('❌ Error fetching comprehensive asteroid data:', error);
      throw error;
    }
  }
}

export const nasaApiService = new NASAApiService();
