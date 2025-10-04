import * as THREE from 'three';

// Planetary elements type
interface PlanetaryElements {
  name: string;
  color: string;
  size: number;
  a: number[];
  e: number[];
  I: number[];
  L: number[];
  w_bar: number[];
  Omega: number[];
  hasRings?: boolean;
  epoch?: number;
  meanMotion?: number;
}

// Keplerian orbital mechanics functions
export function calculateKeplerianPosition(elements: PlanetaryElements, julianDate: number) {
  // Check if this is an asteroid with epoch and mean motion data
  if (elements.epoch && elements.meanMotion) {
    return calculateAsteroidPosition(elements, julianDate);
  }
  
  // Calculate centuries past J2000.0 for planets
  const T = (julianDate - 2451545.0) / 36525.0;
  
  // Compute orbital elements for current time
  const a = elements.a[0] + elements.a[1] * T;           // semi-major axis (AU)
  const e = elements.e[0] + elements.e[1] * T;           // eccentricity
  const I = elements.I[0] + elements.I[1] * T;           // inclination (degrees)
  const L = elements.L[0] + elements.L[1] * T;           // mean longitude (degrees)
  const w_bar = elements.w_bar[0] + elements.w_bar[1] * T; // longitude of perihelion (degrees)
  const Omega = elements.Omega[0] + elements.Omega[1] * T; // longitude of ascending node (degrees)
  
  // Compute argument of perihelion and mean anomaly
  const omega = w_bar - Omega;  // argument of perihelion
  const M = L - w_bar;          // mean anomaly
  
  // Normalize mean anomaly to [-180, 180] degrees
  const M_norm = ((M % 360) + 540) % 360 - 180;
  
  // Solve Kepler's equation for eccentric anomaly E
  const E = solveKeplersEquation(M_norm, e);
  
  // Compute position in orbital plane
  const x_prime = a * (Math.cos(E * Math.PI / 180) - e);
  const y_prime = a * Math.sqrt(1 - e * e) * Math.sin(E * Math.PI / 180);
  const z_prime = 0;
  
  // Convert to 3D coordinates in J2000 ecliptic frame
  const position = transformToEcliptic(x_prime, y_prime, z_prime, omega, I, Omega);
  
  return {
    x: position.x,
    y: position.z, // Use Z as Y for 3D visualization
    z: -position.y, // Negative to make counterclockwise motion (correct orbital direction)
    distance: Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z)
  };
}

// New function for asteroid orbital calculations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateAsteroidPosition(elements: any, julianDate: number) {
  // Calculate time since epoch in days
  const timeSinceEpoch = julianDate - elements.epoch;
  
  // Get orbital elements
  const a = elements.a[0];           // semi-major axis (AU)
  const e = elements.e[0];           // eccentricity
  const I = elements.I[0];           // inclination (degrees)
  const Omega = elements.Omega[0];   // longitude of ascending node (degrees)
  const w_bar = elements.w_bar[0];   // longitude of perihelion (degrees)
  const L_epoch = elements.L[0];     // mean longitude at epoch (degrees)
  const meanMotion = elements.meanMotion; // degrees per day
  
  // Calculate current mean longitude using mean motion
  const L_current = L_epoch + (meanMotion * timeSinceEpoch);
  
  // Compute argument of perihelion and mean anomaly
  const omega = w_bar - Omega;        // argument of perihelion
  const M_current = L_current - w_bar; // current mean anomaly
  
  // Normalize mean anomaly to [-180, 180] degrees
  const M_norm = ((M_current % 360) + 540) % 360 - 180;
  
  // Solve Kepler's equation for eccentric anomaly E
  const E = solveKeplersEquation(M_norm, e);
  
  // Compute position in orbital plane
  const x_prime = a * (Math.cos(E * Math.PI / 180) - e);
  const y_prime = a * Math.sqrt(1 - e * e) * Math.sin(E * Math.PI / 180);
  const z_prime = 0;
  
  // Convert to 3D coordinates in J2000 ecliptic frame
  const position = transformToEcliptic(x_prime, y_prime, z_prime, omega, I, Omega);
  
  const result = {
    x: position.x,
    y: position.z, // Use Z as Y for 3D visualization
    z: -position.y, // Negative to make counterclockwise motion (correct orbital direction)
    distance: Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z)
  };
  
  return result;
}

function solveKeplersEquation(M_deg: number, e: number): number {
  const M = M_deg * Math.PI / 180; // Convert to radians
  const e_star = 57.29578 * e;     // e in degrees
  
  let E = M + e * Math.sin(M);     // Initial guess
  
  // Newton-Raphson iteration
  for (let i = 0; i < 10; i++) {
    const deltaM = M - (E - e * Math.sin(E));
    const deltaE = deltaM / (1 - e * Math.cos(E));
    E = E + deltaE;
    
    if (Math.abs(deltaE) < 1e-8) break; // Convergence tolerance
  }
  
  return E * 180 / Math.PI; // Convert back to degrees
}

function transformToEcliptic(x: number, y: number, z: number, omega: number, I: number, Omega: number) {
  // Convert angles to radians
  const omega_rad = omega * Math.PI / 180;
  const I_rad = I * Math.PI / 180;
  const Omega_rad = Omega * Math.PI / 180;
  
  // Rotation matrices: Rz(-Ω) * Rx(-I) * Rz(-ω)
  const cos_omega = Math.cos(omega_rad);
  const sin_omega = Math.sin(omega_rad);
  const cos_I = Math.cos(I_rad);
  const sin_I = Math.sin(I_rad);
  const cos_Omega = Math.cos(Omega_rad);
  const sin_Omega = Math.sin(Omega_rad);
  
  // Transform to ecliptic coordinates
  const x_ecl = (cos_omega * cos_Omega - sin_omega * sin_Omega * cos_I) * x +
                (-sin_omega * cos_Omega - cos_omega * sin_Omega * cos_I) * y;
                
  const y_ecl = (cos_omega * sin_Omega + sin_omega * cos_Omega * cos_I) * x +
                (-sin_omega * sin_Omega + cos_omega * cos_Omega * cos_I) * y;
                
  const z_ecl = (sin_omega * sin_I) * x + (cos_omega * sin_I) * y;
  
  return { x: x_ecl, y: y_ecl, z: z_ecl };
}

// Generate orbital trajectory points
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateOrbitPoints(elements: any, numPoints: number = 100) {
  const points: THREE.Vector3[] = [];
  const T = 0; // Use current epoch for orbit shape
  
  // Current orbital elements
  const a = elements.a[0] + elements.a[1] * T;
  const e = elements.e[0] + elements.e[1] * T;
  const I = elements.I[0] + elements.I[1] * T;
  const w_bar = elements.w_bar[0] + elements.w_bar[1] * T;
  const Omega = elements.Omega[0] + elements.Omega[1] * T;
  const omega = w_bar - Omega;
  
  for (let i = 0; i <= numPoints; i++) {
    const E = (i / numPoints) * 2 * Math.PI; // Eccentric anomaly from 0 to 2π
    
    // Position in orbital plane
    const x_prime = a * (Math.cos(E) - e);
    const y_prime = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const z_prime = 0;
    
    // Transform to ecliptic coordinates
    const position = transformToEcliptic(x_prime, y_prime, z_prime, omega, I, Omega);
    
    // Scale for visualization (1 AU = 4 units) with correct orbital direction
    points.push(new THREE.Vector3(
      position.x * 4,
      position.z * 4, // Use Z as Y for 3D visualization
      -position.y * 4  // Negative to make counterclockwise motion (correct orbital direction)
    ));
  }
  
  return points;
}
