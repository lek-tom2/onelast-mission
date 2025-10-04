import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import Sun from './Sun';
import Planet from './Planet';
import NEOComponent from './NEOComponent';
import OrbitPath from './OrbitPath';
import SolarSystemCameraController from './SolarSystemCameraController';
import { PLANETARY_ELEMENTS } from '../constants/planetaryElements';
import { NEO_OBJECTS, TimeState } from '../types';
import * as THREE from 'three';

interface SolarSystemContentProps {
  timeState: TimeState;
  onTimeControlChange: (timeScale: number, playing: boolean) => void;
  onObjectDoubleClick: (position: THREE.Vector3) => void;
  setTimeState: React.Dispatch<React.SetStateAction<TimeState>>;
  targetPlanetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun';
  onResetCamera: () => void;
  onPlanetTarget: (planetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun') => void;
}

export default function SolarSystemContent({ 
  timeState, 
  onTimeControlChange, 
  onObjectDoubleClick, 
  setTimeState, 
  targetPlanetKey, 
  onResetCamera, 
  onPlanetTarget 
}: SolarSystemContentProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  
  // Update time in useFrame hook inside Canvas context
  useFrame(() => {
    if (timeState.isPlaying) {
      setTimeState(prev => {
        const hoursToAdd = prev.timeScale;
        const newJulianDate = prev.julianDate + (hoursToAdd / 24); // Convert hours to days
        const newDate = new Date((newJulianDate - 2440587.5) * 86400000);
        
        return {
          ...prev,
          julianDate: newJulianDate,
          currentDate: newDate
        };
      });
    }
  });

  const handleObjectDoubleClick = (position: THREE.Vector3, planetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun') => {
    if (controlsRef.current) {
      controlsRef.current.target.copy(position);
      controlsRef.current.update();
    }
    if (planetKey) {
      onPlanetTarget(planetKey);
    }
    onObjectDoubleClick(position);
  };

  const handleResetCameraInternal = () => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0); // Sun is at the origin
      controlsRef.current.update();
    }
    onPlanetTarget('sun'); // Set tracking to sun
    onResetCamera();
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#FFD700" />
      
      {/* Background stars */}
      <Stars radius={100} depth={50} count={8000} factor={4} saturation={0} fade />
      
      {/* Sun */}
      <Sun onDoubleClick={handleObjectDoubleClick} />
      
      {/* Orbital paths */}
      {Object.entries(PLANETARY_ELEMENTS).map(([planetKey, elements]) => (
        <OrbitPath 
          key={`${planetKey}-orbit`}
          elements={elements}
          color={elements.color}
        />
      ))}
      
      {/* NEO orbital paths */}
      {NEO_OBJECTS.map((neo) => (
        <OrbitPath 
          key={`${neo.id}-orbit`}
          elements={neo.orbitalElements}
          color={neo.color}
        />
      ))}
      
      {/* Planets using Keplerian mechanics */}
      {Object.keys(PLANETARY_ELEMENTS).map((planetKey) => (
        <Planet 
          key={planetKey} 
          planetKey={planetKey as keyof typeof PLANETARY_ELEMENTS}
          julianDate={timeState.julianDate}
          onDoubleClick={handleObjectDoubleClick}
        />
      ))}
      
      {/* NEO Objects */}
      {NEO_OBJECTS.map((neo) => (
        <NEOComponent
          key={neo.id}
          neo={neo}
          julianDate={timeState.julianDate}
          onDoubleClick={handleObjectDoubleClick}
        />
      ))}
      
      {/* Camera controls */}
      <SolarSystemCameraController 
        targetPlanetKey={targetPlanetKey} 
        julianDate={timeState.julianDate}
        controlsRef={controlsRef}
      />
    </>
  );
}
