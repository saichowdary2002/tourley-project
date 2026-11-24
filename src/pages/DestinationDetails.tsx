import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Calendar, Clock, DollarSign, ArrowLeft, Users } from 'lucide-react';
import { destinationAPI, bookingAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export default function DestinationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDestination();
    }
  }, [id]);

  const fetchDestination = async () => {
    try {
      const response = await destinationAPI.getById(id!);
      setDestination(response.data);
    } catch (error) {
      console.error('Error fetching destination:', error);
      toast.error('Failed to load destination details');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to book a destination');
      navigate('/login');
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        userId: user.userId,
        destinationId: destination.destinationId,
        destinationName: destination.name,
        travelDate: new Date().toISOString().split('T')[0], // Today's date as default
        numberOfPeople: 1,
        totalPrice: destination.price
      };
      await bookingAPI.create(bookingData);
      toast.success('Booking confirmed successfully!');
      navigate('/profile');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Destination not found</h2>
          <button
            onClick={() => navigate('/destinations')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Destinations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Image Section */}
          <div className="h-96 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
            <div className="text-center text-white">
              <MapPin className="h-24 w-24 mx-auto mb-4" />
              <h1 className="text-4xl font-bold">{destination.name}</h1>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {destination.name}
                  </h1>
                </div>

                <div className="flex items-center mb-6">
                  <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-600">{destination.location}</span>
                </div>

                <div className="prose max-w-none mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Description</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {destination.description}
                  </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center">
                    <Calendar className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold">{destination.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Group Size</p>
                      <p className="font-semibold">2-10 People</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
                      <p className="font-semibold">4.8/5 (127 reviews)</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Best Time</p>
                      <p className="font-semibold">Mar - Oct</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Section */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="h-6 w-6 text-green-600 mr-1" />
                      <span className="text-3xl font-bold text-gray-900">
                        ${destination.price}
                      </span>
                    </div>
                    <p className="text-gray-600">per person</p>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                  >
                    {bookingLoading ? 'Processing...' : 'Book Now'}
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Secure booking</p>
                    <p className="text-xs text-gray-500">
                      Free cancellation up to 24 hours before
                    </p>
                  </div>

                  {!user && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Please login to book this destination
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}