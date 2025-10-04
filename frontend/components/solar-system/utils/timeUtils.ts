// Get current Julian Date
export function getCurrentJulianDate(): number {
  const now = new Date();
  return 2440587.5 + now.getTime() / 86400000; // Convert to Julian Date
}
