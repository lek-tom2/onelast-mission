'use client';
import { Suspense, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { ImpactScenario } from '@/lib/types/asteroid';
import Earth from './Earth';
import AsteroidField from './AsteroidField';
import ScenarioPanel from './ScenarioPanel';
import AsteroidDetailsPanel from './AsteroidDetailsPanel';
import { nasaDataManager } from '@/lib/services/nasaDataManager';
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
  const { camera } = useThree();
  
  const handleScenarioSelect = (scenario: ImpactScenario) => {
    useAsteroidStore.getState().selectScenario(scenario);
  };

  const focusOnScenario = (scenario: ImpactScenario) => {
    // Convert lat/lng to 3D position
    const lat = scenario.position.lat;
    const lng = scenario.position.lng;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const targetPosition = new THREE.Vector3(
      -2 * Math.sin(phi) * Math.cos(theta),
      2 * Math.cos(phi),
      2 * Math.sin(phi) * Math.sin(theta)
    );
    
    // Smoothly move camera to focus on the scenario
    camera.position.lerp(targetPosition, 0.1);
    camera.lookAt(0, 0, 0);
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
  const { selectedAsteroidDetails, selectAsteroidDetails } = useAsteroidStore();
  const [realScenarios, setRealScenarios] = useState<ImpactScenario[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load real NASA asteroid data
  useEffect(() => {
    const loadRealData = async () => {
      try {
        setLoading(true);
        const data = await nasaDataManager.getRealAsteroidData();
        setRealScenarios(data.impactScenarios);
      } catch (error) {
        console.error('Failed to load real asteroid data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRealData();
  }, []);
  
  const focusOnScenario = (scenario: ImpactScenario) => {
    // This will be handled by the camera controller
    console.log('Focusing on scenario:', scenario.name);
  };

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
        scenarios={loading ? [] : realScenarios}
        onScenarioSelect={(scenario) => {
          useAsteroidStore.getState().selectScenario(scenario);
        }}
        onFocus={focusOnScenario}
      />
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span>Loading NASA asteroid data...</span>
          </div>
        </div>
      )}
      
      {/* Asteroid Details Panel */}
      <AsteroidDetailsPanel 
        scenario={selectedAsteroidDetails}
        onClose={() => selectAsteroidDetails(null)}
      />
    </div>
  );
}
