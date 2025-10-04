
'use client';
import { useState } from 'react';
import SpaceScene from "@/components/SpaceScene";
import SolarSystemScene from "@/components/solar-system/SolarSystemScene";
import ViewSwitcher, { ViewMode } from "@/components/solar-system/components/ViewSwitcher";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewMode>('solar-system');

  return (
    <div className="relative w-full h-screen">
      {/* View Switcher at top center */}
      <ViewSwitcher 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
      
      {/* Scene Content */}
      {currentView === 'earth' ? <SpaceScene /> : <SolarSystemScene />}
    </div>
  );
}
