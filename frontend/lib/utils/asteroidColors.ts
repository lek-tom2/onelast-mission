// Unified color scheme for asteroids across all views
// This ensures consistency between solar system view, asteroid list, and detail panels

export interface AsteroidColorScheme {
    primary: string;
    secondary: string;
    threat: string;
    orbit: string;
    label: string;
}

// Color schemes based on asteroid characteristics
export const getAsteroidColorScheme = (
    isHazardous: boolean,
    orbitClass?: string,
    energy?: number
): AsteroidColorScheme => {
    // High energy asteroids (destructive potential)
    if (energy && energy > 1000) {
        return {
            primary: '#8B0000', // Dark red
            secondary: '#FF4444', // Bright red
            threat: '#FF0000', // Critical red
            orbit: '#FF6666', // Light red orbit
            label: '#FFAAAA' // Light red label
        };
    }

    // Medium energy asteroids
    if (energy && energy > 500) {
        return {
            primary: '#B8860B', // Golden
            secondary: '#DAA520', // Goldenrod
            threat: '#FF8800', // Orange
            orbit: '#FFB366', // Light orange orbit
            label: '#FFD700' // Gold label
        };
    }

    // Hazardous asteroids (regardless of energy)
    if (isHazardous) {
        return {
            primary: '#FF4444', // Red
            secondary: '#FF6666', // Light red
            threat: '#FF0000', // Critical red
            orbit: '#FF8888', // Light red orbit
            label: '#FFAAAA' // Light red label
        };
    }

    // Orbit class based colors (matching solar system view)
    switch (orbitClass) {
        case 'ATE': // Aten
            return {
                primary: '#FFA500', // Orange
                secondary: '#FFB366', // Light orange
                threat: '#FF8800', // Dark orange
                orbit: '#FFCC99', // Very light orange orbit
                label: '#FFD700' // Gold label
            };
        case 'APO': // Apollo
            return {
                primary: '#FFFF00', // Yellow
                secondary: '#FFFF66', // Light yellow
                threat: '#FFD700', // Gold
                orbit: '#FFFF99', // Very light yellow orbit
                label: '#FFFFCC' // Very light yellow label
            };
        case 'AMO': // Amor
            return {
                primary: '#00FF00', // Green
                secondary: '#66FF66', // Light green
                threat: '#00CC00', // Dark green
                orbit: '#99FF99', // Very light green orbit
                label: '#CCFFCC' // Very light green label
            };
        default:
            return {
                primary: '#888888', // Gray
                secondary: '#AAAAAA', // Light gray
                threat: '#666666', // Dark gray
                orbit: '#CCCCCC', // Very light gray orbit
                label: '#DDDDDD' // Very light gray label
            };
    }
};

// Get threat level color
export const getThreatLevelColor = (probability?: number): string => {
    if (!probability) return '#888888';
    if (probability > 0.1) return '#FF0000'; // Critical
    if (probability > 0.05) return '#FF8800'; // High
    if (probability > 0.01) return '#FFFF00'; // Medium
    return '#00FF00'; // Low
};

// Get energy-based color
export const getEnergyColor = (energy: number): string => {
    if (energy > 1000) return '#8B0000'; // Dark red for high energy
    if (energy > 500) return '#B8860B'; // Golden for medium energy
    if (energy > 100) return '#228B22'; // Green for medium-low energy
    return '#4169E1'; // Blue for low energy
};

// Get size-based color
export const getSizeColor = (size: number): string => {
    if (size > 200) return '#8B0000'; // Dark red for large
    if (size > 100) return '#B8860B'; // Golden for medium-large
    if (size > 50) return '#228B22'; // Green for medium
    return '#4169E1'; // Blue for small
};

// Get composition-based color (for traditional asteroid field)
export const getCompositionColor = (composition: string): string => {
    switch (composition) {
        case 'rock': return '#8b7355';
        case 'metal': return '#c0c0c0';
        case 'ice': return '#b0e0e6';
        case 'mixed': return '#9b7653';
        default: return '#8b7355';
    }
};

// Get threat level text color
export const getThreatTextColor = (probability?: number): string => {
    if (!probability) return '#888888';
    if (probability > 0.1) return '#FF4444'; // Critical
    if (probability > 0.05) return '#FF8800'; // High
    if (probability > 0.01) return '#FFFF00'; // Medium
    return '#00FF00'; // Low
};

// Get game mode specific colors
export const getGameModeColors = (gameMode: 'destroy_earth' | 'real_orbit' | 'sandbox') => {
    switch (gameMode) {
        case 'destroy_earth':
            return {
                primary: '#FF4444', // Red theme
                secondary: '#FF6666',
                accent: '#FF0000',
                background: '#2D1B1B'
            };
        case 'real_orbit':
            return {
                primary: '#4A90E2', // Blue theme
                secondary: '#6BA3E8',
                accent: '#2E5BBA',
                background: '#1B2D3D'
            };
        case 'sandbox':
            return {
                primary: '#00FF00', // Green theme
                secondary: '#66FF66',
                accent: '#00CC00',
                background: '#1B2D1B'
            };
        default:
            return {
                primary: '#888888',
                secondary: '#AAAAAA',
                accent: '#666666',
                background: '#2D2D2D'
            };
    }
};
