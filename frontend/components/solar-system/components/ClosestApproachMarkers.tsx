import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface ClosestApproachMarkersProps {
  earthPosition: { x: number; y: number; z: number };
  asteroidPosition: { x: number; y: number; z: number };
  closestApproachDate: Date | null;
  visible: boolean;
}

export default function ClosestApproachMarkers({ 
  earthPosition, 
  asteroidPosition, 
  closestApproachDate,
  visible 
}: ClosestApproachMarkersProps) {
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const points = [
      new THREE.Vector3(earthPosition.x, earthPosition.y, earthPosition.z),
      new THREE.Vector3(asteroidPosition.x, asteroidPosition.y, asteroidPosition.z)
    ];
    geometry.setFromPoints(points);
    return geometry;
  }, [earthPosition, asteroidPosition]);

  const midPoint = useMemo(() => ({
    x: (earthPosition.x + asteroidPosition.x) / 2,
    y: (earthPosition.y + asteroidPosition.y) / 2,
    z: (earthPosition.z + asteroidPosition.z) / 2
  }), [earthPosition, asteroidPosition]);

  const distance = useMemo(() => {
    const dx = asteroidPosition.x - earthPosition.x;
    const dy = asteroidPosition.y - earthPosition.y;
    const dz = asteroidPosition.z - earthPosition.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, [earthPosition, asteroidPosition]);

  if (!visible) return null;

  console.log('🎯 Marker positions:', {
    earth: earthPosition,
    asteroid: asteroidPosition
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
      <mesh position={[earthPosition.x, earthPosition.y, earthPosition.z]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#4A90E2" transparent opacity={0.4} />
      </mesh>

      {/* Asteroid marker - small and transparent */}
      <mesh position={[asteroidPosition.x, asteroidPosition.y, asteroidPosition.z]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#FF6B6B" transparent opacity={0.4} />
      </mesh>

      {/* Date display at midpoint */}
      {closestApproachDate && (
        <Html position={[midPoint.x, midPoint.y + 0.3, midPoint.z]} center>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs font-mono border border-yellow-400/50">
            <div className="text-yellow-300 text-center">
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