'use client';
import { useState, useEffect } from 'react';
import { NEOObject } from '@/components/solar-system/utils';
import { calculateImpactPrediction, ImpactPrediction } from '@/components/solar-system/utils/impactCalculation';
import { useAsteroidStore } from '@/lib/stores/useAsteroidStore';
import Slider from './ui/Slider';

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
  const { activateMiniGame, isMiniGameActive } = useAsteroidStore();

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

      // Calculate impact prediction ONLY for asteroid changes, NOT time changes
      console.log('🎯 Calculating impact prediction for asteroid parameters (ignoring time changes)');
      
      // Use current simulation time as starting point for search, but only calculate once per orbit change
      // This prevents close approach markers from jumping around during time simulation
      const prediction = calculateImpactPrediction(asteroid, currentJulianDate);
      setImpactPrediction(prediction);
      onImpactPredictionUpdate?.(prediction);
    }
  }, [asteroid, onImpactPredictionUpdate]); // Still no currentJulianDate dependency to prevent recalculation!

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

      // Use current simulation time for search starting point but don't recalculate on time changes
      const prediction = calculateImpactPrediction(updatedAsteroid, currentJulianDate);
      setImpactPrediction(prediction);
      onImpactPredictionUpdate?.(prediction);
    }
  }, [editData, asteroid, onImpactPredictionUpdate]); // Still no currentJulianDate dependency!

  // Monitor closest approach for mini-game activation
  useEffect(() => {
    if (impactPrediction && asteroid && !isMiniGameActive) {
      const closestApproachKm = impactPrediction.closestApproach * 149597871; // Convert AU to km
      
      if (closestApproachKm < 5000000) { // 5 million km threshold
        console.log('🚨 CLOSE APPROACH DETECTED:', closestApproachKm.toFixed(0), 'km');
        console.log('🎮 Activating Mini-Game!');
        
        // Calculate asteroid properties for mini-game
        const asteroidSize = asteroid.size || 100; // meters
        const velocity = 20; // km/s default
        const energy = Math.pow(asteroidSize / 100, 3) * 50; // rough energy calculation in megatons
        
        activateMiniGame({
          name: asteroid.name,
          size: asteroidSize,
          energy: energy,
          velocity: velocity
        });
        
        // Show notification
        showMiniGameNotification();
      }
    }
  }, [impactPrediction, asteroid, isMiniGameActive, activateMiniGame]);

  const showMiniGameNotification = () => {
    // Show in-app notification
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff4444, #cc0000);
        color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(255, 68, 68, 0.3);
        z-index: 10000;
        max-width: 350px;
        animation: slideIn 0.5s ease-out;
      ">
        <div style="font-size: 24px; margin-bottom: 10px;">🚨 COLLISION COURSE!</div>
        <div style="font-weight: bold; margin-bottom: 5px;">${asteroid?.name || 'Asteroid'}</div>
        <div style="font-size: 14px; margin-bottom: 10px;">Distance: < 5 million km</div>
        <div style="font-size: 12px; opacity: 0.9;">Mini-Game activated!</div>
        <div style="font-size: 12px; opacity: 0.9; margin-top: 5px;">Switch to Earth View to play!</div>
      </div>
    `;

    // Add animation keyframes if not exists
    if (!document.getElementById('minigame-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'minigame-animation-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove notification after 7 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideIn 0.5s ease-out reverse';
        setTimeout(() => {
          notification.remove();
        }, 500);
      }
    }, 7000);
  };

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
    <div className="fixed top-6 right-6 bottom-6 w-[600px] bg-gray-900/98 backdrop-blur-lg rounded-xl border-2 border-gray-600/80 shadow-2xl z-50 flex flex-col">
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
                <span className={`font-semibold ${
                  (impactPrediction.closestApproach * 149597871) < 5000000 
                    ? 'text-red-400' 
                    : 'text-white'
                }`}>
                  {(impactPrediction.closestApproach * 149597871).toFixed(0)} km
                </span>
              </div>
              
              {/* Close Approach Warning */}
              {(impactPrediction.closestApproach * 149597871) < 5000000 && (
                <div className="mt-2 p-2 bg-red-900/50 border border-red-500 rounded text-center">
                  <div className="text-red-400 font-bold text-sm">🚨 CLOSE APPROACH ALERT</div>
                  <div className="text-red-300 text-xs">
                    Distance: {((impactPrediction.closestApproach * 149597871) / 1000000).toFixed(2)} million km
                  </div>
                  <div className="text-yellow-300 text-xs mt-1">
                    ✅ Sufficient for Earth View mode!
                  </div>
                </div>
              )}
              
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

        <div className="grid grid-cols-2 gap-6">
          {/* Semi-major axis */}
          <div>
            <Slider
              label="Semi-major Axis"
              value={editData.a}
              onChange={(value) => handleInputChange('a', value)}
              min={0.1}
              max={10.0}
              step={0.01}
              unit="AU"
              description="Distance from Sun at semi-major axis. Earth = 1.0 AU"
              gradient="from-blue-500 to-cyan-500"
            />
          </div>

          {/* Eccentricity */}
          <div>
            <Slider
              label="Eccentricity"
              value={editData.e}
              onChange={(value) => handleInputChange('e', value)}
              min={0}
              max={0.99}
              step={0.01}
              description="Oval shape: 0 = circle, 0.99 = very oval"
              gradient="from-green-500 to-emerald-500"
            />
          </div>

          {/* Inclination */}
          <div>
            <Slider
              label="Inclination"
              value={editData.I}
              onChange={(value) => handleInputChange('I', value)}
              min={-180}
              max={180}
              step={1}
              unit="°"
              description="Tilt of orbit relative to Earth's orbit"
              gradient="from-purple-500 to-pink-500"
            />
          </div>

          {/* Mean Longitude */}
          <div>
            <Slider
              label="Mean Longitude"
              value={editData.L}
              onChange={(value) => handleInputChange('L', value)}
              min={0}
              max={360}
              step={1}
              unit="°"
              description="Current position in orbit (0-360°)"
              gradient="from-yellow-500 to-orange-500"
            />
          </div>

          {/* Longitude of Perihelion */}
          <div>
            <Slider
              label="Longitude of Perihelion"
              value={editData.w_bar}
              onChange={(value) => handleInputChange('w_bar', value)}
              min={0}
              max={360}
              step={1}
              unit="°"
              description="Direction of closest approach to Sun"
              gradient="from-red-500 to-rose-500"
            />
          </div>

          {/* Longitude of Ascending Node */}
          <div>
            <Slider
              label="Longitude of Ascending Node"
              value={editData.Omega}
              onChange={(value) => handleInputChange('Omega', value)}
              min={0}
              max={360}
              step={1}
              unit="°"
              description="Rotation of orbit around Sun"
              gradient="from-indigo-500 to-violet-500"
            />
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