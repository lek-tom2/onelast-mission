'use client';
import { useState, useMemo } from 'react';
import { NEOObject } from '@/components/solar-system/utils';
import { GameMode } from '@/lib/stores/useAsteroidStore';

interface AsteroidListPanelProps {
  asteroids: NEOObject[];
  gameMode: GameMode;
  onAsteroidClick: (asteroid: NEOObject) => void;
  loading: boolean;
  error: string | null;
}

interface AsteroidWithImpactChance extends NEOObject {
  impactChance: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export default function AsteroidListPanel({ 
  asteroids, 
  gameMode, 
  onAsteroidClick, 
  loading, 
  error 
}: AsteroidListPanelProps) {
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'impact' | 'hazard'>('impact');
  const [filterHazardous, setFilterHazardous] = useState(false);

  // Calculate impact chances for each asteroid
  const asteroidsWithImpact = useMemo(() => {
    return asteroids.map(asteroid => {
      // Simplified impact calculation based on orbital elements
      const a = asteroid.orbitalElements.a[0];
      const e = asteroid.orbitalElements.e[0];
      
      // Calculate perihelion distance
      const perihelion = a * (1 - e);
      
      // Earth is at ~1 AU
      const earthDistance = 1.0;
      const minDistance = Math.abs(perihelion - earthDistance);
      
      // Calculate impact chance (simplified)
      let impactChance = 0;
      if (minDistance < 0.05) { // Very close
        impactChance = Math.max(0, Math.min(95, (1 - (minDistance * 20)) * 100));
      } else if (minDistance < 0.1) { // Close
        impactChance = Math.max(0, Math.min(50, (1 - (minDistance * 10)) * 50));
      } else if (minDistance < 0.2) { // Moderate
        impactChance = Math.max(0, Math.min(25, (1 - (minDistance * 5)) * 25));
      } else {
        impactChance = Math.max(0, Math.min(10, (1 - (minDistance * 2)) * 10));
      }
      
      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (impactChance > 70) riskLevel = 'critical';
      else if (impactChance > 40) riskLevel = 'high';
      else if (impactChance > 15) riskLevel = 'medium';
      
      return {
        ...asteroid,
        impactChance: Math.round(impactChance * 10) / 10,
        riskLevel
      } as AsteroidWithImpactChance;
    });
  }, [asteroids]);

  // Filter and sort asteroids
  const filteredAndSorted = useMemo(() => {
    let filtered = asteroidsWithImpact;
    
    if (filterHazardous) {
      filtered = filtered.filter(a => a.hazardous);
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return b.size - a.size;
        case 'impact':
          return b.impactChance - a.impactChance;
        case 'hazard':
          return Number(b.hazardous) - Number(a.hazardous);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [asteroidsWithImpact, sortBy, filterHazardous]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-500 bg-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20';
      default: return 'text-green-500 bg-green-500/20';
    }
  };

  const getImpactColor = (chance: number) => {
    if (chance > 70) return 'text-red-400';
    if (chance > 40) return 'text-orange-400';
    if (chance > 15) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (gameMode !== 'destroy_earth') return null;

  return (
    <div className="fixed top-6 right-6 bottom-20 w-96 bg-gray-900/95 backdrop-blur-lg rounded-xl border border-gray-700/50 shadow-xl z-30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-bold text-white mb-2">🎯 Asteroid Targeting</h2>
        <p className="text-sm text-gray-400">Select an asteroid to modify its trajectory</p>
      </div>

      {/* Filters and Sorting */}
      <div className="p-4 border-b border-gray-700/50 space-y-3">
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-400">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          >
            <option value="impact">Impact Chance</option>
            <option value="size">Size</option>
            <option value="name">Name</option>
            <option value="hazard">Hazardous</option>
          </select>
        </div>
        
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={filterHazardous}
            onChange={(e) => setFilterHazardous(e.target.checked)}
            className="rounded"
          />
          <span className="text-gray-400">Show hazardous only</span>
        </label>
      </div>

      {/* Asteroid List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          <div className="text-center text-gray-400 py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading asteroids...
          </div>
        )}
        
        {error && (
          <div className="text-center text-red-400 py-8">
            <div className="text-2xl mb-2">⚠️</div>
            Error loading asteroids: {error}
          </div>
        )}
        
        {!loading && !error && filteredAndSorted.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-2xl mb-2">🔍</div>
            No asteroids found with current filters
          </div>
        )}
        
        {!loading && !error && filteredAndSorted.map((asteroid) => (
          <div
            key={asteroid.id}
            onClick={() => onAsteroidClick(asteroid)}
            className="bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:border-blue-500/50"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold text-sm truncate mr-2">
                {asteroid.name}
              </h3>
              <div className={`px-2 py-1 rounded text-xs font-semibold ${getRiskColor(asteroid.riskLevel)}`}>
                {asteroid.riskLevel.toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Impact Chance:</span>
                <div className={`font-bold ${getImpactColor(asteroid.impactChance)}`}>
                  {asteroid.impactChance}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Size:</span>
                <div className="text-white">{asteroid.size.toFixed(3)}</div>
              </div>
              <div>
                <span className="text-gray-400">Type:</span>
                <div className="text-white capitalize">{asteroid.type}</div>
              </div>
              <div>
                <span className="text-gray-400">Hazardous:</span>
                <div className={asteroid.hazardous ? 'text-red-400' : 'text-green-400'}>
                  {asteroid.hazardous ? '⚠️ Yes' : '✅ No'}
                </div>
              </div>
            </div>
            
            {asteroid.closestApproach && (
              <div className="mt-2 text-xs">
                <span className="text-gray-400">Closest Approach:</span>
                <div className="text-blue-400">
                  {asteroid.closestApproach.distance.toFixed(3)} AU
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Stats Footer */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-800/50">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="text-white font-bold">{filteredAndSorted.length}</div>
            <div className="text-gray-400">Total</div>
          </div>
          <div>
            <div className="text-red-400 font-bold">
              {filteredAndSorted.filter(a => a.riskLevel === 'critical' || a.riskLevel === 'high').length}
            </div>
            <div className="text-gray-400">High Risk</div>
          </div>
          <div>
            <div className="text-orange-400 font-bold">
              {filteredAndSorted.filter(a => a.hazardous).length}
            </div>
            <div className="text-gray-400">Hazardous</div>
          </div>
        </div>
      </div>
    </div>
  );
}