import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { generateOrbitPoints } from '../utils/orbitalMechanics';

interface OrbitPathProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any;
  color: string;
  highlighted?: boolean;
}

export default function OrbitPath({ elements, color, highlighted = false }: OrbitPathProps) {
  const orbitPoints = useMemo(() => generateOrbitPoints(elements), [elements]);
  
  return (
    <Line
      points={orbitPoints}
      color={color}
      transparent
      opacity={highlighted ? 0.9 : 0.4}
      lineWidth={highlighted ? 3 : 1}
    />
  );
}
