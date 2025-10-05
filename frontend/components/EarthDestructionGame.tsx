'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { ImpactScenario } from '@/lib/types/asteroid';
import Earth from './Earth';

interface GameState {
  isActive: boolean;
  asteroidPosition: THREE.Vector3;
  targetPosition: THREE.Vector3 | null;
  trajectory: THREE.Vector3[];
  timeLeft: number; // seconds
  accuracy: number; // 0-100%
  gameResult: 'playing' | 'hit' | 'miss' | 'timeout';
}

interface EarthDestructionGameProps {
  scenario: ImpactScenario;
  onGameEnd: (result: 'hit' | 'miss' | 'timeout', accuracy: number) => void;
  onExit: () => void;
}

// Asteroid component for the game
function GameAsteroid({ 
  position, 
  trajectory, 
  onTargetChange 
}: { 
  position: THREE.Vector3;
  trajectory: THREE.Vector3[];
  onTargetChange: (target: THREE.Vector3 | null) => void;
}) {
  const asteroidRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { camera } = useThree();

  useFrame(() => {
    if (asteroidRef.current && !isDragging) {
      // Rotate asteroid
      asteroidRef.current.rotation.x += 0.01;
      asteroidRef.current.rotation.y += 0.005;
    }
  });

  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerMove = (event: any) => {
    if (isDragging) {
      // Update trajectory target based on mouse movement
      const newTarget = event.point.clone();
      onTargetChange(newTarget);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };

  return (
    <group>
      {/* Asteroid */}
      <mesh
        ref={asteroidRef}
        position={position}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={() => document.body.style.cursor = 'grab'}
        onPointerOut={() => !isDragging && (document.body.style.cursor = 'default')}
      >
        <dodecahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial 
          color="#8C7853"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Trajectory line */}
      {trajectory.length > 1 && (
        <Line
          points={trajectory}
          color="#ff6600"
          lineWidth={3}
          transparent
          opacity={0.8}
        />
      )}

      {/* Trajectory prediction cone */}
      {trajectory.length > 1 && (
        <mesh position={trajectory[trajectory.length - 1]}>
          <coneGeometry args={[0.05, 0.2, 8]} />
          <meshBasicMaterial 
            color="#ff6600"
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}

// Trajectory calculator for the game
function calculateTrajectory(start: THREE.Vector3, target: THREE.Vector3 | null): THREE.Vector3[] {
  if (!target) return [start];

  const points: THREE.Vector3[] = [];
  const steps = 20;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Simple linear interpolation (can be made more realistic with physics)
    const point = start.clone().lerp(target, t);
    points.push(point);
  }

  return points;
}

// Calculate accuracy based on trajectory endpoint vs Earth surface
function calculateAccuracy(trajectory: THREE.Vector3[]): number {
  if (trajectory.length === 0) return 0;

  const endpoint = trajectory[trajectory.length - 1];
  const earthRadius = 1.0; // Earth sphere radius in the scene
  const distanceFromEarth = endpoint.length();

  if (distanceFromEarth <= earthRadius) {
    // Direct hit
    return 100;
  } else {
    // Miss - calculate how close it got
    const missDistance = distanceFromEarth - earthRadius;
    const maxMissDistance = 2.0; // Maximum distance we consider for partial score
    
    if (missDistance >= maxMissDistance) return 0;
    
    return Math.max(0, (1 - missDistance / maxMissDistance) * 100);
  }
}

// Game scene content
function GameSceneContent({ 
  scenario, 
  gameState, 
  onGameStateChange 
}: {
  scenario: ImpactScenario;
  gameState: GameState;
  onGameStateChange: (state: Partial<GameState>) => void;
}) {
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);

  // Calculate trajectory when target changes
  const trajectory = useMemo(() => {
    return calculateTrajectory(gameState.asteroidPosition, targetPosition);
  }, [gameState.asteroidPosition, targetPosition]);

  // Update accuracy when trajectory changes
  useEffect(() => {
    const accuracy = calculateAccuracy(trajectory);
    onGameStateChange({ 
      trajectory, 
      accuracy,
      targetPosition 
    });
  }, [trajectory, onGameStateChange]);

  // Countdown timer
  useFrame((state, delta) => {
    if (gameState.gameResult === 'playing' && gameState.timeLeft > 0) {
      const newTimeLeft = Math.max(0, gameState.timeLeft - delta);
      onGameStateChange({ timeLeft: newTimeLeft });
      
      if (newTimeLeft === 0) {
        onGameStateChange({ gameResult: 'timeout' });
      }
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#4444ff" />
      
      {/* Stars background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
      
      {/* Earth at center */}
      <Earth 
        showPin={false}
        onImpactPointChange={() => {}} // Disabled for game mode
      />
      
      {/* Game asteroid */}
      <GameAsteroid
        position={gameState.asteroidPosition}
        trajectory={trajectory}
        onTargetChange={setTargetPosition}
      />
      
      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={10}
        target={[0, 0, 0]}
      />
    </>
  );
}

// Game UI overlay
function GameUI({ 
  scenario, 
  gameState, 
  onFireAsteroid, 
  onExit 
}: {
  scenario: ImpactScenario;
  gameState: GameState;
  onFireAsteroid: () => void;
  onExit: () => void;
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#00ff00';
    if (accuracy >= 70) return '#ffff00';
    if (accuracy >= 50) return '#ff8800';
    return '#ff0000';
  };

  return (
    <>
      {/* Game HUD */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <h2 className="text-xl font-bold mb-2 text-red-400">🌍 DESTROY EARTH MODE</h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-400">Asteroid:</span> {scenario.name}
          </div>
          <div>
            <span className="text-gray-400">Size:</span> {scenario.asteroidSize.toFixed(0)}m
          </div>
          <div>
            <span className="text-gray-400">Energy:</span> {scenario.energy.toFixed(1)} MT
          </div>
        </div>
      </div>

      {/* Trajectory stats */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <h3 className="text-lg font-bold mb-2">Trajectory Analysis</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Time Left:</span>
            <span className={gameState.timeLeft < 30 ? 'text-red-400' : 'text-white'}>
              {formatTime(gameState.timeLeft)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Accuracy:</span>
            <span style={{ color: getAccuracyColor(gameState.accuracy) }}>
              {gameState.accuracy.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={
              gameState.gameResult === 'playing' ? 'text-yellow-400' :
              gameState.gameResult === 'hit' ? 'text-green-400' :
              'text-red-400'
            }>
              {gameState.gameResult.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <h3 className="text-lg font-bold mb-2">Controls</h3>
        <div className="space-y-2 text-sm">
          <div>• Drag asteroid to aim trajectory</div>
          <div>• Get 90%+ accuracy to hit Earth</div>
          <div>• Red cone shows impact prediction</div>
        </div>
        
        <div className="flex space-x-2 mt-4">
          {gameState.gameResult === 'playing' && (
            <button
              onClick={onFireAsteroid}
              disabled={gameState.accuracy < 50}
              className={`px-4 py-2 rounded font-semibold ${
                gameState.accuracy >= 50
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              🔥 FIRE ASTEROID
            </button>
          )}
          
          <button
            onClick={onExit}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
          >
            ← Exit Game
          </button>
        </div>
      </div>

      {/* Game result overlay */}
      {gameState.gameResult !== 'playing' && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-black/90 rounded-lg p-8 text-center text-white max-w-md">
            <h2 className="text-3xl font-bold mb-4">
              {gameState.gameResult === 'hit' && '🎯 DIRECT HIT!'}
              {gameState.gameResult === 'miss' && '❌ MISSED!'}
              {gameState.gameResult === 'timeout' && '⏰ TIME UP!'}
            </h2>
            
            <div className="space-y-2 mb-6">
              <div>Final Accuracy: <span style={{ color: getAccuracyColor(gameState.accuracy) }}>
                {gameState.accuracy.toFixed(1)}%
              </span></div>
              
              {gameState.gameResult === 'hit' && (
                <div className="text-red-400">
                  <div>🌍 Earth has been destroyed!</div>
                  <div>Estimated casualties: {scenario.casualties.toLocaleString()}</div>
                </div>
              )}
              
              {gameState.gameResult === 'miss' && (
                <div className="text-blue-400">
                  🌍 Earth survives! Asteroid missed by {(2 - gameState.accuracy/50).toFixed(2)} Earth radii
                </div>
              )}
              
              {gameState.gameResult === 'timeout' && (
                <div className="text-yellow-400">
                  ⏰ Time ran out! Asteroid drifted away from Earth
                </div>
              )}
            </div>
            
            <button
              onClick={onExit}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
            >
              Return to Solar System
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Main game component
export default function EarthDestructionGame({ scenario, onGameEnd, onExit }: EarthDestructionGameProps) {
  const [gameState, setGameState] = useState<GameState>({
    isActive: true,
    asteroidPosition: new THREE.Vector3(-3, 1, 2), // Start position away from Earth
    targetPosition: null,
    trajectory: [],
    timeLeft: 120, // 2 minutes
    accuracy: 0,
    gameResult: 'playing'
  });

  const updateGameState = (updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  };

  const handleFireAsteroid = () => {
    if (gameState.accuracy >= 90) {
      updateGameState({ gameResult: 'hit' });
      onGameEnd('hit', gameState.accuracy);
    } else {
      updateGameState({ gameResult: 'miss' });
      onGameEnd('miss', gameState.accuracy);
    }
  };

  const handleExit = () => {
    if (gameState.gameResult === 'playing') {
      onGameEnd('timeout', gameState.accuracy);
    }
    onExit();
  };

  // End game when time runs out
  useEffect(() => {
    if (gameState.timeLeft <= 0 && gameState.gameResult === 'playing') {
      updateGameState({ gameResult: 'timeout' });
      onGameEnd('timeout', gameState.accuracy);
    }
  }, [gameState.timeLeft, gameState.gameResult, onGameEnd]);

  return (
    <div className="w-full h-screen bg-black">
      <Canvas
        camera={{ position: [0, 2, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      >
        <GameSceneContent
          scenario={scenario}
          gameState={gameState}
          onGameStateChange={updateGameState}
        />
      </Canvas>
      
      <GameUI
        scenario={scenario}
        gameState={gameState}
        onFireAsteroid={handleFireAsteroid}
        onExit={handleExit}
      />
    </div>
  );
}