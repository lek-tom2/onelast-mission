// components/solar-system/Earth.tsx
'use client';
import { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { ImpactScenario } from '@/lib/types/asteroid';

interface EarthProps {
  onScenarioSelect?: (scenario: ImpactScenario) => void;
}

export default function Earth({ onScenarioSelect }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const [impactPosition, setImpactPosition] = useState<THREE.Vector3 | null>(null);
  const [localImpactPosition, setLocalImpactPosition] = useState<THREE.Vector3 | null>(null);
  const { selectedAsteroidDetails, showConsequences } = useAsteroidStore();
  
  // Determine if Earth should rotate (only when no asteroid is selected)
  const shouldRotate = !selectedAsteroidDetails;
  
  // Clear impact visualization when asteroid selection changes
  useMemo(() => {
    setImpactPosition(null);
    setLocalImpactPosition(null);
  }, [selectedAsteroidDetails]);
  
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

  // Convert 3D vector to lat/lng coordinates
  const vector3ToLatLng = (vector: THREE.Vector3): { lat: number; lng: number } => {
    const radius = vector.length();
    const lat = 90 - (Math.acos(vector.y / radius) * 180 / Math.PI);
    const lng = (Math.atan2(vector.z, vector.x) * 180 / Math.PI) - 180;
    return { lat, lng };
  };

  // Calculate impact consequences based on asteroid properties
  const calculateImpactConsequences = (asteroid: ImpactScenario) => {
    const energy = asteroid.energy; // megatons
    const size = asteroid.asteroidSize; // meters
    
    // Calculate impact zones based on energy (simplified models)
    const immediateBlastRadius = Math.pow(energy, 0.33) * 2; // km
    const thermalRadius = immediateBlastRadius * 2; // km
    const seismicRadius = immediateBlastRadius * 4; // km
    const craterSize = Math.pow(energy, 0.33) * 0.5; // km
    
    // Determine if impact is in water (simplified - check if position is over ocean)
    const isWaterImpact = Math.random() > 0.3; // Simplified - 70% chance it's land
    
    return {
      immediateBlastRadius,
      thermalRadius,
      seismicRadius,
      craterSize,
      isWaterImpact,
      energy,
      size
    };
  };

  // No fictional scenarios - only real NASA data will be used

  useFrame(() => {
    if (earthRef.current && shouldRotate) {
      // Slow Earth rotation (realistic speed) - only when no asteroid is selected
      earthRef.current.rotation.y += 0.0005;
    }
  });

  const handleEarthClick = (event: any) => {
    event.stopPropagation();
    
    // Only show impact visualization if an asteroid is selected
    if (!selectedAsteroidDetails) {
      return;
    }
    
    // Use the intersection point directly from the Three.js event
    if (event.point) {
      setImpactPosition(event.point);
      setLocalImpactPosition(event.point); // Since Earth is not rotating, world and local are the same
      
      // Convert to lat/lng for display
      const coords = vector3ToLatLng(event.point);
      console.log(`Impact location: ${coords.lat.toFixed(2)}°N, ${coords.lng.toFixed(2)}°E`);
    }
  };

  return (
    <group>
      {/* Earth Surface */}
      <mesh 
        ref={earthRef} 
        onClick={handleEarthClick}
        onPointerOver={() => document.body.style.cursor = selectedAsteroidDetails ? 'crosshair' : 'default'}
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
      {localImpactPosition && selectedAsteroidDetails && showConsequences && (
        <ImpactVisualization 
          position={localImpactPosition}
          asteroid={selectedAsteroidDetails}
          consequences={calculateImpactConsequences(selectedAsteroidDetails)}
        />
      )}
    </group>
  );
}

// Impact Visualization Component
function ImpactVisualization({ 
  position, 
  asteroid, 
  consequences 
}: { 
  position: THREE.Vector3; 
  asteroid: ImpactScenario; 
  consequences: any;
}) {
  const { immediateBlastRadius, thermalRadius, seismicRadius, craterSize, isWaterImpact } = consequences;
  
  return (
    <group>
      {/* Immediate Blast Radius - Complete Destruction Zone */}
      <mesh position={position}>
        <sphereGeometry args={[immediateBlastRadius * 0.01, 32, 32]} />
        <meshBasicMaterial 
          color="#ff0000" 
          transparent 
          opacity={0.4}
          wireframe
        />
      </mesh>
      
      {/* Blast Zone Label */}
      <Text
        position={[immediateBlastRadius * 0.01 + 0.1, 0, 0]}
        fontSize={0.05}
        color="#ff0000"
        anchorX="left"
        anchorY="middle"
      >
        IMMEDIATE BLAST ({immediateBlastRadius.toFixed(1)}km)
      </Text>

      {/* Thermal Radiation Radius - Fire Zone */}
      <mesh position={position}>
        <sphereGeometry args={[thermalRadius * 0.01, 32, 32]} />
        <meshBasicMaterial 
          color="#ff8800" 
          transparent 
          opacity={0.25}
          wireframe
        />
      </mesh>
      
      {/* Thermal Zone Label */}
      <Text
        position={[thermalRadius * 0.01 + 0.1, 0, 0]}
        fontSize={0.05}
        color="#ff8800"
        anchorX="left"
        anchorY="middle"
      >
        THERMAL RADIATION ({thermalRadius.toFixed(1)}km)
      </Text>

      {/* Seismic Effects Radius - Earthquake Zone */}
      <mesh position={position}>
        <sphereGeometry args={[seismicRadius * 0.01, 32, 32]} />
        <meshBasicMaterial 
          color="#ffff00" 
          transparent 
          opacity={0.2}
          wireframe
        />
      </mesh>
      
      {/* Seismic Zone Label */}
      <Text
        position={[seismicRadius * 0.01 + 0.1, 0, 0]}
        fontSize={0.05}
        color="#ffff00"
        anchorX="left"
        anchorY="middle"
      >
        SEISMIC EFFECTS ({seismicRadius.toFixed(1)}km)
      </Text>

      {/* Impact Crater - Only show if not in water */}
      {!isWaterImpact && (
        <>
          <mesh position={position}>
            <sphereGeometry args={[craterSize * 0.01, 16, 16]} />
            <meshBasicMaterial 
              color="#8b4513" 
              transparent 
              opacity={0.7}
            />
          </mesh>
          
          {/* Crater Label */}
          <Text
            position={[0, -craterSize * 0.01 - 0.05, 0]}
            fontSize={0.04}
            color="#8b4513"
            anchorX="center"
            anchorY="middle"
          >
            CRATER ({craterSize.toFixed(1)}km)
          </Text>
        </>
      )}

      {/* Tsunami Warning - Only show if in water */}
      {isWaterImpact && (
        <>
          <mesh position={position}>
            <sphereGeometry args={[seismicRadius * 0.01, 32, 32]} />
            <meshBasicMaterial 
              color="#0066cc" 
              transparent 
              opacity={0.3}
              wireframe
            />
          </mesh>
          
          <Text
            position={[0, seismicRadius * 0.01 + 0.1, 0]}
            fontSize={0.05}
            color="#0066cc"
            anchorX="center"
            anchorY="middle"
          >
            🌊 TSUNAMI ZONE
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
    </group>
  );
}

// Components removed - no fictional scenarios