import { NEOObject } from '../utils';

interface InfoPanelUIProps {
  neoObjects: NEOObject[];
  neoLoading?: boolean;
}

export default function InfoPanelUI({ neoObjects, neoLoading }: InfoPanelUIProps) {
  return (
    <>
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
            <span>{neoLoading ? '...' : neoObjects.length}</span>
          </div>
        </div>
      </div>
    </>
  );
}
