import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { PLANETARY_ELEMENTS } from '../constants/planetaryElements';
import { calculateKeplerianPosition } from '../utils/orbitalMechanics';
import * as THREE from 'three';

interface SolarSystemCameraControllerProps {
  targetPlanetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun';
  julianDate: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
}

export default function SolarSystemCameraController({ 
  targetPlanetKey, 
  julianDate, 
  controlsRef 
}: SolarSystemCameraControllerProps) {
  const { camera } = useThree();
  const { updateCameraState } = useAsteroidStore();
  
  // Track moving target
  useFrame(() => {
    if (targetPlanetKey && controlsRef.current) {
      if (targetPlanetKey === 'sun') {
        // Target the sun at origin
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      } else {
        // Calculate current position of the target planet
        const elements = PLANETARY_ELEMENTS[targetPlanetKey];
        const position = calculateKeplerianPosition(elements, julianDate);
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
