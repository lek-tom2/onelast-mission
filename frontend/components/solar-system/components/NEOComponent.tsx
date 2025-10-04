import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { NEOObject } from '../types';
import { calculateKeplerianPosition } from '../utils/orbitalMechanics';
import * as THREE from 'three';

interface NEOProps {
  neo: NEOObject;
  julianDate: number;
  onDoubleClick: (position: THREE.Vector3) => void;
}

export default function NEOComponent({ neo, julianDate, onDoubleClick }: NEOProps) {
  const neoRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Calculate position using Keplerian mechanics (same as planets)
  const position = calculateKeplerianPosition(neo.orbitalElements, julianDate);
  
  // Scale positions for visualization
  const scaledPosition = {
    x: position.x * 4,
    y: position.y * 4,
    z: position.z * 4
  };
  
  useFrame(() => {
    if (neoRef.current) {
      neoRef.current.position.set(scaledPosition.x, scaledPosition.y, scaledPosition.z);
    }
    
    if (meshRef.current) {
      // Faster rotation for asteroids
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.y += 0.015;
    }
  });

  const handleDoubleClick = () => {
    const worldPos = new THREE.Vector3(scaledPosition.x, scaledPosition.y, scaledPosition.z);
    onDoubleClick(worldPos);
  };

  return (
    <group ref={neoRef}>
      {/* NEO Object */}
      <mesh 
        ref={meshRef} 
        onDoubleClick={handleDoubleClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <dodecahedronGeometry args={[neo.size, 0]} />
        <meshStandardMaterial 
          color={neo.color}
          roughness={0.9}
          metalness={0.1}
          emissive={neo.hazardous ? neo.color : '#000000'}
          emissiveIntensity={neo.hazardous ? 0.2 : 0}
        />
      </mesh>
      
      {/* Hazard indicator for dangerous objects */}
      {neo.hazardous && (
        <mesh>
          <sphereGeometry args={[neo.size * 3, 16, 16]} />
          <meshBasicMaterial 
            color={neo.color}
            transparent
            opacity={0.1}
          />
        </mesh>
      )}
      
      {/* NEO label - always faces camera */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          position={[0, neo.size + 0.1, 0]}
          fontSize={0.08}
          color={neo.hazardous ? '#FF6B6B' : 'white'}
          anchorX="center"
          anchorY="bottom"
        >
          {neo.name}
        </Text>
      </Billboard>
    </group>
  );
}
