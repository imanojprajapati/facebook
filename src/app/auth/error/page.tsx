'use client';

import { Suspense } from 'react';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

// Separate component to use useSearchParams
function ErrorContent() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const error = searchParams.get('error');
    let message = 'An authentication error occurred';

    switch (error) {
      case 'AccessDenied':
        message = 'You denied access to your Facebook account';
        break;
      case 'Callback':
        message = 'There was an error during the Facebook authentication process';
        break;
      case 'OAuthSignin':
        message = 'Error starting the Facebook login process';
        break;
      case 'OAuthCallback':
        message = 'Error completing the Facebook login';
        break;
      case 'TokenError':
        message = 'Your session has expired. Please try logging in again';
        break;
      default:
        if (error) {
          message = error;
        }
    }

    setErrorMessage(message);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <FaExclamationTriangle className="text-5xl text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        
        <p className="text-gray-600 mb-8">{errorMessage}</p>
        
        <Link 
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-facebook hover:bg-facebook-hover text-white px-6 py-3 rounded-lg transition-colors duration-200 w-full"
        >
          <FaHome size={20} />
          <span>Return to Home</span>
        </Link>

        <p className="mt-6 text-sm text-gray-500">
          Need help? Contact our{' '}
          <a 
            href="mailto:support@leadstrack.in"
            className="text-facebook hover:text-facebook-hover underline"
          >
            support team
          </a>
        </p>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function AuthError() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}