import * as THREE from 'three';

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
