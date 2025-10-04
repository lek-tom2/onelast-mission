import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

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

export interface NEODataResponse {
  [objectName: string]: NEOOrbitalData;
}

export const getNeoDataAll = async (startDate: string, endDate: string) => {
  const response = await axios.get(`${BASE_URL}/neo_data_all/`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return response.data;
};

export const getNeoDataOne = async (neoId: number) => {
  const response = await axios.get(`${BASE_URL}/neo_data_one/${neoId}`);
  return response.data;
};

export const getNeoDataPerObject = async (startDate: string, endDate: string): Promise<NEODataResponse> => {
  const response = await axios.get(`${BASE_URL}/neo_data_per_object/`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return response.data;
};
