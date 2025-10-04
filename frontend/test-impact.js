// Simple test to debug impact calculation
const fs = require('fs');

// Test data from 3427459.json
const testNEO = {
  name: "(2008 SS)",
  color: "#FFA500",
  size: 0.02,
  orbitalElements: {
    a: [0.9285116827289324, 0],
    e: [0.479246673866332, 0],
    I: [21.13952185099964, 0],
    L: [464.4159782971862, 1.101597686449804 * 36525], // mean longitude + mean motion per century
    w_bar: [140.0462942890944, 0], // longitude of perihelion
    Omega: [5.01672948424095, 0], // ascending node longitude
    epoch: 2461000.5,
    meanMotion: 1.101597686449804
  }
};

// Simple Julian date calculation
function getCurrentJulianDate() {
  const now = new Date();
  return 2440587.5 + now.getTime() / 86400000;
}

// Test current JD
const currentJD = getCurrentJulianDate();
console.log("Current Julian Date:", currentJD);

// Expected JD for 2025-01-01
const jan2025 = new Date('2025-01-01').getTime();
const jan2025JD = 2440587.5 + jan2025 / 86400000;
console.log("Jan 1, 2025 JD:", jan2025JD);

// Time since epoch
const timeSinceEpoch = currentJD - testNEO.orbitalElements.epoch;
console.log("Time since epoch (days):", timeSinceEpoch);

// Current mean longitude
const L_current = testNEO.orbitalElements.L[0] + (testNEO.orbitalElements.meanMotion * timeSinceEpoch);
console.log("Current mean longitude:", L_current);

// Mean anomaly
const M_current = L_current - testNEO.orbitalElements.w_bar[0];
console.log("Current mean anomaly:", M_current);