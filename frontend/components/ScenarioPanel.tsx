'use client';
import { useState } from 'react';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import { ImpactScenario } from '@/lib/types/asteroid';

interface ScenarioPanelProps {
  scenarios: ImpactScenario[];
  onScenarioSelect: (scenario: ImpactScenario) => void;
}

export default function ScenarioPanel({ scenarios, onScenarioSelect }: ScenarioPanelProps) {
  const { selectedScenario, showTrajectories, showConsequences, toggleTrajectories, toggleConsequences } = useAsteroidStore();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white min-w-80 max-w-96">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Asteroid Impact Scenarios</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
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

          {/* Scenario List */}
          <div className="space-y-2">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                onClick={() => onScenarioSelect(scenario)}
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
            <div className="mt-4 p-3 bg-gray-800 rounded">
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
          )}
        </div>
      )}
    </div>
  );
}
