import { TimeState } from '../utils';
import { useState, useEffect } from 'react';

interface FancyTimeControlsProps {
  timeState: TimeState;
  onTimeControlChange: (timeScale: number, playing: boolean) => void;
  onResetToCurrentDate?: () => void;
  editingMode?: boolean;
}

export default function FancyTimeControls({
  timeState,
  onTimeControlChange,
  onResetToCurrentDate,
  editingMode
}: FancyTimeControlsProps) {
  const [sliderValue, setSliderValue] = useState(timeState.timeScale);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync slider value with time state
  useEffect(() => {
    setSliderValue(timeState.timeScale);
  }, [timeState.timeScale]);

  const handleSliderChange = (value: number) => {
    console.log('🎛️ Slider change:', { value, editingMode });
    setSliderValue(value);
    // In editing mode, keep time paused unless user explicitly wants to run time
    if (editingMode) {
      console.log('⏸️ In editing mode - allowing time control for trajectory planning');
      onTimeControlChange(value, value !== 0);
    } else {
      console.log('▶️ Normal mode - setting playing to:', value !== 0);
      // Normal mode: set playing to true when slider changes, pause only when value is 0
      onTimeControlChange(value, value !== 0);
    }
  };

  const getSpeedLabel = (speed: number) => {
    if (speed === 0) return 'Paused';
    if (speed > 0) return `+${speed}h/frame`;
    return `${speed}h/frame`;
  };

  const speedMarks = [-24, -12, -6, -1, 0, 1, 6, 12, 24];

  // Create position mapping for accurate slider positioning
  const getSliderPosition = (value: number) => {
    const index = speedMarks.indexOf(value);
    if (index === -1) return 50; // default center
    return (index / (speedMarks.length - 1)) * 100;
  };

  const getValueFromPosition = (position: number) => {
    const index = Math.round((position / 100) * (speedMarks.length - 1));
    return speedMarks[Math.max(0, Math.min(speedMarks.length - 1, index))];
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-900/95 backdrop-blur-lg rounded-xl border border-gray-700/50 shadow-xl px-4 py-3 min-w-[400px]">
        {/* Header with Date and Reset Button */}
        <div className="flex items-center justify-center space-x-3 mb-3">
          <span className="text-xs text-gray-300 font-mono">
            {isClient ?
              `${timeState.currentDate.toLocaleDateString()} ${timeState.currentDate.toLocaleTimeString()}` :
              'Loading...'
            }
          </span>
          {onResetToCurrentDate && (
            <button
              onClick={onResetToCurrentDate}
              className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs transition-all"
              title="Reset to current date"
            >
              📅
            </button>
          )}
        </div>

        {/* Mission Status */}
        {editingMode && (
          <div className="mb-3 p-2 rounded-lg text-center bg-blue-900/30 border border-blue-700/50">
            <div className="text-xs font-semibold">
              ⏸️ TRAJECTORY PLANNING
            </div>
            <div className="text-xs text-gray-300">
              Use time controls to see trajectory over time
            </div>
          </div>
        )}

        {/* Speed Slider */}
        <div className="mb-2">
          <div className="relative">
            <input
              type="range"
              min="0"
              max={speedMarks.length - 1}
              step="1"
              value={speedMarks.indexOf(sliderValue)}
              onChange={(e) => {
                const newValue = speedMarks[parseInt(e.target.value)];
                handleSliderChange(newValue);
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-fancy"
            />

            {/* Speed markers with accurate positioning */}
            <div className="flex justify-between mt-1">
              {speedMarks.map((mark, index) => (
                <button
                  key={mark}
                  onClick={() => handleSliderChange(mark)}
                  className={`text-xs px-1 py-0.5 rounded transition-all ${sliderValue === mark
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  style={{
                    position: 'relative',
                    flex: '0 0 auto',
                    minWidth: '24px'
                  }}
                >
                  {mark === 0 ? '⏸' : mark > 0 ? `+${mark}` : `${mark}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider-fancy::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3B82F6, #1D4ED8);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
        
        .slider-fancy::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3B82F6, #1D4ED8);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
        
        .slider-fancy::-webkit-slider-track {
          height: 2px;
          background: #374151;
          border-radius: 2px;
        }
        
        .slider-fancy::-moz-range-track {
          height: 2px;
          background: #374151;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
