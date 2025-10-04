# 3D Earth Asteroid Impact Simulator

A realistic 3D Earth model with real NASA asteroid data, trajectory calculations, and impact consequence modeling. Built with Next.js, React Three Fiber, and TypeScript.

## Features

- 🌍 **Realistic 3D Earth** with high-quality textures and atmospheric effects
- 🚀 **Real NASA Asteroid Data** from the Near Earth Object API
- 📊 **Advanced Trajectory Calculations** with collision probability assessment
- 💥 **Impact Consequence Modeling** including blast radius, thermal radiation, and seismic effects
- 🎮 **Interactive 3D Controls** - zoom, pan, rotate around Earth
- 📱 **Real-time UI** with asteroid details and threat assessment
- 🔗 **NASA Database Integration** with direct links to official asteroid data

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

## How to Use

1. **Explore the 3D Earth**: Use mouse to rotate, scroll to zoom, right-click to pan
2. **View Asteroids**: Zoom out to see the asteroid field around Earth
3. **Select Scenarios**: Click on city markers or use the left sidebar
4. **Analyze Trajectories**: Click on trajectory lines to see detailed information
5. **View Details**: Click "View Full Details" to see comprehensive asteroid data
6. **Assess Threats**: Check collision probabilities and impact consequences

## Technical Details

- **Real Data**: Uses NASA's Near Earth Object API for current asteroid data
- **Scientific Calculations**: Implements orbital mechanics for trajectory calculations
- **Impact Modeling**: Calculates blast radius, thermal radiation, and seismic effects
- **3D Graphics**: Built with React Three Fiber and Three.js
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized rendering with memoization and efficient updates

## Data Sources

- **NASA NEO API**: [https://api.nasa.gov/](https://api.nasa.gov/)
- **Asteroid Data**: Real-time near-Earth object information
- **Trajectory Calculations**: Based on orbital mechanics and gravitational effects
- **Impact Modeling**: Scientific models for asteroid impact consequences

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
