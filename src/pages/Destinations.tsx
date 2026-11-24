import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Filter } from 'lucide-react';
import { destinationAPI } from '@/services/api';

interface Destination {
  destinationId: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  location: string;
  duration: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: string[];
}

export default function Destinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 10000]);

  useEffect(() => {
    fetchDestinations();
  }, []);

  useEffect(() => {
    filterDestinations();
  }, [priceRange, destinations]);

  const fetchDestinations = async () => {
    try {
      const response = await destinationAPI.getAll();
      setDestinations(response.data);
      setFilteredDestinations(response.data);
    } catch (error) {
      console.error('Error fetching destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDestinations = () => {
    let filtered = destinations;

    // Since we don't have category field in API, we'll filter by price only
    filtered = filtered.filter(dest => dest.price >= priceRange[0] && dest.price <= priceRange[1]);

    setFilteredDestinations(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Explore Destinations
          </h1>
          <p className="text-xl text-gray-600">
            Discover amazing places around the world
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price: ${priceRange[1]}
              </label>
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((destination) => (
            <div key={destination.destinationId} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <MapPin className="h-16 w-16 text-white" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {destination.name}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                    {destination.duration}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {destination.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{destination.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">4.8</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">
                    ${destination.price}
                  </span>
                  <Link
                    to={`/destinations/${destination.destinationId}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDestinations.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No destinations found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters to see more results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}