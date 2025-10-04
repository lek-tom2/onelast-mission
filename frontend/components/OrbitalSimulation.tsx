'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ImpactScenario } from '@/lib/types/asteroid';
import { getAsteroidColorScheme } from '@/lib/utils/asteroidColors';

interface OrbitalSimulationProps {
    asteroid: ImpactScenario;
    isVisible: boolean;
}

export default function OrbitalSimulation({ asteroid, isVisible }: OrbitalSimulationProps) {
    const orbitRef = useRef<THREE.Group>(null);
    const asteroidRef = useRef<THREE.Mesh>(null);
    const timeRef = useRef(0);

    // Get color scheme for this asteroid
    const colorScheme = getAsteroidColorScheme(
        asteroid.nasaData?.is_potentially_hazardous_asteroid || false,
        asteroid.orbitalData?.orbit_class?.orbit_class_type,
        asteroid.energy
    );

    // Generate orbital path points using STOLEN SolarSystemScene orbit calculation
    const orbitPoints = useMemo(() => {
        if (!asteroid.orbitalData) return [];

        console.log('STEALING orbit calculation from SolarSystemScene for:', asteroid.name);

        const points: THREE.Vector3[] = [];
        const semiMajorAxis = parseFloat(asteroid.orbitalData.semi_major_axis); // AU
        const eccentricity = parseFloat(asteroid.orbitalData.eccentricity);
        const inclination = parseFloat(asteroid.orbitalData.inclination); // degrees
        const ascendingNode = parseFloat(asteroid.orbitalData.ascending_node_longitude); // degrees
        const perihelionArgument = parseFloat(asteroid.orbitalData.perihelion_argument); // degrees
        const meanAnomaly = parseFloat(asteroid.orbitalData.mean_anomaly); // degrees

        console.log('STOLEN orbital parameters:', {
            semiMajorAxis,
            eccentricity,
            inclination,
            ascendingNode,
            perihelionArgument,
            meanAnomaly
        });

        // Use the SAME calculation as SolarSystemScene
        const numPoints = 300;
        for (let i = 0; i <= numPoints; i++) {
            const E = (i / numPoints) * 2 * Math.PI; // Eccentric anomaly from 0 to 2π

            // Position in orbital plane (SAME as SolarSystemScene)
            const x_prime = semiMajorAxis * (Math.cos(E) - eccentricity);
            const y_prime = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(E);
            const z_prime = 0;

            // Transform to ecliptic coordinates (SAME as SolarSystemScene)
            const omega = perihelionArgument - ascendingNode; // argument of perihelion
            const I_rad = inclination * Math.PI / 180;
            const Omega_rad = ascendingNode * Math.PI / 180;
            const omega_rad = omega * Math.PI / 180;

            // Apply transformations (SAME as SolarSystemScene)
            const cos_omega = Math.cos(omega_rad);
            const sin_omega = Math.sin(omega_rad);
            const cos_I = Math.cos(I_rad);
            const sin_I = Math.sin(I_rad);
            const cos_Omega = Math.cos(Omega_rad);
            const sin_Omega = Math.sin(Omega_rad);

            // Rotate by argument of perihelion
            const x1 = x_prime * cos_omega - y_prime * sin_omega;
            const y1 = x_prime * sin_omega + y_prime * cos_omega;
            const z1 = z_prime;

            // Rotate by inclination
            const x2 = x1;
            const y2 = y1 * cos_I - z1 * sin_I;
            const z2 = y1 * sin_I + z1 * cos_I;

            // Rotate by longitude of ascending node
            const x_ecl = x2 * cos_Omega - y2 * sin_Omega;
            const y_ecl = x2 * sin_Omega + y2 * cos_Omega;
            const z_ecl = z2;

            // Scale for Earth view (closer to Earth for visibility)
            const scale = 0.5; // Closer scale for Earth view
            points.push(new THREE.Vector3(
                x_ecl * scale,
                z_ecl * scale, // Use Z as Y for 3D visualization
                -y_ecl * scale  // Negative to make counterclockwise motion
            ));
        }

        console.log('STOLEN orbit points generated:', points.length, 'First point:', points[0]);
        return points;
    }, [asteroid.orbitalData]);

    // Calculate current asteroid position on orbit (moved to useFrame for real-time updates)
    const currentPosition = useRef(new THREE.Vector3(0, 0, 0));

    // Animate the asteroid along its orbit
    useFrame((state, delta) => {
        if (!isVisible || !asteroid.orbitalData || orbitPoints.length === 0) return;

        timeRef.current += delta;

        // Calculate current position along orbit
        const orbitalPeriod = parseFloat(asteroid.orbitalData.orbital_period); // days
        const timeInDays = (timeRef.current / 60) % orbitalPeriod; // Convert seconds to days
        const progress = timeInDays / orbitalPeriod;

        const index = Math.floor(progress * orbitPoints.length) % orbitPoints.length;
        currentPosition.current.copy(orbitPoints[index]);

        if (asteroidRef.current) {
            // Update asteroid position
            asteroidRef.current.position.copy(currentPosition.current);

            // Rotate asteroid
            asteroidRef.current.rotation.x += delta * 0.5;
            asteroidRef.current.rotation.y += delta * 0.3;
        }
    });

    if (!isVisible || !asteroid.orbitalData) {
        console.log('OrbitalSimulation not visible:', { isVisible, hasOrbitalData: !!asteroid.orbitalData });
        return null;
    }

    console.log('OrbitalSimulation rendering:', {
        asteroidName: asteroid.name,
        orbitPoints: orbitPoints.length,
        isVisible,
        firstPoint: orbitPoints[0],
        lastPoint: orbitPoints[orbitPoints.length - 1]
    });

    return (
        <group ref={orbitRef}>
            {/* Orbital Path - VISIBLE ORBIT */}
            <Line
                points={orbitPoints}
                color="#00ff00"
                lineWidth={4}
                transparent
                opacity={1.0}
            />

            {/* Orbit Label */}
            <Text
                position={[0, 2, 0]}
                fontSize={0.1}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
            >
                {asteroid.name} Orbit
            </Text>

            {/* Asteroid */}
            <mesh ref={asteroidRef}>
                <dodecahedronGeometry args={[0.05, 0]} />
                <meshStandardMaterial
                    color="#ff0000"
                    emissive="#ff4444"
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Asteroid Label */}
            <Text
                position={[currentPosition.current.x, currentPosition.current.y + 0.05, currentPosition.current.z]}
                fontSize={0.02}
                color={colorScheme.label}
                anchorX="center"
                anchorY="middle"
            >
                {asteroid.nasaData?.name || asteroid.name}
            </Text>

            {/* Earth (reference point) */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshBasicMaterial color="#4a90e2" />
            </mesh>
        </group>
    );
}
