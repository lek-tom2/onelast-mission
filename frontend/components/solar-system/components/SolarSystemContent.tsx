import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import Sun from './Sun';
import Planet from './Planet';
import OrbitPath from './OrbitPath';
import NEOComponent from './NEOComponent';
import SolarSystemCameraController from './SolarSystemCameraController';
import ClosestApproachMarkers from './ClosestApproachMarkers';
import { PLANETARY_ELEMENTS } from '../constants/planetaryElements';
import { TimeState, NEOObject, ImpactPrediction } from '../utils';
import { GameMode } from '@/lib/stores/useAsteroidStore';
import * as THREE from 'three';

interface SolarSystemContentProps {
  timeState: TimeState;
  onTimeControlChange: (timeScale: number, playing: boolean) => void;
  onObjectDoubleClick: (position: THREE.Vector3) => void;
  setTimeState: React.Dispatch<React.SetStateAction<TimeState>>;
  targetPlanetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun';
  targetNEO?: NEOObject;
  onResetCamera: () => void;
  onPlanetTarget: (planetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun') => void;
  onPlanetClick?: (planetKey: keyof typeof PLANETARY_ELEMENTS) => void;
  neoObjects: NEOObject[];
  gameMode: GameMode;
  onNEOClick?: (neo: NEOObject) => void;
  editingAsteroid?: NEOObject | null;
  impactPrediction?: ImpactPrediction | null;
}

export default function SolarSystemContent({
  timeState,
  onTimeControlChange,
  onObjectDoubleClick,
  setTimeState,
  targetPlanetKey,
  targetNEO,
  onResetCamera,
  onPlanetTarget,
  onPlanetClick,
  neoObjects,
  gameMode,
  onNEOClick,
  editingAsteroid,
  impactPrediction
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
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 0]} intensity={4} color="#FFD700" />
      <pointLight position={[50, 50, 50]} intensity={1} color="#FFFFFF" />
      <pointLight position={[-50, -50, -50]} intensity={0.5} color="#FFFFFF" />

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
          highlighted={!!editingAsteroid && planetKey === 'earth'}
        />
      ))}
      
      {/* NEO orbital paths - only show selected asteroid path in editing mode */}
      {neoObjects.map((neo) => {
        // In editing mode, only show the orbit of the selected asteroid
        if (editingAsteroid && neo.id !== editingAsteroid.id) {
          return null;
        }
        
        return (
          <OrbitPath 
            key={`${neo.id}-orbit`}
            elements={neo.orbitalElements}
            color={editingAsteroid && neo.id === editingAsteroid.id ? '#FF6B6B' : neo.color}
            highlighted={!!editingAsteroid && neo.id === editingAsteroid.id}
          />
        );
      })}
      
      {/* Planets using Keplerian mechanics */}
      {Object.keys(PLANETARY_ELEMENTS).map((planetKey) => (
        <Planet
          key={planetKey}
          planetKey={planetKey as keyof typeof PLANETARY_ELEMENTS}
          julianDate={timeState.julianDate}
          onDoubleClick={handleObjectDoubleClick}
          onPlanetClick={onPlanetClick}
        />
      ))}
      
      {/* NEO Objects - only show selected asteroid in editing mode */}
      {neoObjects.map((neo) => {
        // In editing mode, only show the selected asteroid
        if (editingAsteroid && neo.id !== editingAsteroid.id) {
          return null;
        }
        
        return (
          <NEOComponent
            key={neo.id}
            neo={neo}
            julianDate={timeState.julianDate}
            onDoubleClick={handleObjectDoubleClick}
            onNEOClick={onNEOClick}
            gameMode={gameMode}
          />
        );
      })}
      
      {/* Closest Approach Markers - Show during editing */}
      {editingAsteroid && impactPrediction?.closestApproachPositions && (
        <ClosestApproachMarkers
          earthPosition={impactPrediction.closestApproachPositions.earth}
          asteroidPosition={impactPrediction.closestApproachPositions.asteroid}
          closestApproachDate={impactPrediction.closestApproachDate}
          visible={true}
        />
      )}
      
      {/* Camera controls */}
      <SolarSystemCameraController
        targetPlanetKey={targetPlanetKey}
        targetNEO={targetNEO}
        julianDate={timeState.julianDate}
        controlsRef={controlsRef}
        editingAsteroid={editingAsteroid}
        gameMode={gameMode}
      />
    </>
  );
}
