'use client';
import { useState } from 'react';
import { ImpactScenario } from '@/lib/types/asteroid';

interface AsteroidDetailsPanelProps {
  scenario: ImpactScenario | null;
  onClose: () => void;
}

export default function AsteroidDetailsPanel({ scenario, onClose }: AsteroidDetailsPanelProps) {
  if (!scenario) return null;

  const getAsteroidTexture = (energy: number) => {
    if (energy > 1000) return '#8B0000'; // Dark red for high energy
    if (energy > 500) return '#B8860B'; // Golden for medium energy
    return '#228B22'; // Green for lower energy
  };

  const getThreatLevel = (energy: number) => {
    if (energy > 1000) return { level: 'CRITICAL', color: '#ff0000' };
    if (energy > 500) return { level: 'HIGH', color: '#ff8800' };
    return { level: 'MEDIUM', color: '#44ff44' };
  };

  const getComposition = (energy: number) => {
    if (energy > 1000) return 'Iron-Nickel (Metallic)';
    if (energy > 500) return 'Stony-Iron (Mixed)';
    return 'Carbonaceous (Rocky)';
  };

  const threat = getThreatLevel(scenario.energy);
  const composition = getComposition(scenario.energy);

  return (
    <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-6 text-white min-w-96 max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-red-400">Asteroid Details</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-2xl"
        >
          ×
        </button>
      </div>

      {/* Asteroid 3D Preview */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Asteroid Preview</h3>
        <div className="flex items-center justify-center h-32 bg-gray-900 rounded">
          <div 
            className="w-16 h-16 rounded-full border-4 border-gray-600 flex items-center justify-center text-2xl"
            style={{ 
              backgroundColor: getAsteroidTexture(scenario.energy),
              boxShadow: `0 0 20px ${getAsteroidTexture(scenario.energy)}`
            }}
          >
            ☄️
          </div>
        </div>
        <p className="text-center text-sm text-gray-400 mt-2">
          {composition} Asteroid
        </p>
      </div>

      {/* Basic Information */}
      <div className="space-y-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="font-semibold">{scenario.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">City:</span>
              <span>{scenario.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Diameter:</span>
              <span>{scenario.asteroidSize}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Composition:</span>
              <span>{composition}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Threat Level:</span>
              <span 
                className="font-bold px-2 py-1 rounded text-xs"
                style={{ backgroundColor: threat.color + '20', color: threat.color }}
              >
                {threat.level}
              </span>
            </div>
            
            {/* Collision Probability */}
            {scenario.collisionProbability !== undefined && (
              <div className="mt-3 p-2 bg-red-900/20 rounded border border-red-500">
                <div className="flex justify-between items-center">
                  <span className="text-red-400 font-semibold">Collision Probability:</span>
                  <span className="text-red-300 font-bold">
                    {(scenario.collisionProbability * 100).toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs text-red-300 mt-1">
                  {scenario.collisionProbability > 0.1 ? '🚨 CRITICAL THREAT' : 
                   scenario.collisionProbability > 0.05 ? '⚠️ HIGH THREAT' :
                   scenario.collisionProbability > 0.01 ? '⚡ MEDIUM THREAT' : '✅ LOW THREAT'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Impact Data */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold">Impact Data</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Energy Release:</span>
            <span className="font-semibold text-yellow-400">{scenario.energy} MT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Blast Radius:</span>
            <span className="text-red-400">{scenario.blastRadius}km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Crater Size:</span>
            <span className="text-orange-400">{scenario.craterSize}km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Estimated Casualties:</span>
            <span className="text-red-400">{scenario.casualties.toLocaleString()}</span>
          </div>
          {scenario.trajectory && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Velocity:</span>
                <span>{scenario.trajectory.velocity} km/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time to Impact:</span>
                <span>{scenario.trajectory.timeToImpact} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Closest Approach:</span>
                <span>{scenario.trajectory.closestApproach.toLocaleString()} km</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Impact Consequences */}
      {scenario.consequences && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Impact Consequences</h3>
          <div className="space-y-3 text-sm">
            <div className="bg-red-900/20 p-3 rounded border-l-4 border-red-500">
              <div className="font-semibold text-red-400">Immediate Blast Zone</div>
              <div className="text-gray-300">
                {scenario.consequences.immediateBlast.radius}km radius - {scenario.consequences.immediateBlast.fatalities.toLocaleString()} fatalities
              </div>
            </div>
            
            <div className="bg-orange-900/20 p-3 rounded border-l-4 border-orange-500">
              <div className="font-semibold text-orange-400">Thermal Radiation Zone</div>
              <div className="text-gray-300">
                {scenario.consequences.thermalRadiation.radius}km radius - {scenario.consequences.thermalRadiation.fatalities.toLocaleString()} fatalities
              </div>
            </div>
            
            <div className="bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-500">
              <div className="font-semibold text-yellow-400">Seismic Effects</div>
              <div className="text-gray-300">
                Magnitude {scenario.consequences.seismicEffects.magnitude} earthquake - {scenario.consequences.seismicEffects.radius}km radius
              </div>
            </div>

            {scenario.consequences.tsunami && (
              <div className="bg-blue-900/20 p-3 rounded border-l-4 border-blue-500">
                <div className="font-semibold text-blue-400">Tsunami</div>
                <div className="text-gray-300">
                  {scenario.consequences.tsunami.height}m height - Affects: {scenario.consequences.tsunami.affectedCoastlines.join(', ')}
                </div>
              </div>
            )}

            <div className="bg-purple-900/20 p-3 rounded border-l-4 border-purple-500">
              <div className="font-semibold text-purple-400">Atmospheric Effects</div>
              <div className="text-gray-300">
                {scenario.consequences.atmosphericEffects.dustCloud && 'Dust Cloud • '}
                {scenario.consequences.atmosphericEffects.climateChange && 'Climate Change • '}
                {scenario.consequences.atmosphericEffects.nuclearWinter && 'Nuclear Winter'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NASA Data Section */}
      {scenario.nasaData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-400">NASA Data</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">NASA ID:</span>
              <span className="font-mono text-blue-300">{scenario.nasaData.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Official Name:</span>
              <span className="text-blue-300">{scenario.nasaData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Potentially Hazardous:</span>
              <span className={scenario.nasaData.is_potentially_hazardous_asteroid ? 'text-red-400 font-bold' : 'text-green-400'}>
                {scenario.nasaData.is_potentially_hazardous_asteroid ? 'YES' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Absolute Magnitude:</span>
              <span>{scenario.nasaData.absolute_magnitude_h}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Diameter Range:</span>
              <span>
                {scenario.nasaData.estimated_diameter.meters.estimated_diameter_min.toFixed(0)} - {scenario.nasaData.estimated_diameter.meters.estimated_diameter_max.toFixed(0)}m
              </span>
            </div>
            
            {scenario.nasaData.close_approach_data && scenario.nasaData.close_approach_data[0] && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Close Approach:</span>
                  <span className="text-yellow-400">{scenario.nasaData.close_approach_data[0].close_approach_date_full}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Miss Distance:</span>
                  <span className="text-green-400">
                    {parseFloat(scenario.nasaData.close_approach_data[0].miss_distance.kilometers).toLocaleString()} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Relative Velocity:</span>
                  <span className="text-orange-400">
                    {parseFloat(scenario.nasaData.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(1)} km/s
                  </span>
                </div>
              </>
            )}
            
            <div className="mt-3 pt-3 border-t border-gray-700">
              <a 
                href={scenario.nasaData.nasa_jpl_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline text-xs"
              >
                View on NASA JPL Small-Body Database →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
