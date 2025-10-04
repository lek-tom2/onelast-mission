import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { PLANETARY_ELEMENTS } from '../constants/planetaryElements';
import { calculateKeplerianPosition } from '../utils/orbitalMechanics';
import * as THREE from 'three';

interface PlanetProps {
  planetKey: keyof typeof PLANETARY_ELEMENTS;
  julianDate: number;
  onDoubleClick: (position: THREE.Vector3, planetKey?: keyof typeof PLANETARY_ELEMENTS) => void;
}

export default function Planet({ planetKey, julianDate, onDoubleClick }: PlanetProps) {
  const planetRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  const elements = PLANETARY_ELEMENTS[planetKey];
  
  // Calculate current position using Keplerian mechanics
  const position = calculateKeplerianPosition(elements, julianDate);
  
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
        <sphereGeometry args={[elements.size, 16, 16]} />
        <meshStandardMaterial 
          color={elements.color}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Saturn's rings */}
      {('hasRings' in elements && elements.hasRings) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[elements.size * 1.2, elements.size * 2, 32]} />
          <meshBasicMaterial 
            color="#D4AF37" 
            transparent 
            opacity={0.6}
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
