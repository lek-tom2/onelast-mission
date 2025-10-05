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

// Mini-Game Results Modal Component
function MiniGameResultsModal({ 
  asteroid, 
  impactScenario, 
  onClose 
}: {
  asteroid: { name: string; size: number; energy: number; velocity: number };
  impactScenario: ImpactScenario;
  onClose: () => void;
}) {
  // Calculate detailed consequences
  const consequences = useMemo(() => {
    const energy = asteroid.energy; // megatons
    const asteroidSize = asteroid.size; // meters
    
    // Base calculations
    const craterDiameter = Math.pow(energy, 0.25) * 2; // km
    const blastRadius = Math.pow(energy, 0.33) * 5; // km
    const thermalRadius = Math.pow(energy, 0.4) * 8; // km
    
    // Population impact (simplified)
    const populationDensity = 1000; // people per km²
    const blastCasualties = Math.floor(Math.PI * Math.pow(blastRadius, 2) * populationDensity * 0.9);
    const thermalCasualties = Math.floor(Math.PI * Math.pow(thermalRadius, 2) * populationDensity * 0.3);
    const totalCasualties = blastCasualties + thermalCasualties;
    
    // Environmental effects
    const magnitude = Math.min(9.5, 5.0 + Math.log10(energy));
    const tsunamiHeight = energy > 100 ? Math.pow(energy / 100, 0.5) * 20 : 0;
    
    return {
      crater: { diameter: craterDiameter, depth: craterDiameter * 0.2 },
      blast: { radius: blastRadius, casualties: blastCasualties },
      thermal: { radius: thermalRadius, casualties: thermalCasualties },
      total: { casualties: totalCasualties, economicDamage: totalCasualties * 50000 },
      seismic: { magnitude: magnitude, radius: magnitude * 100 },
      tsunami: { height: tsunamiHeight, affected: tsunamiHeight > 0 },
      atmosphere: {
        dustCloud: energy > 10,
        climateImpact: energy > 100,
        nuclearWinter: energy > 1000
      }
    };
  }, [asteroid, impactScenario]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-xl border-2 border-red-500 max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-red-400 mb-2">💥 MISSION COMPLETE</h2>
          <h3 className="text-2xl text-white">{asteroid.name} Impact</h3>
          <p className="text-gray-400">
            Target: {impactScenario.city} • Size: {asteroid.size}m • Energy: {asteroid.energy} MT
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Immediate Effects */}
          <div className="bg-red-900/30 p-4 rounded-lg">
            <h4 className="text-xl font-bold text-red-400 mb-3">🔥 Immediate Effects</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Crater Diameter:</span>
                <span className="text-red-300">{consequences.crater.diameter.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span>Crater Depth:</span>
                <span className="text-red-300">{consequences.crater.depth.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span>Blast Radius:</span>
                <span className="text-orange-300">{consequences.blast.radius.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span>Thermal Radius:</span>
                <span className="text-yellow-300">{consequences.thermal.radius.toFixed(1)} km</span>
              </div>
            </div>
          </div>

          {/* Casualties */}
          <div className="bg-orange-900/30 p-4 rounded-lg">
            <h4 className="text-xl font-bold text-orange-400 mb-3">💀 Human Impact</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Blast Casualties:</span>
                <span className="text-red-300">{consequences.blast.casualties.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Thermal Casualties:</span>
                <span className="text-orange-300">{consequences.thermal.casualties.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-600 pt-2">
                <span>Total Casualties:</span>
                <span className="text-red-400">{consequences.total.casualties.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Economic Damage:</span>
                <span className="text-yellow-300">${(consequences.total.economicDamage / 1e9).toFixed(1)}B</span>
              </div>
            </div>
          </div>

          {/* Environmental */}
          <div className="bg-green-900/30 p-4 rounded-lg">
            <h4 className="text-xl font-bold text-green-400 mb-3">🌍 Environmental</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Earthquake Magnitude:</span>
                <span className="text-yellow-300">{consequences.seismic.magnitude.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Seismic Radius:</span>
                <span className="text-orange-300">{consequences.seismic.radius.toFixed(0)} km</span>
              </div>
              <div className="flex justify-between">
                <span>Dust Cloud:</span>
                <span className={consequences.atmosphere.dustCloud ? 'text-red-300' : 'text-green-300'}>
                  {consequences.atmosphere.dustCloud ? 'Massive' : 'Minimal'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Climate Impact:</span>
                <span className={consequences.atmosphere.climateImpact ? 'text-red-300' : 'text-green-300'}>
                  {consequences.atmosphere.climateImpact ? 'Severe' : 'Localized'}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Effects */}
          <div className="bg-blue-900/30 p-4 rounded-lg">
            <h4 className="text-xl font-bold text-blue-400 mb-3">🌊 Secondary Effects</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tsunami Risk:</span>
                <span className={consequences.tsunami.affected ? 'text-red-300' : 'text-green-300'}>
                  {consequences.tsunami.affected ? 'High' : 'Low'}
                </span>
              </div>
              {consequences.tsunami.affected && (
                <div className="flex justify-between">
                  <span>Wave Height:</span>
                  <span className="text-blue-300">{consequences.tsunami.height.toFixed(1)} m</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Nuclear Winter:</span>
                <span className={consequences.atmosphere.nuclearWinter ? 'text-red-300' : 'text-green-300'}>
                  {consequences.atmosphere.nuclearWinter ? 'Possible' : 'Unlikely'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Global Impact:</span>
                <span className="text-yellow-300">
                  {asteroid.energy > 1000 ? 'Extinction Event' : 
                   asteroid.energy > 100 ? 'Regional Catastrophe' : 'Local Disaster'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-lg font-bold"
          >
            Return to Solar System
          </button>
        </div>
      </div>
    </div>
  );
}

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

    // Create a curved trajectory with a lower peak
    const currentPos = startPos.clone().lerp(endPos, progress);

    // Add a very subtle curved arc that peaks at 30% of the distance and goes lower
    const arcHeight = 0.05; // Even smaller arc for very subtle curve
    const arcProgress = Math.sin(progress * Math.PI); // Creates a smooth arc
    const arcOffset = new THREE.Vector3(0, arcHeight * arcProgress, 0);

    currentPos.add(arcOffset);
    meshRef.current.position.copy(currentPos);

    // Rotation speed based on size (smaller asteroids spin faster)
    const rotationSpeed = 0.2 / asteroidSize;
    meshRef.current.rotation.x += rotationSpeed;
    meshRef.current.rotation.y += rotationSpeed;

    const positions = trailRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < trailLength; i++) {
      const trailProgress = Math.max(0, progress - i * (0.02 / asteroidSize));
      const trailPos = startPos.clone().lerp(endPos, trailProgress);

      // Apply the same curved arc to the trail
      const trailArcProgress = Math.sin(trailProgress * Math.PI);
      const trailArcOffset = new THREE.Vector3(0, arcHeight * trailArcProgress, 0);
      trailPos.add(trailArcOffset);

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
  setLaunchHandler,
  onMiniGameImpact
}: {
  launchingAsteroid: ImpactScenario | null;
  setLaunchingAsteroid: (asteroid: ImpactScenario | null) => void;
  setLaunchHandler: (handler: (scenario: ImpactScenario) => void) => void;
  onMiniGameImpact?: () => void;
}) {
  const { camera, scene } = useThree();
  const [impactPoint, setImpactPoint] = useState<THREE.Vector3 | null>(null);
  const [showTrajectory, setShowTrajectory] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showPin, setShowPin] = useState(true);

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
      const latRad = ((city.lat + 1.5) * Math.PI) / 180; // Add 1.5 degrees to latitude to move north
      const lngRad = ((-city.lng - 0.25) * Math.PI) / 180; // Flip longitude and subtract 0.25 degrees offset

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
    setShowPin(false); // Hide pin when launching

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

    // Phase 4: Show pin again after 2 seconds
    setTimeout(() => {
      setShowPin(true);
    }, 2000);
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
        showPin={showPin}
        onMiniGameImpact={onMiniGameImpact}
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
  const { 
    selectedAsteroidDetails, 
    selectAsteroidDetails, 
    showConsequences,
    isMiniGameActive,
    miniGameAsteroid,
    deactivateMiniGame
  } = useAsteroidStore();
  const [realScenarios, setRealScenarios] = useState<ImpactScenario[]>([]);
  const [miniGameScenarios, setMiniGameScenarios] = useState<ImpactScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [launchingAsteroid, setLaunchingAsteroid] = useState<ImpactScenario | null>(null);
  const [launchHandler, setLaunchHandler] = useState<((scenario: ImpactScenario) => void) | null>(null);
  const [hasImpactPoint, setHasImpactPoint] = useState(false);
  const [gameResultShown, setGameResultShown] = useState(false);

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

  // Create mini-game scenario when mini-game is active
  useEffect(() => {
    if (isMiniGameActive && miniGameAsteroid && !gameResultShown) {
      console.log('🎮 Creating mini-game scenario for:', miniGameAsteroid.name);
      
      const miniGameScenario: ImpactScenario = {
        id: `minigame-${miniGameAsteroid.name}`,
        name: miniGameAsteroid.name,
        position: { lat: 0, lng: 0 }, // Will be set by Earth click
        city: 'Target Location',
        asteroidSize: miniGameAsteroid.size,
        energy: miniGameAsteroid.energy,
        casualties: Math.floor(miniGameAsteroid.energy * 100000), // Rough estimate
        tsunami: miniGameAsteroid.energy > 100,
        blastRadius: Math.pow(miniGameAsteroid.energy, 0.33) * 5,
        craterSize: Math.pow(miniGameAsteroid.energy, 0.25) * 2
      };
      
      setMiniGameScenarios([miniGameScenario]);
      setLoading(false);
    } else if (!isMiniGameActive) {
      setMiniGameScenarios([]);
      setGameResultShown(false);
    }
  }, [isMiniGameActive, miniGameAsteroid, gameResultShown]);

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

  // Handle mini-game impact results
  const handleMiniGameImpact = () => {
    if (isMiniGameActive) {
      setGameResultShown(true);
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
            onMiniGameImpact={handleMiniGameImpact}
          />
        </Suspense>
      </Canvas>

      {/* Asteroid List Sidebar - Left Side (like Solar System view) */}
      <ScenarioPanel
        scenarios={loading ? [] : (isMiniGameActive ? miniGameScenarios : realScenarios)}
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
        onClose={() => {
          selectAsteroidDetails(null);
          // Clear selected city
          const { setSelectedCity } = useAsteroidStore.getState();
          setSelectedCity(null);
          // Clear impact visualization
          const clearEvent = new CustomEvent('clearImpactVisualization');
          window.dispatchEvent(clearEvent);
        }}
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

      {/* Mini-Game Results Modal */}
      {isMiniGameActive && miniGameAsteroid && gameResultShown && (
        <MiniGameResultsModal 
          asteroid={miniGameAsteroid}
          impactScenario={miniGameScenarios[0] || {
            city: 'Impact Zone',
            country: 'Earth',
            population: 1000000,
            description: 'Direct impact',
            coordinates: { latitude: 0, longitude: 0 }
          }}
          onClose={() => {
            setGameResultShown(false);
            deactivateMiniGame();
          }}
        />
      )}
    </div>
  );
}
