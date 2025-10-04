'use client';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ImpactScenario } from '@/lib/types/asteroid';

interface OrbitVisualizationProps {
    asteroid: ImpactScenario;
    gameMode: 'destroy_earth' | 'real_orbit';
    onFocusEarth?: () => void;
    onFocusAsteroid?: () => void;
}

export default function OrbitVisualization({ asteroid, gameMode, onFocusEarth, onFocusAsteroid }: OrbitVisualizationProps) {
    const orbitRef = useRef<THREE.Group>(null);
    const asteroidRef = useRef<THREE.Mesh>(null);
    const orbitLineRef = useRef<THREE.Line>(null);
    const { camera } = useThree();
    const [orbitProgress, setOrbitProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [timeScale, setTimeScale] = useState(1);

    // Course modification state for Destroy Earth mode
    const [courseModifications, setCourseModifications] = useState({
        velocityChange: 0, // km/s
        directionChange: 0, // degrees
        altitudeChange: 0, // km
        applied: false
    });

    // Extract orbital data from scenario's orbital data
    const orbitalData = useMemo(() => {
        if (!asteroid.orbitalData) return null;

        const data = asteroid.orbitalData;
        return {
            semiMajorAxis: parseFloat(data.semi_major_axis), // AU
            eccentricity: parseFloat(data.eccentricity),
            inclination: parseFloat(data.inclination), // degrees
            orbitalPeriod: parseFloat(data.orbital_period), // days
            perihelionDistance: parseFloat(data.perihelion_distance), // AU
            aphelionDistance: parseFloat(data.aphelion_distance), // AU
            orbitClass: data.orbit_class?.orbit_class_type || 'Unknown'
        };
    }, [asteroid.orbitalData]);

    // Create orbit path geometry
    const orbitGeometry = useMemo(() => {
        if (!orbitalData) return null;

        const points: THREE.Vector3[] = [];
        const segments = 200;

        // Convert AU to Earth radii (1 AU = 23,481 Earth radii)
        const auToEarthRadii = 23481;
        let semiMajorAxis = orbitalData.semiMajorAxis * auToEarthRadii;
        let eccentricity = orbitalData.eccentricity;

        // Apply course modifications for Destroy Earth mode
        if (gameMode === 'destroy_earth' && courseModifications.applied) {
            // Modify orbital parameters based on course changes
            const velocityFactor = 1 + (courseModifications.velocityChange / 10); // Scale velocity change
            const directionFactor = 1 + (courseModifications.directionChange / 180); // Scale direction change
            const altitudeFactor = 1 + (courseModifications.altitudeChange / 1000); // Scale altitude change

            // Adjust semi-major axis based on velocity and altitude changes
            semiMajorAxis *= velocityFactor * altitudeFactor;

            // Adjust eccentricity based on direction changes
            eccentricity = Math.min(0.99, eccentricity * directionFactor);
        }

        // Create elliptical orbit
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;

            // Elliptical orbit equation: r = a(1-e²)/(1+e*cos(θ))
            const r = (semiMajorAxis * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(angle));

            // Convert to Cartesian coordinates
            const x = r * Math.cos(angle);
            const z = r * Math.sin(angle);
            const y = 0; // Simplified - no inclination for now

            points.push(new THREE.Vector3(x, y, z));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return geometry;
    }, [orbitalData, gameMode, courseModifications]);

    // Calculate asteroid position on orbit
    const asteroidPosition = useMemo(() => {
        if (!orbitalData || !orbitGeometry) return new THREE.Vector3(0, 0, 0);

        const progress = orbitProgress % 1;
        const segments = 200;
        const index = Math.floor(progress * segments);
        const nextIndex = (index + 1) % segments;
        const t = (progress * segments) - index;

        const positions = orbitGeometry.attributes.position.array as Float32Array;

        const currentPos = new THREE.Vector3(
            positions[index * 3],
            positions[index * 3 + 1],
            positions[index * 3 + 2]
        );

        const nextPos = new THREE.Vector3(
            positions[nextIndex * 3],
            positions[nextIndex * 3 + 1],
            positions[nextIndex * 3 + 2]
        );

        return currentPos.lerp(nextPos, t);
    }, [orbitProgress, orbitGeometry, orbitalData]);

    // Animation loop
    useFrame((state, delta) => {
        if (isPlaying && orbitalData) {
            // Calculate orbital speed (degrees per second)
            const orbitalSpeed = (360 / (orbitalData.orbitalPeriod * 24 * 3600)) * timeScale; // degrees per second
            const progressIncrement = (orbitalSpeed * delta) / 360; // convert to progress increment

            setOrbitProgress(prev => prev + progressIncrement);
        }

        // Update asteroid position
        if (asteroidRef.current) {
            asteroidRef.current.position.copy(asteroidPosition);
        }
    });

    // Course modification functions for Destroy Earth mode
    const applyCourseModifications = () => {
        setCourseModifications(prev => ({ ...prev, applied: true }));
    };

    const resetCourseModifications = () => {
        setCourseModifications({
            velocityChange: 0,
            directionChange: 0,
            altitudeChange: 0,
            applied: false
        });
    };

    const updateCourseModification = (field: keyof typeof courseModifications, value: number) => {
        setCourseModifications(prev => ({ ...prev, [field]: value }));
    };

    // Focus functions
    const focusOnEarth = () => {
        camera.position.set(0, 0, 5);
        camera.lookAt(0, 0, 0);
        onFocusEarth?.();
    };

    const focusOnAsteroid = () => {
        if (asteroidPosition) {
            const asteroidWorldPos = asteroidPosition.clone();
            const offset = asteroidWorldPos.clone().normalize().multiplyScalar(2);
            camera.position.copy(asteroidWorldPos.clone().add(offset));
            camera.lookAt(asteroidWorldPos);
            onFocusAsteroid?.();
        }
    };

    if (!orbitalData || !orbitGeometry) {
        return (
            <group>
                <Text
                    position={[0, 2, 0]}
                    fontSize={0.2}
                    color="#ff0000"
                    anchorX="center"
                    anchorY="middle"
                >
                    No orbital data available
                </Text>
            </group>
        );
    }

    return (
        <group ref={orbitRef}>
            {/* Orbit Path */}
            <line ref={orbitLineRef} geometry={orbitGeometry}>
                <lineBasicMaterial color="#00ff00" linewidth={2} />
            </line>

            {/* Earth */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#4a90e2" />
            </mesh>

            {/* Asteroid */}
            <mesh ref={asteroidRef}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial color="#ff6600" />
            </mesh>

            {/* Asteroid Label */}
            <Text
                position={[asteroidPosition.x, asteroidPosition.y + 0.3, asteroidPosition.z]}
                fontSize={0.1}
                color="#ff6600"
                anchorX="center"
                anchorY="middle"
            >
                {asteroid.nasaData?.name || asteroid.name}
            </Text>

            {/* Orbit Information */}
            <Text
                position={[0, 3, 0]}
                fontSize={0.15}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
            >
                {gameMode === 'destroy_earth' ? 'Destroy Earth Mode' : 'Real Orbit Mode'}
            </Text>

            <Text
                position={[0, 2.7, 0]}
                fontSize={0.08}
                color="#cccccc"
                anchorX="center"
                anchorY="middle"
            >
                Semi-Major Axis: {orbitalData.semiMajorAxis.toFixed(3)} AU
            </Text>

            <Text
                position={[0, 2.5, 0]}
                fontSize={0.08}
                color="#cccccc"
                anchorX="center"
                anchorY="middle"
            >
                Eccentricity: {orbitalData.eccentricity.toFixed(3)}
            </Text>

            <Text
                position={[0, 2.3, 0]}
                fontSize={0.08}
                color="#cccccc"
                anchorX="center"
                anchorY="middle"
            >
                Orbital Period: {orbitalData.orbitalPeriod.toFixed(1)} days
            </Text>

            {/* Control Panel */}
            <group position={[0, -3, 0]}>
                {/* Play/Pause Button */}
                <mesh
                    position={[-1, 0, 0]}
                    onClick={() => setIsPlaying(!isPlaying)}
                >
                    <planeGeometry args={[0.3, 0.1]} />
                    <meshBasicMaterial color={isPlaying ? "#ff4444" : "#44ff44"} />
                </mesh>

                <Text
                    position={[-1, 0, 0.01]}
                    fontSize={0.05}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    {isPlaying ? "Pause" : "Play"}
                </Text>

                {/* Time Scale Controls */}
                <mesh
                    position={[-0.5, 0, 0]}
                    onClick={() => setTimeScale(Math.max(0.1, timeScale * 0.5))}
                >
                    <planeGeometry args={[0.2, 0.08]} />
                    <meshBasicMaterial color="#666666" />
                </mesh>

                <Text
                    position={[-0.5, 0, 0.01]}
                    fontSize={0.04}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    Slower
                </Text>

                <mesh
                    position={[0.5, 0, 0]}
                    onClick={() => setTimeScale(Math.min(100, timeScale * 2))}
                >
                    <planeGeometry args={[0.2, 0.08]} />
                    <meshBasicMaterial color="#666666" />
                </mesh>

                <Text
                    position={[0.5, 0, 0.01]}
                    fontSize={0.04}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    Faster
                </Text>

                {/* Focus Buttons */}
                <mesh
                    position={[1, 0, 0]}
                    onClick={focusOnEarth}
                >
                    <planeGeometry args={[0.3, 0.1]} />
                    <meshBasicMaterial color="#4a90e2" />
                </mesh>

                <Text
                    position={[1, 0, 0.01]}
                    fontSize={0.05}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    Focus Earth
                </Text>

                <mesh
                    position={[1.5, 0, 0]}
                    onClick={focusOnAsteroid}
                >
                    <planeGeometry args={[0.3, 0.1]} />
                    <meshBasicMaterial color="#ff6600" />
                </mesh>

                <Text
                    position={[1.5, 0, 0.01]}
                    fontSize={0.05}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    Focus Asteroid
                </Text>

                {/* Time Scale Display */}
                <Text
                    position={[0, -0.2, 0]}
                    fontSize={0.06}
                    color="#ffff00"
                    anchorX="center"
                    anchorY="middle"
                >
                    Time Scale: {timeScale.toFixed(1)}x
                </Text>
            </group>

            {/* Course Modification Controls - Only in Destroy Earth mode */}
            {gameMode === 'destroy_earth' && (
                <group position={[0, -4, 0]}>
                    <Text
                        position={[0, 0.3, 0]}
                        fontSize={0.1}
                        color="#ff4444"
                        anchorX="center"
                        anchorY="middle"
                    >
                        Course Modification
                    </Text>

                    {/* Velocity Change */}
                    <group position={[-1.5, 0, 0]}>
                        <Text
                            position={[0, 0.15, 0]}
                            fontSize={0.06}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            Velocity Change
                        </Text>
                        <Text
                            position={[0, 0.05, 0]}
                            fontSize={0.05}
                            color="#ffff00"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {courseModifications.velocityChange.toFixed(1)} km/s
                        </Text>
                        <mesh
                            position={[-0.1, -0.05, 0]}
                            onClick={() => updateCourseModification('velocityChange', Math.max(-10, courseModifications.velocityChange - 0.5))}
                        >
                            <planeGeometry args={[0.15, 0.06]} />
                            <meshBasicMaterial color="#666666" />
                        </mesh>
                        <Text
                            position={[-0.1, -0.05, 0.01]}
                            fontSize={0.04}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            -
                        </Text>
                        <mesh
                            position={[0.1, -0.05, 0]}
                            onClick={() => updateCourseModification('velocityChange', Math.min(10, courseModifications.velocityChange + 0.5))}
                        >
                            <planeGeometry args={[0.15, 0.06]} />
                            <meshBasicMaterial color="#666666" />
                        </mesh>
                        <Text
                            position={[0.1, -0.05, 0.01]}
                            fontSize={0.04}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            +
                        </Text>
                    </group>

                    {/* Direction Change */}
                    <group position={[0, 0, 0]}>
                        <Text
                            position={[0, 0.15, 0]}
                            fontSize={0.06}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            Direction Change
                        </Text>
                        <Text
                            position={[0, 0.05, 0]}
                            fontSize={0.05}
                            color="#ffff00"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {courseModifications.directionChange.toFixed(1)}°
                        </Text>
                        <mesh
                            position={[-0.1, -0.05, 0]}
                            onClick={() => updateCourseModification('directionChange', Math.max(-180, courseModifications.directionChange - 5))}
                        >
                            <planeGeometry args={[0.15, 0.06]} />
                            <meshBasicMaterial color="#666666" />
                        </mesh>
                        <Text
                            position={[-0.1, -0.05, 0.01]}
                            fontSize={0.04}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            -
                        </Text>
                        <mesh
                            position={[0.1, -0.05, 0]}
                            onClick={() => updateCourseModification('directionChange', Math.min(180, courseModifications.directionChange + 5))}
                        >
                            <planeGeometry args={[0.15, 0.06]} />
                            <meshBasicMaterial color="#666666" />
                        </mesh>
                        <Text
                            position={[0.1, -0.05, 0.01]}
                            fontSize={0.04}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            +
                        </Text>
                    </group>

                    {/* Altitude Change */}
                    <group position={[1.5, 0, 0]}>
                        <Text
                            position={[0, 0.15, 0]}
                            fontSize={0.06}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            Altitude Change
                        </Text>
                        <Text
                            position={[0, 0.05, 0]}
                            fontSize={0.05}
                            color="#ffff00"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {courseModifications.altitudeChange.toFixed(0)} km
                        </Text>
                        <mesh
                            position={[-0.1, -0.05, 0]}
                            onClick={() => updateCourseModification('altitudeChange', Math.max(-1000, courseModifications.altitudeChange - 50))}
                        >
                            <planeGeometry args={[0.15, 0.06]} />
                            <meshBasicMaterial color="#666666" />
                        </mesh>
                        <Text
                            position={[-0.1, -0.05, 0.01]}
                            fontSize={0.04}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            -
                        </Text>
                        <mesh
                            position={[0.1, -0.05, 0]}
                            onClick={() => updateCourseModification('altitudeChange', Math.min(1000, courseModifications.altitudeChange + 50))}
                        >
                            <planeGeometry args={[0.15, 0.06]} />
                            <meshBasicMaterial color="#666666" />
                        </mesh>
                        <Text
                            position={[0.1, -0.05, 0.01]}
                            fontSize={0.04}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            +
                        </Text>
                    </group>

                    {/* Apply/Reset Buttons */}
                    <group position={[0, -0.3, 0]}>
                        <mesh
                            position={[-0.3, 0, 0]}
                            onClick={applyCourseModifications}
                        >
                            <planeGeometry args={[0.4, 0.08]} />
                            <meshBasicMaterial color={courseModifications.applied ? "#44ff44" : "#ff4444"} />
                        </mesh>
                        <Text
                            position={[-0.3, 0, 0.01]}
                            fontSize={0.05}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {courseModifications.applied ? "Applied" : "Apply Changes"}
                        </Text>

                        <mesh
                            position={[0.3, 0, 0]}
                            onClick={resetCourseModifications}
                        >
                            <planeGeometry args={[0.4, 0.08]} />
                            <meshBasicMaterial color="#666666" />
                        </mesh>
                        <Text
                            position={[0.3, 0, 0.01]}
                            fontSize={0.05}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                        >
                            Reset
                        </Text>
                    </group>
                </group>
            )}

            {/* Distance Scale Indicator */}
            <Text
                position={[0, -2, 0]}
                fontSize={0.06}
                color="#888888"
                anchorX="center"
                anchorY="middle"
            >
                Scale: 1 AU = 23,481 Earth Radii
            </Text>
        </group>
    );
}
