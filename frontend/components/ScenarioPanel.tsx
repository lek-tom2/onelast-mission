'use client';
import { useState, useMemo } from 'react';
import { useAsteroidStore, SortOption, FilterOption } from '@/lib/stores/useAsteroidStore';
import { ImpactScenario } from '@/lib/types/asteroid';
import DatePicker from './DatePicker';
import { sortAsteroids, filterAsteroids, getThreatLevel, getThreatColor, formatDistance, formatEnergy } from '@/lib/utils/asteroidUtils';
import { recalculateImpactForCity } from '@/lib/services/impactCalculator';
import { getEnergyColor } from '@/lib/utils/asteroidColors';

interface ScenarioPanelProps {
  scenarios: ImpactScenario[];
  onScenarioSelect: (scenario: ImpactScenario) => void;
  onFocus?: (scenario: ImpactScenario) => void;
  onDateChange?: (startDate: string, endDate: string) => void;
}

export default function ScenarioPanel({ scenarios, onScenarioSelect, onFocus, onDateChange }: ScenarioPanelProps) {
  const {
    selectedScenario,
    selectedAsteroidDetails,
    showTrajectories,
    showConsequences,
    toggleTrajectories,
    toggleConsequences,
    selectAsteroidDetails,
    sortOption,
    filterOption,
    setSortOption,
    setFilterOption,
  } = useAsteroidStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTrajectoryDetails, setShowTrajectoryDetails] = useState(false);

  // Process and filter scenarios
  const processedScenarios = useMemo(() => {
    let processed = [...scenarios];

    // Apply filters
    processed = filterAsteroids(processed, filterOption);

    // Apply sorting
    processed = sortAsteroids(processed, sortOption);

    return processed;
  }, [scenarios, filterOption, sortOption]);

  return (
    <div className={`fixed left-4 top-4 bottom-4 z-40 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-96'
      }`}>
      <div className="h-full bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <h2 className="text-xl font-bold text-white">Asteroid Impact Scenarios</h2>
            )}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? '−' : '+'}
              </button>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title={isCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                {isCollapsed ? '→' : '←'}
              </button>
            </div>
          </div>
        </div>

        {/* Content - only show when not collapsed */}
        {!isCollapsed && (
          <>
            {/* Date Picker */}
            {onDateChange && (
              <div className="p-4 border-b border-gray-700/50">
                <DatePicker onDateChange={onDateChange} />
              </div>
            )}


            {/* Filter Controls */}
            <div className="p-4 border-b border-gray-700/50 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Filter</label>
                <select
                  value={filterOption}
                  onChange={(e) => setFilterOption(e.target.value as FilterOption)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                >
                  <option value="all">All Asteroids</option>
                  <option value="hazardous">Potentially Hazardous</option>
                  <option value="close_approach">Close Approach (&lt;1M km)</option>
                  <option value="high_energy">High Energy (&gt;100 MT)</option>
                  <option value="large_size">Large Size (&gt;100m)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                >
                  <option value="nearest">Nearest to Earth</option>
                  <option value="furthest">Furthest from Earth</option>
                  <option value="highest_energy">Highest Energy</option>
                  <option value="lowest_energy">Lowest Energy</option>
                  <option value="largest">Largest Size</option>
                  <option value="smallest">Smallest Size</option>
                  <option value="most_dangerous">Most Dangerous</option>
                  <option value="least_dangerous">Least Dangerous</option>
                </select>
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex gap-2">
                <button
                  onClick={toggleTrajectories}
                  className={`px-3 py-1 rounded text-sm transition-colors ${showTrajectories
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                    }`}
                >
                  Trajectories
                </button>
                <button
                  onClick={toggleConsequences}
                  className={`px-3 py-1 rounded text-sm transition-colors ${showConsequences
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                    }`}
                >
                  Impact Zones
                </button>
              </div>
            </div>
          </>
        )}

        {/* Scrollable Content */}
        {!isCollapsed && isExpanded && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">

              {/* Scenario List */}
              <div className="space-y-2">
                <div className="text-xs text-gray-400 mb-2">
                  Showing {processedScenarios.length} of {scenarios.length} asteroids
                </div>

                {processedScenarios.map((scenario) => {
                  const threatLevel = getThreatLevel(scenario);
                  const threatColor = getThreatColor(threatLevel);

                  return (
                    <div
                      key={scenario.id}
                      onClick={() => {
                        // Just open the details panel - user will select city there
                        console.log('Selecting scenario:', {
                          id: scenario.id,
                          name: scenario.name,
                          nasaId: scenario.nasaData?.id,
                          nasaName: scenario.nasaData?.name
                        });
                        selectAsteroidDetails(scenario);
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-all border border-gray-700/50 ${selectedScenario?.id === scenario.id
                        ? 'bg-blue-500/20 border-l-4 border-l-blue-400'
                        : 'bg-gray-800/50 hover:bg-gray-700/50'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm truncate">{scenario.nasaData?.name || scenario.name}</h3>
                          <p className="text-xs text-gray-300">Click to select impact city</p>
                        </div>
                        <div className="text-right ml-2">
                          <div
                            style={{ backgroundColor: getEnergyColor(scenario.energy) }}
                            className={`text-xs px-2 py-1 rounded text-white font-semibold `}
                          >
                            {formatEnergy(scenario.energy)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-gray-400">
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>{scenario.asteroidSize.toFixed(0)}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Distance:</span>
                          <span>{scenario.trajectory ? formatDistance(scenario.trajectory.closestApproach) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Velocity:</span>
                          <span>{scenario.trajectory ? `${scenario.trajectory.velocity.toFixed(1)} km/s` : 'N/A'}</span>
                        </div>
                        {scenario.collisionProbability !== undefined && (
                          <div className="flex justify-between">
                            <span>Collision Risk:</span>
                            <span className={`font-semibold ${scenario.collisionProbability > 0.1 ? 'text-red-400' :
                              scenario.collisionProbability > 0.05 ? 'text-orange-400' :
                                scenario.collisionProbability > 0.01 ? 'text-yellow-400' : 'text-green-400'
                              }`}>
                              {(scenario.collisionProbability * 100).toFixed(2)}%
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Casualties:</span>
                          <span className="text-red-300">{scenario.casualties.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Threat Level Indicator */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: threatColor }}
                          ></div>
                          <span className="text-xs font-medium capitalize" style={{ color: threatColor }}>
                            {threatLevel} Threat
                          </span>
                        </div>
                        {scenario.nasaData?.is_potentially_hazardous_asteroid && (
                          <span className="text-xs px-2 py-1 bg-red-900 text-red-300 rounded">
                            ⚠️ Hazardous
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Scenario Details */}
              {selectedScenario && (
                <div className="mt-4 space-y-4">
                  {/* Impact Analysis */}
                  <div className="p-3 bg-gray-800 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Impact Analysis</h4>
                    </div>
                    {selectedScenario.consequences && (
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-red-400">Immediate Blast:</span> {selectedScenario.consequences.immediateBlast.radius.toFixed(1)}km radius
                        </div>
                        <div>
                          <span className="text-orange-400">Thermal Radiation:</span> {selectedScenario.consequences.thermalRadiation.radius.toFixed(1)}km radius
                        </div>
                        <div>
                          <span className="text-yellow-400">Seismic Effects:</span> Magnitude {selectedScenario.consequences.seismicEffects.magnitude.toFixed(1)}
                        </div>
                        {selectedScenario.consequences.tsunami && (
                          <div>
                            <span className="text-blue-400">Tsunami:</span> {selectedScenario.consequences.tsunami.height.toFixed(1)}m height
                          </div>
                        )}
                        {selectedScenario.consequences.atmosphericEffects.nuclearWinter && (
                          <div className="text-purple-400">⚠️ Nuclear Winter Effect</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Trajectory Information */}
                  {selectedScenario.trajectory && (
                    <div className="p-3 bg-blue-900/20 rounded border border-blue-500">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-blue-400">Asteroid Trajectory</h4>
                        <button
                          onClick={() => setShowTrajectoryDetails(!showTrajectoryDetails)}
                          className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        >
                          {showTrajectoryDetails ? 'Hide' : 'Show'} Details
                        </button>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Velocity:</span>
                          <span className="text-blue-300">{selectedScenario.trajectory.velocity} km/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Time to Impact:</span>
                          <span className="text-blue-300">{selectedScenario.trajectory.timeToImpact} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Closest Approach:</span>
                          <span className="text-blue-300">{selectedScenario.trajectory.closestApproach.toLocaleString()} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Approach Angle:</span>
                          <span className="text-blue-300">{selectedScenario.trajectory.approachAngle}°</span>
                        </div>
                      </div>

                      {showTrajectoryDetails && (
                        <div className="mt-3 pt-3 border-t border-blue-600">
                          <div className="text-xs text-gray-300">
                            <p className="mb-2">Trajectory Analysis:</p>
                            <ul className="space-y-1 text-gray-400">
                              <li>• Approach from {selectedScenario.trajectory.approachAngle}° angle</li>
                              <li>• {selectedScenario.trajectory.velocity} km/s impact velocity</li>
                              <li>• {selectedScenario.trajectory.timeToImpact} days until impact</li>
                              <li>• Closest approach: {selectedScenario.trajectory.closestApproach.toLocaleString()} km from Earth</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectAsteroidDetails(selectedScenario)}
                        className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition-colors"
                      >
                        View Full Details
                      </button>
                      <button
                        onClick={() => onFocus && onFocus(selectedScenario)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                      >
                        Focus
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
