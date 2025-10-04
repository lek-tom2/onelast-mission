'use client';
import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import SolarSystemContent from './components/SolarSystemContent';
import FancyTimeControls from './components/FancyTimeControls';
import FancySidebar from './components/FancySidebar';
import { PLANETARY_ELEMENTS } from './constants/planetaryElements';
import { TimeState, NEOObject } from './utils';
import { getCurrentJulianDate } from './utils/timeUtils';
import { useNEOData } from '@/lib/hooks/useNEOData';
import * as THREE from 'three';

export default function SolarSystemScene() {
  const { neoObjects, loading, error, lastUpdated, refetch } = useNEOData();
  
  const [timeState, setTimeState] = useState<TimeState>({
    currentDate: new Date(),
    julianDate: getCurrentJulianDate(),
    timeScale: 1, // 1 hour per frame initially
    isPlaying: false
  });
  const [targetPlanetKey, setTargetPlanetKey] = useState<keyof typeof PLANETARY_ELEMENTS | 'sun' | undefined>();
  const [targetNEO, setTargetNEO] = useState<NEOObject | undefined>();

  const handleTimeControlChange = (timeScale: number, playing: boolean) => {
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
            neoObjects={neoObjects}
          />
        </Suspense>
      </Canvas>
      
      {/* Fancy Time Controls at bottom center */}
      <FancyTimeControls
        timeState={timeState}
        onTimeControlChange={handleTimeControlChange}
        onResetToCurrentDate={handleResetToCurrentDate}
      />
      
      {/* Fancy Sidebar on the left */}
      <FancySidebar
        timeState={timeState}
        targetPlanetKey={targetPlanetKey}
        onPlanetClick={handlePlanetClick}
        onResetCamera={handleResetCamera}
        neoObjects={neoObjects}
        neoLoading={loading}
        neoError={error}
        onNEOClick={handleNEOClick}
      />
    </div>
  );
}
