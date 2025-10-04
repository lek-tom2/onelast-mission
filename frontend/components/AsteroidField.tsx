'use client';
import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { Asteroid, ImpactScenario } from '@/lib/types/asteroid';
import { nasaDataManager } from '@/lib/services/nasaDataManager';
import * as THREE from 'three';

export default function AsteroidField() {
  const { asteroids, generateRandomAsteroids } = useAsteroidStore();
  const fieldRef = useRef<THREE.Group>(null);
  const [realAsteroids, setRealAsteroids] = useState<ImpactScenario[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real NASA asteroid data
  useEffect(() => {
    const loadRealAsteroids = async () => {
      try {
        setLoading(true);
        const data = await nasaDataManager.getRealAsteroidData();
        setRealAsteroids(data.impactScenarios);
      } catch (error) {
        console.error('Failed to load real asteroid data:', error);
        // Fallback to random asteroids
        if (asteroids.length === 0) {
          generateRandomAsteroids(50);
        }
      } finally {
        setLoading(false);
      }
    };

    loadRealAsteroids();
  }, [asteroids.length, generateRandomAsteroids]);

  useFrame(() => {
    if (fieldRef.current) {
      // Slowly rotate the entire asteroid field
      fieldRef.current.rotation.y += 0.0005;
    }
  });

  if (loading) {
    return (
      <group ref={fieldRef}>
        {/* Show loading asteroids */}
        {Array.from({ length: 10 }).map((_, i) => (
          <AsteroidObject 
            key={`loading-${i}`} 
            asteroid={{
              id: `loading-${i}`,
              name: 'Loading...',
              size: 50,
              position: new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
              ),
              velocity: new THREE.Vector3(0, 0, 0),
              composition: 'rock',
              threatLevel: 'low'
            }} 
          />
        ))}
      </group>
    );
  }

  return (
    <group ref={fieldRef}>
      {/* Real NASA asteroids */}
      {realAsteroids.map((scenario) => (
        <RealAsteroidObject key={scenario.id} scenario={scenario} />
      ))}
      
      {/* Fallback random asteroids if no real data */}
      {realAsteroids.length === 0 && asteroids.map((asteroid) => (
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

  const getAsteroidShape = (composition: string) => {
    switch (composition) {
      case 'rock': return 'octahedron';
      case 'metal': return 'box';
      case 'ice': return 'sphere';
      case 'mixed': return 'dodecahedron';
      default: return 'octahedron';
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

  const renderAsteroidShape = () => {
    const shape = getAsteroidShape(asteroid.composition);
    const commonProps = { args: [size, 8, 8] };
    
    switch (shape) {
      case 'octahedron':
        return <octahedronGeometry args={[size, 0]} />;
      case 'box':
        return <boxGeometry args={[size * 1.5, size * 1.2, size * 0.8]} />;
      case 'sphere':
        return <sphereGeometry args={[size, 8, 8]} />;
      case 'dodecahedron':
        return <dodecahedronGeometry args={[size, 0]} />;
      default:
        return <octahedronGeometry args={[size, 0]} />;
    }
  };

  return (
    <group position={asteroid.position}>
      <mesh ref={asteroidRef}>
        {/* Main asteroid body with different shapes */}
        {renderAsteroidShape()}
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
        
        {/* Composition indicator */}
        <mesh position={[0, size * 1.2, 0]}>
          <coneGeometry args={[size * 0.2, size * 0.3, 4]} />
          <meshBasicMaterial 
            color={getAsteroidColor(asteroid.composition)}
            transparent
            opacity={0.6}
          />
        </mesh>
      </mesh>
    </group>
  );
}

// Real asteroid object based on NASA data
function RealAsteroidObject({ scenario }: { scenario: ImpactScenario }) {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const { selectAsteroidDetails } = useAsteroidStore();

  useFrame(({ clock }) => {
    if (asteroidRef.current) {
      // Rotate individual asteroids
      asteroidRef.current.rotation.x += 0.01;
      asteroidRef.current.rotation.y += 0.01;
      
      // Orbital motion based on trajectory
      if (scenario.trajectory) {
        const time = clock.getElapsedTime() * 0.1;
        const trajectoryPoints = scenario.trajectory.points;
        if (trajectoryPoints.length > 0) {
          const index = Math.floor(time * trajectoryPoints.length) % trajectoryPoints.length;
          const nextIndex = (index + 1) % trajectoryPoints.length;
          const t = (time * trajectoryPoints.length) % 1;
          
          const currentPos = trajectoryPoints[index];
          const nextPos = trajectoryPoints[nextIndex];
          
          asteroidRef.current.position.lerpVectors(currentPos, nextPos, t);
        }
      }
    }
  });

  const getAsteroidColor = (energy: number) => {
    if (energy > 1000) return '#8B0000'; // Dark red for high energy
    if (energy > 500) return '#B8860B'; // Golden for medium energy
    return '#228B22'; // Green for lower energy
  };

  const getThreatColor = (probability?: number) => {
    if (!probability) return '#ffffff';
    if (probability > 0.1) return '#ff0000'; // Critical
    if (probability > 0.05) return '#ff8800'; // High
    if (probability > 0.01) return '#ffff00'; // Medium
    return '#00ff00'; // Low
  };

  const getAsteroidShape = (size: number) => {
    if (size > 200) return 'dodecahedron';
    if (size > 100) return 'octahedron';
    if (size > 50) return 'box';
    return 'sphere';
  };

  const size = Math.max(0.01, scenario.asteroidSize / 10000); // Scale down asteroid size
  const shape = getAsteroidShape(scenario.asteroidSize);

  const renderAsteroidShape = () => {
    switch (shape) {
      case 'dodecahedron':
        return <dodecahedronGeometry args={[size, 0]} />;
      case 'octahedron':
        return <octahedronGeometry args={[size, 0]} />;
      case 'box':
        return <boxGeometry args={[size * 1.5, size * 1.2, size * 0.8]} />;
      case 'sphere':
        return <sphereGeometry args={[size, 8, 8]} />;
      default:
        return <octahedronGeometry args={[size, 0]} />;
    }
  };

  return (
    <group>
      <mesh 
        ref={asteroidRef}
        onClick={(e) => {
          e.stopPropagation();
          selectAsteroidDetails(scenario);
        }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        {/* Main asteroid body */}
        {renderAsteroidShape()}
        <meshPhongMaterial 
          color={getAsteroidColor(scenario.energy)}
          shininess={30}
        />
        
        {/* Threat level indicator */}
        <mesh position={[size * 1.5, 0, 0]}>
          <sphereGeometry args={[size * 0.3, 8, 8]} />
          <meshBasicMaterial 
            color={getThreatColor(scenario.collisionProbability)}
            transparent
            opacity={0.8}
          />
        </mesh>
        
        {/* Energy indicator */}
        <mesh position={[0, size * 1.2, 0]}>
          <coneGeometry args={[size * 0.2, size * 0.3, 4]} />
          <meshBasicMaterial 
            color={getAsteroidColor(scenario.energy)}
            transparent
            opacity={0.6}
          />
        </mesh>
      </mesh>
      
      {/* Trajectory lines removed for cleaner visualization */}
    </group>
  );
}
