import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { PLANETARY_ELEMENTS } from '../constants/planetaryElements';
import { calculateKeplerianPosition } from '../utils/orbitalMechanics';
import { NEOObject } from '../utils';
import * as THREE from 'three';

interface SolarSystemCameraControllerProps {
  targetPlanetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun';
  targetNEO?: NEOObject;
  julianDate: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
}

export default function SolarSystemCameraController({ 
  targetPlanetKey,
  targetNEO,
  julianDate, 
  controlsRef 
}: SolarSystemCameraControllerProps) {
  const { camera } = useThree();
  const { updateCameraState } = useAsteroidStore();
  
  // Track moving target
  useFrame(() => {
    if (controlsRef.current) {
      if (targetNEO) {
        // Target a specific NEO object - convert orbital elements to compatible format
        const neoElements = {
          name: targetNEO.name,
          color: targetNEO.color,
          size: targetNEO.size,
          a: targetNEO.orbitalElements.a,
          e: targetNEO.orbitalElements.e,
          I: targetNEO.orbitalElements.I,
          L: targetNEO.orbitalElements.L,
          w_bar: targetNEO.orbitalElements.w_bar,
          Omega: targetNEO.orbitalElements.Omega,
          epoch: targetNEO.orbitalElements.epoch,
          meanMotion: targetNEO.orbitalElements.meanMotion
        };
        const position = calculateKeplerianPosition(neoElements, julianDate);
        const scaleFactor = 4; // Match the scaling used in the visualization
        controlsRef.current.target.set(
          position.x * scaleFactor,
          position.y * scaleFactor,
          position.z * scaleFactor
        );
        controlsRef.current.update();
      } else if (targetPlanetKey) {
        if (targetPlanetKey === 'sun') {
          // Target the sun at origin
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        } else {
          // Calculate current position of the target planet
          const elements = PLANETARY_ELEMENTS[targetPlanetKey];
          // Convert readonly arrays to mutable arrays for compatibility
          const planetElements = {
            name: elements.name,
            color: elements.color,
            size: elements.size,
            a: [...elements.a],
            e: [...elements.e],
            I: [...elements.I],
            L: [...elements.L],
            w_bar: [...elements.w_bar],
            Omega: [...elements.Omega]
          };
          const position = calculateKeplerianPosition(planetElements, julianDate);
          const targetPosition = new THREE.Vector3(
            position.x * 4,
            position.y * 4,
            position.z * 4
          );
          
          // Update the orbit target to follow the moving planet
          controlsRef.current.target.copy(targetPosition);
          controlsRef.current.update();
        }
      }
    }
  });
  
  const handleCameraChange = () => {
    updateCameraState({
      position: camera.position.clone(),
      target: controlsRef.current?.target || new THREE.Vector3(0, 0, 0),
      zoom: camera.position.length()
    });
  };

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={1}
      maxDistance={100}
      onChange={handleCameraChange}
    />
  );
}
