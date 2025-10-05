import { useState } from 'react';
import { PLANETARY_ELEMENTS } from '../constants/planetaryElements';
import { TimeState, NEOObject } from '../utils';
import { GameMode } from '@/lib/stores/useAsteroidStore';

interface FancySidebarProps {
  timeState: TimeState;
  targetPlanetKey?: keyof typeof PLANETARY_ELEMENTS | 'sun';
  onPlanetClick: (planetKey: keyof typeof PLANETARY_ELEMENTS) => void;
  onResetCamera: () => void;
  neoObjects: NEOObject[];
  neoLoading: boolean;
  neoError: string | null;
  onNEOClick?: (neo: NEOObject) => void;
  gameMode: GameMode;
}

interface ExpandableItemProps {
  title: string;
  subtitle?: string;
  color?: string;
  isActive?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

function ExpandableItem({ title, subtitle, color, isActive, onClick, children }: ExpandableItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleItemClick = () => {
    onClick?.();
  };

  return (
    <div className="border border-gray-700/50 rounded-lg overflow-hidden mb-2">
      <div
        className={`w-full p-4 transition-all ${
          isActive 
            ? 'bg-blue-500/20 border-l-4 border-l-blue-400' 
            : 'bg-gray-800/50 hover:bg-gray-700/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={handleItemClick}
            className="flex-1 flex items-center space-x-3 text-left"
          >
            {color && (
              <div 
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
              />
            )}
            <div>
              <div className="font-medium text-white">{title}</div>
              {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
            </div>
          </button>
          {children && (
            <button
              onClick={handleExpandClick}
              className={`p-1 transition-transform hover:bg-gray-600/50 rounded ${isExpanded ? 'rotate-180' : ''}`}
            >
              ⌄
            </button>
          )}
        </div>
      </div>
      
      {isExpanded && children && (
        <div className="p-4 bg-gray-900/30 border-t border-gray-700/30">
          {children}
        </div>
      )}
    </div>
  );
}

export default function FancySidebar({
  timeState,
  targetPlanetKey,
  onPlanetClick,
  onResetCamera,
  neoObjects,
  neoLoading,
  neoError,
  onNEOClick,
}: FancySidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

  const formatDistance = (distance: number) => {
    if (distance < 1) return `${(distance * 1000).toFixed(0)} million km`;
    return `${distance.toFixed(2)} AU`;
  };

  const getThreatLevel = (neo: NEOObject) => {
    if (neo.hazardous) return '🔴 High Risk';
    if (neo.closestApproach && parseFloat(neo.closestApproach.distance.toString()) < 0.1) return '🟡 Medium Risk';
    return '🟢 Low Risk';
  };

  return (
    <div className={`fixed left-4 top-4 bottom-4 z-40 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-96'
    }`}>
      <div className="h-full bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-700/50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <button
                  onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                  className="flex-1 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full shadow-lg"
                      style={{ backgroundColor: '#3B82F6', boxShadow: '0 0 10px #3B82F640' }}
                    />
                    <div>
                      <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Solar System</h2>
                      <p className="text-sm text-gray-400">Objects</p>
                    </div>
                  </div>
                </button>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-all ml-2"
              >
                {isCollapsed ? '→' : '←'}
              </button>
            </div>
          </div>
          
        </div>

        {!isCollapsed && (
          <div className="flex flex-col h-full">

            {/* Solar System Objects */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">🌌 Solar System Objects</h3>
                  <span className="text-sm text-gray-400">
                    {neoLoading ? 'Loading...' : `${Object.keys(PLANETARY_ELEMENTS).length + neoObjects.length} objects`}
                  </span>
                </div>

                {neoError && (
                  <div className="text-red-400 text-sm mb-3 p-2 bg-red-500/10 rounded">
                    Error loading NEO data: {neoError}
                  </div>
                )}

                <div className="space-y-2">
                  {/* Planets */}
                  {Object.entries(PLANETARY_ELEMENTS).map(([planetKey, planet]) => (
                    <ExpandableItem
                      key={planetKey}
                      title={`🪐 ${planet.name}`}
                      subtitle={`Distance: ${planet.a[0].toFixed(2)} AU`}
                      color={planet.color}
                      isActive={targetPlanetKey === planetKey}
                      onClick={() => onPlanetClick(planetKey as keyof typeof PLANETARY_ELEMENTS)}
                    >
                      <div className="text-sm text-gray-300 space-y-2">
                        <div>📏 Semi-major axis: {planet.a[0].toFixed(3)} AU</div>
                        <div>🔄 Eccentricity: {planet.e[0].toFixed(4)}</div>
                        <div>📐 Inclination: {planet.I[0].toFixed(2)}°</div>
                        <div>📦 Size: {planet.size} units</div>
                        {['saturn', 'uranus'].includes(planetKey) && <div>💍 Has ring system</div>}
                      </div>
                    </ExpandableItem>
                  ))}

                  {/* NEO Objects */}
                  <div className="border-t border-gray-700/30">

                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white mt-4">☄️ Near-Earth Objects</h3>
                      <span className="text-sm text-gray-400">
                        {neoLoading ? 'Loading...' : `${neoObjects.length} objects`}
                      </span>
                    </div>
                    
                  </div>
                  {neoObjects.map((neo) => (
                    <ExpandableItem
                      key={neo.id}
                      title={`☄️ ${neo.name}`}
                      subtitle={getThreatLevel(neo)}
                      color={neo.color}
                      onClick={() => onNEOClick?.(neo)}
                    >
                      <div className="text-sm text-gray-300 space-y-2">
                        <div>🎯 Type: {neo.type}</div>
                        <div>⚠️ Hazardous: {neo.hazardous ? 'Yes' : 'No'}</div>
                        <div>📏 Size: {(neo.size * 50).toFixed(1)} m (est.)</div>
                        {neo.closestApproach && (
                          <>
                            <div>📅 Close approach: {neo.closestApproach.date}</div>
                            <div>📐 Min distance: {formatDistance(neo.closestApproach.distance)}</div>
                          </>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          Orbital Elements:
                        </div>
                        <div className="text-xs text-gray-400 pl-2">
                          <div>Semi-major axis: {neo.orbitalElements.a[0].toFixed(3)} AU</div>
                          <div>Eccentricity: {neo.orbitalElements.e[0].toFixed(3)}</div>
                          <div>Inclination: {neo.orbitalElements.I[0].toFixed(1)}°</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNEOClick?.(neo);
                          }}
                          className="mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-all"
                        >
                          🎯 Focus on Object
                        </button>
                      </div>
                    </ExpandableItem>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
