import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingAPI } from '@/services/api';

interface Booking {
  bookingId: string;
  userId: string;
  destinationId: string;
  destinationName: string;
  travelDate: string;
  numberOfPeople: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      const response = await bookingAPI.getUserBookings(user.userId);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-blue-600 text-white p-8">
            <div className="flex items-center">
              <div className="bg-white rounded-full p-4 mr-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user.fullName}</h1>
                <p className="text-blue-100">{user.email}</p>
                {user.mobile && <p className="text-blue-100">{user.mobile}</p>}
                <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-sm mt-2">
                  {user.role === 'admin' ? 'Administrator' : 'Traveler'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {bookings.length}
                </div>
                <div className="text-gray-600">Total Bookings</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </div>
                <div className="text-gray-600">Active Bookings</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {new Date().toLocaleDateString()}
                </div>
                <div className="text-gray-600">Member Since</div>
              </div>
            </div>

            {/* Bookings Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h2>
              
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-600">Start exploring destinations and make your first booking!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.bookingId} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {booking.destinationName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-5 w-5 mr-2" />
                          <span>{booking.numberOfPeople} person{booking.numberOfPeople > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-5 w-5 mr-2" />
                          <span>{new Date(booking.travelDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-5 w-5 mr-2" />
                          <span>${booking.totalPrice}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}