import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Calendar, Users } from 'lucide-react';
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

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const response = await destinationAPI.getAll();
      setDestinations(response.data.slice(0, 6)); // Show only 6 featured destinations
    } catch (error) {
      console.error('Error fetching destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Discover Amazing Places
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Explore the world's most beautiful destinations with Tourley
            </p>
            <Link
              to="/destinations"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Explore Destinations
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Tourley
            </h2>
            <p className="text-xl text-gray-600">
              Your perfect travel companion for unforgettable experiences
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Curated Destinations
              </h3>
              <p className="text-gray-600">
                Handpicked locations that offer the best travel experiences
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Easy Booking
              </h3>
              <p className="text-gray-600">
                Simple and secure booking process for your convenience
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Expert Support
              </h3>
              <p className="text-gray-600">
                Professional assistance throughout your journey
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Destinations
            </h2>
            <p className="text-xl text-gray-600">
              Discover our most popular travel destinations
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {destinations.map((destination) => (
                <div key={destination.destinationId} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                    <MapPin className="h-16 w-16 text-white" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {destination.name}
                    </h3>
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
          )}

          <div className="text-center mt-12">
            <Link
              to="/destinations"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View All Destinations
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready for Your Next Adventure?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of travelers who trust Tourley for their dream vacations
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
}