'use client';
import { useState } from 'react';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { ImpactScenario } from '@/lib/types/asteroid';
import DatePicker from './DatePicker';

interface ScenarioPanelProps {
  scenarios: ImpactScenario[];
  onScenarioSelect: (scenario: ImpactScenario) => void;
  onFocus?: (scenario: ImpactScenario) => void;
  onDateChange?: (startDate: string, endDate: string) => void;
}

export default function ScenarioPanel({ scenarios, onScenarioSelect, onFocus, onDateChange }: ScenarioPanelProps) {
  const { selectedScenario, selectedAsteroidDetails, showTrajectories, showConsequences, toggleTrajectories, toggleConsequences, selectAsteroidDetails } = useAsteroidStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showTrajectoryDetails, setShowTrajectoryDetails] = useState(false);

  return (
    <div className="h-full w-96 bg-black/90 backdrop-blur-sm text-white flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Asteroid Impact Scenarios</h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
        
        {/* Date Picker */}
        {onDateChange && (
          <div className="mb-4">
            <DatePicker onDateChange={onDateChange} />
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={toggleTrajectories}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              showTrajectories 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}
          >
            Trajectories
          </button>
          <button
            onClick={toggleConsequences}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              showConsequences 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}
          >
            Impact Zones
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">

          {/* Scenario List */}
          <div className="space-y-2">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                onClick={() => {
                  onScenarioSelect(scenario);
                  selectAsteroidDetails(scenario);
                }}
                className={`p-3 rounded cursor-pointer transition-all ${
                  selectedScenario?.id === scenario.id
                    ? 'bg-red-600 border-2 border-red-400'
                    : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-sm">{scenario.name}</h3>
                    <p className="text-xs text-gray-300">{scenario.city}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded ${
                      scenario.energy > 1000 ? 'bg-red-500' :
                      scenario.energy > 500 ? 'bg-orange-500' : 'bg-green-500'
                    }`}>
                      {scenario.energy} MT
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-400">
                  <div>Asteroid Size: {scenario.asteroidSize}m</div>
                  <div>Casualties: {scenario.casualties.toLocaleString()}</div>
                  {scenario.trajectory && (
                    <div>Velocity: {scenario.trajectory.velocity} km/s</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Scenario Details */}
          {selectedScenario && (
            <div className="mt-4 space-y-4">
              {/* Impact Analysis */}
              <div className="p-3 bg-gray-800 rounded">
                <h4 className="font-semibold mb-2">Impact Analysis</h4>
                {selectedScenario.consequences && (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-red-400">Immediate Blast:</span> {selectedScenario.consequences.immediateBlast.radius}km radius
                    </div>
                    <div>
                      <span className="text-orange-400">Thermal Radiation:</span> {selectedScenario.consequences.thermalRadiation.radius}km radius
                    </div>
                    <div>
                      <span className="text-yellow-400">Seismic Effects:</span> Magnitude {selectedScenario.consequences.seismicEffects.magnitude}
                    </div>
                    {selectedScenario.consequences.tsunami && (
                      <div>
                        <span className="text-blue-400">Tsunami:</span> {selectedScenario.consequences.tsunami.height}m height
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
          )}
          </div>
        </div>
      )}
    </div>
  );
}
