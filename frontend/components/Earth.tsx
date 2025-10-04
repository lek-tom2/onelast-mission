// components/solar-system/Earth.tsx
'use client';
import { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Line, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { ImpactScenario } from '@/lib/types/asteroid';

interface EarthProps {
  onScenarioSelect?: (scenario: ImpactScenario) => void;
}

export default function Earth({ onScenarioSelect }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const markersRef = useRef<THREE.Group>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const { camera } = useThree();
  const { selectedScenario, selectedAsteroidDetails, showTrajectories, showConsequences, selectAsteroidDetails } = useAsteroidStore();
  
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

  // Convert lat/lng coordinates to 3D vector
  const latLngToVector3 = (lat: number, lng: number, radius: number = 1.02): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  };

  // Generate trajectory points for asteroid approach
  const generateTrajectoryPoints = useMemo(() => {
    return (lat: number, lng: number, distance: number): THREE.Vector3[] => {
      const points: THREE.Vector3[] = [];
      const steps = 20;
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const currentDistance = distance + (1 - t) * 3; // Start from 3 units away
        const point = latLngToVector3(lat, lng, currentDistance);
        points.push(point);
      }
      
      return points;
    };
  }, [latLngToVector3]);

  // Major cities for impact scenarios with enhanced data
  const impactScenarios: ImpactScenario[] = useMemo(() => [
    {
      id: 'nyc',
      name: 'New York Impact',
      position: { lat: 40.7128, lng: -74.0060 },
      city: 'New York City',
      asteroidSize: 500,
      energy: 1000,
      casualties: 10000000,
      tsunami: true,
      blastRadius: 50,
      craterSize: 5,
      trajectory: {
        points: generateTrajectoryPoints(40.7128, -74.0060, 2.5),
        approachAngle: 45,
        velocity: 17,
        timeToImpact: 30,
        closestApproach: 50000
      },
      consequences: {
        immediateBlast: { radius: 50, fatalities: 5000000 },
        thermalRadiation: { radius: 100, fatalities: 2000000 },
        seismicEffects: { magnitude: 8.5, radius: 200 },
        tsunami: { height: 30, affectedCoastlines: ['East Coast USA', 'Europe', 'Africa'] },
        atmosphericEffects: { dustCloud: true, climateChange: true, nuclearWinter: false }
      }
    },
    {
      id: 'tokyo',
      name: 'Tokyo Impact', 
      position: { lat: 35.6762, lng: 139.6503 },
      city: 'Tokyo',
      asteroidSize: 300,
      energy: 500,
      casualties: 8000000,
      tsunami: false,
      blastRadius: 30,
      craterSize: 3,
      trajectory: {
        points: generateTrajectoryPoints(35.6762, 139.6503, 2.0),
        approachAngle: 30,
        velocity: 15,
        timeToImpact: 45,
        closestApproach: 75000
      },
      consequences: {
        immediateBlast: { radius: 30, fatalities: 3000000 },
        thermalRadiation: { radius: 60, fatalities: 1500000 },
        seismicEffects: { magnitude: 7.8, radius: 150 },
        atmosphericEffects: { dustCloud: true, climateChange: false, nuclearWinter: false }
      }
    },
    {
      id: 'london',
      name: 'London Impact',
      position: { lat: 51.5074, lng: -0.1278 },
      city: 'London',
      asteroidSize: 400,
      energy: 750,
      casualties: 6000000,
      tsunami: false,
      blastRadius: 40,
      craterSize: 4,
      trajectory: {
        points: generateTrajectoryPoints(51.5074, -0.1278, 2.2),
        approachAngle: 60,
        velocity: 16,
        timeToImpact: 35,
        closestApproach: 60000
      },
      consequences: {
        immediateBlast: { radius: 40, fatalities: 4000000 },
        thermalRadiation: { radius: 80, fatalities: 1800000 },
        seismicEffects: { magnitude: 8.0, radius: 180 },
        atmosphericEffects: { dustCloud: true, climateChange: true, nuclearWinter: false }
      }
    },
    {
      id: 'sydney',
      name: 'Sydney Impact',
      position: { lat: -33.8688, lng: 151.2093 },
      city: 'Sydney',
      asteroidSize: 600,
      energy: 1200,
      casualties: 3000000,
      tsunami: true,
      blastRadius: 60,
      craterSize: 6,
      trajectory: {
        points: generateTrajectoryPoints(-33.8688, 151.2093, 2.8),
        approachAngle: 25,
        velocity: 18,
        timeToImpact: 25,
        closestApproach: 40000
      },
      consequences: {
        immediateBlast: { radius: 60, fatalities: 2000000 },
        thermalRadiation: { radius: 120, fatalities: 1000000 },
        seismicEffects: { magnitude: 8.8, radius: 250 },
        tsunami: { height: 40, affectedCoastlines: ['Australia', 'New Zealand', 'Pacific Islands'] },
        atmosphericEffects: { dustCloud: true, climateChange: true, nuclearWinter: true }
      }
    },
    {
      id: 'szczecin',
      name: 'Szczecin Impact',
      position: { lat: 53.4285, lng: 14.5528 },
      city: 'Szczecin',
      asteroidSize: 350,
      energy: 600,
      casualties: 2000000,
      tsunami: false,
      blastRadius: 35,
      craterSize: 3.5,
      trajectory: {
        points: generateTrajectoryPoints(53.4285, 14.5528, 2.3),
        approachAngle: 40,
        velocity: 16,
        timeToImpact: 40,
        closestApproach: 65000
      },
      consequences: {
        immediateBlast: { radius: 35, fatalities: 1500000 },
        thermalRadiation: { radius: 70, fatalities: 500000 },
        seismicEffects: { magnitude: 7.9, radius: 160 },
        atmosphericEffects: { dustCloud: true, climateChange: true, nuclearWinter: false }
      }
    }
  ], [generateTrajectoryPoints]);

  useFrame(() => {
    if (earthRef.current) {
      // Slow Earth rotation (realistic speed)
      earthRef.current.rotation.y += 0.0005;
    }
    if (markersRef.current) {
      // Make markers rotate with Earth
      markersRef.current.rotation.y += 0.0005;
    }
  });

  const handleEarthClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Simple raycasting for scenario selection
    const scenario = impactScenarios[0]; // For demo, select first scenario
    if (onScenarioSelect) {
      onScenarioSelect(scenario);
    }
    
    // Zoom to scenario location
    const scenarioPos = latLngToVector3(scenario.position.lat, scenario.position.lng, 2);
    camera.position.lerp(scenarioPos, 0.1);
  };

  return (
    <group>
      {/* Earth Surface */}
      <mesh 
        ref={earthRef} 
        onClick={handleEarthClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
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

      {/* Scenario Markers - Rotating with Earth */}
      <group ref={markersRef}>
        {impactScenarios.map((scenario) => {
          const position = latLngToVector3(scenario.position.lat, scenario.position.lng);
          
          return (
            <group key={scenario.id} position={position}>
              {/* Pulsing Marker */}
              <PulsingMarker 
                scenario={scenario}
                isHovered={hoveredRegion === scenario.id}
                onHover={(hovered: boolean) => setHoveredRegion(hovered ? scenario.id : null)}
                onClick={() => {
                  if (onScenarioSelect) {
                    onScenarioSelect(scenario);
                  }
                  selectAsteroidDetails(scenario);
                }}
              />
              
              {/* City Label */}
              {hoveredRegion === scenario.id && (
                <Text
                  position={[0, 0.3, 0]}
                  fontSize={0.1}
                  color="white"
                  anchorX="center"
                  anchorY="middle"
                >
                  {scenario.city}
                </Text>
              )}

              {/* Asteroid Trajectory - Clickable */}
              {showTrajectories && scenario.trajectory && (
                <Line
                  points={scenario.trajectory.points}
                  color="#ff6b6b"
                  lineWidth={3}
                  transparent
                  opacity={0.8}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectAsteroidDetails(scenario);
                  }}
                  onPointerOver={() => document.body.style.cursor = 'pointer'}
                  onPointerOut={() => document.body.style.cursor = 'default'}
                />
              )}

              {/* Impact Consequences Visualization */}
              {showConsequences && scenario.consequences && selectedScenario?.id === scenario.id && (
                <ImpactVisualization 
                  scenario={scenario}
                  position={position}
                />
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
}

// Pulsing Marker Component
interface PulsingMarkerProps {
  scenario: ImpactScenario;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}

function PulsingMarker({ scenario, isHovered, onHover, onClick }: PulsingMarkerProps) {
  const markerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (markerRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.2;
      markerRef.current.scale.setScalar(scale);
      
      if (isHovered) {
        markerRef.current.scale.setScalar(scale * 1.5);
      }
    }
    
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01;
    }
  });

  const getColor = (energy: number) => {
    if (energy > 1000) return '#ff4444';
    if (energy > 500) return '#ffaa00';
    return '#44ff44';
  };

  const getAsteroidTexture = (energy: number) => {
    // Different asteroid textures based on energy level
    if (energy > 1000) return '#8B0000'; // Dark red for high energy
    if (energy > 500) return '#B8860B'; // Golden for medium energy
    return '#228B22'; // Green for lower energy
  };

  return (
    <group>
      {/* Main Asteroid Marker */}
      <mesh
        ref={markerRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
      >
        <octahedronGeometry args={[0.08, 0]} />
        <meshPhongMaterial 
          color={getAsteroidTexture(scenario.energy)}
          shininess={100}
          transparent 
          opacity={0.9}
        />
      </mesh>
      
      {/* Rotating Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.12, 0.01, 8, 16]} />
        <meshBasicMaterial 
          color={getColor(scenario.energy)} 
          transparent 
          opacity={0.6}
        />
      </mesh>
      
      {/* Energy Glow */}
      <mesh scale={[2, 2, 2]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial 
          color={getColor(scenario.energy)} 
          transparent 
          opacity={0.2}
        />
      </mesh>
      
      {/* Threat Level Indicator */}
      <mesh position={[0, 0.15, 0]}>
        <coneGeometry args={[0.02, 0.05, 4]} />
        <meshBasicMaterial 
          color={getColor(scenario.energy)}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

// Impact Visualization Component
function ImpactVisualization({ scenario, position }: { scenario: ImpactScenario, position: THREE.Vector3 }) {
  const { consequences } = scenario;
  if (!consequences) return null;

  return (
    <group>
      {/* Immediate Blast Radius - Complete Destruction Zone */}
      <mesh position={position}>
        <sphereGeometry args={[consequences.immediateBlast.radius * 0.01, 32, 32]} />
        <meshBasicMaterial 
          color="#ff0000" 
          transparent 
          opacity={0.4}
          wireframe
        />
      </mesh>
      
      {/* Blast Zone Label */}
      <Text
        position={[consequences.immediateBlast.radius * 0.01 + 0.1, 0, 0]}
        fontSize={0.05}
        color="#ff0000"
        anchorX="left"
        anchorY="middle"
      >
        IMMEDIATE BLAST
      </Text>

      {/* Thermal Radiation Radius - Fire Zone */}
      <mesh position={position}>
        <sphereGeometry args={[consequences.thermalRadiation.radius * 0.01, 32, 32]} />
        <meshBasicMaterial 
          color="#ff8800" 
          transparent 
          opacity={0.25}
          wireframe
        />
      </mesh>
      
      {/* Thermal Zone Label */}
      <Text
        position={[consequences.thermalRadiation.radius * 0.01 + 0.1, 0, 0]}
        fontSize={0.05}
        color="#ff8800"
        anchorX="left"
        anchorY="middle"
      >
        THERMAL RADIATION
      </Text>

      {/* Seismic Effects Radius - Earthquake Zone */}
      <mesh position={position}>
        <sphereGeometry args={[consequences.seismicEffects.radius * 0.01, 32, 32]} />
        <meshBasicMaterial 
          color="#ffff00" 
          transparent 
          opacity={0.2}
          wireframe
        />
      </mesh>
      
      {/* Seismic Zone Label */}
      <Text
        position={[consequences.seismicEffects.radius * 0.01 + 0.1, 0, 0]}
        fontSize={0.05}
        color="#ffff00"
        anchorX="left"
        anchorY="middle"
      >
        SEISMIC EFFECTS
      </Text>

      {/* Impact Crater */}
      <mesh position={position}>
        <sphereGeometry args={[scenario.craterSize * 0.01, 16, 16]} />
        <meshBasicMaterial 
          color="#8b4513" 
          transparent 
          opacity={0.7}
        />
      </mesh>
      
      {/* Crater Label */}
      <Text
        position={[0, -scenario.craterSize * 0.01 - 0.05, 0]}
        fontSize={0.04}
        color="#8b4513"
        anchorX="center"
        anchorY="middle"
      >
        CRATER
      </Text>
    </group>
  );
}