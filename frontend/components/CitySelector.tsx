'use client';
import React, { useState } from 'react';

interface City {
  lat: number;
  lng: number;
  name: string;
  country: string;
}

interface CitySelectorProps {
  selectedCity: { lat: number; lng: number; name: string } | null;
  onCitySelect: (city: { lat: number; lng: number; name: string } | null) => void;
}

const majorCities: City[] = [
  { lat: 40.7128, lng: -74.0060, name: 'New York City', country: 'USA' },
  { lat: 35.6762, lng: 139.6503, name: 'Tokyo', country: 'Japan' },
  { lat: 51.5074, lng: -0.1278, name: 'London', country: 'UK' },
  { lat: -33.8688, lng: 151.2093, name: 'Sydney', country: 'Australia' },
  { lat: 53.4285, lng: 14.5528, name: 'Szczecin', country: 'Poland' },
  { lat: 48.8566, lng: 2.3522, name: 'Paris', country: 'France' },
  { lat: 52.5200, lng: 13.4050, name: 'Berlin', country: 'Germany' },
  { lat: 55.7558, lng: 37.6176, name: 'Moscow', country: 'Russia' },
  { lat: 39.9042, lng: 116.4074, name: 'Beijing', country: 'China' },
  { lat: 19.0760, lng: 72.8777, name: 'Mumbai', country: 'India' },
  { lat: -22.9068, lng: -43.1729, name: 'Rio de Janeiro', country: 'Brazil' },
  { lat: 41.8781, lng: -87.6298, name: 'Chicago', country: 'USA' },
  { lat: 34.0522, lng: -118.2437, name: 'Los Angeles', country: 'USA' },
  { lat: 1.3521, lng: 103.8198, name: 'Singapore', country: 'Singapore' },
  { lat: 25.2048, lng: 55.2708, name: 'Dubai', country: 'UAE' },
  { lat: -26.2041, lng: 28.0473, name: 'Johannesburg', country: 'South Africa' },
  { lat: 43.6532, lng: -79.3832, name: 'Toronto', country: 'Canada' },
  { lat: 37.5665, lng: 126.9780, name: 'Seoul', country: 'South Korea' },
  { lat: 23.1291, lng: 113.2644, name: 'Guangzhou', country: 'China' },
  { lat: 12.9716, lng: 77.5946, name: 'Bangalore', country: 'India' }
];

const CitySelector: React.FC<CitySelectorProps> = ({ selectedCity, onCitySelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCities = majorCities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCitySelect = (city: City) => {
    onCitySelect(city);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    onCitySelect(null);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium flex items-center justify-between"
      >
        <span className="truncate">
          {selectedCity ? `${selectedCity.name}` : '🌍 Select Impact City'}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-700">
            <input
              type="text"
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* City List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <button
                  key={`${city.lat}-${city.lng}`}
                  onClick={() => handleCitySelect(city)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${
                    selectedCity?.name === city.name ? 'bg-blue-600 text-white' : 'text-gray-300'
                  }`}
                >
                  <div className="font-medium">{city.name}</div>
                  <div className="text-xs text-gray-400">{city.country}</div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400">No cities found</div>
            )}
          </div>

          {/* Clear Selection */}
          {selectedCity && (
            <div className="p-3 border-t border-gray-700">
              <button
                onClick={handleClearSelection}
                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CitySelector;
