'use client';
import { useState, useEffect } from 'react';
import { NEOObject } from '@/components/solar-system/utils';
import { calculateImpactPrediction, ImpactPrediction } from '@/components/solar-system/utils/impactCalculation';

interface EditableOrbitalElements {
  a: number;        // semi-major axis (AU)
  e: number;        // eccentricity (0-1) 
  I: number;        // inclination (degrees)
  L: number;        // mean longitude (degrees)
  w_bar: number;    // longitude of perihelion (degrees)
  Omega: number;    // longitude of ascending node (degrees)
}

interface AsteroidEditFullPanelProps {
  asteroid: NEOObject | null;
  onClose: () => void;
  onSave: (updatedAsteroid: NEOObject) => void;
  onImpactPredictionUpdate?: (prediction: ImpactPrediction | null) => void;
  currentJulianDate?: number;
}

export default function AsteroidEditFullPanel({
  asteroid,
  onClose,
  onSave,
  onImpactPredictionUpdate,
  currentJulianDate
}: AsteroidEditFullPanelProps) {
  const [editData, setEditData] = useState<EditableOrbitalElements>({
    a: 1,
    e: 0,
    I: 0,
    L: 0,
    w_bar: 0,
    Omega: 0
  });

  const [impactPrediction, setImpactPrediction] = useState<ImpactPrediction | null>(null);

  useEffect(() => {
    if (asteroid) {
      setEditData({
        a: asteroid.orbitalElements.a[0] || 1,
        e: asteroid.orbitalElements.e[0] || 0,
        I: asteroid.orbitalElements.I[0] || 0,
        L: asteroid.orbitalElements.L[0] || 0,
        w_bar: asteroid.orbitalElements.w_bar[0] || 0,
        Omega: asteroid.orbitalElements.Omega[0] || 0
      });

      // Calculate impact prediction
      const prediction = calculateImpactPrediction(asteroid, currentJulianDate);
      setImpactPrediction(prediction);
      onImpactPredictionUpdate?.(prediction);
    }
  }, [asteroid, onImpactPredictionUpdate, currentJulianDate]);

  // Update impact prediction when editData changes
  useEffect(() => {
    if (asteroid) {
      const updatedAsteroid: NEOObject = {
        ...asteroid,
        orbitalElements: {
          ...asteroid.orbitalElements,
          a: [editData.a, asteroid.orbitalElements.a[1]],
          e: [editData.e, asteroid.orbitalElements.e[1]],
          I: [editData.I, asteroid.orbitalElements.I[1]],
          L: [editData.L, asteroid.orbitalElements.L[1]],
          w_bar: [editData.w_bar, asteroid.orbitalElements.w_bar[1]],
          Omega: [editData.Omega, asteroid.orbitalElements.Omega[1]]
        }
      };

      const prediction = calculateImpactPrediction(updatedAsteroid, currentJulianDate);
      setImpactPrediction(prediction);
      onImpactPredictionUpdate?.(prediction);
    }
  }, [editData, asteroid, onImpactPredictionUpdate, currentJulianDate]);

  // Monitor if closest approach date has passed and recalculate
  useEffect(() => {
    if (asteroid && currentJulianDate && impactPrediction?.closestApproachDate) {
      const closestApproachJD = impactPrediction.closestApproachDate.getTime() / 86400000 + 2440587.5; // Convert to Julian Date

      // If current time has passed the closest approach date, recalculate for the next encounter
      if (currentJulianDate > closestApproachJD) {
        console.log('🔄 Closest approach date passed, recalculating next encounter...');

        const updatedAsteroid: NEOObject = {
          ...asteroid,
          orbitalElements: {
            ...asteroid.orbitalElements,
            a: [editData.a, asteroid.orbitalElements.a[1]],
            e: [editData.e, asteroid.orbitalElements.e[1]],
            I: [editData.I, asteroid.orbitalElements.I[1]],
            L: [editData.L, asteroid.orbitalElements.L[1]],
            w_bar: [editData.w_bar, asteroid.orbitalElements.w_bar[1]],
            Omega: [editData.Omega, asteroid.orbitalElements.Omega[1]]
          }
        };

        const prediction = calculateImpactPrediction(updatedAsteroid, currentJulianDate);
        setImpactPrediction(prediction);
        onImpactPredictionUpdate?.(prediction);
      }
    }
  }, [currentJulianDate, impactPrediction?.closestApproachDate, asteroid, editData, onImpactPredictionUpdate]);

  if (!asteroid) return null;

  const handleInputChange = (field: keyof EditableOrbitalElements, value: number) => {
    setEditData(prev => {
      const newData = { ...prev, [field]: value };

      // Auto-save changes in real-time for immediate visual feedback
      if (asteroid) {
        const updatedAsteroid: NEOObject = {
          ...asteroid,
          orbitalElements: {
            ...asteroid.orbitalElements,
            a: [newData.a, asteroid.orbitalElements.a[1]],
            e: [newData.e, asteroid.orbitalElements.e[1]],
            I: [newData.I, asteroid.orbitalElements.I[1]],
            L: [newData.L, asteroid.orbitalElements.L[1]],
            w_bar: [newData.w_bar, asteroid.orbitalElements.w_bar[1]],
            Omega: [newData.Omega, asteroid.orbitalElements.Omega[1]]
          }
        };
        // Delay auto-save to avoid too many updates
        setTimeout(() => onSave(updatedAsteroid), 100);
      }

      return newData;
    });
  };

  const handleSave = () => {
    if (asteroid) {
      const updatedAsteroid: NEOObject = {
        ...asteroid,
        orbitalElements: {
          ...asteroid.orbitalElements,
          a: [editData.a, asteroid.orbitalElements.a[1]],
          e: [editData.e, asteroid.orbitalElements.e[1]],
          I: [editData.I, asteroid.orbitalElements.I[1]],
          L: [editData.L, asteroid.orbitalElements.L[1]],
          w_bar: [editData.w_bar, asteroid.orbitalElements.w_bar[1]],
          Omega: [editData.Omega, asteroid.orbitalElements.Omega[1]]
        }
      };
      onSave(updatedAsteroid);
    }
  };

  // Legacy calculation for backward compatibility
  const calculateApproachToEarth = () => {
    const eccentricity = editData.e;
    const semiMajorAxis = editData.a;
    const perihelionDistance = semiMajorAxis * (1 - eccentricity);
    const earthDistance = 1.0;
    const minDistance = Math.abs(perihelionDistance - earthDistance);

    return {
      willHitEarth: minDistance < 0.02,
      closestApproach: minDistance,
      probability: Math.max(0, Math.min(100, (1 - (minDistance * 50)) * 100))
    };
  };

  const approach = calculateApproachToEarth();

  console.log('🎯 AsteroidEditFullPanel rendered for:', asteroid.name);

  return (
    <div className="fixed top-6 right-6 bottom-6 w-96 bg-gray-900/98 backdrop-blur-lg rounded-xl border-2 border-gray-600/80 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white">🎯 Trajectory Editor</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>
        <div className="text-sm text-gray-400">
          <div className="font-semibold text-white">{asteroid.name}</div>
          <div>Size: {asteroid.size.toFixed(3)} | Type: {asteroid.type}</div>
        </div>

        {/* Mission Status */}
        <div className="mt-2 p-2 rounded-lg bg-blue-900/30 border border-blue-700/50">
          <div className="text-xs font-semibold">
            ⏸️ TRAJECTORY PLANNING
          </div>
          <div className="text-xs text-gray-300">
            Time paused for trajectory modification
          </div>
        </div>
      </div>

      {/* Impact Prediction */}
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-lg font-bold text-white mb-3">🌍 Earth Impact Analysis</h3>

        {impactPrediction && (
          <div className={`p-3 rounded-lg border mb-3 ${impactPrediction.willImpact ? 'border-red-500/50 bg-red-500/10' : 'border-orange-500/50 bg-orange-500/10'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">Impact Probability:</span>
              <span className={`text-xl font-bold ${impactPrediction.impactProbability > 50 ? 'text-red-400' : impactPrediction.impactProbability > 25 ? 'text-yellow-400' : 'text-green-400'}`}>
                {impactPrediction.impactProbability.toFixed(1)}%
              </span>
            </div>

            {/* Real-time update indicator */}
            <div className="text-xs text-blue-400 mb-2">
              📊 Updates in real-time as you modify parameters
            </div>

            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Closest Approach:</span>
                <span className="text-white">{impactPrediction.closestApproach.toFixed(6)} AU</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Distance in km:</span>
                <span className="text-white">{(impactPrediction.closestApproach * 149597871).toFixed(0)} km</span>
              </div>
              {impactPrediction.impactDate && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Impact Date:</span>
                  <span className="text-red-400 font-semibold">
                    {impactPrediction.impactDate instanceof Date
                      ? `${impactPrediction.impactDate.toLocaleDateString()} ${impactPrediction.impactDate.toLocaleTimeString()}`
                      : 'Invalid Date'
                    }
                  </span>
                </div>
              )}
              {impactPrediction.daysUntilImpact && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Days Until Impact:</span>
                  <span className="text-red-400 font-semibold">
                    {Math.round(impactPrediction.daysUntilImpact)} days
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={impactPrediction.willImpact ? 'text-red-400' : 'text-green-400'}>
                  {impactPrediction.willImpact ? '⚠️ IMPACT TRAJECTORY' : '✅ SAFE TRAJECTORY'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orbital Parameters Editor */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-lg font-bold text-white mb-4">⚙️ Orbital Parameters</h3>

        <div className="space-y-4">
          {/* Semi-major axis */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Semi-major Axis (AU)
            </label>
            <input
              type="number"
              step="0.01"
              value={editData.a}
              onChange={(e) => handleInputChange('a', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"

            />
            <div className="text-xs text-gray-500 mt-1">
              Distance from Sun at semi-major axis. Earth = 1.0 AU
            </div>
          </div>

          {/* Eccentricity */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Eccentricity (0-0.99)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="0.99"
              value={editData.e}
              onChange={(e) => handleInputChange('e', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"

            />
            <div className="text-xs text-gray-500 mt-1">
              Oval shape: 0 = circle, 0.99 = very oval
            </div>
          </div>

          {/* Inclination */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Inclination (degrees)
            </label>
            <input
              type="number"
              step="1"
              min="-180"
              max="180"
              value={editData.I}
              onChange={(e) => handleInputChange('I', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"

            />
            <div className="text-xs text-gray-500 mt-1">
              Tilt of orbit relative to Earth&apos;s orbit
            </div>
          </div>

          {/* Mean Longitude */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Mean Longitude (degrees)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="360"
              value={editData.L}
              onChange={(e) => handleInputChange('L', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"

            />
            <div className="text-xs text-gray-500 mt-1">
              Current position in orbit (0-360°)
            </div>
          </div>

          {/* Longitude of Perihelion */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Longitude of Perihelion (degrees)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="360"
              value={editData.w_bar}
              onChange={(e) => handleInputChange('w_bar', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"

            />
            <div className="text-xs text-gray-500 mt-1">
              Direction of closest approach to Sun
            </div>
          </div>

          {/* Longitude of Ascending Node */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Longitude of Ascending Node (degrees)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="360"
              value={editData.Omega}
              onChange={(e) => handleInputChange('Omega', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"

            />
            <div className="text-xs text-gray-500 mt-1">
              Rotation of orbit around Sun
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-700/50 space-y-3">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
        >
          Close Editor
        </button>
      </div>
    </div>
  );
}