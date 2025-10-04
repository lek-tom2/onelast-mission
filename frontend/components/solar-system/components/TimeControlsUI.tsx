import { TimeState } from '../types';

interface TimeControlsUIProps {
  timeState: TimeState;
  onTimeControlChange: (timeScale: number, playing: boolean) => void;
  onDateChange: (direction: 'forward' | 'backward', amount: 'hour' | 'day' | 'week' | 'month') => void;
  onResetCamera: () => void;
}

export default function TimeControlsUI({ 
  timeState, 
  onTimeControlChange, 
  onDateChange,
  onResetCamera 
}: TimeControlsUIProps) {
  return (
    <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
      <h3 className="text-lg font-bold mb-2">Time Controls</h3>
      <div className="space-y-3">
        <div className="text-sm">
          <div>Date: {timeState.currentDate.toLocaleDateString()}</div>
          <div>Time: {timeState.currentDate.toLocaleTimeString()}</div>
          <div>Speed: {timeState.timeScale}x hours/frame</div>
        </div>
        
        {/* Play/Pause and Speed Controls */}
        <div className="flex space-x-2">
          <button
            onClick={() => onTimeControlChange(timeState.timeScale, !timeState.isPlaying)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            {timeState.isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={() => onTimeControlChange(1, timeState.isPlaying)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
          >
            1h
          </button>
          
          <button
            onClick={() => onTimeControlChange(24, timeState.isPlaying)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
          >
            1d
          </button>
          
          <button
            onClick={() => onTimeControlChange(168, timeState.isPlaying)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
          >
            1w
          </button>
        </div>
        
        {/* Manual Date Controls */}
        <div className="space-y-2">
          <div className="text-xs text-gray-300">Manual Time Control:</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <button
              onClick={() => onDateChange('backward', 'hour')}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
            >
              -1h
            </button>
            <button
              onClick={() => onDateChange('forward', 'hour')}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded"
            >
              +1h
            </button>
            <button
              onClick={() => onDateChange('backward', 'day')}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
            >
              -1d
            </button>
            <button
              onClick={() => onDateChange('forward', 'day')}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded"
            >
              +1d
            </button>
            <button
              onClick={() => onDateChange('backward', 'week')}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
            >
              -1w
            </button>
            <button
              onClick={() => onDateChange('forward', 'week')}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded"
            >
              +1w
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
