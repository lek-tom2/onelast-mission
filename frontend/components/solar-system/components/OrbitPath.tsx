import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { generateOrbitPoints } from '../utils/orbitalMechanics';

interface OrbitPathProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any;
  color: string;
}

export default function OrbitPath({ elements, color }: OrbitPathProps) {
  const orbitPoints = useMemo(() => generateOrbitPoints(elements), [elements]);
  
  return (
    <Line
      points={orbitPoints}
      color={color}
      transparent
      opacity={0.4}
      lineWidth={1}
    />
  );
}
