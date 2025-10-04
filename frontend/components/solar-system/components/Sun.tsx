import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { SUN_DATA } from '../constants/planetaryElements';
import * as THREE from 'three';

interface SunProps {
  onDoubleClick?: (position: THREE.Vector3, target: 'sun') => void;
}

export default function Sun({ onDoubleClick }: SunProps) {
  const sunRef = useRef<THREE.Mesh>(null);
  
  // Load sun texture
  const sunTexture = useLoader(THREE.TextureLoader, '/2k_sun.jpg');
  
  useFrame(() => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.005;
    }
  });

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      const worldPos = new THREE.Vector3(0, 0, 0); // Sun is at origin
      onDoubleClick(worldPos, 'sun');
    }
  };

  return (
    <group>
      <mesh 
        ref={sunRef}
        onDoubleClick={handleDoubleClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <sphereGeometry args={[SUN_DATA.size, 32, 32]} />
        <meshBasicMaterial 
          map={sunTexture}
        />
      </mesh>
      
      {/* Sun glow effect */}
      <mesh>
        <sphereGeometry args={[SUN_DATA.size * 1.1, 16, 16]} />
        <meshBasicMaterial 
          color={SUN_DATA.color}
          transparent
          opacity={0.2}
        />
      </mesh>
      
      {/* Sun label - always faces camera */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          position={[0, SUN_DATA.size + 0.3, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="bottom"
        >
          {SUN_DATA.name}
        </Text>
      </Billboard>
    </group>
  );
}
