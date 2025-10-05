'use client';
import { useState, useMemo } from 'react';
import { populationDensityService } from '@/lib/services/populationDensityService';

interface City {
  name: string;
  lat: number;
  lng: number;
  country: string;
  region: string;
  density: number;
}

interface CitySelectorProps {
  onCitySelect: (city: City | null) => void;
  selectedCity?: City | null;
}

export default function CitySelector({ onCitySelect, selectedCity }: CitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  const allCities = useMemo(() => populationDensityService.getAllCities(), []);

  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(allCities.map(city => city.region))];
    return ['All', ...uniqueRegions];
  }, [allCities]);

  const filteredCities = useMemo(() => {
    let filtered = allCities;

    if (selectedRegion !== 'All') {
      filtered = filtered.filter(city => city.region === selectedRegion);
    }

    if (searchTerm) {
      filtered = filtered.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [allCities, selectedRegion, searchTerm]);

  const handleCityClick = (city: City) => {
    onCitySelect(city);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleSelectNone = () => {
    onCitySelect(null);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      {/* City Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-left text-white hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">
              {selectedCity ? selectedCity.name : 'Select a City'}
            </div>
            {selectedCity && (
              <div className="text-xs text-gray-400">
                {selectedCity.country} • {selectedCity.region}
              </div>
            )}
          </div>
          <div className="text-gray-400">
            {isOpen ? '▲' : '▼'}
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-lg shadow-2xl z-50 max-h-80 overflow-hidden">
          {/* Search and Filter Controls */}
          <div className="p-3 border-b border-gray-700/50">
            <input
              type="text"
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 bg-gray-800/50 border border-gray-700/50 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />

            <div className="mt-2">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full p-2 bg-gray-800/50 border border-gray-700/50 rounded text-white focus:outline-none focus:border-blue-500"
              >
                {regions.map(region => (
                  <option key={region} value={region} className="bg-gray-800">
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cities List */}
          <div className="max-h-60 overflow-y-auto">
            {/* Select None Option */}
            <button
              onClick={handleSelectNone}
              className={`w-full p-3 text-left hover:bg-gray-700/50 transition-colors border-b border-gray-700/30 ${!selectedCity
                ? 'bg-red-500/20 border-l-4 border-l-red-400'
                : ''
                }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-white font-medium">Select None</div>
                  <div className="text-sm text-gray-400">
                    Clear city selection
                  </div>
                </div>
              </div>
            </button>

            {filteredCities.length === 0 ? (
              <div className="p-3 text-gray-400 text-center">
                No cities found
              </div>
            ) : (
              filteredCities.map((city) => (
                <button
                  key={`${city.name}-${city.country}`}
                  onClick={() => handleCityClick(city)}
                  className={`w-full p-3 text-left hover:bg-gray-700/50 transition-colors border-b border-gray-700/30 last:border-b-0 ${selectedCity?.name === city.name && selectedCity?.country === city.country
                    ? 'bg-blue-500/20 border-l-4 border-l-blue-400'
                    : ''
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-medium">{city.name}</div>
                      <div className="text-sm text-gray-400">
                        {city.country} • {city.region}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {city.density.toLocaleString()}/km²
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}