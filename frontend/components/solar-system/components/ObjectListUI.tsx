import { PLANETARY_ELEMENTS } from '../constants/planetaryElements';
import { TimeState, NEOObject } from '../types';

interface ObjectListUIProps {
  timeState: TimeState;
  targetPlanetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun';
  onPlanetClick: (planetKey: keyof typeof PLANETARY_ELEMENTS) => void;
  onResetCamera: () => void;
  neoObjects: NEOObject[];
  neoLoading?: boolean;
  neoError?: string | null;
}

export default function ObjectListUI({ 
  timeState, 
  targetPlanetKey, 
  onPlanetClick, 
  onResetCamera,
  neoObjects,
  neoLoading,
  neoError
}: ObjectListUIProps) {
  return (
    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
      <h3 className="text-lg font-bold mb-2">Objects</h3>
      
      {/* Camera controls */}
      <div className="mb-3">
        <button
          onClick={onResetCamera}
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
              onClick={() => onPlanetClick(key as keyof typeof PLANETARY_ELEMENTS)}
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
      
      {(neoObjects.length > 0 || neoLoading || neoError) && (
        <div>
          <h4 className="text-sm font-semibold mb-1">Near-Earth Objects</h4>
          {neoLoading && (
            <div className="text-xs text-blue-300">Loading NEO data...</div>
          )}
          {neoError && (
            <div className="text-xs text-red-400">Error: {neoError}</div>
          )}
          <div className="space-y-1 text-sm">
            {neoObjects.map((neo) => (
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
  );
}
