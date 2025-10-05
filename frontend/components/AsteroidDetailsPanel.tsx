'use client';
import { useState, useEffect } from 'react';
import { ImpactScenario } from '@/lib/types/asteroid';
import CitySelector from './CitySelector';
import { recalculateImpactForCity } from '@/lib/services/impactCalculator';
import { populationDensityService } from '@/lib/services/populationDensityService';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import * as THREE from 'three';

interface AsteroidDetailsPanelProps {
  scenario: ImpactScenario | null;
  onClose: () => void;
  onLaunch?: (scenario: ImpactScenario) => void;
  hasImpactPoint?: boolean;
}

export default function AsteroidDetailsPanel({ scenario, onClose, onLaunch, hasImpactPoint = false }: AsteroidDetailsPanelProps) {
  const [selectedCity, setSelectedCity] = useState<{
    name: string;
    lat: number;
    lng: number;
    country: string;
    region: string;
    density: number;
  } | null>(null);
  const [calculatedScenario, setCalculatedScenario] = useState<ImpactScenario | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const { setSelectedCity: setStoreSelectedCity } = useAsteroidStore();

  // Recalculate casualties when scenario changes
  useEffect(() => {
    if (scenario && selectedCity) {
      console.log('AsteroidDetailsPanel: Recalculating casualties for new scenario:', scenario.name);
      const recalculated = recalculateImpactForCity(scenario, selectedCity);
      setCalculatedScenario(recalculated);
    }
  }, [scenario, selectedCity]);

  // Camera movement function - dispatch event to parent
  const moveCameraToCity = (city: { lat: number; lng: number; name: string }) => {
    console.log('AsteroidDetailsPanel: Moving camera to city:', city);
    // Dispatch custom event to parent component
    const event = new CustomEvent('moveCameraToCity', {
      detail: { city }
    });
    window.dispatchEvent(event);
  };

  // Create impact point at city location
  const createImpactPointAtCity = (city: { lat: number; lng: number; name: string }) => {
    console.log('AsteroidDetailsPanel: Creating impact point at city:', city);
    const latRad = ((city.lat + 1.5) * Math.PI) / 180; // Add 1.5 degrees to latitude to move north
    const lngRad = ((-city.lng - 0.25) * Math.PI) / 180; // Flip longitude and subtract 0.25 degrees offset
    const radius = 1.02;
    const cityPosition = new THREE.Vector3(
      radius * Math.cos(latRad) * Math.cos(lngRad),
      radius * Math.sin(latRad),
      radius * Math.cos(latRad) * Math.sin(lngRad)
    );

    // Dispatch event to create impact point
    const event = new CustomEvent('createImpactPoint', {
      detail: { position: cityPosition, city }
    });
    window.dispatchEvent(event);
  };

  if (!scenario) return null;

  // Debug: Log the scenario data to see what we're getting
  console.log('AsteroidDetailsPanel - scenario ID:', scenario.id);
  console.log('AsteroidDetailsPanel - scenario name:', scenario.name);
  console.log('AsteroidDetailsPanel - NASA data ID:', scenario.nasaData?.id);
  console.log('AsteroidDetailsPanel - NASA data name:', scenario.nasaData?.name);

  // Use calculated scenario if available, otherwise use original
  const displayScenario = calculatedScenario || scenario;

  // Calculate population-based casualties if a city is selected
  const populationImpact = selectedCity && displayScenario ?
    populationDensityService.calculateImpactCasualties(
      selectedCity.lat,
      selectedCity.lng,
      displayScenario.blastRadius,
      displayScenario.blastRadius * 2, // thermal radius
      displayScenario.blastRadius * 4, // seismic radius
      displayScenario.energy
    ) : null;

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

  const handleLaunch = async () => {
    if (!onLaunch) return;

    setIsLaunching(true);
    try {
      // Add a small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      onLaunch(displayScenario);
    } finally {
      setIsLaunching(false);
    }
  };

  const getComposition = (energy: number) => {
    if (energy > 1000) return 'Iron-Nickel (Metallic)';
    if (energy > 500) return 'Stony-Iron (Mixed)';
    return 'Carbonaceous (Rocky)';
  };

  const threat = getThreatLevel(displayScenario.energy);
  const composition = getComposition(displayScenario.energy);

  return (
    <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-6 text-white min-w-96 max-w-lg max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-2xl font-bold text-red-400">Asteroid Details</h2>
        <div className="flex items-center gap-3">
          {onLaunch && (
            <button
              onClick={handleLaunch}
              disabled={isLaunching || !hasImpactPoint}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${isLaunching
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : !hasImpactPoint
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105'
                }`}
              title={!hasImpactPoint ? 'Click on Earth to select impact point first' : 'Launch asteroid to selected impact point'}
            >
              {isLaunching ? '🚀 Launching...' : !hasImpactPoint ? '🚀 Select Impact Point' : '🚀 Launch Asteroid'}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>
      </div>

      {/* City Selection for Impact Calculation */}
      <div className="mb-6 p-4 bg-black/90rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Impact City Selection</h3>
        <div className="mb-3">
          <CitySelector
            selectedCity={selectedCity}
            onCitySelect={(city) => {
              console.log('AsteroidDetailsPanel: City selected:', city);
              setSelectedCity(city);
              setStoreSelectedCity(city); // Update store for city pin

              // Clear any existing impact visualization first
              const clearEvent = new CustomEvent('clearImpactVisualization');
              window.dispatchEvent(clearEvent);

              if (city) {
                const recalculated = recalculateImpactForCity(scenario, city);
                setCalculatedScenario(recalculated);
                // Move camera to selected city
                moveCameraToCity(city);
                // Create impact point at city location
                createImpactPointAtCity(city);
              } else {
                setCalculatedScenario(null);
                // Reset camera when no city is selected
                const resetCameraEvent = new CustomEvent('resetCamera');
                window.dispatchEvent(resetCameraEvent);
              }
            }}
          />
        </div>
        {selectedCity && (
          <div className="text-sm text-green-400">
            ✅ Impact calculated for {selectedCity.name}
          </div>
        )}
        {!selectedCity && (
          <div className="text-sm text-gray-400">
            Select a city to calculate impact consequences
          </div>
        )}
      </div>

      {/* Asteroid 3D Preview */}
      <div className="mb-6 p-4 bg-black/90 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Asteroid Preview</h3>
        <div className="flex items-center justify-center h-32 bg-[#111111] rounded">
          <div
            className="w-16 h-16 rounded-full border-4 bg-black/90 flex items-center justify-center text-2xl"
            style={{
              backgroundColor: getAsteroidTexture(displayScenario.energy),
              boxShadow: `0 0 20px ${getAsteroidTexture(displayScenario.energy)}`
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
          <h3 className="text-lg font-semibold mb-2 text-blue-400">NASA Asteroid Data</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">NASA ID:</span>
              <span className="font-mono text-blue-300">{displayScenario.nasaData?.id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Official Name:</span>
              <span className="font-semibold text-blue-300">{displayScenario.nasaData?.name || displayScenario.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Potentially Hazardous:</span>
              <span className={displayScenario.nasaData?.is_potentially_hazardous_asteroid ? 'text-red-400 font-bold' : 'text-green-400'}>
                {displayScenario.nasaData?.is_potentially_hazardous_asteroid ? 'YES' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Absolute Magnitude:</span>
              <span>{displayScenario.nasaData?.absolute_magnitude_h || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Diameter Range:</span>
              <span>
                {displayScenario.nasaData?.estimated_diameter?.meters ?
                  `${displayScenario.nasaData.estimated_diameter.meters.estimated_diameter_min.toFixed(0)} - ${displayScenario.nasaData.estimated_diameter.meters.estimated_diameter_max.toFixed(0)}m` :
                  'N/A'
                }
              </span>
            </div>

            {/* Collision Probability */}
            {displayScenario.collisionProbability !== undefined && (
              <div className="mt-3 p-2 bg-red-900/20 rounded border border-red-500">
                <div className="flex justify-between items-center">
                  <span className="text-red-400 font-semibold">Collision Probability:</span>
                  <span className="text-red-300 font-bold">
                    {(displayScenario.collisionProbability * 100).toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs text-red-300 mt-1">
                  {displayScenario.collisionProbability > 0.1 ? '🚨 CRITICAL THREAT' :
                    displayScenario.collisionProbability > 0.05 ? '⚠️ HIGH THREAT' :
                      displayScenario.collisionProbability > 0.01 ? '⚡ MEDIUM THREAT' : '✅ LOW THREAT'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Close Approach Data */}
        {displayScenario.nasaData?.close_approach_data && displayScenario.nasaData.close_approach_data[0] && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-yellow-400">Close Approach Data</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Approach Date:</span>
                <span className="text-yellow-400">{displayScenario.nasaData.close_approach_data[0].close_approach_date_full}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Miss Distance:</span>
                <span className="text-green-400">
                  {parseFloat(displayScenario.nasaData.close_approach_data[0].miss_distance.kilometers).toLocaleString()} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Relative Velocity:</span>
                <span className="text-orange-400">
                  {parseFloat(displayScenario.nasaData.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(1)} km/s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Orbiting Body:</span>
                <span className="text-blue-400">{displayScenario.nasaData.close_approach_data[0].orbiting_body}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orbital Data Section */}
      {(() => {
        // Extract orbital data from NASA data if available
        const orbitalData = displayScenario.orbitalData ? {
          orbit_id: displayScenario.orbitalData.orbit_id,
          orbit_determination_date: displayScenario.orbitalData.orbit_determination_date,
          first_observation_date: displayScenario.orbitalData.first_observation_date,
          last_observation_date: displayScenario.orbitalData.last_observation_date,
          data_arc_in_days: displayScenario.orbitalData.data_arc_in_days,
          observations_used: displayScenario.orbitalData.observations_used,
          orbit_uncertainty: displayScenario.orbitalData.orbit_uncertainty,
          minimum_orbit_intersection: displayScenario.orbitalData.minimum_orbit_intersection,
          jupiter_tisserand_invariant: displayScenario.orbitalData.jupiter_tisserand_invariant,
          epoch_osculation: displayScenario.orbitalData.epoch_osculation,
          eccentricity: displayScenario.orbitalData.eccentricity,
          semi_major_axis: displayScenario.orbitalData.semi_major_axis,
          inclination: displayScenario.orbitalData.inclination,
          ascending_node_longitude: displayScenario.orbitalData.ascending_node_longitude,
          orbital_period: displayScenario.orbitalData.orbital_period,
          perihelion_distance: displayScenario.orbitalData.perihelion_distance,
          perihelion_argument: displayScenario.orbitalData.perihelion_argument,
          aphelion_distance: displayScenario.orbitalData.aphelion_distance,
          perihelion_time: displayScenario.orbitalData.perihelion_time,
          mean_anomaly: displayScenario.orbitalData.mean_anomaly,
          mean_motion: displayScenario.orbitalData.mean_motion,
          equinox: displayScenario.orbitalData.equinox,
          orbit_class: {
            orbit_class_type: displayScenario.orbitalData.orbit_class.orbit_class_type,
            orbit_class_description: displayScenario.orbitalData.orbit_class.orbit_class_description,
            orbit_class_range: displayScenario.orbitalData.orbit_class.orbit_class_range
          }
        } : displayScenario.orbitalData;

        return orbitalData && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-purple-400">Orbital Mechanics Data</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Orbit Class:</span>
                <span className="text-purple-400 font-semibold">{orbitalData.orbit_class?.orbit_class_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Orbit Description:</span>
                <span className="text-purple-300 text-xs">{orbitalData.orbit_class?.orbit_class_description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Eccentricity:</span>
                <span className="text-blue-400">{parseFloat(orbitalData.eccentricity).toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Semi-Major Axis:</span>
                <span className="text-blue-400">{parseFloat(orbitalData.semi_major_axis).toFixed(4)} AU</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Inclination:</span>
                <span className="text-blue-400">{parseFloat(orbitalData.inclination).toFixed(2)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Orbital Period:</span>
                <span className="text-blue-400">{parseFloat(orbitalData.orbital_period).toFixed(1)} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Perihelion Distance:</span>
                <span className="text-green-400">{parseFloat(orbitalData.perihelion_distance).toFixed(4)} AU</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Aphelion Distance:</span>
                <span className="text-red-400">{parseFloat(orbitalData.aphelion_distance).toFixed(4)} AU</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Orbit Uncertainty:</span>
                <span className={orbitalData.orbit_uncertainty === '0' ? 'text-green-400' : 'text-yellow-400'}>
                  {orbitalData.orbit_uncertainty === '0' ? 'Well-determined' : `Uncertainty: ${orbitalData.orbit_uncertainty}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Observations Used:</span>
                <span className="text-gray-300">{orbitalData.observations_used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Data Arc:</span>
                <span className="text-gray-300">{orbitalData.data_arc_in_days} days</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Simulated Impact Data */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-orange-400">Simulated Impact Data</h3>
        <p className="text-xs text-gray-400 mb-3">Calculated based on asteroid properties for educational purposes</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Energy Release:</span>
            <span className="font-semibold text-yellow-400">{displayScenario.energy} MT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Blast Radius:</span>
            <span className="text-red-400">{displayScenario.blastRadius}km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Crater Size:</span>
            <span className="text-orange-400">{displayScenario.craterSize}km</span>
          </div>
          {displayScenario.trajectory && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Velocity:</span>
                <span>{displayScenario.trajectory.velocity} km/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time to Impact:</span>
                <span>{displayScenario.trajectory.timeToImpact} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Closest Approach:</span>
                <span>{displayScenario.trajectory.closestApproach.toLocaleString()} km</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Impact Consequences */}
      {displayScenario.consequences && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Impact Consequences</h3>
          <div className="space-y-3 text-sm">
            <div className="bg-red-900/20 p-3 rounded border-l-4 border-red-500">
              <div className="font-semibold text-red-400">Immediate Blast Zone</div>
              <div className="text-gray-300">
                {displayScenario.consequences.immediateBlast.radius}km radius
              </div>
            </div>

            <div className="bg-orange-900/20 p-3 rounded border-l-4 border-orange-500">
              <div className="font-semibold text-orange-400">Thermal Radiation Zone</div>
              <div className="text-gray-300">
                {displayScenario.consequences.thermalRadiation.radius}km radius
              </div>
            </div>

            <div className="bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-500">
              <div className="font-semibold text-yellow-400">Seismic Effects</div>
              <div className="text-gray-300">
                Magnitude {displayScenario.consequences.seismicEffects.magnitude} earthquake - {displayScenario.consequences.seismicEffects.radius}km radius
              </div>
            </div>

            {displayScenario.consequences.tsunami && (
              <div className="bg-blue-900/20 p-3 rounded border-l-4 border-blue-500">
                <div className="font-semibold text-blue-400">Tsunami</div>
                <div className="text-gray-300">
                  {displayScenario.consequences.tsunami.height}m height - Affects: {displayScenario.consequences.tsunami.affectedCoastlines.join(', ')}
                </div>
              </div>
            )}

            <div className="bg-purple-900/20 p-3 rounded border-l-4 border-purple-500">
              <div className="font-semibold text-purple-400">Atmospheric Effects</div>
              <div className="text-gray-300">
                {displayScenario.consequences.atmosphericEffects.dustCloud && 'Dust Cloud • '}
                {displayScenario.consequences.atmosphericEffects.climateChange && 'Climate Change • '}
                {displayScenario.consequences.atmosphericEffects.nuclearWinter && 'Nuclear Winter'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Population Impact Analysis */}
      {populationImpact && selectedCity && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-red-400">Population Impact Analysis</h3>
          <div className="space-y-3">
            <div className="p-3 bg-red-900/20 rounded border border-red-500">
              <div className="flex justify-between items-center mb-2">
                <span className="text-red-400 font-semibold">Impact Location:</span>
                <span className="text-red-300">{selectedCity.name}</span>
              </div>
              <div className="text-sm text-gray-300">
                Coordinates: {selectedCity.lat.toFixed(2)}°N, {selectedCity.lng.toFixed(2)}°E
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Immediate Blast Zone */}
              <div className="p-3 bg-red-800/20 rounded border border-red-600">
                <div className="text-red-400 font-semibold text-sm mb-1">Immediate Blast Zone</div>
                <div className="text-xs text-gray-300 space-y-1">
                  <div>Population: {populationImpact.immediateBlast.population.toLocaleString()}</div>
                  <div>Casualties: {populationImpact.immediateBlast.casualties.toLocaleString()}</div>
                  <div>Casualty Rate: {populationImpact.immediateBlast.casualtyRate.toFixed(1)}%</div>
                </div>
              </div>

              {/* Thermal Radiation Zone */}
              <div className="p-3 bg-orange-800/20 rounded border border-orange-600">
                <div className="text-orange-400 font-semibold text-sm mb-1">Thermal Radiation Zone</div>
                <div className="text-xs text-gray-300 space-y-1">
                  <div>Population: {populationImpact.thermalRadiation.population.toLocaleString()}</div>
                  <div>Casualties: {populationImpact.thermalRadiation.casualties.toLocaleString()}</div>
                  <div>Casualty Rate: {populationImpact.thermalRadiation.casualtyRate.toFixed(1)}%</div>
                </div>
              </div>

              {/* Seismic Effects Zone */}
              <div className="p-3 bg-yellow-800/20 rounded border border-yellow-600">
                <div className="text-yellow-400 font-semibold text-sm mb-1">Seismic Effects Zone</div>
                <div className="text-xs text-gray-300 space-y-1">
                  <div>Population: {populationImpact.seismicEffects.population.toLocaleString()}</div>
                  <div>Casualties: {populationImpact.seismicEffects.casualties.toLocaleString()}</div>
                  <div>Casualty Rate: {populationImpact.seismicEffects.casualtyRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Total Impact Summary */}
            <div className="p-4 bg-gray-800/50 rounded border border-gray-600">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400 mb-1">
                  {populationImpact.totalCasualties.toLocaleString()}
                </div>
                <div className="text-sm text-gray-300 mb-2">Total Estimated Casualties</div>
                <div className="text-xs text-gray-400">
                  Out of {populationImpact.totalAffected.toLocaleString()} people affected
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
