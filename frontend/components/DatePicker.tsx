'use client';
import { useState } from 'react';

interface DatePickerProps {
  onDateChange: (startDate: string, endDate: string) => void;
  currentStartDate?: string;
  currentEndDate?: string;
}

export default function DatePicker({ onDateChange, currentStartDate, currentEndDate }: DatePickerProps) {
  const [startDate, setStartDate] = useState(currentStartDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(currentEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = () => {
    onDateChange(startDate, endDate);
    setIsOpen(false);
  };

  const setPresetDate = (days: number) => {
    const today = new Date();
    const targetDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split('T')[0];
    setStartDate(dateStr);
    setEndDate(dateStr);
    onDateChange(dateStr, dateStr);
    setIsOpen(false);
  };

  const presets = [
    { label: 'Today', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: 'Next Week', days: 7 },
    { label: 'Next Month', days: 30 },
    { label: 'Historical (2015)', days: -365 * 8 } // 8 years ago
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors flex items-center space-x-2"
      >
        <span>📅</span>
        <span>Change Date</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white min-w-80 z-50 border border-gray-600">
          <h3 className="text-lg font-semibold mb-4">Select Date Range</h3>
          
          {/* Preset Buttons */}
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">Quick Presets:</p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setPresetDate(preset.days)}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="space-y-3">
            <p className="text-sm text-gray-300">Custom Range:</p>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white"
                max={new Date().toISOString().split('T')[0]} // Can't select future dates
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white"
                max={new Date().toISOString().split('T')[0]} // Can't select future dates
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleDateChange}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-4 p-2 bg-blue-900/20 rounded border border-blue-500">
            <p className="text-xs text-blue-300">
              💡 NASA API has a 7-day maximum range. Historical data may have more asteroids.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
