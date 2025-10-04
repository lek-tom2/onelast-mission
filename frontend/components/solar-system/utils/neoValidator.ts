import { calculateKeplerianPosition } from './orbitalMechanics';
import { PLANETARY_ELEMENTS } from '../constants/planetaryElements';

// Function to calculate distance between two 3D points
function calculateDistance(pos1: { x: number, y: number, z: number }, pos2: { x: number, y: number, z: number }) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Function to convert AU to kilometers
function auToKm(au: number) {
  return au * 149597870.7; // 1 AU = 149,597,870.7 km
}

// Function to validate NEO positions against close approach data
export function validateNEOPositions(neoObjects: any[], julianDate: number) {
  console.log(`🔍 Validating NEO positions for Julian Date: ${julianDate}`);
  
  // Calculate Earth's position
  const earthPosition = calculateKeplerianPosition(PLANETARY_ELEMENTS.earth, julianDate);
  console.log(`🌍 Earth position: x=${earthPosition.x.toFixed(3)}, y=${earthPosition.y.toFixed(3)}, z=${earthPosition.z.toFixed(3)}`);
  
  const currentDate = new Date((julianDate - 2440587.5) * 86400000);
  const currentDateStr = currentDate.toISOString().split('T')[0];
  
  console.log(`📅 Current simulation date: ${currentDateStr}`);
  
  neoObjects.forEach((neo, index) => {
    if (index > 5) return; // Limit to first 5 NEOs for debugging
    
    // Calculate NEO position
    const neoPosition = calculateKeplerianPosition(neo.orbitalElements, julianDate);
    
    // Calculate distance to Earth in our simulation
    const simulationDistance = calculateDistance(neoPosition, earthPosition);
    const simulationDistanceKm = auToKm(simulationDistance);
    
    console.log(`\n☄️ NEO: ${neo.name}`);
    console.log(`   Position: x=${neoPosition.x.toFixed(3)}, y=${neoPosition.y.toFixed(3)}, z=${neoPosition.z.toFixed(3)}`);
    console.log(`   Distance to Earth (simulation): ${simulationDistance.toFixed(4)} AU (${(simulationDistanceKm/1000000).toFixed(2)} million km)`);
    
    // Check close approach data
    if (neo.closestApproach) {
      const approachDate = neo.closestApproach.date;
      const approachDistanceKm = parseFloat(neo.closestApproach.distance) * 149597870.7; // Convert AU to km
      
      console.log(`   Close approach date: ${approachDate}`);
      console.log(`   Expected close distance: ${neo.closestApproach.distance} AU (${(approachDistanceKm/1000000).toFixed(2)} million km)`);
      
      // Check if current date matches approach date
      if (approachDate === currentDateStr) {
        const distanceDifference = Math.abs(simulationDistanceKm - approachDistanceKm);
        const relativeError = (distanceDifference / approachDistanceKm) * 100;
        
        console.log(`   ⚠️ CLOSE APPROACH TODAY!`);
        console.log(`   Distance difference: ${(distanceDifference/1000000).toFixed(2)} million km`);
        console.log(`   Relative error: ${relativeError.toFixed(1)}%`);
        
        if (relativeError > 50) {
          console.log(`   🔴 HIGH ERROR - Position may be incorrect!`);
        } else if (relativeError > 20) {
          console.log(`   🟡 MODERATE ERROR - Check orbital elements`);
        } else {
          console.log(`   🟢 GOOD - Position looks correct`);
        }
      }
    }
  });
}
