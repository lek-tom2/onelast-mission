
'use client';
import { useState, useEffect } from 'react';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import SpaceScene from "@/components/SpaceScene";
import SolarSystemScene from "@/components/solar-system/SolarSystemScene";
import ViewSwitcher, { ViewMode } from "@/components/solar-system/components/ViewSwitcher";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewMode>('solar-system');
  const { isMiniGameActive } = useAsteroidStore();

  // Auto-switch to Earth View when mini-game is activated
  useEffect(() => {
    if (isMiniGameActive && currentView !== 'earth') {
      console.log('🎮 Auto-switching to Earth View for mini-game');
      setCurrentView('earth');
    }
  }, [isMiniGameActive, currentView]);

  return (
    <div className="relative w-full h-screen">
      {/* View Switcher at top center */}
      <ViewSwitcher 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      {/* Scene Content */}
      {currentView === 'earth' ? (
        <SpaceScene /> 
      ) : (
        <SolarSystemScene onSwitchToEarthView={() => setCurrentView('earth')} />
      )}
    </div>
  );
}
