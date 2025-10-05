'use client';
import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import Earth from './Earth';
import AsteroidDetailsPanel from './AsteroidDetailsPanel';
import { trajectoryCalculator } from '@/lib/services/trajectoryCalculator';
import { ImpactScenario } from '@/lib/types/asteroid';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import toast, { Toaster } from 'react-hot-toast';

// Impact Explosion Component (copied from SpaceScene)
function ImpactExplosion({ asteroid, impactPoint }: { asteroid: ImpactScenario; impactPoint?: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());

  const energyScale = Math.max(0.07, Math.min(1.67, 0.17 + (asteroid.energy / 1000) * 1.5));
  const explosionDuration = Math.max(1.5, Math.min(4.0, 2.0 + energyScale * 0.5));

  useFrame(() => {
    if (!groupRef.current || !impactPoint) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / explosionDuration, 1);

    groupRef.current.position.copy(impactPoint);
    groupRef.current.scale.setScalar(progress * energyScale);

    if (progress >= 1) {
      groupRef.current.visible = false;
    }
  });

  if (!impactPoint) return null;

  return (
    <group ref={groupRef}>
      {/* Core explosion */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ff3300" transparent opacity={0.8} />
      </mesh>
      
      {/* Outer blast */}
      <mesh scale={[2, 2, 2]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.4} />
      </mesh>
      
      {/* Shockwave */}
      <mesh scale={[4, 4, 4]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// Game Asteroid Component
function GameAsteroid({ scenario }: { scenario: ImpactScenario }) {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const [position, setPosition] = useState(new THREE.Vector3(3, 1, 2));

  useFrame(() => {
    if (asteroidRef.current) {
      asteroidRef.current.rotation.x += 0.01;
      asteroidRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={asteroidRef} position={position}>
      <dodecahedronGeometry args={[0.1, 0]} />
      <meshStandardMaterial 
        color="#8C7853"
        roughness={0.7}
        metalness={0.3}
        emissive="#332211"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// Impact Result Display
function ImpactResults({ 
  scenario, 
  impactLocation, 
  onClose 
}: { 
  scenario: ImpactScenario; 
  impactLocation: THREE.Vector3;
  onClose: () => void;
}) {
  const [consequences, setConsequences] = useState<any>(null);

  useEffect(() => {
    // Calculate impact consequences based on asteroid and location
    const calculateConsequences = () => {
      const energy = scenario.energy; // megatons
      const asteroidSize = scenario.asteroidSize; // meters
      
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
        crater: {
          diameter: craterDiameter,
          depth: craterDiameter * 0.2
        },
        blast: {
          radius: blastRadius,
          casualties: blastCasualties
        },
        thermal: {
          radius: thermalRadius,
          casualties: thermalCasualties
        },
        total: {
          casualties: totalCasualties,
          economicDamage: totalCasualties * 50000 // $50k per casualty rough estimate
        },
        seismic: {
          magnitude: magnitude,
          radius: magnitude * 100
        },
        tsunami: {
          height: tsunamiHeight,
          affected: tsunamiHeight > 0
        },
        atmosphere: {
          dustCloud: energy > 10,
          climateImpact: energy > 100,
          nuclearWinter: energy > 1000
        }
      };
    };

    setConsequences(calculateConsequences());
  }, [scenario, impactLocation]);

  if (!consequences) return null;

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-xl border-2 border-red-500 max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-red-400 mb-2">💥 IMPACT ANALYSIS</h2>
          <h3 className="text-2xl text-white">{scenario.name}</h3>
          <p className="text-gray-400">Asteroid: {scenario.asteroidSize}m diameter, {scenario.energy} megatons</p>
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

          {/* Human Impact */}
          <div className="bg-orange-900/30 p-4 rounded-lg">
            <h4 className="text-xl font-bold text-orange-400 mb-3">👥 Human Impact</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Blast Casualties:</span>
                <span className="text-red-300">{consequences.blast.casualties.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Thermal Casualties:</span>
                <span className="text-orange-300">{consequences.thermal.casualties.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total Casualties:</span>
                <span className="text-red-400">{consequences.total.casualties.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Economic Damage:</span>
                <span className="text-yellow-300">${(consequences.total.economicDamage / 1e9).toFixed(1)}B</span>
              </div>
            </div>
          </div>

          {/* Environmental Effects */}
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
                  {consequences.atmosphere.dustCloud ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Climate Impact:</span>
                <span className={consequences.atmosphere.climateImpact ? 'text-red-300' : 'text-green-300'}>
                  {consequences.atmosphere.climateImpact ? 'Significant' : 'Minimal'}
                </span>
              </div>
            </div>
          </div>

          {/* Tsunami Effects */}
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
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-lg font-bold"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

interface DestructionSceneProps {
  onBackToSolar: () => void;
}

export default function DestructionScene({ onBackToSolar }: DestructionSceneProps) {
  const { gameScenario, deactivateGameMode, markGameCompleted, selectAsteroidDetails } = useAsteroidStore();
  const [impactPoint, setImpactPoint] = useState<THREE.Vector3 | null>(null);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isTargeting, setIsTargeting] = useState(true);

  // Set asteroid details for Earth component when game starts
  useEffect(() => {
    if (gameScenario && isTargeting) {
      selectAsteroidDetails(gameScenario);
    }
  }, [gameScenario, selectAsteroidDetails, isTargeting]);

  // Handle scenario selection from Earth component
  const handleScenarioSelect = (scenario: ImpactScenario) => {
    setImpactPoint(scenario.position ? new THREE.Vector3(scenario.position.lat, 0, scenario.position.lng) : null);
    setIsTargeting(false);
    setShowExplosion(true);
    
    // Show results after explosion
    setTimeout(() => {
      setShowResults(true);
    }, 3000);

    toast.success(`Impact at ${scenario.city}!`, {
      icon: '🎯',
      duration: 2000,
    });
  };

  const handleClose = () => {
    if (gameScenario) {
      markGameCompleted(gameScenario.id);
    }
    deactivateGameMode();
    onBackToSolar();
  };

  if (!gameScenario) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-white mb-4">No active destruction scenario</h2>
          <button 
            onClick={onBackToSolar}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Solar System
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black relative">
      <Toaster position="top-right" />
      
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        {/* Enhanced Lighting */}
        <ambientLight intensity={0.4} color="#ffffff" />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.2} 
          color="#ffffff"
          castShadow
        />
        <pointLight position={[0, 0, 0]} intensity={0.8} color="#ffeb3b" />
        <pointLight position={[5, 0, 0]} intensity={0.3} color="#ff9800" />

        {/* Background */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />

        {/* Earth with click handling */}
        <Suspense fallback={null}>
          <Earth 
            onScenarioSelect={handleScenarioSelect}
            onImpactPointChange={(point) => setImpactPoint(point)}
            showPin={true}
          />
        </Suspense>

        {/* Game Asteroid */}
        <GameAsteroid scenario={gameScenario} />

        {/* Impact Explosion */}
        {showExplosion && impactPoint && (
          <ImpactExplosion asteroid={gameScenario} impactPoint={impactPoint} />
        )}

        {/* Camera Controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={10}
          minDistance={2}
        />
      </Canvas>

      {/* Instructions UI */}
      {isTargeting && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/90 p-6 rounded-lg border border-red-500/50 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-2">🎯 TARGET SELECTION</h2>
            <h3 className="text-xl text-white mb-2">{gameScenario.name}</h3>
            <p className="text-gray-300 mb-4">
              Asteroid: {gameScenario.asteroidSize}m diameter, {gameScenario.energy} megatons
            </p>
            <p className="text-yellow-400 text-lg font-bold">
              Click on Earth to select impact location
            </p>
            <button 
              onClick={handleClose}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Asteroid Info Panel */}
      <div className="absolute bottom-4 left-4 z-40">
        <div className="bg-black/90 p-4 rounded-lg border border-red-500/50">
          <h3 className="text-lg font-bold text-red-400 mb-2">Active Threat</h3>
          <div className="text-white">
            <p className="font-semibold">{gameScenario.name}</p>
            <p className="text-sm text-gray-300">Size: {gameScenario.asteroidSize}m</p>
            <p className="text-sm text-gray-300">Energy: {gameScenario.energy} MT</p>
            <p className="text-sm text-gray-300">Casualties: {gameScenario.casualties.toLocaleString()}</p>
          </div>
          <button 
            onClick={handleClose}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full"
          >
            Abort Mission
          </button>
        </div>
      </div>

      {/* Impact Results */}
      {showResults && impactPoint && (
        <ImpactResults 
          scenario={gameScenario}
          impactLocation={impactPoint}
          onClose={handleClose}
        />
      )}
    </div>
  );
}