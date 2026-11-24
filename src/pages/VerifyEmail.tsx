import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, CheckCircle } from 'lucide-react';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyEmail } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    
    try {
      await verifyEmail(email, otp);
      toast.success('Email verified successfully!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    navigate('/signup');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Verify your email
          </h2>
          <p className="text-gray-600">
            We've sent a 6-digit verification code to {email}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Didn't receive the code?{' '}
            <button
              onClick={() => window.location.reload()}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Resend code
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}