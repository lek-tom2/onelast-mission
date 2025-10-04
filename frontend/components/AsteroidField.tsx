'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { Asteroid } from '@/lib/types/asteroid';
import * as THREE from 'three';

export default function AsteroidField() {
  const { asteroids, generateRandomAsteroids } = useAsteroidStore();
  const fieldRef = useRef<THREE.Group>(null);

  // Generate asteroids if none exist
  useMemo(() => {
    if (asteroids.length === 0) {
      generateRandomAsteroids(50);
    }
  }, [asteroids.length, generateRandomAsteroids]);

  useFrame(() => {
    if (fieldRef.current) {
      // Slowly rotate the entire asteroid field
      fieldRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group ref={fieldRef}>
      {asteroids.map((asteroid) => (
        <AsteroidObject key={asteroid.id} asteroid={asteroid} />
      ))}
    </group>
  );
}

function AsteroidObject({ asteroid }: { asteroid: Asteroid }) {
  const asteroidRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (asteroidRef.current) {
      // Rotate individual asteroids
      asteroidRef.current.rotation.x += 0.01;
      asteroidRef.current.rotation.y += 0.01;
      
      // Orbital motion (simplified)
      const time = clock.getElapsedTime() * 0.1;
      const radius = asteroid.position.length();
      asteroidRef.current.position.x = Math.cos(time + asteroid.position.x) * radius;
      asteroidRef.current.position.z = Math.sin(time + asteroid.position.z) * radius;
    }
  });

  const getAsteroidColor = (composition: string) => {
    switch (composition) {
      case 'rock': return '#8b7355';
      case 'metal': return '#c0c0c0';
      case 'ice': return '#b0e0e6';
      case 'mixed': return '#9b7653';
      default: return '#8b7355';
    }
  };

  const getThreatColor = (threatLevel: string) => {
    switch (threatLevel) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff8800';
      case 'medium': return '#ffff00';
      case 'low': return '#00ff00';
      default: return '#ffffff';
    }
  };

  const size = Math.max(0.01, asteroid.size / 10000); // Scale down asteroid size

  return (
    <group position={asteroid.position}>
      <mesh ref={asteroidRef}>
        {/* Main asteroid body */}
        <sphereGeometry args={[size, 8, 8]} />
        <meshPhongMaterial 
          color={getAsteroidColor(asteroid.composition)}
          shininess={30}
        />
        
        {/* Threat level indicator */}
        <mesh position={[size * 1.5, 0, 0]}>
          <sphereGeometry args={[size * 0.3, 8, 8]} />
          <meshBasicMaterial 
            color={getThreatColor(asteroid.threatLevel)}
            transparent
            opacity={0.8}
          />
        </mesh>
      </mesh>
    </group>
  );
}
