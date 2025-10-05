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
import CitySelector from './CitySelector';
import { nasaDataManager } from '@/lib/services/nasaDataManager';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import toast, { Toaster } from 'react-hot-toast';

// Impact Explosion Component
function ImpactExplosion({ asteroid, impactPoint }: { asteroid: ImpactScenario; impactPoint?: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());

  // Calculate explosion scale based on asteroid energy
  const energyScale = useMemo(() => {
    // Energy is in megatons, scale from 0.07 to 1.67 (3x smaller)
    const minEnergy = 0.1; // 0.1 megatons
    const maxEnergy = 1000; // 1000 megatons
    const energy = Math.max(minEnergy, Math.min(maxEnergy, asteroid.energy));

    // Logarithmic scaling for better visual distribution
    const logScale = Math.log10(energy / minEnergy) / Math.log10(maxEnergy / minEnergy);
    return Math.max(0.07, Math.min(1.67, 0.17 + logScale * 1.5));
  }, [asteroid.energy]);

  // Calculate explosion duration based on energy (larger explosions last longer)
  const explosionDuration = useMemo(() => {
    return Math.max(1.5, Math.min(4.0, 2.0 + energyScale * 0.5));
  }, [energyScale]);

  useFrame((state) => {
    if (!groupRef.current || !impactPoint) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / explosionDuration, 1);

    // Position at impact point
    groupRef.current.position.copy(impactPoint);

    // Scale up the explosion based on energy
    const scale = progress * energyScale;
    groupRef.current.scale.setScalar(scale);

    // Fade out over time
    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshBasicMaterial;
        material.opacity = Math.max(0, 1 - progress * 1.2);
      }
    });
  });

  if (!impactPoint) return null;

  // Calculate particle count based on energy
  const particleCount = Math.max(3, Math.min(17, Math.floor(7 * energyScale)));

  return (
    <group ref={groupRef}>
      {/* Inner explosion core */}
      <mesh>
        <sphereGeometry args={[0.2 * energyScale, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>

      {/* Main explosion */}
      <mesh>
        <sphereGeometry args={[0.4 * energyScale, 16, 16]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
      </mesh>

      {/* Outer shockwave */}
      <mesh>
        <sphereGeometry args={[0.6 * energyScale, 16, 16]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.6} wireframe />
      </mesh>

      {/* Debris particles - more particles for larger explosions */}
      {Array.from({ length: particleCount }, (_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 2 * energyScale,
          (Math.random() - 0.5) * 2 * energyScale,
          (Math.random() - 0.5) * 2 * energyScale
        ]}>
          <sphereGeometry args={[0.02 * energyScale, 4, 4]} />
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

  // Calculate asteroid size based on energy
  const asteroidSize = useMemo(() => {
    // Energy is in megatons, scale asteroid size from 0.006 to 0.033 (3x smaller than before)
    const minEnergy = 0.1; // 0.1 megatons
    const maxEnergy = 1000; // 1000 megatons
    const energy = Math.max(minEnergy, Math.min(maxEnergy, asteroid.energy));

    // Logarithmic scaling for better visual distribution
    const logScale = Math.log10(energy / minEnergy) / Math.log10(maxEnergy / minEnergy);
    return Math.max(0.006, Math.min(0.033, 0.009 + logScale * 0.024));
  }, [asteroid.energy]);

  // Calculate trail length based on energy (larger asteroids have longer trails)
  const trailLength = useMemo(() => {
    return Math.max(3, Math.min(9, Math.floor(6 * (0.5 + asteroidSize * 2))));
  }, [asteroidSize]);

  const { startPos, endPos } = useMemo(() => {
    const startPos = camera.position.clone(); // Start from camera position
    const endPos = impactPoint ? impactPoint.clone() : new THREE.Vector3(0, 0, 1);
    return { startPos, endPos };
  }, [impactPoint, camera.position]);

  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(trailLength * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [trailLength]);

  // Calculate trajectory duration based on energy (larger asteroids move slower)
  const trajectoryDuration = useMemo(() => {
    return Math.max(0.8, Math.min(2.0, 1.0 + asteroidSize * 2));
  }, [asteroidSize]);

  useFrame(() => {
    if (!meshRef.current || !trailRef.current) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / trajectoryDuration, 1);

    const currentPos = startPos.clone().lerp(endPos, progress);
    meshRef.current.position.copy(currentPos);

    // Rotation speed based on size (smaller asteroids spin faster)
    const rotationSpeed = 0.2 / asteroidSize;
    meshRef.current.rotation.x += rotationSpeed;
    meshRef.current.rotation.y += rotationSpeed;

    const positions = trailRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < trailLength; i++) {
      const trailProgress = Math.max(0, progress - i * (0.02 / asteroidSize));
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
        <sphereGeometry args={[asteroidSize, 8, 8]} />
        <meshPhongMaterial
          color="#ff6600"
          emissive="#ff3300"
          emissiveIntensity={0.5 + asteroidSize * 0.5} // Brighter for larger asteroids
        />
      </mesh>
      <points ref={trailRef} geometry={trailGeometry}>
        <pointsMaterial
          size={0.003 * asteroidSize}
          color="#ffaa00"
          transparent
          opacity={0.8}
        />
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
      minDistance={1.5}
      maxDistance={60}
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
  const { camera, scene } = useThree();
  const [impactPoint, setImpactPoint] = useState<THREE.Vector3 | null>(null);
  const [showTrajectory, setShowTrajectory] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);

  // Listen for impact point creation events
  useEffect(() => {
    const handleSetImpactPoint = (event: CustomEvent) => {
      const { position, city } = event.detail;
      console.log('SceneContent: Setting impact point at:', position, 'for city:', city);
      setImpactPoint(position);
    };

    const handleCameraMove = (event: CustomEvent) => {
      const { city } = event.detail;
      console.log('SceneContent: Moving camera to city:', city);

      // Convert lat/lng to 3D position using the same method as the pin
      const latRad = (city.lat * Math.PI) / 180;
      const lngRad = (-city.lng * Math.PI) / 180; // Flip longitude (multiply by -1)

      // Animate camera to city position
      const startPosition = camera.position.clone();

      const duration = 2000; // 2 seconds
      const startTime = Date.now();

      const animateCamera = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth easing function
        const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const easedProgress = easeInOutCubic(progress);

        // Calculate city position using the same method as the pin (radius 1.02)
        const radius = 1.02;
        const cityPosition = new THREE.Vector3(
          radius * Math.cos(latRad) * Math.cos(lngRad),
          radius * Math.sin(latRad),
          radius * Math.cos(latRad) * Math.sin(lngRad)
        );

        // Calculate camera position (at distance from city)
        const endPosition = cityPosition.clone().multiplyScalar(2.5);

        // Interpolate position
        camera.position.lerpVectors(startPosition, endPosition, easedProgress);

        // Look at the city
        camera.lookAt(cityPosition);
        camera.updateMatrixWorld();

        if (progress < 1) {
          requestAnimationFrame(animateCamera);
        } else {
          // After animation, start following Earth's rotation
          startCameraFollow(city, latRad, lngRad);
        }
      };

      animateCamera();
    };

    // Function to make camera follow Earth's rotation
    const startCameraFollow = (city: { lat: number; lng: number; name: string; country: string; region: string; density: number }, latRad: number, lngRad: number) => {
      let isFollowing = true;

      const followEarth = () => {
        if (!isFollowing) return;

        // Calculate city position using the same method as the pin (radius 1.02)
        const radius = 1.02;
        const cityPosition = new THREE.Vector3(
          radius * Math.cos(latRad) * Math.cos(lngRad),
          radius * Math.sin(latRad),
          radius * Math.cos(latRad) * Math.sin(lngRad)
        );

        // Update camera to always look at the city (which rotates with Earth)
        camera.lookAt(cityPosition);
        camera.updateMatrixWorld();

        requestAnimationFrame(followEarth);
      };

      followEarth();

      // Stop following after 10 seconds or when new city is selected
      setTimeout(() => {
        isFollowing = false;
      }, 10000);
    };

    window.addEventListener('setImpactPoint', handleSetImpactPoint as EventListener);
    window.addEventListener('moveCameraToCity', handleCameraMove as EventListener);

    return () => {
      window.removeEventListener('setImpactPoint', handleSetImpactPoint as EventListener);
      window.removeEventListener('moveCameraToCity', handleCameraMove as EventListener);
    };
  }, []);

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

    // Calculate trajectory duration based on asteroid energy
    const minEnergy = 0.1;
    const maxEnergy = 1000;
    const energy = Math.max(minEnergy, Math.min(maxEnergy, scenario.energy));
    const logScale = Math.log10(energy / minEnergy) / Math.log10(maxEnergy / minEnergy);
    const asteroidSize = Math.max(0.006, Math.min(0.033, 0.009 + logScale * 0.024));
    const trajectoryDuration = Math.max(0.8, Math.min(2.0, 1.0 + asteroidSize * 2)) * 1000; // Convert to milliseconds

    // Calculate explosion duration based on energy
    const energyScale = Math.max(0.07, Math.min(1.67, 0.17 + logScale * 1.5));
    const explosionDuration = Math.max(1.5, Math.min(4.0, 2.0 + energyScale * 0.5)) * 1000; // Convert to milliseconds

    // Phase 1: Show asteroid trajectory from camera to impact point
    setLaunchingAsteroid(scenario);
    setShowTrajectory(true);
    setShowExplosion(false);

    // Wait for asteroid to reach impact point (dynamic duration)
    await new Promise(resolve => setTimeout(resolve, trajectoryDuration));

    // Phase 2: Hide trajectory and show explosion
    setShowTrajectory(false);
    setShowExplosion(true);

    // Show explosion for dynamic duration
    await new Promise(resolve => setTimeout(resolve, explosionDuration));

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

  // Camera movement event listener - dispatch to SceneContent
  useEffect(() => {
    const handleCameraMove = (event: CustomEvent) => {
      const { city } = event.detail;
      console.log('SpaceScene: Dispatching camera move to SceneContent for city:', city);

      // Dispatch event to SceneContent to handle camera movement
      const cameraEvent = new CustomEvent('moveCameraToCity', {
        detail: { city }
      });
      window.dispatchEvent(cameraEvent);
    };

    const handleCreateImpactPoint = (event: CustomEvent) => {
      const { position, city } = event.detail;
      console.log('SpaceScene: Creating impact point at:', position, 'for city:', city);

      // Dispatch event to SceneContent to set impact point
      const impactEvent = new CustomEvent('setImpactPoint', {
        detail: { position, city }
      });
      window.dispatchEvent(impactEvent);
    };

    window.addEventListener('moveCameraToCity', handleCameraMove as EventListener);
    window.addEventListener('createImpactPoint', handleCreateImpactPoint as EventListener);

    return () => {
      window.removeEventListener('moveCameraToCity', handleCameraMove as EventListener);
      window.removeEventListener('createImpactPoint', handleCreateImpactPoint as EventListener);
    };
  }, []);

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
    <div className="w-full h-screen bg-black">
      {/* 3D Scene - Full Screen */}
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

      {/* Asteroid List Sidebar - Left Side (like Solar System view) */}
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
