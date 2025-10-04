import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { PLANETARY_ELEMENTS } from '../constants/planetaryElements';
import { calculateKeplerianPosition } from '../utils/orbitalMechanics';
import * as THREE from 'three';

interface PlanetProps {
  planetKey: keyof typeof PLANETARY_ELEMENTS;
  julianDate: number;
  onDoubleClick: (position: THREE.Vector3, planetKey?: keyof typeof PLANETARY_ELEMENTS) => void;
}

// Map planet keys to texture file names
const getTextureMap = (planetKey: keyof typeof PLANETARY_ELEMENTS): string => {
  const textureMap: Record<keyof typeof PLANETARY_ELEMENTS, string> = {
    mercury: '/2k_mercury.jpg',
    venus: '/2k_venus_surface.jpg',
    earth: '/2k_earth_daymap.jpg',
    mars: '/2k_mars.jpg',
    jupiter: '/2k_jupiter.jpg',
    saturn: '/2k_saturn.jpg',
    uranus: '/2k_uranus.jpg',
    neptune: '/2k_neptune.jpg'
  };
  return textureMap[planetKey];
};

export default function Planet({ planetKey, julianDate, onDoubleClick }: PlanetProps) {
  const planetRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const elements = PLANETARY_ELEMENTS[planetKey];

  // Load planet texture
  const texture = useLoader(THREE.TextureLoader, getTextureMap(planetKey));

  // Calculate current position using Keplerian mechanics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const position = calculateKeplerianPosition(elements as any, julianDate);

  // Scale positions for better visualization (1 AU = 4 units)
  const scaledPosition = {
    x: position.x * 4,
    y: position.y * 4,
    z: position.z * 4
  };

  useFrame(() => {
    if (planetRef.current) {
      planetRef.current.position.set(scaledPosition.x, scaledPosition.y, scaledPosition.z);
    }

    if (meshRef.current) {
      // Planet rotation
      meshRef.current.rotation.y += 0.01;
    }
  });

  const handleDoubleClick = () => {
    const worldPos = new THREE.Vector3(scaledPosition.x, scaledPosition.y, scaledPosition.z);
    onDoubleClick(worldPos, planetKey);
  };

  return (
    <group ref={planetRef}>
      {/* Planet */}
      <mesh
        ref={meshRef}
        onDoubleClick={handleDoubleClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <sphereGeometry args={[elements.size, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Saturn's rings */}
      {planetKey === 'saturn' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[elements.size * 1.2, elements.size * 2, 64]} />
          <meshBasicMaterial
            color="#D4AF37"
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Planet label - always faces camera */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          position={[0, elements.size + 0.1, 0]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="bottom"
        >
          {elements.name}
        </Text>
      </Billboard>
    </group>
  );
}
