'use client';
import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import SolarSystemContent from './components/SolarSystemContent';
import TimeControlsUI from './components/TimeControlsUI';
import ObjectListUI from './components/ObjectListUI';
import InfoPanelUI from './components/InfoPanelUI';
import { PLANETARY_ELEMENTS } from './constants/planetaryElements';
import { TimeState } from './types';
import { getCurrentJulianDate } from './utils/timeUtils';
import * as THREE from 'three';

export default function SolarSystemScene() {
  const [timeState, setTimeState] = useState<TimeState>({
    currentDate: new Date(),
    julianDate: getCurrentJulianDate(),
    timeScale: 1, // 1 hour per frame initially
    isPlaying: false
  });
  const [targetPlanetKey, setTargetPlanetKey] = useState<keyof typeof PLANETARY_ELEMENTS | 'sun' | undefined>();

  const handleTimeControlChange = (timeScale: number, playing: boolean) => {
    setTimeState(prev => ({
      ...prev,
      timeScale,
      isPlaying: playing
    }));
  };

  const handleDateChange = (direction: 'forward' | 'backward', amount: 'hour' | 'day' | 'week' | 'month') => {
    setTimeState(prev => {
      let hoursToAdd = 0;
      
      switch (amount) {
        case 'hour': hoursToAdd = 1; break;
        case 'day': hoursToAdd = 24; break;
        case 'week': hoursToAdd = 24 * 7; break;
        case 'month': hoursToAdd = 24 * 30; break;
      }
      
      if (direction === 'backward') hoursToAdd = -hoursToAdd;
      
      const newJulianDate = prev.julianDate + (hoursToAdd / 24);
      const newDate = new Date((newJulianDate - 2440587.5) * 86400000);
      
      return {
        ...prev,
        julianDate: newJulianDate,
        currentDate: newDate
      };
    });
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
            onResetCamera={handleResetCamera}
            onPlanetTarget={handlePlanetTarget}
          />
        </Suspense>
      </Canvas>
      
      {/* Time Controls */}
      <TimeControlsUI
        timeState={timeState}
        onTimeControlChange={handleTimeControlChange}
        onDateChange={handleDateChange}
        onResetCamera={handleResetCamera}
      />
      
      {/* Object List */}
      <ObjectListUI
        timeState={timeState}
        targetPlanetKey={targetPlanetKey}
        onPlanetClick={handlePlanetClick}
        onResetCamera={handleResetCamera}
      />
      
      {/* Info Panels */}
      <InfoPanelUI />
    </div>
  );
}
