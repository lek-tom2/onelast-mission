'use client';
import { Suspense, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Line, Billboard } from '@react-three/drei';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import * as THREE from 'three';

// NASA JPL Keplerian Elements (Table 1: 1800 AD - 2050 AD)
// Elements: a (AU), e, I (deg), L (deg), ϖ (deg), Ω (deg)
// Rates: per century
const PLANETARY_ELEMENTS = {
  mercury: {
    name: 'Mercury',
    color: '#8C7853',
    size: 0.03,
    a: [0.38709927, 0.00000037],      // semi-major axis
    e: [0.20563593, 0.00001906],      // eccentricity
    I: [7.00497902, -0.00594749],     // inclination
    L: [252.25032350, 149472.67411175], // mean longitude
    w_bar: [77.45779628, 0.16047689], // longitude of perihelion
    Omega: [48.33076593, -0.12534081]  // longitude of ascending node
  },
  venus: {
    name: 'Venus',
    color: '#FFC649',
    size: 0.05,
    a: [0.72333566, 0.00000390],
    e: [0.00677672, -0.00004107],
    I: [3.39467605, -0.00078890],
    L: [181.97909950, 58517.81538729],
    w_bar: [131.60246718, 0.00268329],
    Omega: [76.67984255, -0.27769418]
  },
  earth: {
    name: 'Earth',
    color: '#6B93D6',
    size: 0.05,
    a: [1.00000261, 0.00000562],
    e: [0.01671123, -0.00004392],
    I: [-0.00001531, -0.01294668],
    L: [100.46457166, 35999.37244981],
    w_bar: [102.93768193, 0.32327364],
    Omega: [0.0, 0.0]
  },
  mars: {
    name: 'Mars',
    color: '#CD5C5C',
    size: 0.04,
    a: [1.52371034, 0.00001847],
    e: [0.09339410, 0.00007882],
    I: [1.84969142, -0.00813131],
    L: [-4.55343205, 19140.30268499],
    w_bar: [-23.94362959, 0.44441088],
    Omega: [49.55953891, -0.29257343]
  },
  jewpiter: {
    name: 'zydpiotr',
    color: '#D8CA9D',
    size: 0.15,
    a: [5.20288700, -0.00011607],
    e: [0.04838624, -0.00013253],
    I: [1.30439695, -0.00183714],
    L: [34.39644051, 3034.74612775],
    w_bar: [14.72847983, 0.21252668],
    Omega: [100.47390909, 0.20469106]
  },
  saturn: {
    name: 'Saturn',
    color: '#FAD5A5',
    size: 0.12,
    hasRings: true,
    a: [9.53667594, -0.00125060],
    e: [0.05386179, -0.00050991],
    I: [2.48599187, 0.00193609],
    L: [49.95424423, 1222.49362201],
    w_bar: [92.59887831, -0.41897216],
    Omega: [113.66242448, -0.28867794]
  } as const,
  uranus: {
    name: 'Uranus',
    color: '#4FD0E3',
    size: 0.08,
    a: [19.18916464, -0.00196176],
    e: [0.04725744, -0.00004397],
    I: [0.77263783, -0.00242939],
    L: [313.23810451, 428.48202785],
    w_bar: [170.95427630, 0.40805281],
    Omega: [74.01692503, 0.04240589]
  },
  neptune: {
    name: 'Neptune',
    color: '#4B70DD',
    size: 0.08,
    a: [30.06992276, 0.00026291],
    e: [0.00859048, 0.00005105],
    I: [1.77004347, 0.00035372],
    L: [-55.12002969, 218.45945325],
    w_bar: [44.96476227, -0.32241464],
    Omega: [131.78422574, -0.00508664]
  }
};

// Sun data
const SUN_DATA = {
  name: 'Sun',
  color: '#FFD700',
  size: 0.3
};

// NEO (Near-Earth Objects) data structure
interface NEOObject {
  id: string;
  name: string;
  color: string;
  size: number;
  type: 'asteroid' | 'comet';
  orbitalElements: {
    a: [number, number];      // semi-major axis
    e: [number, number];      // eccentricity
    I: [number, number];      // inclination
    L: [number, number];      // mean longitude
    w_bar: [number, number];  // longitude of perihelion
    Omega: [number, number];  // longitude of ascending node
  };
  hazardous: boolean;
  closestApproach?: {
    date: string;
    distance: number; // AU
  };
}

// Sample NEO objects (this will be expanded)
const NEO_OBJECTS: NEOObject[] = [
  // Temporarily removed for testing
];

// Time simulation state
interface TimeState {
  currentDate: Date;
  julianDate: number;
  timeScale: number; // Hours per frame
  isPlaying: boolean;
}

// Keplerian orbital mechanics functions
function calculateKeplerianPosition(elements: any, julianDate: number) {
  // Calculate centuries past J2000.0
  const T = (julianDate - 2451545.0) / 36525.0;
  
  // Compute orbital elements for current time
  const a = elements.a[0] + elements.a[1] * T;           // semi-major axis (AU)
  const e = elements.e[0] + elements.e[1] * T;           // eccentricity
  const I = elements.I[0] + elements.I[1] * T;           // inclination (degrees)
  const L = elements.L[0] + elements.L[1] * T;           // mean longitude (degrees)
  const w_bar = elements.w_bar[0] + elements.w_bar[1] * T; // longitude of perihelion (degrees)
  const Omega = elements.Omega[0] + elements.Omega[1] * T; // longitude of ascending node (degrees)
  
  // Compute argument of perihelion and mean anomaly
  const omega = w_bar - Omega;  // argument of perihelion
  const M = L - w_bar;          // mean anomaly
  
  // Normalize mean anomaly to [-180, 180] degrees
  const M_norm = ((M % 360) + 540) % 360 - 180;
  
  // Solve Kepler's equation for eccentric anomaly E
  const E = solveKeplersEquation(M_norm, e);
  
  // Compute position in orbital plane
  const x_prime = a * (Math.cos(E * Math.PI / 180) - e);
  const y_prime = a * Math.sqrt(1 - e * e) * Math.sin(E * Math.PI / 180);
  const z_prime = 0;
  
  // Convert to 3D coordinates in J2000 ecliptic frame
  const position = transformToEcliptic(x_prime, y_prime, z_prime, omega, I, Omega);
  
  return {
    x: position.x,
    y: position.z, // Use Z as Y for 3D visualization
    z: position.y, // Use Y as Z for 3D visualization
    distance: Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z)
  };
}

function solveKeplersEquation(M_deg: number, e: number): number {
  const M = M_deg * Math.PI / 180; // Convert to radians
  const e_star = 57.29578 * e;     // e in degrees
  
  let E = M + e * Math.sin(M);     // Initial guess
  
  // Newton-Raphson iteration
  for (let i = 0; i < 10; i++) {
    const deltaM = M - (E - e * Math.sin(E));
    const deltaE = deltaM / (1 - e * Math.cos(E));
    E = E + deltaE;
    
    if (Math.abs(deltaE) < 1e-8) break; // Convergence tolerance
  }
  
  return E * 180 / Math.PI; // Convert back to degrees
}

function transformToEcliptic(x: number, y: number, z: number, omega: number, I: number, Omega: number) {
  // Convert angles to radians
  const omega_rad = omega * Math.PI / 180;
  const I_rad = I * Math.PI / 180;
  const Omega_rad = Omega * Math.PI / 180;
  
  // Rotation matrices: Rz(-Ω) * Rx(-I) * Rz(-ω)
  const cos_omega = Math.cos(omega_rad);
  const sin_omega = Math.sin(omega_rad);
  const cos_I = Math.cos(I_rad);
  const sin_I = Math.sin(I_rad);
  const cos_Omega = Math.cos(Omega_rad);
  const sin_Omega = Math.sin(Omega_rad);
  
  // Transform to ecliptic coordinates
  const x_ecl = (cos_omega * cos_Omega - sin_omega * sin_Omega * cos_I) * x +
                (-sin_omega * cos_Omega - cos_omega * sin_Omega * cos_I) * y;
                
  const y_ecl = (cos_omega * sin_Omega + sin_omega * cos_Omega * cos_I) * x +
                (-sin_omega * sin_Omega + cos_omega * cos_Omega * cos_I) * y;
                
  const z_ecl = (sin_omega * sin_I) * x + (cos_omega * sin_I) * y;
  
  return { x: x_ecl, y: y_ecl, z: z_ecl };
}

// Get current Julian Date
function getCurrentJulianDate(): number {
  const now = new Date();
  return 2440587.5 + now.getTime() / 86400000; // Convert to Julian Date
}

// Generate orbital trajectory points
function generateOrbitPoints(elements: any, numPoints: number = 100) {
  const points: THREE.Vector3[] = [];
  const T = 0; // Use current epoch for orbit shape
  
  // Current orbital elements
  const a = elements.a[0] + elements.a[1] * T;
  const e = elements.e[0] + elements.e[1] * T;
  const I = elements.I[0] + elements.I[1] * T;
  const w_bar = elements.w_bar[0] + elements.w_bar[1] * T;
  const Omega = elements.Omega[0] + elements.Omega[1] * T;
  const omega = w_bar - Omega;
  
  for (let i = 0; i <= numPoints; i++) {
    const E = (i / numPoints) * 2 * Math.PI; // Eccentric anomaly from 0 to 2π
    
    // Position in orbital plane
    const x_prime = a * (Math.cos(E) - e);
    const y_prime = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const z_prime = 0;
    
    // Transform to ecliptic coordinates
    const position = transformToEcliptic(x_prime, y_prime, z_prime, omega, I, Omega);
    
    // Scale for visualization (1 AU = 4 units)
    points.push(new THREE.Vector3(
      position.x * 4,
      position.z * 4, // Use Z as Y for 3D visualization
      position.y * 4  // Use Y as Z for 3D visualization
    ));
  }
  
  return points;
}

// Camera controller for solar system view
function SolarSystemCameraController({ targetPlanetKey, julianDate, controlsRef }: { 
  targetPlanetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun'; 
  julianDate: number;
  controlsRef: React.RefObject<any>;
}) {
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

// Orbital path component
interface OrbitPathProps {
  elements: any;
  color: string;
}

function OrbitPath({ elements, color }: OrbitPathProps) {
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

// NEO Object component
interface NEOProps {
  neo: NEOObject;
  julianDate: number;
  onDoubleClick: (position: THREE.Vector3) => void;
}

function NEOComponent({ neo, julianDate, onDoubleClick }: NEOProps) {
  const neoRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Calculate position using Keplerian mechanics (same as planets)
  const position = calculateKeplerianPosition(neo.orbitalElements, julianDate);
  
  // Scale positions for visualization
  const scaledPosition = {
    x: position.x * 4,
    y: position.y * 4,
    z: position.z * 4
  };
  
  useFrame(() => {
    if (neoRef.current) {
      neoRef.current.position.set(scaledPosition.x, scaledPosition.y, scaledPosition.z);
    }
    
    if (meshRef.current) {
      // Faster rotation for asteroids
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.y += 0.015;
    }
  });

  const handleDoubleClick = () => {
    const worldPos = new THREE.Vector3(scaledPosition.x, scaledPosition.y, scaledPosition.z);
    onDoubleClick(worldPos);
  };

  return (
    <group ref={neoRef}>
      {/* NEO Object */}
      <mesh 
        ref={meshRef} 
        onDoubleClick={handleDoubleClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <dodecahedronGeometry args={[neo.size, 0]} />
        <meshStandardMaterial 
          color={neo.color}
          roughness={0.9}
          metalness={0.1}
          emissive={neo.hazardous ? neo.color : '#000000'}
          emissiveIntensity={neo.hazardous ? 0.2 : 0}
        />
      </mesh>
      
      {/* Hazard indicator for dangerous objects */}
      {neo.hazardous && (
        <mesh>
          <sphereGeometry args={[neo.size * 3, 16, 16]} />
          <meshBasicMaterial 
            color={neo.color}
            transparent
            opacity={0.1}
          />
        </mesh>
      )}
      
      {/* NEO label - always faces camera */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          position={[0, neo.size + 0.1, 0]}
          fontSize={0.08}
          color={neo.hazardous ? '#FF6B6B' : 'white'}
          anchorX="center"
          anchorY="bottom"
        >
          {neo.name}
        </Text>
      </Billboard>
    </group>
  );
}

// Planet component using Keplerian mechanics
// Planet component using Keplerian mechanics
interface PlanetProps {
  planetKey: keyof typeof PLANETARY_ELEMENTS;
  julianDate: number;
  onDoubleClick: (position: THREE.Vector3, planetKey?: keyof typeof PLANETARY_ELEMENTS) => void;
}

function Planet({ planetKey, julianDate, onDoubleClick }: PlanetProps) {
  const planetRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  const elements = PLANETARY_ELEMENTS[planetKey];
  
  // Calculate current position using Keplerian mechanics
  const position = calculateKeplerianPosition(elements, julianDate);
  
  // Scale positions for better visualization (1 AU = 4 units)
  const scaledPosition = {
    x: position.x * 4,
    y: position.y * 4,
    z: position.z * 4
  };
  
  useFrame(() => {
    if (planetRef.current) {
      planetRef.current.position.set(scaledPosition.x, scaledPosition.y, scaledPosition.z);
    }
    
    if (meshRef.current) {
      // Planet rotation
      meshRef.current.rotation.y += 0.01;
    }
  });

  const handleDoubleClick = () => {
    const worldPos = new THREE.Vector3(scaledPosition.x, scaledPosition.y, scaledPosition.z);
    onDoubleClick(worldPos, planetKey);
  };

  return (
    <group ref={planetRef}>
      {/* Planet */}
      <mesh 
        ref={meshRef}
        onDoubleClick={handleDoubleClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <sphereGeometry args={[elements.size, 16, 16]} />
        <meshStandardMaterial 
          color={elements.color}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Saturn's rings */}
      {('hasRings' in elements && elements.hasRings) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[elements.size * 1.2, elements.size * 2, 32]} />
          <meshBasicMaterial 
            color="#D4AF37" 
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Planet label - always faces camera */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          position={[0, elements.size + 0.1, 0]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="bottom"
        >
          {elements.name}
        </Text>
      </Billboard>
    </group>
  );
}

// Sun component
function Sun({ onDoubleClick }: { onDoubleClick?: (position: THREE.Vector3, target: 'sun') => void }) {
  const sunRef = useRef<THREE.Mesh>(null);
  
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
          color={SUN_DATA.color}
        />
      </mesh>
      
      {/* Sun glow effect */}
      <mesh>
        <sphereGeometry args={[SUN_DATA.size * 1.2, 16, 16]} />
        <meshBasicMaterial 
          color={SUN_DATA.color}
          transparent
          opacity={0.3}
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

// Time Controls UI Component
interface TimeControlsUIProps {
  timeState: TimeState;
  onTimeControlChange: (timeScale: number, playing: boolean) => void;
  onResetCamera: () => void;
}

function TimeControlsUI({ timeState, onTimeControlChange, onResetCamera }: TimeControlsUIProps) {
  return null; // This will be rendered outside the Canvas
}

// Main solar system content
function SolarSystemContent({ timeState, onTimeControlChange, onObjectDoubleClick, setTimeState, targetPlanetKey, onResetCamera, onPlanetTarget }: {
  timeState: TimeState;
  onTimeControlChange: (timeScale: number, playing: boolean) => void;
  onObjectDoubleClick: (position: THREE.Vector3) => void;
  setTimeState: React.Dispatch<React.SetStateAction<TimeState>>;
  targetPlanetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun';
  onResetCamera: () => void;
  onPlanetTarget: (planetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun') => void;
}) {
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
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <h3 className="text-lg font-bold mb-2">Time Controls</h3>
        <div className="space-y-3">
          <div className="text-sm">
            <div>Date: {timeState.currentDate.toLocaleDateString()}</div>
            <div>Time: {timeState.currentDate.toLocaleTimeString()}</div>
            <div>Speed: {timeState.timeScale}x hours/frame</div>
          </div>
          
          {/* Play/Pause and Speed Controls */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleTimeControlChange(timeState.timeScale, !timeState.isPlaying)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              {timeState.isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <button
              onClick={() => handleTimeControlChange(1, timeState.isPlaying)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            >
              1h
            </button>
            
            <button
              onClick={() => handleTimeControlChange(24, timeState.isPlaying)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            >
              1d
            </button>
            
            <button
              onClick={() => handleTimeControlChange(168, timeState.isPlaying)}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            >
              1w
            </button>
          </div>
          
          {/* Manual Date Controls */}
          <div className="space-y-2">
            <div className="text-xs text-gray-300">Manual Time Control:</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <button
                onClick={() => handleDateChange('backward', 'hour')}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
              >
                -1h
              </button>
              <button
                onClick={() => handleDateChange('forward', 'hour')}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded"
              >
                +1h
              </button>
              <button
                onClick={() => handleDateChange('backward', 'day')}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
              >
                -1d
              </button>
              <button
                onClick={() => handleDateChange('forward', 'day')}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded"
              >
                +1d
              </button>
              <button
                onClick={() => handleDateChange('backward', 'week')}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
              >
                -1w
              </button>
              <button
                onClick={() => handleDateChange('forward', 'week')}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded"
              >
                +1w
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white max-w-sm">
        <h3 className="text-lg font-bold mb-2">Controls</h3>
        <div className="space-y-1 text-sm">
          <div>• Double-click any object to focus camera</div>
          <div>• Mouse wheel to zoom</div>
          <div>• Left drag to rotate view</div>
          <div>• Right drag to pan</div>
        </div>
      </div>
      
      {/* UI Info Panel */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white max-w-sm">
        <h2 className="text-xl font-bold mb-2">Solar System Simulation</h2>
        <p className="text-sm text-gray-300 mb-2">
          Real planetary positions using NASA JPL Keplerian elements with NEO tracking
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Data Source:</span>
            <span>NASA JPL</span>
          </div>
          <div className="flex justify-between">
            <span>Mechanics:</span>
            <span>Keplerian Orbits</span>
          </div>
          <div className="flex justify-between">
            <span>NEOs Tracked:</span>
            <span>{NEO_OBJECTS.length}</span>
          </div>
        </div>
      </div>
      
      {/* Object List */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <h3 className="text-lg font-bold mb-2">Objects</h3>
        
        {/* Camera controls */}
        <div className="mb-3">
          <button
            onClick={handleResetCamera}
            className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm mb-2"
          >
            Reset Camera
          </button>
          {targetPlanetKey && (
            <div className="text-xs text-blue-300">
              Tracking: {targetPlanetKey === 'sun' ? 'Sun' : PLANETARY_ELEMENTS[targetPlanetKey].name}
            </div>
          )}
        </div>
        
        <div className="mb-3">
          <h4 className="text-sm font-semibold mb-1">Planets</h4>
          <div className="space-y-1 text-sm">
            {Object.entries(PLANETARY_ELEMENTS).map(([key, planet]) => (
              <div 
                key={key} 
                className={`flex items-center space-x-2 cursor-pointer hover:bg-white/10 px-2 py-1 rounded ${
                  targetPlanetKey === key ? 'bg-blue-600/30' : ''
                }`}
                onClick={() => handlePlanetClick(key as keyof typeof PLANETARY_ELEMENTS)}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: planet.color }}
                ></div>
                <span>{planet.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {NEO_OBJECTS.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Near-Earth Objects</h4>
            <div className="space-y-1 text-sm">
              {NEO_OBJECTS.map((neo) => (
                <div key={neo.id} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3" 
                    style={{ 
                      backgroundColor: neo.color,
                      transform: 'rotate(45deg)'
                    }}
                  ></div>
                  <span className={neo.hazardous ? 'text-red-400' : 'text-white'}>
                    {neo.name}
                  </span>
                  {neo.hazardous && <span className="text-red-500 text-xs">⚠️</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
