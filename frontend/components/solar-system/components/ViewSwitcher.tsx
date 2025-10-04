import { useState } from 'react';

export type ViewMode = 'earth' | 'solar-system';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  const views = [
    {
      key: 'earth' as ViewMode,
      label: '🌍 Earth View',
      description: 'Track asteroids approaching Earth'
    },
    {
      key: 'solar-system' as ViewMode,
      label: '🌌 Solar System',
      description: 'Explore the entire solar system'
    }
  ];

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-2xl p-2">
        <div className="flex space-x-2">
          {views.map((view) => (
            <button
              key={view.key}
              onClick={() => onViewChange(view.key)}
              className={`group relative px-6 py-3 rounded-xl transition-all duration-300 ${
                currentView === view.key
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-lg font-semibold">{view.label}</span>
                <span className="text-xs opacity-80">{view.description}</span>
              </div>
              
              {/* Glow effect for active view */}
              {currentView === view.key && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-600/20 blur-xl -z-10" />
              )}
            </button>
          ))}
        </div>
        
        {/* Connection indicator */}
        <div className="flex justify-center mt-2">
          <div className="flex space-x-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  i === 2 ? 'bg-green-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="ml-2 text-xs text-gray-400">System Active</span>
        </div>
      </div>
    </div>
  );
}
