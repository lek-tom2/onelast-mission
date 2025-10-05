import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { calculateKeplerianPosition } from '../utils/orbitalMechanics';

interface ClosestApproachMarkersProps {
  earthPosition: { x: number; y: number; z: number };
  asteroidPosition: { x: number; y: number; z: number };
  closestApproachDate: Date | null;
  visible: boolean;
  currentJulianDate?: number;
  asteroidElements?: any;
}

export default function ClosestApproachMarkers({ 
  earthPosition, 
  asteroidPosition, 
  closestApproachDate,
  visible,
  currentJulianDate,
  asteroidElements
}: ClosestApproachMarkersProps) {
  
  // Calculate dynamic positions based on closest approach date if we have the julian date for it
  const dynamicPositions = useMemo(() => {
    if (!closestApproachDate || !currentJulianDate || !asteroidElements) {
      return { earth: earthPosition, asteroid: asteroidPosition };
    }

    // Convert closest approach date to Julian date
    const closestJD = (closestApproachDate.getTime() / 86400000) + 2440587.5;
    
    // Earth orbital elements
    const earthElements = {
      name: 'Earth',
      color: '#4A90E2',
      size: 1,
      a: [1.00000261, 0.00000562],
      e: [0.01671123, -0.00004392],
      I: [-0.00001531, -0.01294668],
      L: [100.46457166, 35999.37244981],
      w_bar: [102.93768193, 0.32327364],
      Omega: [0.0, 0.0]
    };

    // Calculate positions at closest approach time
    const earthPos = calculateKeplerianPosition(earthElements, closestJD);
    const asteroidPos = calculateKeplerianPosition(asteroidElements, closestJD);
    
    const scaleFactor = 4;
    return {
      earth: {
        x: earthPos.x * scaleFactor,
        y: earthPos.y * scaleFactor,
        z: earthPos.z * scaleFactor
      },
      asteroid: {
        x: asteroidPos.x * scaleFactor,
        y: asteroidPos.y * scaleFactor,
        z: asteroidPos.z * scaleFactor
      }
    };
  }, [earthPosition, asteroidPosition, closestApproachDate, currentJulianDate, asteroidElements]);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const points = [
      new THREE.Vector3(dynamicPositions.earth.x, dynamicPositions.earth.y, dynamicPositions.earth.z),
      new THREE.Vector3(dynamicPositions.asteroid.x, dynamicPositions.asteroid.y, dynamicPositions.asteroid.z)
    ];
    geometry.setFromPoints(points);
    return geometry;
  }, [dynamicPositions]);

  const midPoint = useMemo(() => ({
    x: (dynamicPositions.earth.x + dynamicPositions.asteroid.x) / 2,
    y: (dynamicPositions.earth.y + dynamicPositions.asteroid.y) / 2,
    z: (dynamicPositions.earth.z + dynamicPositions.asteroid.z) / 2
  }), [dynamicPositions]);

  const distance = useMemo(() => {
    const dx = dynamicPositions.asteroid.x - dynamicPositions.earth.x;
    const dy = dynamicPositions.asteroid.y - dynamicPositions.earth.y;
    const dz = dynamicPositions.asteroid.z - dynamicPositions.earth.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, [dynamicPositions]);

  if (!visible) return null;

  console.log('🎯 Dynamic marker positions:', {
    earth: dynamicPositions.earth,
    asteroid: dynamicPositions.asteroid,
    closestApproachDate,
    currentJulianDate
  });

  return (
    <group>
      {/* Connection line */}
      <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ 
        color: 0xFFD700, 
        transparent: true, 
        opacity: 0.3
      }))} />

      {/* Earth marker - small and transparent */}
      <mesh position={[dynamicPositions.earth.x, dynamicPositions.earth.y, dynamicPositions.earth.z]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#4A90E2" transparent opacity={0.4} />
      </mesh>

      {/* Asteroid marker - small and transparent */}
      <mesh position={[dynamicPositions.asteroid.x, dynamicPositions.asteroid.y, dynamicPositions.asteroid.z]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#FF6B6B" transparent opacity={0.4} />
      </mesh>

      {/* Date display at midpoint */}
      {closestApproachDate && (
        <Html position={[midPoint.x, midPoint.y + 0.3, midPoint.z]} center>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs font-mono border border-yellow-400/50">
            <div className="text-yellow-300 text-center">
              Closest Approach
            </div>
            <div className="text-white text-center text-xs">
              {closestApproachDate.toLocaleDateString()} {closestApproachDate.toLocaleTimeString()}
            </div>
            <div className="text-gray-300 text-center text-xs">
              {(distance * 149597871 / 4).toFixed(0)} km
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}