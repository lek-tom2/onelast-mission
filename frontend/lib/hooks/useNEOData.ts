import { useState, useEffect } from 'react';
import { convertNASADataToNEO } from '../utils/neoDataConverter';
import { NEOObject } from '@/components/solar-system/utils';
import feedData from '@/components/solar-system/feed.json';
import singleNeoData from '@/components/solar-system/3427459.json';

export function useNEOData() {
  const [neoObjects, setNeoObjects] = useState<NEOObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNEOData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading NEO data from feed...');
      
      const allNEOs: NEOObject[] = [];
      
      // Process all NEO objects from feed.json
      Object.entries(feedData.near_earth_objects).forEach(([date, neos]) => {
        console.log(`Processing ${neos.length} NEOs for date ${date}`);
        
        neos.forEach((neo: any) => {
          // Create simplified orbital data from the feed data
          // Since feed doesn't have full orbital elements, we'll use approximations
          const simplifiedOrbitalData = {
            orbit_id: '0',
            orbit_determination_date: date,
            first_observation_date: date,
            last_observation_date: date,
            data_arc_in_days: 1,
            observations_used: 1,
            orbit_uncertainty: '0',
            minimum_orbit_intersection: neo.close_approach_data[0]?.miss_distance?.astronomical || '0.1',
            jupiter_tisserand_invariant: '5.0',
            epoch_osculation: '2461000.5',
            eccentricity: '0.2', // Default values since feed doesn't have these
            semi_major_axis: '1.0',
            inclination: '10.0',
            ascending_node_longitude: Math.random() * 360 + '', // Random for distribution
            orbital_period: '365.0',
            perihelion_distance: '0.8',
            perihelion_argument: Math.random() * 360 + '',
            aphelion_distance: '1.2',
            perihelion_time: '2461000.5',
            mean_anomaly: Math.random() * 360 + '',
            mean_motion: '1.0',
            equinox: 'J2000',
            orbit_class: {
              orbit_class_type: neo.is_potentially_hazardous_asteroid ? 'PHO' : 'NEO',
              orbit_class_description: 'Near-Earth Object',
              orbit_class_range: 'a < 1.3 AU'
            }
          };
          
          const convertedNEO = convertNASADataToNEO(neo.name, simplifiedOrbitalData);
          // Override hazardous status from feed data
          convertedNEO.hazardous = neo.is_potentially_hazardous_asteroid;
          allNEOs.push(convertedNEO);
        });
      });
      
      // Also add the detailed single NEO object
      const detailedNEO = convertNASADataToNEO(singleNeoData.name, singleNeoData.orbital_data);
      allNEOs.push(detailedNEO);
      
      setNeoObjects(allNEOs);
      setLastUpdated(new Date());
      console.log(`Successfully loaded ${allNEOs.length} NEO objects`);
      
    } catch (err) {
      console.error('Failed to load NEO data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load NEO data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on component mount
  useEffect(() => {
    fetchNEOData();
  }, []);

  return {
    neoObjects,
    loading,
    error,
    lastUpdated,
    refetch: fetchNEOData
  };
}
