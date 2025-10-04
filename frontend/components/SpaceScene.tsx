'use client';
import { Suspense, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { ImpactScenario } from '@/lib/types/asteroid';
import Earth from './Earth';
import AsteroidField from './AsteroidField';
import ScenarioPanel from './ScenarioPanel';
import AsteroidDetailsPanel from './AsteroidDetailsPanel';
import DatePicker from './DatePicker';
import { nasaDataManager } from '@/lib/services/nasaDataManager';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import toast, { Toaster } from 'react-hot-toast';

// Impact Explosion Component
function ImpactExplosion({ asteroid, impactPoint }: { asteroid: ImpactScenario; impactPoint?: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());

  useFrame((state) => {
    if (!groupRef.current || !impactPoint) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / 2, 1); // 2 second explosion

    // Position at impact point
    groupRef.current.position.copy(impactPoint);

    // Scale up the explosion from 0 to 3x
    const scale = progress * 3;
    groupRef.current.scale.setScalar(scale);

    // Fade out over time
    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshBasicMaterial;
        material.opacity = Math.max(0, 1 - progress * 1.5);
      }
    });
  });

  if (!impactPoint) return null;

  return (
    <group ref={groupRef}>
      {/* Inner explosion core */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>

      {/* Main explosion */}
      <mesh>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
      </mesh>

      {/* Outer shockwave */}
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.6} wireframe />
      </mesh>

      {/* Debris particles */}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ]}>
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshBasicMaterial color="#ff6600" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Asteroid Trajectory Component
function AsteroidTrajectory({ asteroid, impactPoint }: { asteroid: ImpactScenario; impactPoint?: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Points>(null);
  const startTime = useRef(Date.now());
  const { camera } = useThree();

  const { startPos, endPos } = useMemo(() => {
    const startPos = camera.position.clone(); // Start from camera position
    const endPos = impactPoint ? impactPoint.clone().multiplyScalar(1.1) : new THREE.Vector3(0, 0, 1);
    return { startPos, endPos };
  }, [impactPoint, camera.position]);

  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(50 * 3); // Fewer points for shorter trail
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame(() => {
    if (!meshRef.current || !trailRef.current) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / 1, 1); // 1 second trajectory

    const currentPos = startPos.clone().lerp(endPos, progress);
    meshRef.current.position.copy(currentPos);

    meshRef.current.rotation.x += 0.2;
    meshRef.current.rotation.y += 0.2;

    const positions = trailRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < 50; i++) {
      const trailProgress = Math.max(0, progress - i * 0.02);
      const trailPos = startPos.clone().lerp(endPos, trailProgress);
      positions[i * 3] = trailPos.x;
      positions[i * 3 + 1] = trailPos.y;
      positions[i * 3 + 2] = trailPos.z;
    }
    trailRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshPhongMaterial color="#ff6600" emissive="#ff3300" emissiveIntensity={0.5} />
      </mesh>
      <points ref={trailRef} geometry={trailGeometry}>
        <pointsMaterial size={0.03} color="#ffaa00" transparent opacity={0.8} />
      </points>
    </group>
  );
}

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
function SceneContent({
  launchingAsteroid,
  setLaunchingAsteroid,
  setLaunchHandler
}: {
  launchingAsteroid: ImpactScenario | null;
  setLaunchingAsteroid: (asteroid: ImpactScenario | null) => void;
  setLaunchHandler: (handler: (scenario: ImpactScenario) => void) => void;
}) {
  const { camera } = useThree();
  const [impactPoint, setImpactPoint] = useState<THREE.Vector3 | null>(null);
  const [showTrajectory, setShowTrajectory] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);

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

  const handleLaunch = async (scenario: ImpactScenario) => {
    if (!impactPoint) {
      toast.error('Please select an impact point on Earth first!', {
        duration: 3000,
        style: {
          background: '#ff4444',
          color: 'white',
          fontWeight: 'bold',
        },
      });
      return;
    }

    // Phase 1: Show asteroid trajectory from camera to impact point
    setLaunchingAsteroid(scenario);
    setShowTrajectory(true);
    setShowExplosion(false);

    // Wait for asteroid to reach impact point (1 second)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Phase 2: Hide trajectory and show explosion
    setShowTrajectory(false);
    setShowExplosion(true);

    // Show explosion for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Phase 3: Hide explosion and show impact visualization
    setLaunchingAsteroid(null);
    setShowExplosion(false);
    // The impact visualization will automatically show because the impact point is already set
    // and showConsequences should be true
  };

  // Register the launch handler
  useEffect(() => {
    setLaunchHandler(() => handleLaunch);
  }, [setLaunchHandler, impactPoint]);


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
      <Earth
        onScenarioSelect={handleScenarioSelect}
        onImpactPointChange={setImpactPoint}
      />

      {/* Asteroid Field (visible when zoomed out) */}
      <AsteroidField />

      {/* Asteroid Trajectory */}
      {showTrajectory && launchingAsteroid && (
        <AsteroidTrajectory asteroid={launchingAsteroid} impactPoint={impactPoint || undefined} />
      )}

      {/* Impact Explosion */}
      {showExplosion && launchingAsteroid && (
        <ImpactExplosion asteroid={launchingAsteroid} impactPoint={impactPoint || undefined} />
      )}

      {/* Camera Controls */}
      <CameraController />
    </>
  );
}

export default function SpaceScene() {
  const { selectedAsteroidDetails, selectAsteroidDetails, showConsequences } = useAsteroidStore();
  const [realScenarios, setRealScenarios] = useState<ImpactScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [launchingAsteroid, setLaunchingAsteroid] = useState<ImpactScenario | null>(null);
  const [launchHandler, setLaunchHandler] = useState<((scenario: ImpactScenario) => void) | null>(null);
  const [hasImpactPoint, setHasImpactPoint] = useState(false);

  // Load real NASA asteroid data
  useEffect(() => {
    const loadRealData = async () => {
      try {
        setLoading(true);
        console.log('Loading NASA asteroid data...');
        const data = await nasaDataManager.getRealAsteroidData();
        console.log('Loaded scenarios:', data.impactScenarios.length);
        setRealScenarios(data.impactScenarios);
      } catch (error) {
        console.error('Failed to load real asteroid data:', error);
        // Set empty array on error to show fallback UI
        setRealScenarios([]);
      } finally {
        setLoading(false);
      }
    };

    loadRealData();
  }, []);

  // Track when impact point is selected (when showConsequences is true and asteroid is selected)
  useEffect(() => {
    setHasImpactPoint(!!(selectedAsteroidDetails && showConsequences));
  }, [selectedAsteroidDetails, showConsequences]);

  const focusOnScenario = (scenario: ImpactScenario) => {
    // This will be handled by the camera controller
    console.log('Focusing on scenario:', scenario.name);
  };

  const handleDateChange = async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      console.log('Changing date range to:', startDate, 'to', endDate);
      const data = await nasaDataManager.changeDateRange(startDate, endDate);
      console.log('Loaded scenarios for new date:', data.impactScenarios.length);
      setRealScenarios(data.impactScenarios);
    } catch (error) {
      console.error('Failed to load data for new date range:', error);
      setRealScenarios([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-black flex">
      {/* 3D Scene - Full Screen */}
      <div className="flex-1">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <SceneContent
              launchingAsteroid={launchingAsteroid}
              setLaunchingAsteroid={setLaunchingAsteroid}
              setLaunchHandler={setLaunchHandler}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <ScenarioPanel
        scenarios={loading ? [] : realScenarios}
        onScenarioSelect={(scenario) => {
          useAsteroidStore.getState().selectScenario(scenario);
        }}
        onFocus={focusOnScenario}
        onDateChange={handleDateChange}
      />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white z-50">
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
        onLaunch={launchHandler || undefined}
        hasImpactPoint={hasImpactPoint}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            fontWeight: 'bold',
          },
        }}
      />
    </div>
  );
}
