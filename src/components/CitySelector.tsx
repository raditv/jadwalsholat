import React, { useState } from 'react';
import { X, Search, MapPin, Loader2 } from 'lucide-react';

interface CitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onCitySelect: (lat: number, lon: number) => void;
}

interface City {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

const POPULAR_CITIES: City[] = [
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lon: 106.8456 },
  { name: 'Mecca', country: 'Saudi Arabia', lat: 21.4225, lon: 39.8262 },
  { name: 'Medina', country: 'Saudi Arabia', lat: 24.4672, lon: 39.6112 },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lon: 28.9784 },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708 },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357 },
];

export function CitySelector({ isOpen, onClose, onCitySelect }: CitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      
      const cities: City[] = data.map((item: any) => ({
        name: item.display_name.split(',')[0],
        country: item.display_name.split(',').slice(-1)[0].trim(),
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));
      
      setSearchResults(cities);
    } catch (error) {
      console.error('Error searching for cities:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAutoDetect = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onCitySelect(position.coords.latitude, position.coords.longitude);
          setIsLocating(false);
          onClose();
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setIsLocating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Select City</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={handleAutoDetect}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors mb-4"
            >
              {isLocating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
              {isLocating ? 'Detecting Location...' : 'Auto-detect My Location'}
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search for a city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Search Results</h3>
              <div className="space-y-2">
                {searchResults.map((city, index) => (
                  <button
                    key={`${city.name}-${index}`}
                    onClick={() => onCitySelect(city.lat, city.lon)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100"
                  >
                    <div className="font-medium">{city.name}</div>
                    <div className="text-sm text-gray-500">{city.country}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Popular Cities</h3>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_CITIES.map((city) => (
                <button
                  key={`${city.name}-${city.country}`}
                  onClick={() => onCitySelect(city.lat, city.lon)}
                  className="text-left px-4 py-3 rounded-lg hover:bg-gray-100"
                >
                  <div className="font-medium">{city.name}</div>
                  <div className="text-sm text-gray-500">{city.country}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}