'use client';
import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import SolarSystemContent from './components/SolarSystemContent';
import FancyTimeControls from './components/FancyTimeControls';
import FancySidebar from './components/FancySidebar';
import GameModeSelector from '../GameModeSelector';
import AsteroidListPanel from '../AsteroidListPanel';
import AsteroidEditFullPanel from '../AsteroidEditFullPanel';
import { PLANETARY_ELEMENTS } from './constants/planetaryElements';
import { TimeState, NEOObject, ImpactPrediction } from './utils';
import { getCurrentJulianDate } from './utils/timeUtils';
import { useNEOData } from '@/lib/hooks/useNEOData';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import * as THREE from 'three';

export default function SolarSystemScene() {
  const { neoObjects, loading, error, lastUpdated, refetch } = useNEOData();
  const { gameMode } = useAsteroidStore();
  
  const [timeState, setTimeState] = useState<TimeState>({
    currentDate: new Date(),
    julianDate: getCurrentJulianDate(),
    timeScale: 1, // 1 hour per frame initially
    isPlaying: true // Start playing by default
  });
  const [targetPlanetKey, setTargetPlanetKey] = useState<keyof typeof PLANETARY_ELEMENTS | 'sun' | undefined>();
  const [targetNEO, setTargetNEO] = useState<NEOObject | undefined>();
  const [editingAsteroid, setEditingAsteroid] = useState<NEOObject | null>(null);
  const [neoData, setNeoData] = useState<NEOObject[]>([]);
  const [originalTimeState, setOriginalTimeState] = useState<TimeState | null>(null);
  const [impactPrediction, setImpactPrediction] = useState<ImpactPrediction | null>(null);

  // Update neoData when neoObjects changes
  useEffect(() => {
    setNeoData(neoObjects);
  }, [neoObjects]);

  const handleTimeControlChange = (timeScale: number, playing: boolean) => {
    console.log('⏰ Time control change:', { timeScale, playing });
    setTimeState(prev => ({
      ...prev,
      timeScale,
      isPlaying: playing
    }));
  };

  const handleObjectDoubleClick = (position: THREE.Vector3) => {
    // Handle object focus if needed
    console.log('Object focused at:', position);
  };

  const handlePlanetClick = (planetKey: keyof typeof PLANETARY_ELEMENTS) => {
    setTargetPlanetKey(planetKey);
  };

  const handlePlanetTarget = (planetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun') => {
    setTargetPlanetKey(planetKey);
  };

  const handleResetCamera = () => {
    setTargetPlanetKey('sun');
    setTargetNEO(undefined);
  };

  const handleNEOClick = (neo: NEOObject) => {
    setTargetNEO(neo);
    setTargetPlanetKey(undefined);
  };

  const handleNEODoubleClick = (neo: NEOObject) => {
    if (gameMode === 'destroy_earth') {
      // Save current time state before entering editing mode
      if (!originalTimeState) {
        setOriginalTimeState({ ...timeState });
      }
      console.log('🎯 Entering editing mode for:', neo.name);
      setTimeState(prev => ({ ...prev, isPlaying: false, timeScale: 0 }));
      setEditingAsteroid(neo);
    } else {
      handleNEOClick(neo);
    }
  };  const handleAsteroidSave = (updatedAsteroid: NEOObject) => {
    setNeoData(prev => prev.map(neo => 
      neo.id === updatedAsteroid.id ? updatedAsteroid : neo
    ));
  };

  const handleCloseEditor = () => {
    setEditingAsteroid(null);
    // Restore original time state if available
    if (originalTimeState) {
      setTimeState(originalTimeState);
      setOriginalTimeState(null);
    }
  };

  const handleResetToCurrentDate = () => {
    const now = new Date();
    const currentJulianDate = getCurrentJulianDate();
    
    setTimeState({
      currentDate: now,
      julianDate: currentJulianDate,
      timeScale: 1,
      isPlaying: false
    });
  };

  return (
    <div className="w-full h-screen bg-black">
      <Canvas
        camera={{ position: [0, 10, 15], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <SolarSystemContent 
            timeState={timeState}
            onTimeControlChange={handleTimeControlChange}
            onObjectDoubleClick={handleObjectDoubleClick}
            setTimeState={setTimeState}
            targetPlanetKey={targetPlanetKey}
            targetNEO={targetNEO}
            onResetCamera={handleResetCamera}
            onPlanetTarget={handlePlanetTarget}
            neoObjects={neoData}
            onNEOClick={handleNEODoubleClick}
            gameMode={gameMode}
            editingAsteroid={editingAsteroid}
            impactPrediction={impactPrediction}
          />
        </Suspense>
      </Canvas>
      
      {/* Game Mode Selector */}
      <GameModeSelector />
      
      {/* Asteroid List Panel for Game Mode - Hide when editing */}
      {!editingAsteroid && (
        <AsteroidListPanel
          asteroids={neoData}
          gameMode={gameMode}
          onAsteroidClick={handleNEODoubleClick}
          loading={loading}
          error={error}
        />
      )}
      
      {/* Fancy Time Controls at bottom center */}
      <FancyTimeControls
        timeState={timeState}
        onTimeControlChange={handleTimeControlChange}
        onResetToCurrentDate={handleResetToCurrentDate}
        editingMode={!!editingAsteroid}
      />
      
      {/* Fancy Sidebar on the left (only in real_orbit mode) */}
      {gameMode === 'real_orbit' && (
        <FancySidebar
          timeState={timeState}
          targetPlanetKey={targetPlanetKey}
          onPlanetClick={handlePlanetClick}
          onResetCamera={handleResetCamera}
          neoObjects={neoData}
          neoLoading={loading}
          neoError={error}
          onNEOClick={handleNEOClick}
          gameMode={gameMode}
        />
      )}
      
      {/* Asteroid Edit Panel for Game Mode */}
      {editingAsteroid && (
        <AsteroidEditFullPanel
          asteroid={editingAsteroid}
          onClose={handleCloseEditor}
          onSave={handleAsteroidSave}
          onImpactPredictionUpdate={setImpactPrediction}
          currentJulianDate={timeState.julianDate}
        />
      )}
    </div>
  );
}
