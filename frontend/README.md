# 🌍 3D Earth Asteroid Impact Simulator

A comprehensive 3D Earth model with real NASA asteroid data, scientific trajectory calculations, and detailed impact consequence modeling. Built with Next.js, React Three Fiber, and TypeScript.

## ✨ Features

- 🌍 **Realistic 3D Earth** with high-quality textures and atmospheric effects
- 🚀 **Real NASA Asteroid Data** from the Near Earth Object API
- 📊 **Advanced Trajectory Calculations** with collision probability assessment
- 💥 **Impact Consequence Modeling** including blast radius, thermal radiation, and seismic effects
- 🎮 **Interactive 3D Controls** - zoom, pan, rotate around Earth
- 📱 **Real-time UI** with asteroid details and threat assessment
- 🔗 **NASA Database Integration** with direct links to official asteroid data
- 📅 **Date Picker** to explore historical and future asteroid data
- 🎯 **Collision Probability** calculations based on orbital mechanics
- 🌐 **Global Impact Scenarios** across 20 major cities worldwide

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### NASA API Key Setup

1. Get a free NASA API key from [https://api.nasa.gov/](https://api.nasa.gov/)
2. Create a `.env.local` file in the frontend directory:
   ```bash
   NEXT_PUBLIC_NASA_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual NASA API key

**Note:** The app will work with the demo key, but it has rate limits. A real API key provides higher rate limits and better reliability.

### Installation

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎮 How to Use

### **3D Navigation**
1. **Rotate Earth**: Left-click and drag to rotate the view
2. **Zoom**: Scroll wheel to zoom in/out
3. **Pan**: Right-click and drag to pan the camera
4. **Reset View**: Double-click to reset camera position

### **Asteroid Interaction**
1. **View Asteroid Field**: Zoom out to see asteroids orbiting Earth
2. **Select Asteroids**: Click on any asteroid or trajectory line
3. **City Markers**: Click on pulsing markers on Earth's surface
4. **Sidebar Selection**: Use the left panel to browse all asteroids

### **Data Analysis**
1. **Trajectory Analysis**: Click trajectory lines for detailed path information
2. **Impact Details**: Click "View Full Details" for comprehensive data
3. **Threat Assessment**: Check collision probabilities and energy levels
4. **Date Exploration**: Use date picker to explore different time periods

### **UI Controls**
- **Left Panel**: Scrollable list of all asteroids and scenarios
- **Date Picker**: Change time period for asteroid data
- **Toggle Buttons**: Show/hide trajectories and impact zones
- **Details Panel**: Comprehensive asteroid information and NASA data

## 🏗️ Technical Architecture

### **Frontend Stack**
- **Next.js 15** - React framework with App Router
- **React Three Fiber** - 3D graphics rendering
- **Three.js** - 3D graphics library
- **TypeScript** - Type safety and development experience
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management

### **3D Graphics Pipeline**
```
NASA API → Data Processing → 3D Scene Rendering
    ↓              ↓              ↓
Real Data → Trajectory Calc → Three.js Meshes
    ↓              ↓              ↓
Asteroids → Impact Modeling → Visual Effects
```

### **Component Architecture**
```
SpaceScene (Main Container)
├── Canvas (3D Scene)
│   ├── SceneContent
│   │   ├── Earth (3D Earth Model)
│   │   ├── AsteroidField (Orbiting Asteroids)
│   │   └── CameraController
│   └── OrbitControls
├── ScenarioPanel (Left Sidebar)
│   ├── DatePicker
│   ├── AsteroidList
│   └── ScenarioDetails
└── AsteroidDetailsPanel (Right Panel)
    ├── 3D Asteroid Model
    ├── NASA Data
    └── Impact Analysis
```

## 🔬 Scientific Calculations

### **Trajectory Calculations**
- **Orbital Mechanics**: Based on gravitational effects and velocity
- **Approach Angles**: Calculated from miss distance and velocity
- **Collision Probability**: Factors in gravitational focusing and uncertainty
- **Energy Calculations**: Kinetic energy based on mass and velocity

### **Impact Modeling**
- **Blast Radius**: `radius = energy^(1/3) * 2` (km)
- **Thermal Radiation**: `radius = blast_radius * 2` (km)
- **Seismic Effects**: `magnitude = 4 + log10(energy)`
- **Casualties**: Based on population density and impact energy

### **Data Processing**
- **Asteroid Filtering**: Size, velocity, miss distance criteria
- **City Distribution**: 20 major cities worldwide
- **Threat Assessment**: Color-coded by collision probability
- **Real-time Updates**: Cached data with 24-hour refresh

## 📊 Data Sources

- **NASA NEO API**: [https://api.nasa.gov/](https://api.nasa.gov/)
- **Real-time Data**: Current and historical asteroid information
- **Scientific Models**: Impact consequence calculations
- **Orbital Mechanics**: Trajectory and collision probability
- **Population Data**: City-specific impact scenarios

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx              # Main application entry point
│   ├── layout.tsx            # Root layout component
│   └── globals.css           # Global styles
├── components/
│   ├── SpaceScene.tsx        # Main 3D scene container
│   ├── Earth.tsx             # 3D Earth model with textures
│   ├── AsteroidField.tsx     # Orbiting asteroids rendering
│   ├── ScenarioPanel.tsx     # Left sidebar with asteroid list
│   ├── AsteroidDetailsPanel.tsx # Right panel with detailed info
│   └── DatePicker.tsx        # Date selection component
├── lib/
│   ├── services/
│   │   ├── nasaApi.ts        # NASA API integration
│   │   ├── nasaDataManager.ts # Data caching and management
│   │   └── trajectoryCalculator.ts # Scientific calculations
│   ├── stores/
│   │   └── useAsteroidStore.ts # Zustand state management
│   └── types/
│       └── asteroid.ts       # TypeScript type definitions
└── public/
    └── textures/             # Earth texture assets
```

## 🔧 API Integration

### **NASA NEO API**
```typescript
// Fetch asteroid data for date range
const data = await nasaApiService.getNearEarthObjects(startDate, endDate);

// Get specific asteroid details
const asteroid = await nasaApiService.getAsteroidDetails(asteroidId);
```

### **Data Flow**
1. **API Request** → NASA NEO API
2. **Data Processing** → Filter and categorize asteroids
3. **Trajectory Calculation** → Compute orbital paths
4. **Impact Modeling** → Calculate consequences
5. **3D Rendering** → Display in Three.js scene

### **State Management**
```typescript
// Global state store
const {
  selectedScenario,      // Currently selected asteroid
  selectedAsteroidDetails, // Detailed asteroid info
  asteroids,            // All asteroid data
  cameraState,          // 3D camera position
  showTrajectories,     // Toggle trajectory visibility
  showConsequences      // Toggle impact zones
} = useAsteroidStore();
```

## 🎨 3D Rendering Pipeline

### **Earth Model**
- **High-resolution textures** for realistic appearance
- **Atmospheric glow** for visual depth
- **Rotating city markers** synchronized with Earth
- **Clickable surface** for interaction

### **Asteroid Field**
- **Real NASA data** with actual orbital parameters
- **Dynamic trajectories** calculated from orbital mechanics
- **Threat indicators** color-coded by collision probability
- **Animated movement** along calculated paths

### **Visual Effects**
- **Trajectory lines** showing asteroid paths
- **Impact zones** with blast radius visualization
- **Pulsing markers** for city impact points
- **Particle effects** for atmospheric entry

## 🧮 Mathematical Models

### **Collision Probability**
```typescript
const probability = gravitationalFocusing * uncertaintyFactor * 0.1;
const gravitationalFocusing = 1 + (2 * earthMass * G) / (missDistance * velocity²);
```

### **Impact Energy**
```typescript
const kineticEnergy = 0.5 * mass * velocity²;
const megatons = kineticEnergy / (4.184e15); // Convert to megatons TNT
```

### **Blast Radius**
```typescript
const blastRadius = Math.pow(energy, 1/3) * 2; // km
const thermalRadius = blastRadius * 2;
const seismicRadius = blastRadius * 4;
```

## 🚀 Performance Optimizations

- **Memoization**: Expensive calculations cached with `useMemo`
- **Lazy Loading**: Components loaded on demand
- **Efficient Rendering**: Only re-render when data changes
- **Data Caching**: 24-hour cache for NASA API responses
- **Optimized Meshes**: Efficient 3D geometry for smooth rendering

## 🔄 How Everything Works

### **1. Application Initialization**
```
1. SpaceScene loads → 2. NASA API called → 3. Data processed → 4. 3D scene rendered
```

**Detailed Flow:**
1. **SpaceScene.tsx** mounts and initializes the 3D canvas
2. **nasaDataManager** fetches real asteroid data from NASA API
3. **trajectoryCalculator** processes raw data into impact scenarios
4. **Earth.tsx** renders the 3D Earth model with city markers
5. **AsteroidField.tsx** displays orbiting asteroids with trajectories
6. **ScenarioPanel.tsx** shows scrollable list of all scenarios

### **2. Data Processing Pipeline**

#### **NASA API Integration**
```typescript
// 1. Fetch raw asteroid data
const nasaResponse = await nasaApiService.getNearEarthObjects(startDate, endDate);

// 2. Filter interesting asteroids
const interestingAsteroids = allAsteroids.filter(asteroid => {
  return asteroid.is_potentially_hazardous_asteroid || 
         missDistance < earthRadius * 20 ||
         diameter > 100 || velocity > 15;
});

// 3. Create impact scenarios
const scenario = trajectoryCalculator.convertToImpactScenario(asteroid, city);
```

#### **Trajectory Calculation**
```typescript
// Calculate orbital path
const points = generateTrajectoryPoints(approachAngle, missDistance, velocity);

// Compute collision probability
const probability = calculateCollisionProbability(missDistance, diameter, velocity);

// Calculate impact energy
const energy = calculateImpactEnergy(diameter, velocity);
```

#### **Impact Modeling**
```typescript
// Blast radius calculation
const blastRadius = Math.pow(energy, 1/3) * 2;

// Casualty estimation
const casualties = Math.min(50000000, energy * 10000);

// Seismic magnitude
const magnitude = Math.min(10, 4 + Math.log10(energy));
```

### **3. 3D Rendering System**

#### **Earth Model Rendering**
```typescript
// High-quality Earth texture
<mesh>
  <sphereGeometry args={[1, 64, 64]} />
  <meshPhongMaterial map={earthTexture} />
</mesh>

// Atmospheric glow
<mesh>
  <sphereGeometry args={[1.05, 32, 32]} />
  <meshBasicMaterial color={0x4fc3f7} transparent opacity={0.1} />
</mesh>

// Rotating city markers
<group ref={markersRef}>
  {impactScenarios.map(scenario => (
    <PulsingMarker key={scenario.id} scenario={scenario} />
  ))}
</group>
```

#### **Asteroid Field Rendering**
```typescript
// Real asteroid data with orbital motion
{realAsteroids.map(scenario => (
  <RealAsteroidObject 
    key={scenario.id} 
    scenario={scenario}
    onClick={() => selectAsteroidDetails(scenario)}
  />
))}

// Trajectory lines
<line>
  <bufferGeometry>
    <bufferAttribute
      attach="attributes-position"
      array={new Float32Array(trajectoryPoints.flatMap(p => [p.x, p.y, p.z]))}
      itemSize={3}
    />
  </bufferGeometry>
  <lineBasicMaterial color={threatColor} />
</line>
```

### **4. User Interaction Flow**

#### **Asteroid Selection**
```
User clicks asteroid → selectAsteroidDetails() → AsteroidDetailsPanel opens
```

#### **Date Change**
```
User selects date → handleDateChange() → nasaDataManager.changeDateRange() → New data loaded
```

#### **3D Navigation**
```
Mouse interaction → OrbitControls → Camera state updated → Scene re-rendered
```

### **5. State Management**

#### **Global State (Zustand)**
```typescript
interface AsteroidStore {
  // Current selections
  selectedScenario: ImpactScenario | null;
  selectedAsteroidDetails: ImpactScenario | null;
  
  // Data
  asteroids: Asteroid[];
  
  // UI state
  cameraState: CameraState;
  isPlaying: boolean;
  showTrajectories: boolean;
  showConsequences: boolean;
  
  // Actions
  selectScenario: (scenario: ImpactScenario) => void;
  selectAsteroidDetails: (scenario: ImpactScenario | null) => void;
  toggleTrajectories: () => void;
  toggleConsequences: () => void;
}
```

#### **Component State**
- **SpaceScene**: Manages real asteroid data and loading states
- **ScenarioPanel**: Handles panel expansion and scroll position
- **Earth**: Manages city marker hover states and rotation
- **AsteroidField**: Manages asteroid animation and selection

### **6. Real-time Updates**

#### **Animation Loop**
```typescript
useFrame(() => {
  // Rotate Earth
  if (earthRef.current) {
    earthRef.current.rotation.y += 0.0005;
  }
  
  // Rotate city markers with Earth
  if (markersRef.current) {
    markersRef.current.rotation.y += 0.0005;
  }
  
  // Animate asteroids along trajectories
  if (asteroidRef.current && scenario.trajectory) {
    // Interpolate position along trajectory points
    asteroidRef.current.position.lerpVectors(currentPos, nextPos, t);
  }
});
```

#### **Data Caching**
```typescript
// 24-hour cache with automatic refresh
if (this.cache && this.isCacheValid()) {
  return this.cache; // Use cached data
}

// Fetch fresh data and cache it
const data = await this.fetchFreshData();
this.cache = data;
```

### **7. Error Handling & Fallbacks**

#### **API Failure Handling**
```typescript
try {
  const data = await nasaDataManager.getRealAsteroidData();
  setRealScenarios(data.impactScenarios);
} catch (error) {
  console.error('Failed to load real asteroid data:', error);
  setRealScenarios([]); // Show empty state
}
```

#### **Fallback Data**
```typescript
private getFallbackData(): RealAsteroidData {
  return {
    nasaObjects: [],
    impactScenarios: [/* Sample scenarios */],
    lastUpdated: new Date()
  };
}
```

## 🎯 Key Features Explained

### **Collision Probability Calculation**
The app calculates realistic collision probabilities based on:
- **Gravitational focusing** - Earth's gravity bends asteroid paths
- **Miss distance** - How close the asteroid comes to Earth
- **Asteroid size** - Larger asteroids are easier to detect and track
- **Velocity** - Faster asteroids have less time for gravitational effects

### **Impact Consequence Modeling**
Uses scientific models to calculate:
- **Immediate blast radius** - Complete destruction zone
- **Thermal radiation** - Fire and heat damage zone
- **Seismic effects** - Earthquake magnitude and radius
- **Atmospheric effects** - Dust clouds, climate change, nuclear winter

### **Real-time 3D Visualization**
- **Orbital mechanics** - Asteroids follow realistic paths
- **Synchronized rotation** - City markers rotate with Earth
- **Dynamic scaling** - Asteroid sizes based on real data
- **Color coding** - Threat levels and energy indicators

This comprehensive system creates a realistic, educational, and interactive asteroid impact simulator using real NASA data and scientific calculations!

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
