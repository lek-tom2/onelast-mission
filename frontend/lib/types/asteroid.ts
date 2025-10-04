import * as THREE from 'three';

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

export interface ImpactScenario {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  city: string;
  asteroidSize: number; // meters
  energy: number; // megatons
  casualties: number;
  tsunami: boolean;
  blastRadius: number; // km
  craterSize: number; // km
  trajectory?: AsteroidTrajectory;
  consequences?: ImpactConsequences;
  nasaData?: any; // NASA API data
  orbitalData?: OrbitalData; // Orbital mechanics data
  collisionProbability?: number; // 0-1
}


export interface AsteroidTrajectory {
  points: THREE.Vector3[];
  approachAngle: number;
  velocity: number; // km/s
  timeToImpact: number; // days
  closestApproach: number; // km from Earth
}


export interface ImpactConsequences {
  immediateBlast: {
    radius: number; // km
    fatalities: number;
  };
  thermalRadiation: {
    radius: number; // km
    fatalities: number;
  };
  seismicEffects: {
    magnitude: number;
    radius: number; // km
  };
  tsunami?: {
    height: number; // meters
    affectedCoastlines: string[];
  };
  atmosphericEffects: {
    dustCloud: boolean;
    climateChange: boolean;
    nuclearWinter: boolean;
  };
}

export interface Asteroid {
  id: string;
  name: string;
  size: number; // meters
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  composition: 'rock' | 'metal' | 'ice' | 'mixed';
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  closestApproach?: {
    date: Date;
    distance: number; // km
  };
}

export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  zoom: number;
  mode: 'earth' | 'solar-system' | 'scenario';
}
