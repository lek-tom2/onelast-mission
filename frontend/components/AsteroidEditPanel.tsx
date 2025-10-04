'use client';
import { useState, useEffect } from 'react';
import { NEOObject } from '@/components/solar-system/utils';

interface EditableOrbitalElements {
  a: number;        // semi-major axis (AU)
  e: number;        // eccentricity (0-1) 
  I: number;        // inclination (degrees)
  L: number;        // mean longitude (degrees)
  w_bar: number;    // longitude of perihelion (degrees)
  Omega: number;    // longitude of ascending node (degrees)
}

interface AsteroidEditPanelProps {
  asteroid: NEOObject | null;
  onClose: () => void;
  onSave: (updatedAsteroid: NEOObject) => void;
}

export default function AsteroidEditPanel({ asteroid, onClose, onSave }: AsteroidEditPanelProps) {
  const [editData, setEditData] = useState<EditableOrbitalElements>({
    a: 1,
    e: 0,
    I: 0,
    L: 0,
    w_bar: 0,
    Omega: 0
  });

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
    }
  }, [asteroid]);

  if (!asteroid) return null;

  const handleInputChange = (field: keyof EditableOrbitalElements, value: number) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
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
      onClose();
    }
  };

  const calculateApproachToEarth = () => {
    // Simplified calculation - in reality this would be much more complex
    const eccentricity = editData.e;
    const semiMajorAxis = editData.a;
    
    // Calculate perihelion distance
    const perihelionDistance = semiMajorAxis * (1 - eccentricity);
    
    // Earth is at ~1 AU from Sun
    const earthDistance = 1.0;
    const minDistance = Math.abs(perihelionDistance - earthDistance);
    
    return {
      willHitEarth: minDistance < 0.02, // Within 0.02 AU of Earth (~3 million km)
      closestApproach: minDistance,
      probability: Math.max(0, Math.min(100, (1 - (minDistance * 50)) * 100)) // Rough probability
    };
  };

  const approach = calculateApproachToEarth();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900/95 backdrop-blur-lg rounded-xl border border-gray-700/50 shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">🎯 Mission Control</h2>
            <p className="text-gray-400">Modify trajectory of {asteroid.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Impact Prediction */}
        <div className={`p-4 rounded-lg mb-6 border ${approach.willHitEarth 
          ? 'bg-red-900/50 border-red-500' 
          : 'bg-gray-800 border-gray-600'
        }`}>
          <h3 className="text-lg font-bold mb-2">
            {approach.willHitEarth ? '🎯 IMPACT TRAJECTORY' : '🛡️ Safe Trajectory'}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Closest Approach:</span>
              <div className="text-white font-mono">
                {(approach.closestApproach * 149.6).toFixed(2)} million km
              </div>
            </div>
            <div>
              <span className="text-gray-400">Impact Probability:</span>
              <div className={`font-mono ${approach.willHitEarth ? 'text-red-400' : 'text-green-400'}`}>
                {(approach.probability * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Orbital Parameters */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">⚙️ Orbital Parameters</h3>
          
          {/* Semi-major axis */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Semi-major Axis (AU)
              </label>
              <input
                type="number"
                step="0.1"
                value={editData.a || 0}
                onChange={(e) => handleInputChange('a', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Eccentricity (0-1)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="0.99"
                value={editData.e || 0}
                onChange={(e) => handleInputChange('e', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Inclination and Mean Longitude */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Inclination (degrees)
              </label>
              <input
                type="number"
                step="1"
                min="-180"
                max="180"
                value={editData.I || 0}
                onChange={(e) => handleInputChange('I', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Mean Longitude (degrees)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="360"
                value={editData.L || 0}
                onChange={(e) => handleInputChange('L', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Longitude of Perihelion and Longitude of Ascending Node */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Longitude of Perihelion (degrees)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="360"
                value={editData.w_bar || 0}
                onChange={(e) => handleInputChange('w_bar', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Longitude of Ascending Node (degrees)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="360"
                value={editData.Omega || 0}
                onChange={(e) => handleInputChange('Omega', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
          >
            Cancel
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => {
                // Quick preset for Earth impact
                setEditData(prev => ({
                  ...prev,
                  a: 1.0,
                  e: 0.1,
                  I: 0,
                  L: 0,
                  w_bar: 0,
                  Omega: 0
                }));
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all text-sm"
            >
              🎯 Quick Impact
            </button>
            
            <button
              onClick={handleSave}
              className={`px-6 py-2 rounded-lg transition-all font-semibold ${
                approach.willHitEarth
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {approach.willHitEarth ? '💥 Deploy Impact' : '🛡️ Update Orbit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}