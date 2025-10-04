'use client';
import { Suspense, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { ImpactScenario } from '@/lib/types/asteroid';
import Earth from './Earth';
import AsteroidField from './AsteroidField';
import ScenarioPanel from './ScenarioPanel';
import * as THREE from 'three';

// Camera controller component
function CameraController() {
  const { camera } = useThree();
  const { updateCameraState } = useAsteroidStore();
  
  // Update camera state when camera changes
  const handleCameraChange = () => {
    updateCameraState({
      position: camera.position.clone(),
      target: new THREE.Vector3(0, 0, 0), // Simplified for now
      zoom: camera.position.length()
    });
  };

  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={1}
      maxDistance={20}
      onChange={handleCameraChange}
    />
  );
}

// Main scene content
function SceneContent() {
  const handleScenarioSelect = (scenario: ImpactScenario) => {
    useAsteroidStore.getState().selectScenario(scenario);
  };

  return (
    <>
      {/* Realistic Lighting Setup */}
      <ambientLight intensity={0.1} />
      
      {/* Sun Light (directional light from sun) */}
      <directionalLight 
        position={[10, 5, 5]} 
        intensity={1.2}
        color={0xffffff}
        castShadow
      />
      
      {/* Fill Light */}
      <directionalLight 
        position={[-5, -2, -3]} 
        intensity={0.3}
        color={0x4fc3f7}
      />
      
      {/* Rim Light for atmosphere */}
      <directionalLight 
        position={[0, 0, -10]} 
        intensity={0.2}
        color={0x87ceeb}
      />

      {/* Environment */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
      
      {/* Earth */}
      <Earth onScenarioSelect={handleScenarioSelect} />
      
      {/* Asteroid Field (visible when zoomed out) */}
      <AsteroidField />
      
      {/* Camera Controls */}
      <CameraController />
    </>
  );
}

export default function SpaceScene() {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
      
      {/* UI Overlay */}
      <ScenarioPanel 
        scenarios={[
          {
            id: 'nyc',
            name: 'New York Impact',
            position: { lat: 40.7128, lng: -74.0060 },
            city: 'New York City',
            asteroidSize: 500,
            energy: 1000,
            casualties: 10000000,
            tsunami: true,
            blastRadius: 50,
            craterSize: 5
          },
          {
            id: 'tokyo',
            name: 'Tokyo Impact', 
            position: { lat: 35.6762, lng: 139.6503 },
            city: 'Tokyo',
            asteroidSize: 300,
            energy: 500,
            casualties: 8000000,
            tsunami: false,
            blastRadius: 30,
            craterSize: 3
          },
          {
            id: 'london',
            name: 'London Impact',
            position: { lat: 51.5074, lng: -0.1278 },
            city: 'London',
            asteroidSize: 400,
            energy: 750,
            casualties: 6000000,
            tsunami: false,
            blastRadius: 40,
            craterSize: 4
          },
          {
            id: 'sydney',
            name: 'Sydney Impact',
            position: { lat: -33.8688, lng: 151.2093 },
            city: 'Sydney',
            asteroidSize: 600,
            energy: 1200,
            casualties: 3000000,
            tsunami: true,
            blastRadius: 60,
            craterSize: 6
          },
          {
            id: 'szczecin',
            name: 'Szczecin Impact',
            position: { lat: 53.4285, lng: 14.5528 },
            city: 'Szczecin',
            asteroidSize: 350,
            energy: 600,
            casualties: 2000000,
            tsunami: false,
            blastRadius: 35,
            craterSize: 3.5
          }
        ]}
        onScenarioSelect={(scenario) => {
          useAsteroidStore.getState().selectScenario(scenario);
        }}
      />
    </div>
  );
}
