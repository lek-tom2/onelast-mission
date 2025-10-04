
'use client';
import { useState } from 'react';
import SpaceScene from "@/components/SpaceScene";
import SolarSystemScene from "@/components/solar-system/SolarSystemScene";

export default function Home() {
  const [currentView, setCurrentView] = useState<'earth' | 'solar-system'>('earth');

  return (
    <div className="relative w-full h-screen">
      {/* Scene Content */}
      {currentView === 'earth' ? <SpaceScene /> : <SolarSystemScene />}
      
      {/* Navigation Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 flex space-x-2">
          <button
            onClick={() => setCurrentView('earth')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'earth'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Earth View
          </button>
          <button
            onClick={() => setCurrentView('solar-system')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'solar-system'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Solar System
          </button>
        </div>
      </div>
    </div>
  );
}
