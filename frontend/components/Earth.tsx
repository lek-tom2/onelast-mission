// components/solar-system/Earth.tsx
'use client';
import { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { ImpactScenario } from '@/lib/types/asteroid';

interface EarthProps {
  onScenarioSelect?: (scenario: ImpactScenario) => void;
}

export default function Earth({ onScenarioSelect }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  
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

  // Helper functions removed - no fictional scenarios

  // No fictional scenarios - only real NASA data will be used

  useFrame(() => {
    if (earthRef.current) {
      // Slow Earth rotation (realistic speed)
      earthRef.current.rotation.y += 0.0005;
    }
  });

  const handleEarthClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    // No fictional scenarios - clicking Earth does nothing
    // Real asteroid data comes from NASA API and is handled in the sidebar
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

      {/* No fictional scenario markers - only real NASA data is used */}
    </group>
  );
}

// PulsingMarker component removed - no fictional scenarios

// ImpactVisualization component removed - no fictional scenarios