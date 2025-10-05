'use client';
import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { ImpactScenario } from '@/lib/types/asteroid';
import Earth from './Earth';

interface TrajectoryParams {
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  angle: number; // approach angle in degrees
  distance: number; // starting distance from Earth
}

interface GameState {
  isActive: boolean;
  timeLeft: number; // seconds
  trajectoryParams: TrajectoryParams;
  impactProbability: number; // 0-100%
  gameResult: 'playing' | 'hit' | 'miss' | 'timeout';
  finalDistance: number; // closest approach distance
}

interface EarthDestructionGameV2Props {
  scenario: ImpactScenario;
  onGameEnd: (result: 'hit' | 'miss' | 'timeout', accuracy: number) => void;
  onExit: () => void;
}

// Asteroid component
function GameAsteroid({ 
  trajectoryParams,
  timeLeft,
  onTrajectoryUpdate
}: { 
  trajectoryParams: TrajectoryParams;
  timeLeft: number;
  onTrajectoryUpdate: (trajectory: THREE.Vector3[], impactProb: number, finalDistance: number) => void;
}) {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const [trajectory, setTrajectory] = useState<THREE.Vector3[]>([]);

  useFrame(() => {
    if (asteroidRef.current) {
      // Rotate asteroid
      asteroidRef.current.rotation.x += 0.01;
      asteroidRef.current.rotation.y += 0.005;
    }
  });

  // Calculate trajectory based on parameters
  useEffect(() => {
    const newTrajectory: THREE.Vector3[] = [];
    const steps = 100;
    const earthRadius = 1; // Earth sphere radius in our scene
    
    // Starting position (far from Earth)
    const startPos = new THREE.Vector3(
      Math.cos(trajectoryParams.angle * Math.PI / 180) * trajectoryParams.distance,
      0,
      Math.sin(trajectoryParams.angle * Math.PI / 180) * trajectoryParams.distance
    );

    // Calculate trajectory points
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pos = new THREE.Vector3(
        startPos.x + t * trajectoryParams.velocityX * -5, // Move towards Earth
        startPos.y + t * trajectoryParams.velocityY * 2,
        startPos.z + t * trajectoryParams.velocityZ * 2
      );
      newTrajectory.push(pos);
    }

    setTrajectory(newTrajectory);

    // Calculate closest approach to Earth (at origin)
    let closestDistance = Infinity;
    newTrajectory.forEach(point => {
      const distance = point.length(); // Distance from origin (Earth center)
      if (distance < closestDistance) {
        closestDistance = distance;
      }
    });

    // Calculate impact probability based on closest approach
    const impactThreshold = earthRadius + 0.1; // Small margin for atmosphere
    const impactProb = Math.max(0, Math.min(100, 
      100 * (impactThreshold - closestDistance) / impactThreshold
    ));

    onTrajectoryUpdate(newTrajectory, Math.max(0, impactProb), closestDistance);
  }, [trajectoryParams, onTrajectoryUpdate]);

  // Position asteroid along trajectory based on time
  const getAsteroidPosition = () => {
    if (trajectory.length === 0) return new THREE.Vector3(5, 0, 0);
    
    const progress = 1 - (timeLeft / 60); // Assuming 60 second total time
    const index = Math.floor(progress * (trajectory.length - 1));
    return trajectory[Math.min(index, trajectory.length - 1)] || new THREE.Vector3(5, 0, 0);
  };

  return (
    <group>
      {/* Asteroid */}
      <mesh
        ref={asteroidRef}
        position={getAsteroidPosition()}
      >
        <dodecahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial 
          color="#8C7853"
          roughness={0.7}
          metalness={0.3}
          emissive="#332211"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Trajectory line */}
      {trajectory.length > 1 && (
        <Line
          points={trajectory}
          color="#ff6600"
          lineWidth={4}
          transparent
          opacity={0.9}
        />
      )}

      {/* Trajectory end marker */}
      {trajectory.length > 0 && (
        <mesh position={trajectory[trajectory.length - 1]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

// Enhanced Earth with better lighting
function BrightEarth() {
  const earthRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group>
      {/* Earth */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color="#4A90E2"
          roughness={0.8}
          metalness={0.1}
          emissive="#1a3d5c"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Atmosphere glow */}
      <mesh scale={[1.05, 1.05, 1.05]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#87CEEB"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// UI Controls Component
function GameControls({ 
  trajectoryParams, 
  onParamsChange, 
  gameState, 
  onExit 
}: {
  trajectoryParams: TrajectoryParams;
  onParamsChange: (params: TrajectoryParams) => void;
  gameState: GameState;
  onExit: () => void;
}) {
  return (
    <div className="absolute top-4 left-4 w-80 bg-black/90 p-6 rounded-lg border border-red-500/50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-red-400">🚀 Asteroid Control</h2>
        <button 
          onClick={onExit}
          className="text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      {/* Timer */}
      <div className="mb-4 text-center">
        <div className="text-3xl font-mono text-yellow-400">
          {Math.ceil(gameState.timeLeft)}s
        </div>
        <div className="text-sm text-gray-400">Time Remaining</div>
      </div>

      {/* Impact Probability */}
      <div className="mb-4 text-center">
        <div className={`text-2xl font-bold ${
          gameState.impactProbability > 80 ? 'text-red-400' :
          gameState.impactProbability > 50 ? 'text-yellow-400' :
          'text-green-400'
        }`}>
          {gameState.impactProbability.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-400">Impact Probability</div>
      </div>

      {/* Closest Approach */}
      <div className="mb-6 text-center">
        <div className="text-lg text-blue-400">
          {(gameState.finalDistance * 6371).toFixed(0)} km
        </div>
        <div className="text-sm text-gray-400">Closest Approach</div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Velocity X */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Velocity X: {trajectoryParams.velocityX.toFixed(2)}
          </label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={trajectoryParams.velocityX}
            onChange={(e) => onParamsChange({
              ...trajectoryParams,
              velocityX: parseFloat(e.target.value)
            })}
            className="w-full accent-red-500"
          />
        </div>

        {/* Velocity Y */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Velocity Y: {trajectoryParams.velocityY.toFixed(2)}
          </label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={trajectoryParams.velocityY}
            onChange={(e) => onParamsChange({
              ...trajectoryParams,
              velocityY: parseFloat(e.target.value)
            })}
            className="w-full accent-red-500"
          />
        </div>

        {/* Velocity Z */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Velocity Z: {trajectoryParams.velocityZ.toFixed(2)}
          </label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={trajectoryParams.velocityZ}
            onChange={(e) => onParamsChange({
              ...trajectoryParams,
              velocityZ: parseFloat(e.target.value)
            })}
            className="w-full accent-red-500"
          />
        </div>

        {/* Approach Angle */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Approach Angle: {trajectoryParams.angle.toFixed(0)}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={trajectoryParams.angle}
            onChange={(e) => onParamsChange({
              ...trajectoryParams,
              angle: parseFloat(e.target.value)
            })}
            className="w-full accent-red-500"
          />
        </div>

        {/* Starting Distance */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Start Distance: {trajectoryParams.distance.toFixed(1)}
          </label>
          <input
            type="range"
            min="3"
            max="8"
            step="0.2"
            value={trajectoryParams.distance}
            onChange={(e) => onParamsChange({
              ...trajectoryParams,
              distance: parseFloat(e.target.value)
            })}
            className="w-full accent-red-500"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500">
        🎯 Adjust trajectory to impact Earth!<br />
        🔴 Red trajectory shows asteroid path<br />
        ⏱️ You have 60 seconds to succeed
      </div>
    </div>
  );
}

export default function EarthDestructionGameV2({ scenario, onGameEnd, onExit }: EarthDestructionGameV2Props) {
  const { markGameCompleted } = useAsteroidStore();
  
  const [gameState, setGameState] = useState<GameState>({
    isActive: true,
    timeLeft: 60, // 60 seconds
    trajectoryParams: {
      velocityX: 0.5,
      velocityY: 0,
      velocityZ: 0,
      angle: 45,
      distance: 6
    },
    impactProbability: 0,
    gameResult: 'playing',
    finalDistance: 999
  });

  // Game timer
  useEffect(() => {
    if (gameState.isActive && gameState.timeLeft > 0) {
      const timer = setInterval(() => {
        setGameState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          
          if (newTimeLeft <= 0) {
            // Game timeout
            const result = prev.impactProbability >= 80 ? 'hit' : 'timeout';
            markGameCompleted(scenario.id);
            onGameEnd(result, prev.impactProbability);
            return { ...prev, timeLeft: 0, gameResult: result, isActive: false };
          }
          
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState.isActive, gameState.timeLeft, gameState.impactProbability, onGameEnd, scenario.id, markGameCompleted]);

  const handleTrajectoryUpdate = (trajectory: THREE.Vector3[], impactProb: number, finalDistance: number) => {
    setGameState(prev => ({
      ...prev,
      impactProbability: impactProb,
      finalDistance: finalDistance
    }));

    // Auto-win if high probability achieved
    if (impactProb >= 80 && gameState.isActive) {
      markGameCompleted(scenario.id);
      onGameEnd('hit', impactProb);
      setGameState(prev => ({ ...prev, gameResult: 'hit', isActive: false }));
    }
  };

  const handleParamsChange = (newParams: TrajectoryParams) => {
    setGameState(prev => ({ ...prev, trajectoryParams: newParams }));
  };

  const handleExit = () => {
    markGameCompleted(scenario.id);
    onExit();
  };

  return (
    <div className="w-full h-screen bg-black relative">
      <Canvas camera={{ position: [3, 2, 5], fov: 75 }}>
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
        <pointLight position={[-5, 5, 5]} intensity={0.4} color="#2196f3" />

        {/* Background */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />

        {/* Earth */}
        <BrightEarth />

        {/* Asteroid */}
        <GameAsteroid 
          trajectoryParams={gameState.trajectoryParams}
          timeLeft={gameState.timeLeft}
          onTrajectoryUpdate={handleTrajectoryUpdate}
        />

        {/* Camera Controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={15}
          minDistance={2}
        />
      </Canvas>

      {/* Game Controls UI */}
      <GameControls 
        trajectoryParams={gameState.trajectoryParams}
        onParamsChange={handleParamsChange}
        gameState={gameState}
        onExit={handleExit}
      />

      {/* Game Result Overlay */}
      {!gameState.isActive && (
        <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
          <div className="bg-gray-900 p-8 rounded-lg border-2 border-red-500 text-center">
            <h2 className="text-4xl font-bold mb-4 text-white">
              {gameState.gameResult === 'hit' ? '🎯 IMPACT!' : 
               gameState.gameResult === 'timeout' ? '⏰ TIME UP!' : '❌ MISSED!'}
            </h2>
            <p className="text-xl text-gray-300 mb-2">
              Final Impact Probability: {gameState.impactProbability.toFixed(1)}%
            </p>
            <p className="text-lg text-gray-400 mb-6">
              Closest Approach: {(gameState.finalDistance * 6371).toFixed(0)} km
            </p>
            <button 
              onClick={handleExit}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Exit Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}