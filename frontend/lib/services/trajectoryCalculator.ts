import { NASAObject, CloseApproachData } from './nasaApi';
import * as THREE from 'three';

export interface TrajectoryData {
  points: THREE.Vector3[];
  approachAngle: number;
  velocity: number; // km/s
  timeToImpact: number; // days
  closestApproach: number; // km from Earth
  collisionProbability: number; // 0-1
  impactEnergy: number; // megatons
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

class TrajectoryCalculator {
  private earthRadius = 6371; // km
  private earthMass = 5.972e24; // kg
  private gravitationalConstant = 6.674e-11; // m³/kg/s²

  calculateTrajectory(nasaObject: NASAObject): TrajectoryData {
    const approachData = nasaObject.close_approach_data[0];
    const diameter = (nasaObject.estimated_diameter.meters.estimated_diameter_min + 
                     nasaObject.estimated_diameter.meters.estimated_diameter_max) / 2;
    
    // Convert NASA data to our format
    const velocity = parseFloat(approachData.relative_velocity.kilometers_per_second);
    const missDistance = parseFloat(approachData.miss_distance.kilometers);
    const approachDate = new Date(approachData.close_approach_date);
    const now = new Date();
    const timeToImpact = Math.max(0, (approachDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate approach angle (simplified)
    const approachAngle = this.calculateApproachAngle(velocity, missDistance);
    
    // Generate trajectory points
    const points = this.generateTrajectoryPoints(approachAngle, missDistance, velocity);
    
    // Calculate collision probability
    const collisionProbability = this.calculateCollisionProbability(missDistance, diameter, velocity);
    
    // Calculate impact energy
    const impactEnergy = this.calculateImpactEnergy(diameter, velocity);
    
    return {
      points,
      approachAngle,
      velocity,
      timeToImpact,
      closestApproach: missDistance,
      collisionProbability,
      impactEnergy
    };
  }

  private calculateApproachAngle(velocity: number, missDistance: number): number {
    // Simplified approach angle calculation
    const earthRadiusKm = 6371;
    const gravitationalInfluence = earthRadiusKm * 10; // 10x Earth radius
    
    if (missDistance < gravitationalInfluence) {
      return Math.random() * 60 + 15; // 15-75 degrees for close approaches
    }
    
    return Math.random() * 30 + 5; // 5-35 degrees for distant approaches
  }

  private generateTrajectoryPoints(approachAngle: number, missDistance: number, velocity: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const steps = 20;
    const startDistance = Math.max(missDistance * 2, 100000); // Start from 100,000 km or 2x miss distance
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const currentDistance = startDistance * (1 - t) + missDistance * t;
      
      // Convert to 3D coordinates (simplified orbital mechanics)
      const x = currentDistance * Math.cos(approachAngle * Math.PI / 180) / 100000; // Scale down
      const y = currentDistance * Math.sin(approachAngle * Math.PI / 180) / 100000;
      const z = (Math.random() - 0.5) * 0.1; // Add some randomness
      
      points.push(new THREE.Vector3(x, y, z));
    }
    
    return points;
  }

  private calculateCollisionProbability(missDistance: number, diameter: number, velocity: number): number {
    const earthRadiusKm = 6371;
    const asteroidRadiusKm = diameter / 2000; // Convert meters to km, divide by 2 for radius
    
    // If miss distance is less than Earth radius + asteroid radius, collision is certain
    if (missDistance <= earthRadiusKm + asteroidRadiusKm) {
      return 1.0;
    }
    
    // Calculate probability based on gravitational focusing and uncertainty
    const gravitationalFocusing = 1 + (2 * this.earthMass * this.gravitationalConstant) / 
                                 (missDistance * 1000 * velocity * 1000 * velocity * 1000);
    
    const uncertaintyFactor = Math.min(1, asteroidRadiusKm / (missDistance / 1000));
    
    return Math.min(1, gravitationalFocusing * uncertaintyFactor * 0.1); // Scale down for realism
  }

  private calculateImpactEnergy(diameter: number, velocity: number): number {
    // Assume density of 3000 kg/m³ (typical for rocky asteroids)
    const density = 3000; // kg/m³
    const radius = diameter / 2; // meters
    const volume = (4/3) * Math.PI * Math.pow(radius, 3); // m³
    const mass = density * volume; // kg
    
    // Kinetic energy = 0.5 * mass * velocity²
    const velocityMs = velocity * 1000; // Convert km/s to m/s
    const kineticEnergyJoules = 0.5 * mass * Math.pow(velocityMs, 2);
    
    // Convert to megatons TNT (1 megaton = 4.184e15 joules)
    const megatons = kineticEnergyJoules / (4.184e15);
    
    return megatons;
  }

  calculateImpactConsequences(trajectoryData: TrajectoryData, nasaObject: NASAObject): ImpactConsequences {
    const energy = trajectoryData.impactEnergy;
    const diameter = (nasaObject.estimated_diameter.meters.estimated_diameter_min + 
                     nasaObject.estimated_diameter.meters.estimated_diameter_max) / 2;
    
    // More realistic blast radius calculations based on nuclear weapon scaling
    // R = 0.28 * E^(1/3) where E is in kilotons, R in km
    // Convert megatons to kilotons: 1 MT = 1000 kT
    const energyKiloton = energy * 1000;
    const immediateBlastRadius = 0.28 * Math.pow(energyKiloton, 1/3); // km
    
    // Thermal radiation radius is typically 2-3x the blast radius
    const thermalRadius = immediateBlastRadius * 2.5; // km
    
    // Seismic effects can extend much further, typically 10-20x blast radius
    const seismicRadius = immediateBlastRadius * 15; // km
    
    // Calculate fatalities (simplified model)
    const immediateFatalities = Math.min(50000000, energy * 10000); // Cap at 50M
    const thermalFatalities = Math.min(20000000, energy * 5000);
    
    // Seismic magnitude
    const seismicMagnitude = Math.min(10, 4 + Math.log10(energy));
    
    // Tsunami for ocean impacts (simplified)
    const tsunami = energy > 100 ? {
      height: Math.min(100, energy / 10),
      affectedCoastlines: ['Global Coastlines']
    } : undefined;
    
    // Atmospheric effects
    const atmosphericEffects = {
      dustCloud: energy > 50,
      climateChange: energy > 200,
      nuclearWinter: energy > 1000
    };
    
    return {
      immediateBlast: {
        radius: Math.round(immediateBlastRadius * 1000) / 1000, // Round to 3 decimal places
        fatalities: immediateFatalities
      },
      thermalRadiation: {
        radius: Math.round(thermalRadius * 1000) / 1000,
        fatalities: thermalFatalities
      },
      seismicEffects: {
        magnitude: seismicMagnitude,
        radius: Math.round(seismicRadius * 1000) / 1000
      },
      tsunami,
      atmosphericEffects
    };
  }

  // Convert NASA object to our ImpactScenario format
  convertToImpactScenario(nasaObject: NASAObject, targetCity: { lat: number; lng: number; name: string }): any {
    const trajectoryData = this.calculateTrajectory(nasaObject);
    const consequences = this.calculateImpactConsequences(trajectoryData, nasaObject);
    
    const diameter = (nasaObject.estimated_diameter.meters.estimated_diameter_min + 
                     nasaObject.estimated_diameter.meters.estimated_diameter_max) / 2;
    
    // Deep clone the NASA object to avoid reference issues
    const nasaDataClone = JSON.parse(JSON.stringify(nasaObject));
    
    return {
      id: nasaObject.id,
      name: `${nasaObject.name} Impact`,
      position: targetCity,
      city: targetCity.name,
      asteroidSize: diameter,
      energy: trajectoryData.impactEnergy,
      casualties: consequences.immediateBlast.fatalities + consequences.thermalRadiation.fatalities,
      tsunami: !!consequences.tsunami,
      blastRadius: consequences.immediateBlast.radius,
      craterSize: Math.pow(trajectoryData.impactEnergy, 0.33),
      trajectory: trajectoryData,
      consequences,
      nasaData: nasaDataClone,
      collisionProbability: trajectoryData.collisionProbability
    };
  }
}

export const trajectoryCalculator = new TrajectoryCalculator();
