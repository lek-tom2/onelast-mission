// components/solar-system/Earth.tsx
'use client';
import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { ImpactScenario } from '@/lib/types/asteroid';
import { populationDensityService } from '@/lib/services/populationDensityService';
// Simple impact consequences calculation
const calculateImpactConsequences = (asteroid: ImpactScenario, lat: number, lng: number) => {
    const energy = asteroid.energy; // megatons
    const energyKiloton = energy * 1000;

    // More realistic blast radius calculations based on nuclear weapon scaling
    const immediateBlastRadius = 0.28 * Math.pow(energyKiloton, 1 / 3); // km
    const thermalRadius = immediateBlastRadius * 2.5; // km
    const seismicRadius = immediateBlastRadius * 15; // km

    // Crater size (simplified)
    const craterSize = immediateBlastRadius * 0.5; // km

    // Check if it's a water impact (simplified)
    const isWaterImpact = Math.abs(lat) < 30 && (lng > 120 || lng < -120);

    return {
        immediateBlastRadius: Math.round(immediateBlastRadius * 1000) / 1000,
        thermalRadius: Math.round(thermalRadius * 1000) / 1000,
        seismicRadius: Math.round(seismicRadius * 1000) / 1000,
        craterSize: Math.round(craterSize * 1000) / 1000,
        isWaterImpact
    };
};
// Simple coordinate conversion
const vector3ToLatLng = (vector: THREE.Vector3) => {
    const lat = Math.asin(vector.y) * (180 / Math.PI);
    const lng = Math.atan2(vector.z, vector.x) * (180 / Math.PI);
    return { lat, lng };
};

// Convert lat/lng coordinates to 3D vector (adjusted for texture mapping)
const latLngToVector3 = (lat: number, lng: number, radius: number = 1.02): THREE.Vector3 => {
    // Convert to radians with adjusted coordinates for texture mapping
    const latRad = ((lat + 1.5) * Math.PI) / 180; // Add 1.5 degrees to latitude to move north
    const lngRad = ((-lng - 0.25) * Math.PI) / 180; // Flip longitude and subtract 0.25 degrees offset

    // Spherical to Cartesian conversion
    return new THREE.Vector3(
        radius * Math.cos(latRad) * Math.cos(lngRad),
        radius * Math.sin(latRad),
        radius * Math.cos(latRad) * Math.sin(lngRad)
    );
};

interface City {
    name: string;
    lat: number;
    lng: number;
    country: string;
    region: string;
    density: number;
}

interface EarthProps {
    onScenarioSelect?: (scenario: ImpactScenario) => void;
    onImpactPointChange?: (point: THREE.Vector3 | null) => void;
    showPin?: boolean;
}

export default function Earth({ onScenarioSelect, onImpactPointChange, showPin = true }: EarthProps) {
    const earthRef = useRef<THREE.Mesh>(null);
    const { camera } = useThree();
    const [impactPosition, setImpactPosition] = useState<THREE.Vector3 | null>(null);
    const [localImpactPosition, setLocalImpactPosition] = useState<THREE.Vector3 | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [impactConsequences, setImpactConsequences] = useState<any>(null);
    const { selectedAsteroidDetails, showConsequences, selectedCity } = useAsteroidStore();

    // Determine if Earth should rotate (only when no asteroid is selected)
    const shouldRotate = !selectedAsteroidDetails;

    // Clear impact visualization when asteroid selection changes
    useEffect(() => {
        setImpactPosition(null);
        setLocalImpactPosition(null);
        onImpactPointChange?.(null);
    }, [selectedAsteroidDetails, onImpactPointChange]);

    // Listen for clear impact visualization events
    useEffect(() => {
        const handleClearImpact = () => {
            console.log('Earth: Clearing impact visualization');
            setImpactPosition(null);
            setLocalImpactPosition(null);
            onImpactPointChange?.(null);
        };

        window.addEventListener('clearImpactVisualization', handleClearImpact);
        return () => {
            window.removeEventListener('clearImpactVisualization', handleClearImpact);
        };
    }, [onImpactPointChange]);

    // Notify parent when impact point changes
    useEffect(() => {
        onImpactPointChange?.(localImpactPosition);
    }, [localImpactPosition, onImpactPointChange]);


    // Load Earth textures with fallback
    const [earthTexture, bumpMap] = useTexture([
        // Earth surface texture with atmosphere
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
        // Bump map for terrain
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg'
    ]);

    // Configure texture properties
    [earthTexture, bumpMap].forEach(texture => {
        if (texture) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
        }
    });

    // Create realistic Earth material
    const earthMaterial = useMemo(() => {
        return new THREE.MeshPhongMaterial({
            map: earthTexture,
            bumpMap: bumpMap,
            bumpScale: 0.1,
            specular: new THREE.Color(0x111111),
            shininess: 1000,
            transparent: false
        });
    }, [earthTexture, bumpMap]);


    // Convert 3D vector to lat/lng coordinates
    const vector3ToLatLng = (vector: THREE.Vector3): { lat: number; lng: number } => {
        const radius = vector.length();
        const lat = 90 - (Math.acos(vector.y / radius) * 180 / Math.PI);
        const lng = (Math.atan2(vector.z, vector.x) * 180 / Math.PI) - 180;
        return { lat, lng };
    };

    // Calculate impact consequences based on asteroid properties and population density
    const calculateImpactConsequences = (asteroid: ImpactScenario, impactLat: number, impactLng: number) => {
        const energy = asteroid.energy; // megatons
        const size = asteroid.asteroidSize; // meters

        // More realistic blast radius calculations based on nuclear weapon scaling
        // R = 0.28 * E^(1/3) where E is in kilotons, R in km
        // Convert megatons to kilotons: 1 MT = 1000 kT
        const energyKiloton = energy * 1000;
        const immediateBlastRadius = 0.28 * Math.pow(energyKiloton, 1 / 3); // km

        // Thermal radiation radius is typically 2-3x the blast radius
        const thermalRadius = immediateBlastRadius * 2.5; // km

        // Seismic effects can extend much further, typically 10-20x blast radius
        const seismicRadius = immediateBlastRadius * 15; // km

        // Crater size is typically 0.1-0.2x the blast radius
        const craterSize = immediateBlastRadius * 0.15; // km

        // Determine if impact is in water (simplified - check if position is over ocean)
        const isWaterImpact = Math.random() > 0.3; // Simplified - 70% chance it's land

        // Calculate population-based casualties
        const populationImpact = populationDensityService.calculateImpactCasualties(
            impactLat,
            impactLng,
            immediateBlastRadius,
            thermalRadius,
            seismicRadius,
            energy
        );

        return {
            immediateBlastRadius: Math.round(immediateBlastRadius * 1000) / 1000, // Round to 3 decimal places
            thermalRadius: Math.round(thermalRadius * 1000) / 1000,
            seismicRadius: Math.round(seismicRadius * 1000) / 1000,
            craterSize: Math.round(craterSize * 1000) / 1000,
            isWaterImpact,
            energy,
            size,
            populationImpact
        };
    };

    // No fictional scenarios - only real NASA data will be used

    useFrame(() => {
        if (earthRef.current && shouldRotate) {
            // Slow Earth rotation (realistic speed) - only when no asteroid is selected
            earthRef.current.rotation.y += 0.0005;
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEarthClick = (event: any) => {
        event.stopPropagation();

        // Only show impact visualization if an asteroid is selected and no city is selected
        if (!selectedAsteroidDetails || selectedCity) {
            return;
        }

        // Use the intersection point directly from the Three.js event
        if (event.point) {
            setImpactPosition(event.point);
            setLocalImpactPosition(event.point); // Since Earth is not rotating, world and local are the same

            // Convert to lat/lng for display and population calculation
            const coords = vector3ToLatLng(event.point);
            console.log(`Impact location: ${coords.lat.toFixed(2)}°N, ${coords.lng.toFixed(2)}°E`);

            // Get population data for this location
            const populationData = populationDensityService.getPopulationData(coords.lat, coords.lng);
            console.log('Population data:', populationData);

            // Calculate consequences based on selected asteroid and impact point
            const consequences = calculateImpactConsequences(selectedAsteroidDetails, coords.lat, coords.lng);

            // Calculate detailed population impact using optimized analysis
            const populationImpact = populationDensityService.calculateImpactCasualties(
                coords.lat,
                coords.lng,
                consequences.immediateBlastRadius,
                consequences.thermalRadius,
                consequences.seismicRadius,
                selectedAsteroidDetails.energy
            );

            setImpactConsequences({
                ...consequences,
                populationImpact: populationData,
                detailedPopulationImpact: populationImpact
            });
        }
    };

    return (
        <group name="earth-group">
            {/* Earth Surface */}
            <mesh
                ref={earthRef}
                onClick={handleEarthClick}
                onPointerOver={() => document.body.style.cursor = (selectedAsteroidDetails && !selectedCity) ? 'crosshair' : 'default'}
                onPointerOut={() => document.body.style.cursor = 'default'}
            >
                <sphereGeometry args={[1, 64, 64]} />
                <primitive object={earthMaterial} />
            </mesh>

            {/* Atmospheric Glow */}
            <mesh>
                <sphereGeometry args={[1.05, 32, 32]} />
                <meshBasicMaterial
                    color={0x4fc3f7}
                    transparent
                    opacity={0.1}
                    side={THREE.BackSide}
                />
            </mesh>

            {/* Status Indicator */}
            {selectedAsteroidDetails && !impactPosition && (
                <Text
                    position={[0, 1.5, 0]}
                    fontSize={0.08}
                    color="#00ff00"
                    anchorX="center"
                    anchorY="middle"
                >
                    🎯 Earth stopped - Click to simulate impact
                </Text>
            )}

            {!selectedAsteroidDetails && (
                <Text
                    position={[0, 1.5, 0]}
                    fontSize={0.06}
                    color="#888888"
                    anchorX="center"
                    anchorY="middle"
                >
                    🌍 Earth rotating - Select asteroid to stop
                </Text>
            )}

            {/* Impact Visualization - Rotates with Earth */}
            {localImpactPosition && selectedAsteroidDetails && showConsequences && impactConsequences && (() => {
                const coords = vector3ToLatLng(localImpactPosition);
                return (
                    <ImpactVisualization
                        position={localImpactPosition}
                        asteroid={selectedAsteroidDetails}
                        consequences={impactConsequences}
                        coordinates={coords}
                    />
                );
            })()}

            {/* City Pin - Shows selected city */}
            {selectedCity && showPin && (
                <CityPin
                    city={selectedCity}
                />
            )}
        </group>
    );
}

// Impact Visualization Component
function ImpactVisualization({
    position,
    asteroid,
    consequences,
    coordinates
}: {
    position: THREE.Vector3;
    asteroid: ImpactScenario;
    consequences: {
        immediateBlastRadius: number;
        thermalRadius: number;
        seismicRadius: number;
        craterSize: number;
        isWaterImpact: boolean;
        populationImpact: {
            latitude: number;
            longitude: number;
            populationDensity: number;
            totalPopulation: number;
            country: string;
            region: string;
            isUrban: boolean;
            isCoastal: boolean;
        };
        detailedPopulationImpact: {
            totalAffected: number;
            totalCasualties: number;
            immediateBlast: { population: number; casualties: number; casualtyRate: number };
            thermalRadiation: { population: number; casualties: number; casualtyRate: number };
            seismicEffects: { population: number; casualties: number; casualtyRate: number };
        };
    };
    coordinates: { lat: number; lng: number };
}) {
    const { immediateBlastRadius, thermalRadius, seismicRadius, craterSize, isWaterImpact, detailedPopulationImpact } = consequences;

    return (
        <group>
            {/* Immediate Blast Radius - Complete Destruction Zone */}
            <mesh position={position}>
                <sphereGeometry args={[Math.min(immediateBlastRadius * 0.001, 0.5), 32, 32]} />
                <meshBasicMaterial
                    color="#ff0000"
                    transparent
                    opacity={0.4}
                    wireframe
                />
            </mesh>

            {/* Blast Zone Label */}
            <Text
                position={[Math.min(immediateBlastRadius * 0.001, 0.5) + 0.1, 0, 0]}
                fontSize={0.05}
                color="#ff0000"
                anchorX="left"
                anchorY="middle"
            >
                IMMEDIATE BLAST ({immediateBlastRadius.toFixed(3)}km)
            </Text>

            {/* Thermal Radiation Radius - Fire Zone */}
            <mesh position={position}>
                <sphereGeometry args={[Math.min(thermalRadius * 0.001, 1.0), 32, 32]} />
                <meshBasicMaterial
                    color="#ff8800"
                    transparent
                    opacity={0.25}
                    wireframe
                />
            </mesh>

            {/* Thermal Zone Label */}
            <Text
                position={[Math.min(thermalRadius * 0.001, 1.0) + 0.1, 0, 0]}
                fontSize={0.05}
                color="#ff8800"
                anchorX="left"
                anchorY="middle"
            >
                THERMAL RADIATION ({thermalRadius.toFixed(3)}km)
            </Text>

            {/* Seismic Effects Radius - Earthquake Zone */}
            <mesh position={position}>
                <sphereGeometry args={[Math.min(seismicRadius * 0.001, 2.0), 32, 32]} />
                <meshBasicMaterial
                    color="#ffff00"
                    transparent
                    opacity={0.2}
                    wireframe
                />
            </mesh>

            {/* Seismic Zone Label */}
            <Text
                position={[Math.min(seismicRadius * 0.001, 2.0) + 0.1, 0, 0]}
                fontSize={0.05}
                color="#ffff00"
                anchorX="left"
                anchorY="middle"
            >
                SEISMIC EFFECTS ({seismicRadius.toFixed(3)}km)
            </Text>

            {/* Impact Crater - Only show if not in water */}
            {!isWaterImpact && (
                <>
                    <mesh position={position}>
                        <sphereGeometry args={[Math.min(craterSize * 0.001, 0.3), 16, 16]} />
                        <meshBasicMaterial
                            color="#8b4513"
                            transparent
                            opacity={0.7}
                        />
                    </mesh>

                    {/* Crater Label */}
                    <Text
                        position={[0, -Math.min(craterSize * 0.001, 0.3) - 0.05, 0]}
                        fontSize={0.04}
                        color="#8b4513"
                        anchorX="center"
                        anchorY="middle"
                    >
                        CRATER ({craterSize.toFixed(3)}km)
                    </Text>
                </>
            )}

            {/* Tsunami Warning - Only show if in water */}
            {isWaterImpact && (
                <>
                    <mesh position={position}>
                        <sphereGeometry args={[Math.min(seismicRadius * 0.001, 2.0), 32, 32]} />
                        <meshBasicMaterial
                            color="#0066cc"
                            transparent
                            opacity={0.3}
                            wireframe
                        />
                    </mesh>

                    <Text
                        position={[0, Math.min(seismicRadius * 0.001, 2.0) + 0.1, 0]}
                        fontSize={0.05}
                        color="#0066cc"
                        anchorX="center"
                        anchorY="middle"
                    >
                        TSUNAMI ZONE
                    </Text>
                </>
            )}

            {/* Asteroid Info */}
            <Text
                position={[0, 0.2, 0]}
                fontSize={0.04}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
            >
                {asteroid.nasaData?.name || asteroid.name}
            </Text>

            <Text
                position={[0, 0.15, 0]}
                fontSize={0.03}
                color="#cccccc"
                anchorX="center"
                anchorY="middle"
            >
                Energy: {asteroid.energy.toFixed(1)} MT | Size: {asteroid.asteroidSize.toFixed(0)}m
            </Text>

            {/* Population Impact Information */}
            {detailedPopulationImpact && (
                <>
                    <Text
                        position={[0, 0.08, 0]}
                        fontSize={0.025}
                        color="#ff6666"
                        anchorX="center"
                        anchorY="middle"
                    >
                        Location: {coordinates.lat.toFixed(4)}°N, {coordinates.lng.toFixed(4)}°E
                    </Text>

                    <Text
                        position={[0, 0.03, 0]}
                        fontSize={0.02}
                        color="#ffaa66"
                        anchorX="center"
                        anchorY="middle"
                    >
                        Total Affected: {detailedPopulationImpact.totalAffected.toLocaleString()} people
                    </Text>

                    <Text
                        position={[0, -0.02, 0]}
                        fontSize={0.02}
                        color="#ff4444"
                        anchorX="center"
                        anchorY="middle"
                    >
                        Estimated Casualties: {detailedPopulationImpact.totalCasualties.toLocaleString()}
                    </Text>

                    <Text
                        position={[0, -0.07, 0]}
                        fontSize={0.018}
                        color="#ff8888"
                        anchorX="center"
                        anchorY="middle"
                    >
                        Blast: {detailedPopulationImpact.immediateBlast.casualties.toLocaleString()} ({detailedPopulationImpact.immediateBlast.casualtyRate.toFixed(1)}%) |
                        Thermal: {detailedPopulationImpact.thermalRadiation.casualties.toLocaleString()} ({detailedPopulationImpact.thermalRadiation.casualtyRate.toFixed(1)}%) |
                        Seismic: {detailedPopulationImpact.seismicEffects.casualties.toLocaleString()} ({detailedPopulationImpact.seismicEffects.casualtyRate.toFixed(1)}%)
                    </Text>
                </>
            )}
        </group>
    );
}

// City Pin Component
function CityPin({ city }: { city: City }) {
    const cityPosition = latLngToVector3(city.lat, city.lng);

    return (
        <group position={cityPosition}>
            {/* Pin Base */}
            <mesh>
                <cylinderGeometry args={[0.01, 0.01, 0.05, 8]} />
                <meshBasicMaterial color="#ff4444" />
            </mesh>

            {/* Pin Head */}
            <mesh position={[0, 0.03, 0]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color="#ff0000" />
            </mesh>

            {/* Pin Label */}
            <Text
                position={[0.05, 0.05, 0]}
                fontSize={0.03}
                color="#ffffff"
                anchorX="left"
                anchorY="middle"
            >
                📍 {city.name}
            </Text>

            {/* City Info */}
            <Text
                position={[0.05, 0.02, 0]}
                fontSize={0.02}
                color="#cccccc"
                anchorX="left"
                anchorY="middle"
            >
                {city.country} • {city.density.toLocaleString()}/km²
            </Text>
        </group>
    );
}

// Components removed - no fictional scenarios