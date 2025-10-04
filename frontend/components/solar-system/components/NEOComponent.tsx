import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { NEOObject } from '../utils';
import { calculateKeplerianPosition } from '../utils/orbitalMechanics';
import { GameMode } from '@/lib/stores/useAsteroidStore';
import * as THREE from 'three';

interface NEOProps {
  neo: NEOObject;
  julianDate: number;
  onDoubleClick: (position: THREE.Vector3) => void;
  onNEOClick?: (neo: NEOObject) => void;
  gameMode: GameMode;
}

export default function NEOComponent({ neo, julianDate, onDoubleClick, onNEOClick, gameMode }: NEOProps) {
  const neoRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const currentPositionRef = useRef({ x: 0, y: 0, z: 0 });
  const trailRef = useRef<THREE.Vector3[]>([]);
  
  // Debug: Log when julianDate changes (less frequently)
  useEffect(() => {
    if (Math.random() < 0.1) { // Only log 10% of the time
      console.log(`NEO ${neo.name} - Julian Date updated:`, julianDate);
    }
  }, [julianDate, neo.name]);
  
  useFrame(() => {
    // Create adapter object for calculateKeplerianPosition
    const neoElements = {
      name: neo.name,
      color: neo.color,
      size: neo.size,
      a: neo.orbitalElements.a,
      e: neo.orbitalElements.e,
      I: neo.orbitalElements.I,
      L: neo.orbitalElements.L,
      w_bar: neo.orbitalElements.w_bar,
      Omega: neo.orbitalElements.Omega,
      epoch: neo.orbitalElements.epoch,
      meanMotion: neo.orbitalElements.meanMotion
    };
    
    // Calculate position using Keplerian mechanics
    const position = calculateKeplerianPosition(neoElements, julianDate);
    
    // Debug: Log position calculations occasionally
    if (Math.random() < 0.001) { // Much less frequent logging
      console.log(`NEO ${neo.name} position:`, position, 'Julian Date:', julianDate);
    }
    
    // Scale positions for visualization
    const scaledPosition = {
      x: position.x * 4,
      y: position.y * 4,
      z: position.z * 4
    };
    
    // Add to trail for visualization
    const newPos = new THREE.Vector3(scaledPosition.x, scaledPosition.y, scaledPosition.z);
    trailRef.current.push(newPos);
    
    // Keep only last 50 positions for trail
    if (trailRef.current.length > 50) {
      trailRef.current.shift();
    }
    
    // Store current position for click handling
    currentPositionRef.current = scaledPosition;
    
    if (neoRef.current) {
      neoRef.current.position.set(scaledPosition.x, scaledPosition.y, scaledPosition.z);
    }
    
    if (meshRef.current) {
      // Faster rotation for asteroids to show it's animated
      meshRef.current.rotation.x += 0.05;
      meshRef.current.rotation.y += 0.03;
    }
  });

  const handleDoubleClick = () => {
    const worldPos = new THREE.Vector3(
      currentPositionRef.current.x, 
      currentPositionRef.current.y, 
      currentPositionRef.current.z
    );
    onDoubleClick(worldPos);
  };

  const handleClick = () => {
    if (gameMode === 'destroy_earth' && onNEOClick) {
      onNEOClick(neo);
    }
  };

  return (
    <group ref={neoRef}>
      {/* NEO Object */}
      <mesh 
        ref={meshRef} 
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <dodecahedronGeometry args={[neo.size, 0]} />
        <meshStandardMaterial 
          color={neo.color}
          roughness={0.3}
          metalness={0.7}
          emissive={neo.color}
          emissiveIntensity={gameMode === 'destroy_earth' ? 0.6 : 0.4}
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
